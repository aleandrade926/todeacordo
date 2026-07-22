import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  Send,
  FileText,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Bot,
  AlertCircle
} from "lucide-react";
import {
  evaluateLeadOpportunityMatch,
  saveOpportunityMatchState,
  mergeMatchWithManualEdits,
  type LeadInput,
  type OpportunityMatchResult,
  type TargetMatchStatus,
  type ManualMatchEdits
} from "../../lib/taxmanagers/opportunity-engine";
import { supabase } from "../../lib/supabase";

interface OpportunityModuleProps {
  realLeadsSample: LeadInput[];
  onRefreshSample?: () => void;
  isLoading?: boolean;
}

export const OpportunityModule: React.FC<OpportunityModuleProps> = ({
  realLeadsSample,
  onRefreshSample,
  isLoading = false,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<TargetMatchStatus>("PRIORIDADE");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Status Comercial Persistido e Local
  const [commercialState, setCommercialState] = useState<
    Record<string, ManualMatchEdits>
  >({});

  // Carrega matches persistidos do Supabase ao montar/carregar amostra
  useEffect(() => {
    async function loadPersistedMatches() {
      if (!realLeadsSample || realLeadsSample.length === 0) return;
      const leadIds = realLeadsSample.slice(0, 200).map(l => l.id);

      try {
        const { data, error } = await supabase
          .from("taxmanagers_opportunity_matches")
          .select("lead_id, commercial_status, next_contact_at, notes")
          .in("lead_id", leadIds);

        if (!error && data && data.length > 0) {
          const loadedState: Record<string, ManualMatchEdits> = {};
          data.forEach((item: any) => {
            loadedState[item.lead_id] = {
              commercial_status: item.commercial_status,
              next_contact_at: item.next_contact_at ? String(item.next_contact_at).split("T")[0] : null,
              notes: item.notes,
            };
          });
          setCommercialState((prev) => ({ ...prev, ...loadedState }));
        }
      } catch (err) {
        console.warn("[OpportunityModule] Migration may be pending in database:", err);
      }
    }
    loadPersistedMatches();
  }, [realLeadsSample]);

  // Mensagens geradas por IA (Distinção entre IA Real vs Sugestão Local de Contingência)
  const [aiCopies, setAiCopies] = useState<
    Record<string, { initialMessage: string; discoveryQuestion: string; followUp: string; isGenerating?: boolean; isRealAI?: boolean; errorNote?: string }>
  >({});

  // 1. Processar a Amostra Real de até 200 Contatos
  const rawEvaluatedMatches = useMemo(() => {
    const sample = realLeadsSample.slice(0, 200);
    return sample.map((lead) => evaluateLeadOpportunityMatch(lead));
  }, [realLeadsSample]);

  // 2. Mesclar com Edições Manuais (Preservando Notas e Status ao Recalcular)
  const evaluatedMatches = useMemo(() => {
    return rawEvaluatedMatches.map((match) => {
      const edits = commercialState[match.lead_id];
      return mergeMatchWithManualEdits(match, edits);
    });
  }, [rawEvaluatedMatches, commercialState]);

  // 3. Estatísticas de Resolução da Amostra Real
  const resolutionStats = useMemo(() => {
    const stats = {
      confirmed: 0,
      candidate: 0,
      unresolved: 0,
      missing: 0,
      prioridade: 0,
      validar: 0,
      nao_abordar: 0,
    };

    evaluatedMatches.forEach((match) => {
      stats[match.company_resolution_status]++;
      if (match.match_status === "PRIORIDADE") stats.prioridade++;
      else if (match.match_status === "VALIDAR") stats.validar++;
      else stats.nao_abordar++;
    });

    return stats;
  }, [evaluatedMatches]);

  // 4. Filtrar e Ranquear
  const filteredMatches = useMemo(() => {
    return evaluatedMatches
      .filter((m) => m.match_status === selectedGroup)
      .filter((m) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          m.lead_name.toLowerCase().includes(term) ||
          (m.company_name_snapshot && m.company_name_snapshot.toLowerCase().includes(term)) ||
          (m.lead_cargo && m.lead_cargo.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (b.opportunity_adherence_score !== a.opportunity_adherence_score) {
          return b.opportunity_adherence_score - a.opportunity_adherence_score;
        }
        const curveOrder = { A: 1, B: 2, C: 3 };
        return curveOrder[a.contact_curve] - curveOrder[b.contact_curve];
      });
  }, [evaluatedMatches, selectedGroup, searchTerm]);

  // Handlers para atualizar e persistir status comercial
  const handleUpdateCommercialData = async (leadId: string, updates: ManualMatchEdits) => {
    const newEdits = {
      ...commercialState[leadId],
      ...updates,
    };

    setCommercialState((prev) => ({
      ...prev,
      [leadId]: newEdits,
    }));

    const targetMatch = evaluatedMatches.find((m) => m.lead_id === leadId);
    if (targetMatch) {
      await saveOpportunityMatchState(supabase, targetMatch, newEdits);
    }
  };

  // Conectar com Endpoint Real de IA (/api/personalize_agent) com Tratamento de Erro & Fallback
  const handleGenerateAICopies = async (match: OpportunityMatchResult) => {
    setAiCopies((prev) => ({
      ...prev,
      [match.lead_id]: { initialMessage: "", discoveryQuestion: "", followUp: "", isGenerating: true },
    }));

    const isUnresolved = match.company_resolution_status !== "confirmed";
    const companyRef = match.company_name_snapshot ? match.company_name_snapshot : "sua empresa";

    const payload = {
      lead: {
        id: match.lead_id,
        nome: match.lead_name,
        cargo: match.lead_cargo || "decisor",
        empresa: match.company_name_snapshot || "",
        status: match.company_resolution_status
      },
      context_extra: `Oportunidade: Tax Managers — Diagnóstico Receita Sintonia. Resolução da Empresa: ${match.company_resolution_status}. Dados comprovados: Aderência=${match.opportunity_adherence_score}pts. Dados faltantes: ${match.missing_data.join(", ")}. REGRA RIGOROSA: Não afirme fatos sobre empresa candidate, unresolved ou missing.`
    };

    try {
      const response = await fetch("/api/personalize_agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error && (data.short_note || data.long_email)) {
          const initialMessage = data.short_note || (isUnresolved
            ? `Olá ${match.lead_name}, como responsável pela área tributária/financeira, gostaria de apresentar nossa análise de oportunidade no Diagnóstico Receita Sintonia focado em eficiência fiscal.`
            : `Olá ${match.lead_name}, identificamos na ${companyRef} potenciais pontos de otimização no Diagnóstico Receita Sintonia. Terias 10 minutos esta semana para avaliarmos a aderência?`);

          const discoveryQuestion = data.article_pitch || `No cenário atual da ${companyRef}, vocês já possuem processo automatizado para auditoria de créditos de ICMS e PIS/COFINS pelo Receita Sintonia?`;

          const followUp = data.long_email || `Olá ${match.lead_name}, passando para checar se teve oportunidade de avaliar a mensagem anterior sobre o Diagnóstico Receita Sintonia. Ficamos à disposição para um breve alinhamento técnico.`;

          setAiCopies((prev) => ({
            ...prev,
            [match.lead_id]: {
              initialMessage,
              discoveryQuestion,
              followUp,
              isGenerating: false,
              isRealAI: true,
              errorNote: undefined
            },
          }));
          return;
        }
      }
    } catch (err: any) {
      console.warn("[OpportunityModule AI Endpoint fallback]:", err?.message || err);
    }

    // Fallback seguro (Sugestão Local de Contingência)
    const initialMessage = isUnresolved
      ? `Olá ${match.lead_name}, como responsável pela área tributária/financeira, gostaria de apresentar nossa análise de oportunidade no Diagnóstico Receita Sintonia focado em eficiência fiscal.`
      : `Olá ${match.lead_name}, identificamos na ${companyRef} potenciais pontos de otimização no Diagnóstico Receita Sintonia. Terias 10 minutos esta semana para avaliarmos a aderência?`;

    const discoveryQuestion = `No cenário atual da ${companyRef}, vocês já possuem processo automatizado para auditoria de créditos de ICMS e PIS/COFINS pelo Receita Sintonia?`;

    const followUp = `Olá ${match.lead_name}, passando para checar se teve oportunidade de avaliar a mensagem anterior sobre o Diagnóstico Receita Sintonia. Ficamos à disposição para um breve alinhamento técnico.`;

    setAiCopies((prev) => ({
      ...prev,
      [match.lead_id]: {
        initialMessage,
        discoveryQuestion,
        followUp,
        isGenerating: false,
        isRealAI: false,
        errorNote: "Sugestão local de contingência (Fallback). API indisponível."
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Oportunidade */}
      <div className="bg-[#0b0b0f] border border-white/10 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Oportunidade Ativa MVP
              </span>
              <span className="text-xs text-slate-400">ID: opp-receita-sintonia</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Tax Managers — Diagnóstico Receita Sintonia
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Identificação determinística de empresas e contatos prioritários com aderência tributária corporativa.
              Priorização baseada no Opportunity Adherence Score e autoridade do contato (Curva ABC).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefreshSample && (
              <button
                onClick={onRefreshSample}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg bg-[#111116] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
                Atualizar Amostra ({evaluatedMatches.length} Leads)
              </button>
            )}
          </div>
        </div>

        {/* Resumo de Resolução dos 4 Cenários na Amostra Real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="bg-[#111116] border border-emerald-500/20 p-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Empresa Confirmada</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400 mt-1">{resolutionStats.confirmed}</p>
            <span className="text-[10px] text-slate-500">company_id preenchido</span>
          </div>

          <div className="bg-[#111116] border border-amber-500/20 p-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Empresa Candidata</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-lg font-bold text-amber-400 mt-1">{resolutionStats.candidate}</p>
            <span className="text-[10px] text-slate-500">candidate_company_id</span>
          </div>

          <div className="bg-[#111116] border border-blue-500/20 p-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Texto Legado (Empresa)</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-lg font-bold text-blue-400 mt-1">{resolutionStats.unresolved}</p>
            <span className="text-[10px] text-slate-500">empresa textual sem id</span>
          </div>

          <div className="bg-[#111116] border border-rose-500/20 p-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Empresa Ausente</span>
              <HelpCircle className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-300 mt-1">{resolutionStats.missing}</p>
            <span className="text-[10px] text-slate-500">sem informação</span>
          </div>
        </div>

        {/* Nota de Auditoria de Amostra Real */}
        {(resolutionStats.confirmed === 0 || resolutionStats.candidate === 0) && (
          <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Nota da Amostra Real:</strong> A amostra operacional atual contém{" "}
              {resolutionStats.confirmed} empresas confirmadas e {resolutionStats.candidate} candidatas. Nenhum dado foi fabricado artificialmente.
            </span>
          </div>
        )}
      </div>

      {/* Tabs dos 3 Grupos de Alvo (PRIORIDADE / VALIDAR / NÃO ABORDAR) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#0b0b0f] border border-white/10 p-2 rounded-xl">
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedGroup("PRIORIDADE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedGroup === "PRIORIDADE"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            PRIORIDADE ({resolutionStats.prioridade})
          </button>

          <button
            onClick={() => setSelectedGroup("VALIDAR")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedGroup === "VALIDAR"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            VALIDAR ({resolutionStats.validar})
          </button>

          <button
            onClick={() => setSelectedGroup("NÃO ABORDAR")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedGroup === "NÃO ABORDAR"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            NÃO ABORDAR ({resolutionStats.nao_abordar})
          </button>
        </div>

        {/* Busca rápida na lista */}
        <div className="relative shrink-0 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por nome, empresa ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111116] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Lista de Alvos Ranqueados */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-8 text-center text-slate-400 text-xs">
            Nenhum alvo encontrado no grupo <strong>{selectedGroup}</strong> com os filtros aplicados.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isExpanded = expandedLeadId === match.lead_id;
            const currentState = commercialState[match.lead_id] || {
              commercial_status: match.commercial_status,
              next_contact_at: match.next_contact_at || "",
              notes: match.notes || "",
            };
            const aiCopy = aiCopies[match.lead_id];

            return (
              <div
                key={match.lead_id}
                className="bg-[#0b0b0f] border border-white/10 hover:border-white/20 rounded-xl transition-all overflow-hidden"
              >
                {/* Cabeçalho do Card de Alvo */}
                <div
                  onClick={() => setExpandedLeadId(isExpanded ? null : match.lead_id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#111116] border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                      {match.contact_curve}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{match.lead_name}</h4>

                        {/* Badge de Empresa e Status de Resolução */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            match.company_resolution_status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : match.company_resolution_status === "candidate"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : match.company_resolution_status === "unresolved"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          Empresa: {match.company_name_snapshot || "Não informada"} (
                          {match.company_resolution_status.toUpperCase()})
                        </span>

                        {/* Badge Curva ABC */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          Curva {match.contact_curve} (Cargo)
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        Cargo: <strong className="text-slate-200">{match.lead_cargo || "Não informado"}</strong> | Origem Resolução:{" "}
                        <code className="text-[11px] text-cyan-300 font-mono">{match.company_resolution_source}</code>
                      </p>
                    </div>
                  </div>

                  {/* Lado Direito: Pontuação e Ação Recomendada */}
                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                        <span>Score Oportunidade:</span>
                        <span
                          className={`text-sm font-mono px-2 py-0.5 rounded font-bold ${
                            match.opportunity_adherence_score > 0
                              ? "bg-emerald-500/20 text-emerald-400"
                              : match.opportunity_adherence_score < 0
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {match.opportunity_adherence_score > 0 ? `+${match.opportunity_adherence_score}` : match.opportunity_adherence_score} pts
                        </span>
                      </div>
                      {match.relationship_signal > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Sinal Comercial: +{match.relationship_signal} pts
                        </div>
                      )}
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Detalhes Expansíveis do Alvo */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 bg-[#09090d]">
                    {/* Ação Recomendada */}
                    <div className="p-3 bg-[#111116] border border-cyan-500/20 rounded-lg">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Próxima Ação Comercial Recomendada
                      </span>
                      <p className="text-xs text-slate-200 font-medium mt-1">{match.recommended_action}</p>
                    </div>

                    {/* Justificativas da Pontuação e Dados Faltantes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#111116] border border-white/5 p-3 rounded-lg">
                        <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Razões da Pontuação de Aderência
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {match.score_reasons.length > 0 ? (
                            match.score_reasons.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-cyan-400 font-bold">•</span>
                                <span>{reason}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic text-[11px]">Nenhuma razão específica pontuada.</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-[#111116] border border-white/5 p-3 rounded-lg">
                        <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                          Dados Faltantes / PONTOS DE ATENÇÃO
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {match.missing_data.length > 0 ? (
                            match.missing_data.map((m, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{m}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-emerald-400 font-medium text-[11px]">
                              Dados corporativos críticos completos.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Controles de Status Comercial com Persistência Idempotente */}
                    <div className="bg-[#111116] border border-white/5 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Status Comercial
                        </label>
                        <select
                          value={currentState.commercial_status || "pendente"}
                          onChange={(e) => handleUpdateCommercialData(match.lead_id, { commercial_status: e.target.value as any })}
                          className="w-full bg-[#0b0b0f] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="abordado">Abordado</option>
                          <option value="respondeu">Respondeu</option>
                          <option value="sem_interesse">Sem Interesse</option>
                          <option value="reuniao_marcada">Reunião Marcada</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Data do Próximo Contato
                        </label>
                        <input
                          type="date"
                          value={currentState.next_contact_at || ""}
                          onChange={(e) => handleUpdateCommercialData(match.lead_id, { next_contact_at: e.target.value })}
                          className="w-full bg-[#0b0b0f] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Observações
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Pediu proposta por email..."
                          value={currentState.notes || ""}
                          onChange={(e) => handleUpdateCommercialData(match.lead_id, { notes: e.target.value })}
                          className="w-full bg-[#0b0b0f] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Botão e Área de Copys Personalizadas com Distinção Clara entre IA Real e Contingência Local */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <button
                          onClick={() => handleGenerateAICopies(match)}
                          disabled={aiCopy?.isGenerating}
                          className="px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${aiCopy?.isGenerating ? "animate-spin" : ""}`} />
                          {aiCopy?.isGenerating ? "Gerando Mensagens..." : "Gerar Mensagens Personalizadas"}
                        </button>

                        {/* Indicação Clara da Origem da Resposta */}
                        {aiCopy && !aiCopy.isGenerating && (
                          aiCopy.isRealAI ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                              <Bot className="w-3 h-3 text-emerald-400" />
                              IA Groq/Llama Real Ativa
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              Sugestão Local de Contingência (Fallback)
                            </span>
                          )
                        )}
                      </div>

                      {aiCopy && !aiCopy.isGenerating && (
                        <div className="mt-3 space-y-2 bg-[#050508] border border-white/10 p-3 rounded-lg">
                          {aiCopy.errorNote && (
                            <div className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 mb-2 font-mono flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{aiCopy.errorNote}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mensagem Inicial:</span>
                            <p className="text-xs text-slate-200 bg-[#111116] p-2 rounded border border-white/5 font-mono mt-0.5">
                              {aiCopy.initialMessage}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pergunta de Descoberta:</span>
                            <p className="text-xs text-slate-200 bg-[#111116] p-2 rounded border border-white/5 font-mono mt-0.5">
                              {aiCopy.discoveryQuestion}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Follow-up:</span>
                            <p className="text-xs text-slate-200 bg-[#111116] p-2 rounded border border-white/5 font-mono mt-0.5">
                              {aiCopy.followUp}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
