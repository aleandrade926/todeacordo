import React, { useState, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Bot,
  AlertCircle,
  Info,
  Clock,
  UserX
} from "lucide-react";
import {
  evaluateLeadOpportunityMatch,
  type LeadInput,
  type OpportunityMatchResult,
  type TargetMatchStatus
} from "../../lib/taxmanagers/opportunity-engine";
import {
  getSavedOpportunityGroup,
  getSavedOpportunityFilter,
  syncNavigationStateToStorageAndUrl
} from "../../lib/taxmanagers/navigation-state";

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
  // Inicialização de estado persistente com fallback seguro (Regra F5)
  const [selectedGroup, setSelectedGroup] = useState<TargetMatchStatus>(() => getSavedOpportunityGroup());
  const [searchTerm, setSearchTerm] = useState<string>(() => getSavedOpportunityFilter());
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Mensagens geradas por IA (Vercel API / Groq Real com Fallback Seguro de Contingência)
  const [aiCopies, setAiCopies] = useState<
    Record<string, { initialMessage: string; discoveryQuestion: string; followUp: string; isGenerating?: boolean; isRealAI?: boolean; errorNote?: string }>
  >({});

  const handleSelectGroup = (group: TargetMatchStatus) => {
    setSelectedGroup(group);
    syncNavigationStateToStorageAndUrl("fruta_baixa", "oportunidade", group, searchTerm);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    syncNavigationStateToStorageAndUrl("fruta_baixa", "oportunidade", selectedGroup, term);
  };

  // 1. Processar a Amostra Real de até 200 Contatos da Fila Fruta Baixa (Somente Leitura)
  const evaluatedMatches = useMemo(() => {
    const sample = realLeadsSample.slice(0, 200);
    return sample.map((lead) => evaluateLeadOpportunityMatch(lead));
  }, [realLeadsSample]);

  // 2. Estatísticas de Resolução dos 4 Níveis e Recência na Amostra Real
  const resolutionStats = useMemo(() => {
    const stats = {
      confirmed: 0,
      candidate: 0,
      unresolved: 0,
      missing: 0,
      prioridade: 0,
      validar: 0,
      nao_abordar: 0,
      retiredOrInactive: 0,
    };

    evaluatedMatches.forEach((match) => {
      stats[match.company_resolution_status]++;
      if (match.match_status === "PRIORIDADE") stats.prioridade++;
      else if (match.match_status === "VALIDAR") stats.validar++;
      else stats.nao_abordar++;

      if (match.current_employment_status !== "active") {
        stats.retiredOrInactive++;
      }
    });

    return stats;
  }, [evaluatedMatches]);

  // 3. Filtrar e Ranquear
  const filteredMatches = useMemo(() => {
    return evaluatedMatches
      .filter((m) => m.match_status === selectedGroup)
      .filter((m) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          m.lead_name.toLowerCase().includes(term) ||
          (m.company_name_snapshot && m.company_name_snapshot.toLowerCase().includes(term)) ||
          (m.current_company_name && m.current_company_name.toLowerCase().includes(term)) ||
          (m.previous_company_name && m.previous_company_name.toLowerCase().includes(term)) ||
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

  // Conectar com Endpoint Real de IA (/api/personalize_agent) respeitando a Regra de Vínculo Atual (Regras 4 & 9)
  const handleGenerateAICopies = async (match: OpportunityMatchResult) => {
    setAiCopies((prev) => ({
      ...prev,
      [match.lead_id]: { initialMessage: "", discoveryQuestion: "", followUp: "", isGenerating: true },
    }));

    // Regra 4 & 9: Não gerar mensagem comercial para contatos inativos/aposentados dirigidas à empresa histórica
    if (match.current_employment_status !== "active" || !match.current_company_name) {
      const inactiveMsg = `Contato sem vínculo ativo no momento (${match.employment_recency_status.toUpperCase()}). Não abordar como colaborador atual de ${match.previous_company_name || "empresa anterior"}.`;
      setAiCopies((prev) => ({
        ...prev,
        [match.lead_id]: {
          initialMessage: inactiveMsg,
          discoveryQuestion: "Validar vínculo profissional atual antes de qualquer contato.",
          followUp: "Abordagem suspensa para preservar governança comercial.",
          isGenerating: false,
          isRealAI: false,
          errorNote: match.recommended_action
        },
      }));
      return;
    }

    const companyRef = match.current_company_name;

    const payload = {
      lead: {
        id: match.lead_id,
        nome: match.lead_name,
        cargo: match.current_role || match.lead_cargo || "decisor",
        empresa: companyRef,
        status: match.company_resolution_status
      },
      context_extra: `Oportunidade: Tax Managers — Diagnóstico Receita Sintonia. Vínculo Atual Confirmado: ${companyRef}. REGRA RIGOROSA: Não afirme fatos sobre empresa anterior ou encerrada.`
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
          const initialMessage = data.short_note || `Olá ${match.lead_name}, identificamos na ${companyRef} potenciais pontos de otimização no Diagnóstico Receita Sintonia. Terias 10 minutos esta semana para avaliarmos a aderência?`;
          const discoveryQuestion = data.article_pitch || `No cenário atual da ${companyRef}, vocês já possuem processo automatizado para auditoria de créditos tributários corporativos?`;
          const followUp = data.long_email || `Olá ${match.lead_name}, passando para checar se teve oportunidade de avaliar a mensagem anterior sobre o Diagnóstico Receita Sintonia na ${companyRef}.`;

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

    // Fallback seguro de contingência
    const initialMessage = `Olá ${match.lead_name}, identificamos na ${companyRef} potenciais pontos de otimização no Diagnóstico Receita Sintonia. Terias 10 minutos esta semana para avaliarmos a aderência?`;
    const discoveryQuestion = `No cenário atual da ${companyRef}, vocês já possuem processo automatizado para auditoria de créditos tributários corporativos?`;
    const followUp = `Olá ${match.lead_name}, passando para checar se teve oportunidade de avaliar a mensagem anterior sobre o Diagnóstico Receita Sintonia na ${companyRef}.`;

    setAiCopies((prev) => ({
      ...prev,
      [match.lead_id]: {
        initialMessage,
        discoveryQuestion,
        followUp,
        isGenerating: false,
        isRealAI: false,
        errorNote: "Sugestão local de contingência (Fallback)."
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Aviso Discreto de Modo Leitura */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 text-amber-300 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Versão inicial em modo leitura</strong> — alterações não são persistidas nesta etapa.
          </span>
        </div>
        <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono shrink-0">READ ONLY</span>
      </div>

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
              Filtragem rigorosa de vínculos profissionais ativos, separando contatos aposentados, em transição ou com vínculos encerrados.
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

        {/* Resumo de Resolução na Amostra Real */}
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
              <span className="text-[11px] text-slate-400 font-medium">Vínculos Inativos/Históricos</span>
              <UserX className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-lg font-bold text-rose-400 mt-1">{resolutionStats.retiredOrInactive}</p>
            <span className="text-[10px] text-slate-500">aposentados / histórico</span>
          </div>
        </div>
      </div>

      {/* Tabs dos 3 Grupos de Alvo (PRIORIDADE / VALIDAR / NÃO ABORDAR) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#0b0b0f] border border-white/10 p-2 rounded-xl">
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleSelectGroup("PRIORIDADE")}
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
            onClick={() => handleSelectGroup("VALIDAR")}
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
            onClick={() => handleSelectGroup("NÃO ABORDAR")}
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
            onChange={(e) => handleSearchChange(e.target.value)}
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

                        {/* Status de Recência do Vínculo */}
                        {match.employment_recency_status === "retired" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <UserX className="w-3 h-3 text-rose-400" /> Aposentado
                          </span>
                        ) : match.employment_recency_status === "career_break" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-400" /> Pausa na Carreira
                          </span>
                        ) : match.employment_recency_status === "unemployed" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <UserX className="w-3 h-3 text-rose-400" /> Desempregado
                          </span>
                        ) : match.employment_recency_status === "historical" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> Vínculo Histórico Encerrado
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              match.company_resolution_status === "confirmed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            Empresa Atual: {match.current_company_name || match.company_name_snapshot || "Não confirmada"}
                          </span>
                        )}

                        {/* Badge Curva ABC */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          Curva {match.contact_curve} (Cargo)
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        Cargo Atual: <strong className="text-slate-200">{match.current_role || match.lead_cargo || "Não informado"}</strong>
                        {match.previous_company_name && (
                          <span className="text-slate-400 ml-2">
                            | Empresa Anterior: <strong className="text-amber-300/90">{match.previous_company_name}</strong> (Término: {match.previous_role_ended_at || "histórico"})
                          </span>
                        )}
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

                    {/* Detalhamento dos 8 Campos de Recência do Vínculo */}
                    <div className="bg-[#111116] border border-white/5 p-3 rounded-lg text-xs space-y-1 font-mono">
                      <div className="text-[11px] font-bold text-slate-400 uppercase font-sans mb-1">
                        Dossiê de Recência do Vínculo Profissional (Regras 5 & 6)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div>current_company_name: <span className="text-cyan-300">{match.current_company_name || "null"}</span></div>
                        <div>current_role: <span className="text-cyan-300">{match.current_role || "null"}</span></div>
                        <div>current_employment_status: <span className="text-amber-300">{match.current_employment_status}</span></div>
                        <div>employment_recency_status: <span className="text-emerald-300 font-bold">{match.employment_recency_status}</span></div>
                        <div>previous_company_name: <span className="text-slate-400">{match.previous_company_name || "null"}</span></div>
                        <div>previous_role_ended_at: <span className="text-slate-400">{match.previous_role_ended_at || "null"}</span></div>
                      </div>
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

                    {/* Botão e Área de Copys Personalizadas com IA Real / Fallback */}
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
