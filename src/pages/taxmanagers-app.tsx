import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Search, 
  Filter, 
  Plus, 
  Clipboard, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  MessageSquare, 
  Settings, 
  DollarSign, 
  Award, 
  TrendingUp, 
  LogOut, 
  Users, 
  Menu, 
  X, 
  ChevronRight, 
  Sparkles, 
  UploadCloud, 
  AlertCircle, 
  ShieldAlert,
  Trash2,
  Calendar,
  Layers,
  CheckSquare,
  Radar,
  Workflow,
  ShieldCheck
} from "lucide-react";
import { supabase } from "../lib/supabase";

// Flag de módulo — FORA do componente React, persiste entre re-renders e StrictMode.
// Garante que apenas UM processo de gravação ocorra por abertura do popup de importação.
let _importLock = false;
const _inFlightUrls = new Set<string>();

// Configurações da API da VPS
const VPS_API_URL = import.meta.env.VITE_VPS_API_URL || (typeof window !== "undefined" ? window.location.origin + "/api/vps-proxy" : "http://147.15.112.40:5000");

// Interfaces de Dados
interface Partner {
  id: string;
  nome: string;
  faixa: "Branca" | "Verde" | "Preta";
  saldo_comissao: number;
  is_admin: boolean;
}

interface Campaign {
  id: string;
  nome: string;
  parceiro_id: string | null;
}

interface Lead {
  id: string;
  campanha_id: string | null;
  parceiro_id: string | null;
  nome: string;
  empresa: string;
  cargo: string;
  url: string;
  email: string;
  telefone: string;
  aniversario: string;
  passo1_mensagem: string;
  passo2_mensagem: string;
  passo3_mensagem: string;
  status: "Pendente" | "Abordado" | "Passo 1" | "Passo 2" | "Passo 3" | "Reunião Agendada" | "Faturado" | "Descartado";
  chat_history: string;
  created_at: string;
  linkedin_key?: string | null;
  metadata?: {
    lead_role?: "prospect_parceiro" | "parceiro_ativo" | "cliente_final_empresa" | "indefinido";
    [key: string]: any;
  } | null;
}

interface Sale {
  id: string;
  lead_id: string;
  parceiro_id: string;
  valor_contrato: number;
  comissao_parceiro: number;
  comissao_taxmanagers: number;
  comissao_expert: number;
  comissao_autor: number;
  created_at: string;
  lead_nome?: string;
  lead_empresa?: string;
}

interface AgentConfig {
  id: string;
  campanha_id: string;
  parceiro_id: string;
  thesis_focus: string;
  system_prompt: string;
}

export default function TaxManagersApp() {
  const [location] = useLocation();

  // Auth & Session
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Estado da Importação do Bookmarklet
  const [importStatus, setImportStatus] = useState<"loading" | "success" | "error" | "unauthenticated">("loading");
  const [importedLeadInfo, setImportedLeadInfo] = useState<any>(null);

  const leadSavedRef = useRef(false);

  useEffect(() => {
    if (location !== "/taxmanagers/app/import") return;

    // Reseta apenas o ref de renderização local. O flag global de módulo _importLock NÃO é resetado aqui
    // para evitar que re-renders ou remounts de StrictMode/wouter permitam execuções duplicadas.
    leadSavedRef.current = false;

    let timeoutId: any = null;

    const saveImportedLead = async (leadData: any) => {
      // Trava síncrona — se já iniciou, abandona imediatamente
      if (_importLock || leadSavedRef.current) {
        console.log("Importação já em andamento ou concluída — ignorando chamada duplicada.");
        return;
      }

      const name = leadData.name || "";
      const role = leadData.role || "";
      const company = leadData.company || "";
      const url = leadData.url || "";
      const action = leadData.action || "Importado";
      const email = leadData.email || "";
      const phone = leadData.phone || "";
      const anniversary = leadData.birthday || "";
      const chatHistory = leadData.chat_history || "";

      // Normaliza URL e extrai o username/handle
      const normalizeUrl = (raw: string) => {
        try {
          const u = new URL(raw);
          let hostname = u.hostname.toLowerCase();
          if (hostname.startsWith("www.")) hostname = hostname.substring(4);
          return (u.protocol + "//" + hostname + u.pathname).replace(/\/$/, '').toLowerCase();
        } catch { return raw.toLowerCase().split('?')[0].replace(/\/$/, '').replace("www.", ""); }
      };
      const normalizedUrl = normalizeUrl(url);

      const extractLinkedInHandle = (rawUrl: string) => {
        try {
          const clean = rawUrl.split('?')[0].replace(/\/$/, '');
          const match = clean.match(/\/in\/([^/]+)/i);
          return match && match[1] ? match[1].toLowerCase().trim() : null;
        } catch { return null; }
      };
      const handle = extractLinkedInHandle(url);

      // Trava por URL em processamento
      if (normalizedUrl) {
        if (_inFlightUrls.has(normalizedUrl)) {
          console.log("URL já está sendo processada:", normalizedUrl);
          return;
        }
        _inFlightUrls.add(normalizedUrl);
      }

      _importLock = true;
      leadSavedRef.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user?.id) {
        console.error("Erro de autenticação: session ou session.user.id não encontrado. Abortando importação de lead.");
        setImportStatus("unauthenticated");
        _importLock = false;
        leadSavedRef.current = false;
        if (normalizedUrl) _inFlightUrls.delete(normalizedUrl);
        return;
      }

      try {
        setImportedLeadInfo({ name, role, company, action });

        // Verifica se o lead já existe para este parceiro
        let existingLead = null;

        // 1) Busca por ID/username do LinkedIn na URL (método mais robusto)
        if (handle) {
          const { data: byUrl } = await supabase
            .from("taxmanagers_leads")
            .select("id, email, telefone, cargo, empresa, aniversario, status, chat_history, import_status")
            .eq("parceiro_id", session.user.id)
            .eq("import_status", "active")
            .eq("linkedin_key", handle)
            .limit(1);
          if (byUrl && byUrl.length > 0) existingLead = byUrl[0];
        }

        // 2) Fallback para URL normalizada
        if (!existingLead && normalizedUrl) {
          const { data: byUrl } = await supabase
            .from("taxmanagers_leads")
            .select("id, email, telefone, cargo, empresa, aniversario, status, chat_history, import_status")
            .eq("parceiro_id", session.user.id)
            .eq("import_status", "active")
            .ilike("url", normalizedUrl + "%")
            .limit(1);
          if (byUrl && byUrl.length > 0) existingLead = byUrl[0];
        }

        // 3) Busca por nome + empresa
        if (!existingLead && name && company) {
          const { data: byName } = await supabase
            .from("taxmanagers_leads")
            .select("id, email, telefone, cargo, empresa, aniversario, status, chat_history, import_status")
            .eq("parceiro_id", session.user.id)
            .eq("import_status", "active")
            .ilike("nome", name)
            .ilike("empresa", company)
            .limit(1);
          if (byName && byName.length > 0) existingLead = byName[0];
        }

        // 4) Fallback: busca só pelo nome (caso empresa esteja vazia)
        if (!existingLead && name && !company) {
          const { data: byNameOnly } = await supabase
            .from("taxmanagers_leads")
            .select("id, email, telefone, cargo, empresa, aniversario, status, chat_history, import_status")
            .eq("parceiro_id", session.user.id)
            .eq("import_status", "active")
            .ilike("nome", name)
            .limit(1);
          if (byNameOnly && byNameOnly.length > 0) existingLead = byNameOnly[0];
        }

        let targetLeadId = "";
        let isUpdate = false;

        // Prepara dados mesclando com o lead existente para evitar perda de dados
        let mergedEmail = email;
        let mergedPhone = phone;
        let mergedRole = role;
        let mergedCompany = company;
        let mergedAnniversary = anniversary;
        let mergedChatHistory = chatHistory;
        let mergedStatus = "Pendente";

        if (existingLead) {
          targetLeadId = existingLead.id;
          isUpdate = true;
          mergedStatus = existingLead.status || "Pendente";

          // Mantém o e-mail anterior se o novo for vazio ou "Sem e-mail"
          if (!email || email === "Sem e-mail" || email.toLowerCase().includes("sem")) {
            mergedEmail = existingLead.email || "Sem e-mail";
          }
          // Mantém o telefone anterior se o novo for vazio ou "Sem telefone"
          if (!phone || phone === "Sem telefone" || phone.toLowerCase().includes("sem")) {
            mergedPhone = existingLead.telefone || "Sem telefone";
          }
          // Mantém o cargo anterior se o novo for vazio
          if (!role) {
            mergedRole = existingLead.cargo || "";
          }
          // Mantém a empresa anterior se o novo for vazio
          if (!company) {
            mergedCompany = existingLead.empresa || "";
          }
          // Mantém o aniversário anterior se o novo for vazio
          if (!anniversary) {
            mergedAnniversary = existingLead.aniversario || "";
          }
          // Concatena o histórico do chat tratando formatos JSON vs texto puro
          if (existingLead.chat_history) {
            const existingRaw = existingLead.chat_history.trim();
            const newText = (chatHistory || "").trim();
            if (existingRaw.startsWith("[") && existingRaw.endsWith("]")) {
              try {
                const parsed = JSON.parse(existingRaw);
                if (newText) {
                  if (!existingRaw.includes(newText)) {
                    parsed.push({ role: "user" as const, content: `[Nova Conversa Importada]:\n${newText}` });
                  }
                }
                mergedChatHistory = JSON.stringify(parsed);
              } catch (e) {
                mergedChatHistory = existingLead.chat_history + "\n\n" + newText;
              }
            } else {
              if (newText && !existingRaw.includes(newText)) {
                mergedChatHistory = existingLead.chat_history + "\n\n" + newText;
              } else {
                mergedChatHistory = existingLead.chat_history;
              }
            }
          }
        }

        const upsertPayload = {
          nome: name,
          empresa: mergedCompany,
          cargo: mergedRole,
          url: url,
          email: mergedEmail || "Sem e-mail",
          telefone: mergedPhone || "Sem telefone",
          aniversario: mergedAnniversary,
          status: mergedStatus,
          chat_history: mergedChatHistory,
          parceiro_id: session.user.id,
          linkedin_key: handle || null
        };

        // Garantia de parceiro_id preenchido conforme requisito
        if (!upsertPayload.parceiro_id) {
          throw new Error("parceiro_id não pode ser nulo para importação.");
        }

        const { data: upsertedLeads, error: leadError } = await supabase
          .from("taxmanagers_leads")
          .upsert(upsertPayload, { onConflict: "parceiro_id,linkedin_key" })
          .select();

        if (leadError || !upsertedLeads || upsertedLeads.length === 0) {
          console.error("Erro ao importar/upsert lead:", leadError);
          setImportStatus("error");
          _importLock = false;
          leadSavedRef.current = false;
          if (normalizedUrl) _inFlightUrls.delete(normalizedUrl);
          return;
        }
        targetLeadId = upsertedLeads[0].id;

        // Cria a interação de importação na timeline
        let timelineMessage = isUpdate 
          ? `Lead atualizado via importação do LinkedIn. Ação: ${action}.`
          : `Lead importado via LinkedIn. Ação: ${action}.`;

        if (action === "Pediu Conexão (Inbound)") {
          timelineMessage += "\n\nOrigem LinkedIn: pediu conexão comigo (inbound). Lead morno.";
        } else if (action === "Aceitou Conexão (Outbound)") {
          timelineMessage += "\n\nOrigem LinkedIn: aceitou conexão que enviei (outbound). Lead frio.";
        }

        await supabase.from("taxmanagers_interactions").insert([{
          lead_id: targetLeadId,
          partner_id: session.user.id,
          type: "import",
          direction: action === "Pediu Conexão (Inbound)" ? "inbound" : "internal",
          content: timelineMessage,
          created_by: session.user.id
        }]);

        // Se houver histórico de chat, salva como uma interação de LinkedIn na timeline
        if (chatHistory) {
          await supabase.from("taxmanagers_interactions").insert([{
            lead_id: targetLeadId,
            partner_id: session.user.id,
            type: "linkedin",
            direction: "inbound",
            content: chatHistory,
            created_by: session.user.id
          }]);
        }

        // Se deu tudo certo, remove do Set após salvar
        if (normalizedUrl) _inFlightUrls.delete(normalizedUrl);

        setImportStatus("success");
        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (e) {
        console.error(e);
        if (normalizedUrl) _inFlightUrls.delete(normalizedUrl);
        setImportStatus("error");
        _importLock = false;
        leadSavedRef.current = false;
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "lead_data") {
        if (timeoutId) clearTimeout(timeoutId);
        saveImportedLead(event.data);
      }
    };

    window.addEventListener("message", handleMessage);

    // Sinalizar para o opener que a página está pronta para receber a mensagem
    if (window.opener) {
      window.opener.postMessage("ready", "*");
    }

    // Fallback: se não recebermos a mensagem por postMessage após 3 segundos,
    // tentamos ler os dados não sensíveis da URL query string
    timeoutId = setTimeout(() => {
      console.warn("Handshake postMessage expirou. Usando fallback via query string...");
      const params = new URLSearchParams(window.location.search);
      const name = params.get("name") || "";
      const role = params.get("role") || "";
      const company = params.get("company") || "";
      const url = params.get("url") || "";
      const action = params.get("action") || "Importado";
      
      saveImportedLead({
        name, role, company, url, action,
        email: "", phone: "", birthday: "", chat_history: ""
      });
    }, 3000);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location]);

  // Perfil e Estado Multi-tenant
  const [profile, setProfile] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [appLoading, setAppLoading] = useState(true);

  // Tabs e Navegação
  const [activeTab, setActiveTab] = useState<"hoje" | "dashboard" | "leads" | "comissoes" | "config" | "fruta_baixa">("hoje");

  // Dados do CRM
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [cadences, setCadences] = useState<any[]>([]);
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const [loggingNotes, setLoggingNotes] = useState<string>("");
  const [activeLeadCadence, setActiveLeadCadence] = useState<any>(null);


  // Filtros & Buscas
  const [leadSearch, setLeadSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [activeLeadsLimit, setActiveLeadsLimit] = useState(50);
  const [quarantineLeadsLimit, setQuarantineLeadsLimit] = useState(50);
  const [activeLeadsTotalCount, setActiveLeadsTotalCount] = useState(0);
  const [quarantineTotalCount, setQuarantineTotalCount] = useState(0);
  const [quarantineDatabaseCount, setQuarantineDatabaseCount] = useState(0);
  const [quarantineLoadedCount, setQuarantineLoadedCount] = useState(0);
  const [dbCounts, setDbCounts] = useState<{ total: number; active: number; quarantine: number; other: number } | null>(null);
  const [ataque50kMode, setAtaque50kMode] = useState(false);

  // Efeito para debounce de busca (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(leadSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [leadSearch]);

  // Reseta os limites de listagem de leads para 50 sempre que a busca, o status, a campanha, o parceiro ou a aba mudarem
  useEffect(() => {
    setActiveLeadsLimit(50);
    setQuarantineLeadsLimit(50);
  }, [debouncedSearch, leadStatusFilter, selectedCampaignId, selectedPartnerId, activeTab]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeLeadSubTab, setActiveLeadSubTab] = useState<"outreach" | "ia" | "timeline" | "files" | "edit" | "espelho" | "chat">("outreach");

  // Chat com Llama (Copiloto IA)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Agente Espelho / Clone IA
  const [agentProfile, setAgentProfile] = useState<any | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<any[]>([]);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [editingBlockTipo, setEditingBlockTipo] = useState<string | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState<string>("");
  const [assignClonePartnerId, setAssignClonePartnerId] = useState("");
  const [potencialEco, setPotencialEco] = useState("");
  const [frutaBaixaLeads, setFrutaBaixaLeads] = useState<any[]>([]);
  const [frutaBaixaLoading, setFrutaBaixaLoading] = useState(false);
  const [frutaBaixaError, setFrutaBaixaError] = useState("");
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [expandedMessageLeadId, setExpandedMessageLeadId] = useState<string | null>(null);

  // Helper defensivo para strings — nunca crashar com .toLowerCase() em null/undefined
  const safeText = (value: unknown) => String(value || "").toLowerCase();
  
  // Customização de Leads (Campos Edição)
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAnniversary, setEditAnniversary] = useState("");
  const [editStatus, setEditStatus] = useState<any>("Pendente");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editCargo, setEditCargo] = useState("");

  // Processamento IA e Vision
  const [iaLoading, setIaLoading] = useState(false);
  const [iaLogs, setIaLogs] = useState<string[]>([]);
  const [thesisFocus, setThesisFocus] = useState("Automático");
  const [manualChatInput, setManualChatInput] = useState("");
  const [profilePdfBase64, setProfilePdfBase64] = useState<string | null>(null);
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [contactImageBase64, setContactImageBase64] = useState<string | null>(null);

  // Arquivos Raspados da VPS
  const [vpsFiles, setVpsFiles] = useState<string[]>([]);
  const [vpsFilesLoading, setVpsFilesLoading] = useState(false);

  // Modais de Criação
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [showRegisterSaleModal, setShowRegisterSaleModal] = useState(false);
  
  // Novos Formulários
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadCargo, setNewLeadCargo] = useState("");
  const [newLeadUrl, setNewLeadUrl] = useState("");
  const [newLeadCampaign, setNewLeadCampaign] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");

  // Formulário de Venda
  const [saleLeadId, setSaleLeadId] = useState("");
  const [saleContractValue, setSaleContractValue] = useState("");

  // Monitorar Sessão do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setAppLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Garante que existam as cadências padrão do portal para o parceiro
  const ensureDefaultCadences = async (partnerId: string) => {
    try {
      const { data: existingCadences, error } = await supabase
        .from("taxmanagers_cadences")
        .select("id")
        .limit(1);
      
      if (error || (existingCadences && existingCadences.length === 0)) {
        console.log("Nenhuma cadência encontrada. Criando cadência padrão...");
        const { data: newCadence, error: cadenceError } = await supabase
          .from("taxmanagers_cadences")
          .insert([{
            name: "Fluxo Prospecção Padrão (3 Passos)",
            target_type: "Geral",
            description: "Cadência padrão de 3 etapas com abordagens no LinkedIn e follow-ups.",
            active: true,
            created_by: partnerId
          }])
          .select();

        if (cadenceError) {
          console.error("Erro ao criar cadência no Supabase:", cadenceError);
          alert("Erro ao criar cadência padrão: " + cadenceError.message);
          return;
        }

        if (newCadence && newCadence.length > 0) {
          const cadenceId = newCadence[0].id;
          const { error: stepsError } = await supabase
            .from("taxmanagers_cadence_steps")
            .insert([
              {
                cadence_id: cadenceId,
                step_order: 1,
                channel: "linkedin_manual",
                delay_days: 0,
                subject_template: "Passo 1 - Conexão LinkedIn",
                body_template: "Mensagem de conexão baseada no perfil.",
                goal: "Conectar"
              },
              {
                cadence_id: cadenceId,
                step_order: 2,
                channel: "linkedin_manual",
                delay_days: 2,
                subject_template: "Passo 2 - Newsletter / Conteúdo",
                body_template: "Mensagem agregando valor com post/artigo.",
                goal: "Iniciar diálogo"
              },
              {
                cadence_id: cadenceId,
                step_order: 3,
                channel: "phone",
                delay_days: 3,
                subject_template: "Passo 3 - Diagnóstico / Ligação",
                body_template: "Ligação telefônica para diagnóstico rápido.",
                goal: "Agendar Reunião"
              }
            ]);

          if (stepsError) {
            console.error("Erro ao criar etapas da cadência:", stepsError);
            alert("Erro ao criar etapas da cadência: " + stepsError.message);
          } else {
            console.log("Cadência padrão e etapas inseridas com sucesso.");
          }
        }
      }
    } catch (e: any) {
      console.error("Erro ao verificar/criar cadências padrão:", e);
      alert("Erro ao verificar/criar cadências padrão: " + e.message);
    }
  };

  // Busca Perfil do Parceiro
  const fetchProfile = async (userId: string, userEmail?: string) => {
    setAppLoading(true);
    try {
      const { data, error } = await supabase
        .from("taxmanagers_partners")
        .select("*")
        .eq("id", userId)
        .single();

      // Resolve the email to check for admin dynamically
      const email = userEmail || session?.user?.email;

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        // Se o perfil não existir, cria um perfil padrão para este usuário autenticado
        let resolvedEmail = email;
        if (!resolvedEmail) {
          const { data: userData } = await supabase.auth.getUser();
          resolvedEmail = userData?.user?.email;
        }

        const newProfile = {
          id: userId,
          nome: resolvedEmail?.split("@")[0] || "Parceiro",
          faixa: "Branca",
          saldo_comissao: 0.00,
          is_admin: resolvedEmail?.toLowerCase().trim() === "alexandre.florio@hotmail.com" // Admin Hardcoded
        };
        const { error: insertError } = await supabase
          .from("taxmanagers_partners")
          .insert([newProfile]);
        if (!insertError) {
          setProfile(newProfile as any);
          setSelectedPartnerId(newProfile.is_admin ? "all" : newProfile.id);
          await ensureDefaultCadences(newProfile.id);
        }
      } else {
        const isAdmin = email?.toLowerCase().trim() === "alexandre.florio@hotmail.com" || !!data.is_admin;
        const profileWithAdmin = { ...data, is_admin: isAdmin };
        setProfile(profileWithAdmin);
        setSelectedPartnerId(isAdmin ? "all" : profileWithAdmin.id);
        await ensureDefaultCadences(data.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAppLoading(false);
    }
  };

  // Carrega lista de Franqueados (Modo Admin)
  useEffect(() => {
    if (profile?.is_admin) {
      supabase.from("taxmanagers_partners").select("*").then(({ data }) => {
        if (data) setPartners(data);
      });
    }
  }, [profile]);

  // Declarações das funções de busca do CRM
  const fetchCampaigns = async () => {
    if (!session) return;
    const targetPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!targetPartner) return;
    const query = supabase.from("taxmanagers_campaigns").select("*");
    if (!profile?.is_admin) {
      query.or(`parceiro_id.is.null,parceiro_id.eq.${targetPartner}`);
    } else if (targetPartner !== "all") {
      query.or(`parceiro_id.is.null,parceiro_id.eq.${targetPartner}`);
    }
    const { data } = await query;
    if (data) setCampaigns(data);
  };

  const fetchActiveLeads = async () => {
    if (!session) return;
    const targetPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!targetPartner) return;
    
    let query = supabase
      .from("taxmanagers_leads")
      .select("*", { count: "exact" })
      .eq("import_status", "active")
      .order("created_at", { ascending: false });

    if (targetPartner !== "all") {
      query = query.eq("parceiro_id", targetPartner);
    }

    if (leadStatusFilter !== "all") {
      query = query.eq("status", leadStatusFilter);
    }

    if (selectedCampaignId !== "all") {
      query = query.eq("campanha_id", selectedCampaignId);
    }

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim().replace(/[%,()]/g, "");
      query = query.or(
        `nome.ilike.%${s}%,empresa.ilike.%${s}%,cargo.ilike.%${s}%,email.ilike.%${s}%,telefone.ilike.%${s}%,linkedin_key.ilike.%${s}%`
      );
    }

    query = query.range(0, activeLeadsLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error("Erro ao buscar leads ativos do banco:", error);
    }
    if (data) {
      setLeads(data);
      setActiveLeadsTotalCount(count || 0);
    }

    if (profile?.is_admin) {
      (async () => {
        try {
          const { count: total } = await supabase.from("taxmanagers_leads").select("*", { count: "exact", head: true });
          const { count: active } = await supabase.from("taxmanagers_leads").select("*", { count: "exact", head: true }).eq("import_status", "active");
          const { count: quarantine } = await supabase.from("taxmanagers_leads").select("*", { count: "exact", head: true }).eq("import_status", "quarantine");
          const { count: other } = await supabase.from("taxmanagers_leads").select("*", { count: "exact", head: true }).not("import_status", "in", '("active","quarantine")');
          const { count: statusNull } = await supabase.from("taxmanagers_leads").select("*", { count: "exact", head: true }).is("import_status", null);
          setDbCounts({
            total: total || 0,
            active: active || 0,
            quarantine: quarantine || 0,
            other: (other || 0) + (statusNull || 0)
          });
        } catch (err) {
          console.error("Erro no diagnostico de contagens:", err);
        }
      })();
    }
  };

  const fetchQuarantineLeads = async () => {
    if (!session || !profile?.is_admin) return;
    setFrutaBaixaLoading(true);
    setFrutaBaixaError("");
    try {
      const { count: dbCount, error: countErr } = await supabase
        .from("taxmanagers_leads")
        .select("id", { count: "exact", head: true })
        .eq("import_status", "quarantine");

      if (countErr) {
        console.error("Erro ao buscar total de leads da quarentena:", countErr);
      } else {
        setQuarantineDatabaseCount(dbCount || 0);
      }

      let query = supabase
        .from("taxmanagers_leads")
        .select("*", { count: "exact" })
        .eq("import_status", "quarantine");

      const isSearchActive = !!debouncedSearch.trim();

      if (isSearchActive) {
        const s = debouncedSearch.trim().replace(/[%,()]/g, "");
        query = query.or(
          `nome.ilike.%${s}%,empresa.ilike.%${s}%,cargo.ilike.%${s}%,email.ilike.%${s}%,telefone.ilike.%${s}%,linkedin_key.ilike.%${s}%`
        );
        query = query.range(0, quarantineLeadsLimit - 1);
      } else {
        let keywords: string[] = [];
        if (ataque50kMode) {
          keywords = [
            "contador", "advogado", "tributario", "tributário", "tributaria", "tributária", 
            "contador", "tributario", "tributário", "tributaria", "tributária", 
            "cfo", "controller", "diretor", "especialista", "auditor", "consultor", "professor"
          ];
        } else {
          keywords = [
            "consultor", "socio", "sócio", "advogado", "advogada", "contador", "contadora", "tax", "fiscal", 
            "advisory", "cfo", "ceo", "diretor", "controller", "partner", "founder",
            "tributario", "tributário", "tributaria", "tributária", "planejamento", "recuperacao", 
            "recuperação", "reforma", "boutique", "owner", "head", "consultoria"
          ];
        }
        const orFilter = keywords.map(kw => `cargo.ilike.%${kw}%`).join(",");
        query = query.or(orFilter).limit(1000);
      }

      const { data, count, error } = await query;
      if (error) {
        console.error("[fetchQuarantineLeads:error] Supabase error:", error);
        setFrutaBaixaError(error.message || "Erro ao buscar leads na quarentena");
        setFrutaBaixaLeads([]);
        return;
      }

      if (data) {
        setQuarantineLoadedCount(data?.length || 0);
        let scored = data.map((l: any) => {
          const cargoLower = safeText(l.cargo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const empresaLower = safeText(l.empresa).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const emailText = safeText(l.email);
          const phoneText = safeText(l.telefone);

          let score = 0;
          const reasons: string[] = [];
          let isProspectParceiro = false;
          let isClienteFinalEmpresa = false;
          let ataque50kClassificacao = "";

          const hasNoEmail = !emailText || emailText === "sem e-mail" || emailText.includes("sem");
          const hasNoPhone = !phoneText || phoneText === "sem telefone" || phoneText.includes("sem");
          const hasNoLinkedin = !l.linkedin_key && !l.url;

          if (ataque50kMode) {
            // Lógica Ataque 50k
            const parceiroFirmKeywords = ["advocacia", "advogados", "sociedade de advogados", "contabilidade", "contabil", "auditoria", "consultoria", "consultores", "tax", "fiscal", "tributario", "boutique", "escritorio"];
            const parceiroRoleKeywords = ["socio", "partner", "fundador", "consultor independente", "advogado tributarista", "contador proprietario"];

            const isParceiroFirm = parceiroFirmKeywords.some(kw => empresaLower.includes(kw));
            const isParceiroRole = parceiroRoleKeywords.some(kw => cargoLower.includes(kw));

            if (isParceiroFirm || isParceiroRole) {
              isProspectParceiro = true;
              reasons.push("Prospect Parceiro");
            } else {
              isClienteFinalEmpresa = true;
              if (["advogado", "tributario", "tributário", "gerente tributario", "coordenador fiscal", "especialista tributario"].some(kw => cargoLower.includes(kw))) {
                reasons.push("Cliente Final - Setor Fiscal/Tributário");
              } else if (["cfo", "controller", "diretor financeiro"].some(kw => cargoLower.includes(kw))) {
                reasons.push("Cliente Final Empresa");
              } else {
                reasons.push("Cliente Final - possível influenciador");
              }
            }

            if (["socio", "diretor", "cfo", "partner", "founder"].some(kw => cargoLower.includes(kw))) {
              score += 50;
            }
            if (["tributario", "fiscal"].some(kw => cargoLower.includes(kw) || empresaLower.includes(kw))) {
              score += 30;
            }
            if (!hasNoEmail || !hasNoPhone) {
              score += 20;
            }

            if (score >= 80 && (!hasNoEmail || !hasNoPhone)) {
              ataque50kClassificacao = "Alto Fit";
            } else if (score >= 50) {
              ataque50kClassificacao = "Médio Fit";
            } else {
              ataque50kClassificacao = "Baixo Fit";
            }
          } else {
            // Lógica Padrão Fruta Baixa
            const partnerKeywords = [
              "advogado tributario", "advogada tributaria", "socio de escritorio", "contador", "contadora",
              "consultor fiscal", "consultora fiscal", "consultor tributario", "consultora tributaria",
              "cfo fracionado", "controller", "especialista fiscal", "boutique tributaria",
              "consultoria tributaria", "planejamento tributario", "recuperacao de creditos", "reforma tributaria"
            ];

            if (partnerKeywords.some(kw => cargoLower.includes(kw) || empresaLower.includes(kw))) {
              isProspectParceiro = true;
              score += 150;
              reasons.push("Perfil Prospect Parceiro (+150)");
            }

            ["socio", "fundador", "owner", "partner", "diretor", "head", "consultor independente", "ceo", "founder"].forEach(role => {
              if (cargoLower.includes(role)) {
                score += 40;
                reasons.push(`Tomador Decisão: '${role}' (+40)`);
              }
            });

            ["tributario", "tributaria", "fiscal", "contabil", "contabilidade", "tax", "advisory", "auditor", "auditoria"].forEach(kw => {
              if (cargoLower.includes(kw) || empresaLower.includes(kw)) {
                score += 30;
                reasons.push(`Atuação: '${kw}' (+30)`);
              }
            });

            if (l.linkedin_key || l.url) { score += 15; reasons.push("Possui LinkedIn (+15)"); }
            if (!hasNoEmail) { score += 15; reasons.push("Possui E-mail (+15)"); }
            if (!hasNoPhone && phoneText.length > 5) { score += 15; reasons.push("Possui Telefone (+15)"); }
            if (l.empresa && l.empresa.toLowerCase() !== "n/a" && l.empresa.trim() !== "") { score += 15; reasons.push("Empresa Identificada (+15)"); }

            ["escritorio", "tributaria", "consultoria", "contabilidade", "assessoria", "boutique"].forEach(kw => {
              if (empresaLower.includes(kw) || cargoLower.includes(kw)) { score += 25; reasons.push("Escritório/Consultoria (+25)"); }
            });

            const isSPorBR = 
              cargoLower.includes("sp") || cargoLower.includes("sao paulo") || cargoLower.includes("brasil") || cargoLower.includes("brazil") ||
              empresaLower.includes("sp") || empresaLower.includes("sao paulo") || empresaLower.includes("brasil") ||
              (!hasNoEmail && (emailText.endsWith(".br") || emailText.includes(".com.br"))) ||
              (!hasNoPhone && (phoneText.startsWith("11") || phoneText.startsWith("(11)") || phoneText.startsWith("+5511") || phoneText.startsWith("+55 (11)")));

            if (isSPorBR) { score += 20; reasons.push("Localização SP/BR (+20)"); }

            ["junior", "estagiario", "estagiaria", "estagio", "trainee", "assistente", "auxiliar", "tecnico", "estudante", "student", "universidade", "faculdade", "tribunal", "prefeitura", "secretaria", "ministerio", "receita federal", "juiz", "desembargador", "promotor"].forEach(kw => {
              if (cargoLower.includes(kw) || empresaLower.includes(kw)) { score -= 80; reasons.push(`Cargo/Org Rebaixado: '${kw}' (-80)`); }
            });

            if (hasNoEmail && hasNoPhone && hasNoLinkedin) { score -= 50; reasons.push("Registro Incompleto (-50)"); }
          }

          let sugestaoMensagem = "";
          const pNome = l.nome ? l.nome.split(" ")[0] : "Parceiro";
          const pEmpresa = l.empresa && l.empresa !== "N/A" && l.empresa !== "n/a" ? l.empresa : "seu escritório";

          if (ataque50kMode) {
            if (score >= 70) {
              if (isProspectParceiro) {
                sugestaoMensagem = `A TaxManagers está montando uma operação comercial-tributária com Clone IA, base de prospecção e retaguarda técnica para parceiros. Faz sentido uma conversa rápida para avaliar uma parceria tática neste mês?`;
              } else if (isClienteFinalEmpresa) {
                sugestaoMensagem = `Estou estruturando pela TaxManagers uma frente de diagnóstico tributário com IA para empresas do seu setor, sem começar pedindo arquivos sensíveis. Faz sentido uma conversa rápida de 15 minutos para avaliar aderência?`;
              } else {
                sugestaoMensagem = `Estou estruturando pela TaxManagers uma frente de diagnóstico tributário com IA para empresas do seu setor, sem começar pedindo arquivos sensíveis. Faz sentido uma conversa rápida de 15 minutos para avaliar aderência?`;
              }
            } else if (score >= 40) {
              sugestaoMensagem = `Sugerido adicionar à cadência de nutrição. Não abordar agressivamente agora.`;
            } else {
              sugestaoMensagem = `Em espera. Pontuação insuficiente para abordagem comercial no momento.`;
            }
          } else {
            if (cargoLower.includes("advogado") || cargoLower.includes("boutique") || cargoLower.includes("tributaria") || cargoLower.includes("tributario")) {
              sugestaoMensagem = `Olá ${pNome}, tudo bem? Vi sua atuação em planejamento tributário na ${pEmpresa}. A TaxManagers apoia escritórios e consultorias tributárias fornecendo inteligência artificial e retaguarda técnica especializada para acelerar a captação e entrega de soluções tributárias corporativas. Teria 10 minutos para conversarmos sobre um modelo de parceria?`;
            } else if (cargoLower.includes("contador") || cargoLower.includes("contabilidade")) {
              sugestaoMensagem = `Olá ${pNome}, tudo bem? Notei sua experiência na área contábil e fiscal. Apoiamos contadores a expandirem seus portfólios com soluções avançadas de recuperação de créditos e revisão tributária de forma automatizada, atuando como sua retaguarda de engenharia fiscal. Que tal conversarmos sobre uma parceria de retaguarda técnica?`;
            } else if (cargoLower.includes("cfo") || cargoLower.includes("controller") || cargoLower.includes("diretor")) {
              sugestaoMensagem = `Olá ${pNome}, tudo bem? Vi que atua na gestão financeira e fiscal na ${pEmpresa}. Desenvolvemos soluções de auditoria digital e IA para retaguarda contábil/fiscal que auxiliam empresas a identificarem oportunidades tributárias de forma automatizada. Gostaria de conhecer nossa retaguarda técnica para apoiar seus projetos?`;
            } else {
              sugestaoMensagem = `Olá ${pNome}, tudo bem? A TaxManagers atua como retaguarda técnica especializada e IA para consultores tributários independentes e escritórios corporativos. Vi seu perfil como ${l.cargo || "especialista"} e gostaria de explorar sinergias para apoiarmos seus projetos e clientes. Teria disponibilidade para um bate-papo rápido esta semana?`;
            }
          }

          return {
            ...l,
            score,
            is_prospect_parceiro: isProspectParceiro,
            is_cliente_final_empresa: isClienteFinalEmpresa,
            ataque50k_classificacao: ataque50kClassificacao,
            sugestao_mensagem: sugestaoMensagem,
            motivo_score: reasons.join(", ") || "Critérios básicos"
          };
        });

        scored.sort((a: any, b: any) => b.score - a.score);

        if (isSearchActive) {
          setFrutaBaixaLeads(scored);
          setQuarantineTotalCount(count || 0);
        } else {
          const sliced = scored.slice(0, quarantineLeadsLimit);
          setFrutaBaixaLeads(sliced);
          setQuarantineTotalCount(count || 0);
        }
      } else {
        setFrutaBaixaLeads([]);
        setQuarantineTotalCount(0);
        setQuarantineLoadedCount(0);
      }
    } catch (err: any) {
      console.error("[fetchQuarantineLeads:error]", err);
      setFrutaBaixaError(err?.message || "Erro ao carregar Base Bruta");
      setFrutaBaixaLeads([]);
    } finally {
      setFrutaBaixaLoading(false);
    }
  };

  const fetchSales = async () => {
    if (!session) return;
    const targetPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!targetPartner) return;
    const query = supabase.from("taxmanagers_sales").select("*");
    if (targetPartner !== "all") {
      query.eq("parceiro_id", targetPartner);
    }
    const { data } = await query;
    if (data) setSales(data);
  };

  const fetchTasks = async () => {
    if (!session) return;
    const targetPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!targetPartner) return;
    const query = supabase
      .from("taxmanagers_tasks")
      .select("*, lead:taxmanagers_leads!inner(nome, empresa, cargo, import_status)")
      .eq("lead.import_status", "active")
      .order("due_at", { ascending: true });
    
    if (targetPartner !== "all") {
      query.eq("partner_id", targetPartner);
    }
    const { data, error } = await query;
    if (data) setTasks(data);
  };

  const fetchCadences = async () => {
    if (!session) return;
    const targetPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!targetPartner) return;
    const query = supabase.from("taxmanagers_cadences").select("*");
    if (targetPartner !== "all") {
      query.or(`created_by.is.null,created_by.eq.${targetPartner}`);
    }
    const { data } = await query;
    if (data) setCadences(data);
  };

  const refreshCRMData = () => {
    fetchCampaigns();
    fetchSales();
    fetchTasks();
    fetchCadences();
  };

  const fetchCurrentTabLeads = () => {
    if (activeTab === "leads") {
      fetchActiveLeads();
    } else if (activeTab === "fruta_baixa") {
      fetchQuarantineLeads();
    }
  };

  // Carrega Campanhas, Vendas, Tarefas e Cadências baseados no parceiro selecionado
  useEffect(() => {
    refreshCRMData();
  }, [session, profile, selectedPartnerId]);

  // Recarrega os leads ativos sempre que o parceiro, busca, status, campanha ou limite de paginação mudarem
  useEffect(() => {
    if (activeTab === "leads") {
      fetchActiveLeads();
    }
  }, [session, profile, selectedPartnerId, debouncedSearch, leadStatusFilter, selectedCampaignId, activeLeadsLimit, activeTab]);

  // Recarrega os leads em quarentena sempre que a busca, parceiro ou limite mudarem
  useEffect(() => {
    if (activeTab === "fruta_baixa" && profile?.is_admin) {
      fetchQuarantineLeads();
    }
  }, [session, profile, selectedPartnerId, debouncedSearch, quarantineLeadsLimit, activeTab, ataque50kMode]);


  // Carrega arquivos da VPS e interações para o lead selecionado
  useEffect(() => {
    if (!selectedLead) return;
    
    // Sincroniza estados de edição do Lead
    setEditName(selectedLead.nome || "");
    setEditEmail(selectedLead.email || "");
    setEditPhone(selectedLead.telefone || "");
    setEditAnniversary(selectedLead.aniversario || "");
    setEditStatus(selectedLead.status || "Pendente");
    setEditCampaignId(selectedLead.campanha_id || "none");
    setEditCompany(selectedLead.empresa || "");
    setEditCargo(selectedLead.cargo || "");

    // Inicializa o chat com Llama para este Lead, carregando histórico existente se houver
    let existingHistory = [];
    if (selectedLead.chat_history) {
      const rawHistory = selectedLead.chat_history.trim();
      if (rawHistory.startsWith("[") && rawHistory.endsWith("]")) {
        try {
          existingHistory = JSON.parse(rawHistory);
        } catch (e) {
          console.error("Erro ao fazer parse do chat_history:", e);
          existingHistory = [{ role: "user" as const, content: `[Histórico Anterior]:\n${rawHistory}` }];
        }
      } else if (rawHistory) {
        existingHistory = [{ role: "user" as const, content: `[Conversa Importada do LinkedIn]:\n${rawHistory}` }];
      }
    }

    if (existingHistory && existingHistory.length > 0) {
      setChatMessages(existingHistory);
    } else {
      setChatMessages([
        {
          role: "assistant",
          content: `Olá! Sou o seu Copiloto de Prospecção IA da TaxManagers. Mapeei os dados de **${selectedLead.nome}** (atuando na empresa **${selectedLead.empresa || "não especificada"}** como **${selectedLead.cargo || "decisor"}**).

Como posso te ajudar a ajustar a hipótese de abordagem comercial, sugerir ganchos personalizados para o setor dele ou responder dúvidas específicas sobre este prospect?`
        }
      ]);
    }

    setVpsFilesLoading(true);
    setVpsFiles([]);

    const fetchFiles = async () => {
      try {
        const res = await fetch(`${VPS_API_URL}/api/vps_files?cnpj=${encodeURIComponent(selectedLead.empresa)}&email=${encodeURIComponent(selectedLead.email)}&name=${encodeURIComponent(selectedLead.nome)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.files) {
            setVpsFiles(data.files);
          }
        }
      } catch (e) {
        console.error("Erro ao buscar arquivos na VPS:", e);
      } finally {
        setVpsFilesLoading(false);
      }
    };
    fetchFiles();
    fetchLeadInteractions(selectedLead.id);
    fetchActiveLeadCadence(selectedLead.id);
    fetchAgentProfile(selectedLead.id);
  }, [selectedLead]);

  // O Bookmarklet foi descontinuado em favor da Extensão do Chrome
  // A extensão encontra-se no diretório taxmanagers-extension/

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError("Credenciais inválidas. Verifique seu e-mail e senha.");
    } catch (e: any) {
      setAuthError(e.message || "Erro de conexão.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Adicionar Lead Manual
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany || !newLeadCampaign) return;

    let partnerId = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (profile?.is_admin && (partnerId === "all" || !partnerId)) {
      partnerId = profile.id;
    }

    if (!partnerId) {
      alert("Erro: Não foi possível determinar o parceiro responsável pelo lead.");
      return;
    }

    const emailToInsert = newLeadEmail.trim() || `sem-email-${Date.now()}-${Math.floor(Math.random() * 10000)}@taxmanagers.com.br`;

    const payload = {
      nome: newLeadName.trim(),
      empresa: newLeadCompany.trim(),
      cargo: newLeadCargo.trim(),
      url: newLeadUrl.trim(),
      email: emailToInsert,
      telefone: newLeadPhone.trim() || null,
      campanha_id: newLeadCampaign === "none" ? null : newLeadCampaign,
      parceiro_id: partnerId,
      status: "Pendente"
    };

    const { data, error } = await supabase
      .from("taxmanagers_leads")
      .insert([payload])
      .select();

    if (!error && data) {
      fetchCurrentTabLeads();
      setNewLeadName("");
      setNewLeadCompany("");
      setNewLeadCargo("");
      setNewLeadUrl("");
      setNewLeadEmail("");
      setNewLeadPhone("");
      setShowAddLeadModal(false);
    } else {
      alert("Erro ao adicionar lead: " + error.message);
    }
  };

  // Criar Campanha
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName) return;

    const partnerId = profile?.is_admin ? selectedPartnerId : profile?.id;
    const payload = {
      nome: newCampaignName.trim(),
      parceiro_id: profile?.is_admin ? null : partnerId // Admin cria campanhas globais
    };

    const { data, error } = await supabase
      .from("taxmanagers_campaigns")
      .insert([payload])
      .select();

    if (!error && data) {
      setCampaigns([...campaigns, data[0]]);
      setNewCampaignName("");
      setShowAddCampaignModal(false);
    } else {
      alert("Erro ao criar campanha: " + error.message);
    }
  };

  // Salvar Alterações de Lead
  const handleSaveLeadEdits = async () => {
    if (!selectedLead) return;

    const { error } = await supabase
      .from("taxmanagers_leads")
      .update({
        nome: editName,
        email: editEmail,
        telefone: editPhone,
        aniversario: editAnniversary,
        status: editStatus,
        campanha_id: editCampaignId === "none" ? null : editCampaignId,
        empresa: editCompany,
        cargo: editCargo
      })
      .eq("id", selectedLead.id);

    if (!error) {
      fetchCurrentTabLeads();
      setSelectedLead({
        ...selectedLead,
        nome: editName,
        email: editEmail,
        telefone: editPhone,
        aniversario: editAnniversary,
        status: editStatus,
        campanha_id: editCampaignId === "none" ? null : editCampaignId,
        empresa: editCompany,
        cargo: editCargo
      });
      alert("Alterações salvas com sucesso!");
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  // Resgatar Lote Drip de Leads (Simulador)
  const handleDripLeads = async () => {
    alert("Procurando por novos lotes de leads qualificados na base global da TaxManagers...");
    // Aqui faríamos uma consulta a leads não atribuídos (parceiro_id IS NULL) e atribuiríamos 50 ao parceiro ativo.
    const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
      ? profile?.id
      : (profile?.is_admin ? selectedPartnerId : profile?.id);
    const partnerId = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
    if (!partnerId) return;

    // Mock/Simulação: Pega até 5 leads não atribuídos e atribui a ele
    const { data: globalLeads, error } = await supabase
      .from("taxmanagers_leads")
      .select("*, import_status")
      .is("parceiro_id", null)
      .eq("import_status", "active")
      .limit(10);

    if (error) {
      alert("Erro ao resgatar leads: " + error.message);
      return;
    }

    if (!globalLeads || globalLeads.length === 0) {
      alert("Nenhum lead livre qualificado encontrado na base global. Fale com a equipe TaxManagers.");
      return;
    }

    const leadIds = globalLeads.map(l => l.id);
    const { error: updateError } = await supabase
      .from("taxmanagers_leads")
      .update({ parceiro_id: partnerId })
      .in("id", leadIds);

    if (!updateError) {
      alert(`Sucesso! ${leadIds.length} novos leads foram alocados para a sua carteira.`);
      // Recarrega leads
      const { data } = await supabase
        .from("taxmanagers_leads")
        .select("*, import_status")
        .eq("parceiro_id", partnerId)
        .eq("import_status", "active");
      if (data) setLeads(data);
    }
  };

  // Executar Personalização de IA
  const handleRunAgentWorkflow = async () => {
    if (!selectedLead) return;
    setIaLoading(true);
    setIaLogs(["🚀 Conectando com o serviço de IA...", "🧠 Inicializando análise de perfil..."]);
    
    const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
      ? (selectedLead?.parceiro_id || profile?.id)
      : (profile?.is_admin ? selectedPartnerId : profile?.id);
    const partnerId = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
    if (!partnerId) {
      setIaLogs(prev => [...prev, "❌ Erro: Parceiro não selecionado ou não autenticado."]);
      setIaLoading(false);
      return;
    }

    let jobId: string | null = null;
    const extraContext = `Foco da tese: ${thesisFocus}.${manualChatInput ? ` Entrada manual: ${manualChatInput}` : ""}`;
    const payload = {
      lead: {
        id: selectedLead.id,
        nome: selectedLead.nome,
        cargo: selectedLead.cargo,
        empresa: selectedLead.empresa,
        email: selectedLead.email,
        url: selectedLead.url,
        linkedin_key: selectedLead.linkedin_key,
        chat_history: selectedLead.chat_history,
        metadata: selectedLead.metadata
      },
      context_extra: extraContext,
      profile_image: profileImageBase64,
      contact_image: contactImageBase64
    };

    try {
      // Cria registro de processamento na tabela taxmanagers_ai_jobs
      const { data: jobData, error: jobError } = await supabase
        .from("taxmanagers_ai_jobs")
        .insert([{
          lead_id: selectedLead.id,
          partner_id: partnerId,
          campaign_id: selectedLead.campanha_id || null,
          job_type: "generate_message",
          status: "processing",
          input_payload: payload
        }])
        .select();

      if (jobError) {
        console.error("Erro ao registrar Job de IA:", jobError);
      } else if (jobData && jobData.length > 0) {
        jobId = jobData[0].id;
      }

      setIaLogs(prev => [...prev, "🌐 Fazendo busca profunda de malha fiscal e CARF para a empresa...", "🤖 Executando Llama 3.3 70B para redação..."]);
      
      const res = await fetch("/api/personalize_agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        // Salva as mensagens geradas no Supabase (incluindo metadados atualizados pós-OCR se houver)
        const updatedMetadata = data.updated_metadata || selectedLead.metadata;
        const updatedFields = {
          passo1_mensagem: data.short_note || "",
          passo2_mensagem: data.long_email || "",
          passo3_mensagem: data.article_pitch || "",
          metadata: updatedMetadata
        };

        const { error } = await supabase
          .from("taxmanagers_leads")
          .update(updatedFields)
          .eq("id", selectedLead.id);

        if (!error) {
          setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, ...updatedFields } : l));
          setSelectedLead({ ...selectedLead, ...updatedFields });
          setProfileImageBase64(null);
          setContactImageBase64(null);
          setIaLogs(prev => [...prev, "✅ Mensagens de abordagem geradas e sincronizadas com a nuvem com sucesso!"]);

          // Atualiza Job de IA para concluído
          if (jobId) {
            await supabase
              .from("taxmanagers_ai_jobs")
              .update({
                status: "completed",
                output_payload: data,
                completed_at: new Date().toISOString()
              })
              .eq("id", jobId);
          }

          // Cria interação na timeline notificando sugestão de IA
          await supabase.from("taxmanagers_interactions").insert([{
            lead_id: selectedLead.id,
            partner_id: partnerId,
            type: "ai_suggestion",
            direction: "internal",
            content: `Sugestão de abordagens gerada por IA com sucesso. Foco: ${thesisFocus}.`,
            created_by: profile?.id || null
          }]);
          
          fetchLeadInteractions(selectedLead.id);

        } else {
          setIaLogs(prev => [...prev, "❌ Erro ao salvar no Supabase: " + error.message]);
          if (jobId) {
            await supabase
              .from("taxmanagers_ai_jobs")
              .update({
                status: "failed",
                error_message: "Erro ao salvar no Supabase: " + error.message,
                completed_at: new Date().toISOString()
              })
              .eq("id", jobId);
          }
        }
      } else {
        const errText = await res.text();
        setIaLogs(prev => [...prev, "❌ Erro na API do Servidor: " + errText]);
        if (jobId) {
          await supabase
            .from("taxmanagers_ai_jobs")
            .update({
              status: "failed",
              error_message: "Erro na API do Servidor: " + errText,
              completed_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
      }
    } catch (e: any) {
      setIaLogs(prev => [...prev, "❌ Falha crítica de conexão: " + e.message]);
      if (jobId) {
        await supabase
          .from("taxmanagers_ai_jobs")
          .update({
            status: "failed",
            error_message: "Falha de conexão: " + e.message,
            completed_at: new Date().toISOString()
          })
          .eq("id", jobId);
      }
    } finally {
      setIaLoading(false);
    }
  };

  // Registrar Venda
  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleLeadId || !saleContractValue) return;

    const val = parseFloat(saleContractValue);
    if (isNaN(val) || val <= 0) return;

    let partnerId = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (partnerId === "all") {
      partnerId = leads.find(l => l.id === saleLeadId)?.parceiro_id || profile?.id || null;
    }
    if (!partnerId) return;

    // Splits: 30% Parceiro, 50% Taxmanagers, 10% Expert, 10% Autor
    const comissaoParceiro = val * 0.30;
    const comissaoTax = val * 0.50;
    const comissaoExpert = val * 0.10;
    const comissaoAutor = val * 0.10;

    const payload = {
      lead_id: saleLeadId,
      parceiro_id: partnerId,
      valor_contrato: val,
      comissao_parceiro: comissaoParceiro,
      comissao_taxmanagers: comissaoTax,
      comissao_expert: comissaoExpert,
      comissao_autor: comissaoAutor
    };

    // 1. Salva venda
    const { data: saleData, error: saleError } = await supabase
      .from("taxmanagers_sales")
      .insert([payload])
      .select();

    if (saleError) {
      alert("Erro ao registrar venda: " + saleError.message);
      return;
    }

    // 2. Atualiza status do lead para "Faturado"
    await supabase
      .from("taxmanagers_leads")
      .update({ status: "Faturado" })
      .eq("id", saleLeadId);

    // 3. Atualiza saldo da carteira do parceiro
    const novoSaldo = (profile?.saldo_comissao || 0) + comissaoParceiro;
    await supabase
      .from("taxmanagers_partners")
      .update({ saldo_comissao: novoSaldo })
      .eq("id", partnerId);

    alert("Contrato fechado com sucesso! Split financeiro distribuído.");
    
    // Atualiza estados locais
    setLeads(leads.map(l => l.id === saleLeadId ? { ...l, status: "Faturado" } : l));
    setSales([...sales, saleData[0]]);
    if (profile && profile.id === partnerId) {
      setProfile({ ...profile, saldo_comissao: novoSaldo });
    }
    setSaleLeadId("");
    setSaleContractValue("");
    setShowRegisterSaleModal(false);
  };

  // Busca Perfil do Agente Espelho e seus outputs
  const fetchAgentProfile = async (leadId: string) => {
    setLoadingAgent(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("taxmanagers_agent_profiles")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();

      if (profileError) {
        console.error("Erro ao buscar perfil do agente:", profileError);
        setAgentProfile(null);
        setAgentOutputs([]);
        return;
      }

      setAgentProfile(profileData);

      if (profileData) {
        setPotencialEco(profileData.metadata?.potencial_economico || "R$ 350.000 a R$ 1.500.000");
        const { data: outputsData, error: outputsError } = await supabase
          .from("taxmanagers_agent_outputs")
          .select("*")
          .eq("agent_id", profileData.id);

        if (outputsError) {
          console.error("Erro ao buscar outputs do agente:", outputsError);
          setAgentOutputs([]);
        } else {
          setAgentOutputs(outputsData || []);
        }
      } else {
        setAgentOutputs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAgent(false);
    }
  };


  // Criar clone e abrir dossiê
  const handleCreateAgentForLead = async (lead: Lead) => {
    // Abre o dossiê do lead e define a aba Clone IA
    setSelectedLead(lead);
    setActiveLeadSubTab("espelho"); 
    
    const partnerId = profile?.id;
    if (!partnerId) return;

    try {
      let activeProfile = null;
      
      // 1. Checar se já existe
      const { data: existingProfile } = await supabase
        .from("taxmanagers_agent_profiles")
        .select("*")
        .eq("lead_id", lead.id)
        .maybeSingle();

      if (existingProfile) {
        activeProfile = existingProfile;
        const mergedMetadata = {
          ...(existingProfile.metadata || {}),
          potencial_economico: existingProfile.metadata?.potencial_economico || "R$ 350.000 a R$ 1.500.000",
          modo_uso: existingProfile.metadata?.modo_uso || "demo"
        };
        await supabase
          .from("taxmanagers_agent_profiles")
          .update({
            metadata: mergedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProfile.id);
        activeProfile.metadata = mergedMetadata;
      } else {
        const { data: newProfile, error: profileError } = await supabase
          .from("taxmanagers_agent_profiles")
          .insert([{
            lead_id: lead.id,
            parceiro_id: lead.parceiro_id || null,
            created_by: partnerId,
            status: "mirror_mode",
            metadata: { potencial_economico: "R$ 350.000 a R$ 1.500.000", modo_uso: "demo" }
          }])
          .select()
          .single();

        if (profileError) throw profileError;
        activeProfile = newProfile;
      }

      // 2. Criar ou atualizar os 7 outputs do Clone IA
      const tipos = ["perfil_operacional", "tese", "icp", "lista_empresas", "mensagens", "cadencia", "next_actions"];
      const outputsPayload = tipos.map(tipo => ({
        agent_id: activeProfile.id,
        tipo,
        conteudo: generateSmartTemplate(tipo, lead),
        status: "success"
      }));

      const { error: outputsError } = await supabase
        .from("taxmanagers_agent_outputs")
        .upsert(outputsPayload, { onConflict: "agent_id,tipo" });

      if (outputsError) throw outputsError;

      alert("Clone IA criado/atualizado com sucesso!");
      fetchAgentProfile(lead.id);
    } catch (e: any) {
      alert("Erro ao criar Clone IA: " + e.message);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !selectedLead) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    const updatedUserMsgs = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(updatedUserMsgs);
    setChatLoading(true);

    try {
      // 1. Salva a mensagem do usuário imediatamente no banco de dados para que o backend a encontre
      const { error: preSaveError } = await supabase
        .from("taxmanagers_leads")
        .update({ chat_history: JSON.stringify(updatedUserMsgs) })
        .eq("id", selectedLead.id);

      if (preSaveError) {
        console.error("Erro ao pré-salvar chat_history no banco:", preSaveError);
      } else {
        setSelectedLead(prev =>
          prev ? { ...prev, chat_history: JSON.stringify(updatedUserMsgs) } : prev
        );
      }

      // Exclui a mensagem de boas-vindas inicial (index 0) ao enviar para o histórico do Groq
      const history = chatMessages.slice(1);
      
      const response = await fetch("/api/chat_agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: selectedLead,
          messages: history,
          userMessage: userMsg
        })
      });

      if (!response.ok) {
        throw new Error("Falha na comunicação com o Copiloto IA");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || "Erro no processamento do chat");
      }

      const updatedAllMsgs = [...updatedUserMsgs, { role: "assistant" as const, content: data.content }];
      setChatMessages(updatedAllMsgs);

      // 2. Salva o histórico final com a resposta do assistente no banco de dados
      const { error: dbError } = await supabase
        .from("taxmanagers_leads")
        .update({ chat_history: JSON.stringify(updatedAllMsgs) })
        .eq("id", selectedLead.id);

      if (dbError) {
        console.error("Erro ao salvar chat_history no banco:", dbError);
      } else {
        setSelectedLead(prev =>
          prev ? { ...prev, chat_history: JSON.stringify(updatedAllMsgs) } : prev
        );
        setLeads(prev =>
          prev.map(lead =>
            lead.id === selectedLead.id
              ? { ...lead, chat_history: JSON.stringify(updatedAllMsgs) }
              : lead
          )
        );
      }

      // Teste decisivo de reidratação/gravação
      const { data: verifyData, error: verifyError } = await supabase
        .from("taxmanagers_leads")
        .select("id, chat_history")
        .eq("id", selectedLead.id)
        .single();
      console.log("CHAT HISTORY APÓS SAVE:", verifyData?.chat_history, verifyError);

    } catch (e: any) {
      console.error(e);
      const errorMsgs = [
        ...updatedUserMsgs, 
        { role: "assistant" as const, content: `⚠️ Ocorreu um erro ao processar a mensagem: ${e.message}. Verifique a conexão com a API do Groq.` }
      ];
      setChatMessages(errorMsgs);
    } finally {
      setChatLoading(false);
    }
  };

  // Auxiliar para gerar templates estruturados inteligentes para o Clone IA
  const generateSmartTemplate = (tipo: string, lead: any) => {
    const leadName = lead.nome || "Prospect";
    const leadRole = lead.cargo || "Diretor Fiscal";
    const leadCompany = lead.empresa || "Empresa Alvo";
    const leadEmail = lead.email || "Sem e-mail";
    const leadUrl = lead.url || "Sem URL LinkedIn";
    const leadLinkedinKey = lead.linkedin_key || "Sem Key";
    const leadChatHistory = lead.chat_history || "Sem Histórico";
    
    let conteudo = "";
    let hipotese = "";
    let nivelConfianca = "MÉDIO";
    let fonteDados = `Dados cadastrais do lead (Nome: ${leadName}, Empresa: ${leadCompany})`;

    if (leadEmail && leadEmail !== "Sem e-mail" && !leadEmail.toLowerCase().includes("sem")) {
      fonteDados += `, E-mail: ${leadEmail}`;
    }
    if (leadLinkedinKey && leadLinkedinKey !== "Sem Key") {
      fonteDados += `, LinkedIn Key: ${leadLinkedinKey}`;
    }
    if (leadChatHistory && leadChatHistory !== "Sem Histórico" && leadChatHistory.trim() !== "") {
      fonteDados += `, Histórico de interações no chat`;
    }

    switch(tipo) {
      case "perfil_operacional":
        conteudo = `Clone Operador Comercial-Tributário de ${leadName}
Atuando como: ${leadRole} na empresa ${leadCompany}
Canal de Abordagem: LinkedIn (${leadUrl})

* Foco de Autoridade: Planejamento tributário sênior, recuperação de créditos fiscais e auditoria de obrigações acessórias.
* Tom de Voz: Altamente profissional, direto, focado em ROI, geração de caixa e segurança jurídica.
* Linguagem: Consultiva, focada em segurança jurídica e geração imediata de fluxo de caixa operacional.`;
        hipotese = `O prospect ${leadName} gerencia ou influencia o orçamento e a conformidade fiscal na ${leadCompany}. O clone deve se posicionar como um igual técnico (peer-to-peer).`;
        nivelConfianca = "ALTO";
        break;

      case "tese":
        conteudo = `Teses Tributárias Recomendadas para ${leadCompany}:
1. Recuperação de Créditos Acumulados de ICMS: Mapeamento de saldos credores gerados por diferimento, exportação ou alíquotas diferenciadas.
2. Exclusão do ICMS da base de cálculo do PIS e da COFINS: Retificação de obrigações acessórias (EFD-Contribuições) e compensação dos últimos 5 anos.
3. Créditos sobre Insumos de PIS/COFINS (STJ): Enquadramento de despesas logísticas e de produção como essenciais.`;
        hipotese = `Com base no setor e porte estimado da ${leadCompany}, o regime de Lucro Real/Presumido permite ampla recuperação de créditos não-cumulativos que normalmente passam despercebidos por auditorias internas padrão.`;
        nivelConfianca = "MÉDIO-ALTO";
        break;

      case "icp":
        conteudo = `Perfil de Cliente Ideal (ICP) & Mercado-Alvo:
* Setor prioritário: Indústria Manufatureira, Agronegócio, Distribuição e Transportadoras.
* Regime Tributário: Preferencialmente Lucro Real com faturamento anual superior a R$ 30 Milhões.
* Persona ideal: CFO, Diretor Financeiro, Controller ou Gerente Fiscal de nível estratégico.`;
        hipotese = `Empresas de médio e grande porte nesse segmento possuem alta complexidade fiscal e margens pressionadas, aumentando a propensão de contratar auditoria externa focada em êxito.`;
        nivelConfianca = "MÉDIO";
        break;

      case "lista_empresas":
        conteudo = `Lista de Prospects Correlacionados sugeridos para ataque:
1. Metalúrgica Sul-Rio S.A. | Setor: Metalmecânico | Faturamento Est: R$ 85M/ano
2. Distribuidora e Logística do Vale Ltda | Setor: Transportes | Faturamento Est: R$ 60M/ano
3. Agropecuária Nova Terra | Setor: Agronegócio | Faturamento Est: R$ 110M/ano`;
        hipotese = `Aproximar o prospect com referências e contatos no mesmo setor e faixa de faturamento gera confiança imediata e facilita a validação da tese.`;
        nivelConfianca = "MÉDIO";
        break;

      case "mensagens":
        conteudo = `[MENSAGEM 1 - CONEXÃO LINKEDIN]
"Olá, ${leadName.split(" ")[0]}. Acompanho sua atuação como ${leadRole} na ${leadCompany}. Mapeamos recentemente oportunidades de recuperação fiscal específicas para o seu setor. Gostaria de nos conectar."

[MENSAGEM 2 - PÓS-CONEXÃO (24H DEPOIS)]
"Olá, ${leadName.split(" ")[0]}, obrigado pela conexão. Temos observado que indústrias similares à ${leadCompany} costumam reaver em média 8% de créditos tributários sobre insumos essenciais de PIS/COFINS. Mapeamos um cenário preliminar para a sua operação. Faríamos uma chamada de 10 minutos nesta semana para eu te apresentar?"`;
        hipotese = `O pitch comercial focado em insights e dados de benchmark setorial possui taxa de agendamento significativamente superior à prospecção fria tradicional.`;
        nivelConfianca = "ALTO";
        break;

      case "cadencia":
        conteudo = `Cadência Comercial do Clone IA (7 Dias):
* Dia 1: Solicitação de conexão personalizada no LinkedIn (Mensagem 1).
* Dia 3: Mensagem de valor agregado pós-conexão (Mensagem 2).
* Dia 5: E-mail de follow-up com estudo de caso em PDF para o contato (${leadEmail}).
* Dia 7: Mensagem de resgate no LinkedIn propondo agendamento de diagnóstico rápido.`;
        hipotese = `O fluxo multicanal de 4 pontos de contato otimiza o alcance sem saturar a caixa de entrada do prospect.`;
        nivelConfianca = "ALTO";
        break;

      case "next_actions":
        conteudo = `Próximas Ações do Clone:
1. Validar e confirmar se o LinkedIn (${leadUrl}) e o E-mail (${leadEmail}) estão ativos.
2. Iniciar o Dia 1 da cadência comercial.
3. Monitorar respostas no LinkedIn e sinalizar no painel se houver interesse para chamada.
4. Alimentar a timeline com anotações de conversas.`;
        hipotese = `A execução rápida do fluxo inicial de abordagem logo após o mapeamento maximiza a conversão de reuniões.`;
        nivelConfianca = "ALTO";
        break;

      default:
        conteudo = `Informações gerais e ações recomendadas para o prospect ${leadName}.`;
        hipotese = `N/A`;
        nivelConfianca = "MÉDIO";
    }

    return `CONTEÚDO:
${conteudo}

HIPÓTESE:
${hipotese}

NÍVEL DE CONFIANÇA:
${nivelConfianca}

FONTE DOS DADOS USADOS:
${fonteDados}`;
  };

  // Criar ou carregar o Registro do Clone IA (idempotente)
  const handleCreateAgent = async () => {
    if (!selectedLead) return;
    const partnerId = profile?.id;
    if (!partnerId) {
      alert("Usuário não autenticado.");
      return;
    }

    try {
      // 1. Verificar se já existe um perfil para o lead_id
      let activeProfile = null;
      const { data: existingProfile, error: checkError } = await supabase
        .from("taxmanagers_agent_profiles")
        .select("*")
        .eq("lead_id", selectedLead.id)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao checar perfil existente:", checkError);
      }

      if (existingProfile) {
        // Se já existe, reaproveitamos e atualizamos/fundimos o metadata
        activeProfile = existingProfile;
        const mergedMetadata = {
          ...(existingProfile.metadata || {}),
          potencial_economico: existingProfile.metadata?.potencial_economico || "R$ 350.000 a R$ 1.500.000",
          modo_uso: existingProfile.metadata?.modo_uso || "demo"
        };
        
        await supabase
          .from("taxmanagers_agent_profiles")
          .update({
            metadata: mergedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProfile.id);
          
        activeProfile.metadata = mergedMetadata;
      } else {
        // Se não existe, cria um novo perfil
        const { data: newProfile, error: profileError } = await supabase
          .from("taxmanagers_agent_profiles")
          .insert([{
            lead_id: selectedLead.id,
            parceiro_id: selectedLead.parceiro_id || null,
            created_by: partnerId,
            status: "mirror_mode",
            metadata: { potencial_economico: "R$ 350.000 a R$ 1.500.000", modo_uso: "demo" }
          }])
          .select()
          .single();

        if (profileError) {
          console.error("Erro ao criar perfil do agente:", profileError);
          alert("Erro ao criar perfil do agente: " + profileError.message);
          return;
        }
        activeProfile = newProfile;
      }

      // 2. Criar ou atualizar os 7 outputs do Clone IA (idempotente via upsert)
      const tipos = [
        "perfil_operacional",
        "tese",
        "icp",
        "lista_empresas",
        "mensagens",
        "cadencia",
        "next_actions"
      ];

      const outputsPayload = tipos.map(tipo => ({
        agent_id: activeProfile.id,
        tipo,
        conteudo: generateSmartTemplate(tipo, selectedLead),
        status: "success"
      }));

      const { error: outputsError } = await supabase
        .from("taxmanagers_agent_outputs")
        .upsert(outputsPayload, { onConflict: "agent_id,tipo" });

      if (outputsError) {
        console.error("Erro ao criar/atualizar outputs do agente:", outputsError);
        alert("Erro ao criar outputs do agente: " + outputsError.message);
      } else {
        alert("Clone IA criado com sucesso!");
      }

      fetchAgentProfile(selectedLead.id);
      refreshCRMData();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao processar criação de Clone IA: " + err.message);
    }
  };

  // Salvar Edição de Bloco do Agente
  const handleSaveAgentBlock = async (tipo: string, conteudo: string) => {
    if (!agentProfile) return;

    try {
      const { error } = await supabase
        .from("taxmanagers_agent_outputs")
        .upsert({
          agent_id: agentProfile.id,
          tipo,
          conteudo,
          status: "user_edited",
          updated_at: new Date().toISOString()
        }, { onConflict: "agent_id,tipo" });

      if (error) {
        console.error("Erro ao salvar bloco do agente:", error);
        alert("Erro ao salvar: " + error.message);
        return;
      }

      alert("Bloco atualizado com sucesso!");
      
      // Atualiza estado local de outputs
      setAgentOutputs(prev => {
        const exists = prev.some(o => o.tipo === tipo);
        if (exists) {
          return prev.map(o => o.tipo === tipo ? { ...o, conteudo, status: "user_edited" } : o);
        } else {
          return [...prev, { agent_id: agentProfile.id, tipo, conteudo, status: "user_edited" }];
        }
      });
      setEditingBlockTipo(null);
      setEditingBlockContent("");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    }
  };

  // Salvar Potencial Econômico Estimado (salvo no metadata do profile)
  const handleSavePotencialEco = async () => {
    if (!agentProfile) return;
    try {
      const mergedMetadata = {
        ...(agentProfile.metadata || {}),
        potencial_economico: potencialEco,
        modo_uso: agentProfile.metadata?.modo_uso || "demo"
      };

      const { error } = await supabase
        .from("taxmanagers_agent_profiles")
        .update({
          metadata: mergedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq("id", agentProfile.id);

      if (error) throw error;
      
      alert("Potencial econômico atualizado!");
      setAgentProfile(prev => prev ? { ...prev, metadata: mergedMetadata } : null);
    } catch (e: any) {
      alert("Erro ao salvar potencial econômico: " + e.message);
    }
  };

  // Ativar para minha própria operação (Master Admin assume a propriedade)
  const handleActivateForMe = async () => {
    if (!agentProfile || !selectedLead || !profile) return;

    const confirmAct = window.confirm("Tem certeza que deseja ativar este Clone IA para a sua própria operação? Você se tornará o proprietário deste lead e do clone.");
    if (!confirmAct) return;

    try {
      // 1. Atualiza o perfil do agente
      const { error: agentErr } = await supabase
        .from("taxmanagers_agent_profiles")
        .update({
          status: "client_active",
          parceiro_id: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", agentProfile.id);

      if (agentErr) throw agentErr;

      // 2. Atualiza o lead no CRM
      const { error: leadErr } = await supabase
        .from("taxmanagers_leads")
        .update({
          parceiro_id: profile.id,
          import_status: "active"
        })
        .eq("id", selectedLead.id);

      if (leadErr) throw leadErr;

      // 3. Registra na timeline
      await supabase.from("taxmanagers_interactions").insert([{
        lead_id: selectedLead.id,
        partner_id: profile.id,
        type: "status_change",
        direction: "internal",
        content: `Clone IA ativado com sucesso para a operação do Master Admin ${profile.nome}.`,
        created_by: profile.id
      }]);

      alert("Clone ativado com sucesso para sua operação!");
      fetchAgentProfile(selectedLead.id);
      refreshCRMData();
      fetchActiveLeads();
      fetchQuarantineLeads();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao ativar para sua operação: " + err.message);
    }
  };

  // Ativar para parceiro (exige seleção de parceiro e confirmação explícita)
  const handleActivateForPartner = async () => {
    if (!agentProfile || !selectedLead || !profile) return;
    if (!assignClonePartnerId) {
      alert("Por favor, selecione um parceiro na lista primeiro.");
      return;
    }

    const partner = partners.find(p => p.id === assignClonePartnerId);
    const partnerName = partner ? partner.nome : "Parceiro Selecionado";

    const confirmAct = window.confirm(`ATENÇÃO: Você está prestes a transferir e ativar este Clone IA para a operação de "${partnerName}". O lead e o clone serão removidos da quarentena e enviados para a conta dele. Confirma esta ação?`);
    if (!confirmAct) return;

    try {
      // 1. Atualiza o perfil do agente
      const { error: agentErr } = await supabase
        .from("taxmanagers_agent_profiles")
        .update({
          status: "client_active",
          parceiro_id: assignClonePartnerId,
          updated_at: new Date().toISOString()
        })
        .eq("id", agentProfile.id);

      if (agentErr) throw agentErr;

      // 2. Atualiza o lead no CRM
      const { error: leadErr } = await supabase
        .from("taxmanagers_leads")
        .update({
          parceiro_id: assignClonePartnerId,
          import_status: "active"
        })
        .eq("id", selectedLead.id);

      if (leadErr) throw leadErr;

      // 3. Registra na timeline
      await supabase.from("taxmanagers_interactions").insert([{
        lead_id: selectedLead.id,
        partner_id: assignClonePartnerId,
        type: "status_change",
        direction: "internal",
        content: `Clone IA ativado e transferido para a operação do parceiro ${partnerName} por ${profile.nome}.`,
        created_by: profile.id
      }]);

      alert(`Clone ativado com sucesso para o parceiro ${partnerName}!`);
      fetchAgentProfile(selectedLead.id);
      refreshCRMData();
      fetchActiveLeads();
      fetchQuarantineLeads();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao ativar para parceiro: " + err.message);
    }
  };

  // Inicia uma cadência para um lead
  const startLeadCadence = async (leadId: string, cadenceId: string) => {
    const leadObj = leads.find(l => l.id === leadId);
    const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
      ? (leadObj?.parceiro_id || profile?.id)
      : (profile?.is_admin ? selectedPartnerId : profile?.id);
    const targetPartner = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
    const createdByPartner = profile?.id || null;
    if (!targetPartner) return;
    
    try {
      const { data: steps, error: stepsError } = await supabase
        .from("taxmanagers_cadence_steps")
        .select("*")
        .eq("cadence_id", cadenceId)
        .order("step_order", { ascending: true });

      if (stepsError || !steps || steps.length === 0) {
        alert("Erro ao buscar etapas da cadência ou cadência sem etapas cadastradas.");
        return;
      }

      const firstStep = steps[0];
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + (firstStep.delay_days || 0));

      const { error: lcError } = await supabase
        .from("taxmanagers_lead_cadences")
        .insert([{
          lead_id: leadId,
          cadence_id: cadenceId,
          current_step_id: firstStep.id,
          status: "active",
          started_at: new Date().toISOString(),
          next_due_at: dueAt.toISOString(),
          owner_partner_id: targetPartner
        }]);

      if (lcError) {
        console.error(lcError);
        alert("Erro ao associar cadência ao lead.");
        return;
      }

      const { error: taskError } = await supabase
        .from("taxmanagers_tasks")
        .insert([{
          lead_id: leadId,
          partner_id: targetPartner,
          cadence_id: cadenceId,
          step_id: firstStep.id,
          type: firstStep.channel,
          channel: firstStep.channel,
          title: `${firstStep.subject_template || "Etapa " + firstStep.step_order}`,
          description: firstStep.body_template || "",
          due_at: dueAt.toISOString(),
          status: "pending"
        }]);

      if (taskError) {
        console.error("Erro ao criar tarefa inicial:", taskError);
      }

      const cadenceName = cadences.find(c => c.id === cadenceId)?.name || "Fluxo";
      await supabase.from("taxmanagers_interactions").insert([{
        lead_id: leadId,
        partner_id: targetPartner,
        type: "status_change",
        direction: "internal",
        content: `Iniciou a cadência: ${cadenceName}`,
        created_by: createdByPartner
      }]);

      // Se o lead selecionado for o atual, recarrega suas interações
      if (selectedLead && selectedLead.id === leadId) {
        fetchLeadInteractions(leadId);
      }

      refreshCRMData();
      alert(`Cadência "${cadenceName}" iniciada com sucesso no lead!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Concluir ou pular tarefa da cadência
  const completeTask = async (taskId: string, outcome: 'done' | 'skipped', notes?: string) => {
    const rawPartner = profile?.is_admin ? selectedPartnerId : profile?.id;
    if (!rawPartner) return;
    
    try {
      const { data: task, error: fetchError } = await supabase
        .from("taxmanagers_tasks")
        .select("*")
        .eq("id", taskId)
        .single();
        
      if (fetchError || !task) {
        console.error("Erro ao obter dados da tarefa:", fetchError);
        return;
      }

      const leadObj = leads.find(l => l.id === task.lead_id);
      const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
        ? (leadObj?.parceiro_id || task.partner_id || profile?.id)
        : (profile?.is_admin ? selectedPartnerId : profile?.id);
      const targetPartnerResolved = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
      const createdByResolved = profile?.id || null;

      const { error: updateError } = await supabase
        .from("taxmanagers_tasks")
        .update({
          status: outcome,
          completed_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (updateError) {
        console.error("Erro ao atualizar tarefa:", updateError);
        return;
      }

      const interactionType = task.channel === 'phone' ? 'phone' : 
                              task.channel === 'email' ? 'email' : 
                              task.channel === 'whatsapp_manual' ? 'whatsapp' :
                              task.channel === 'linkedin_manual' ? 'linkedin' : 'note';

      await supabase.from("taxmanagers_interactions").insert([{
        lead_id: task.lead_id,
        partner_id: targetPartnerResolved,
        type: outcome === 'done' ? interactionType : 'note',
        direction: "outbound",
        content: outcome === 'done' 
          ? `Tarefa Concluída: ${task.title}. ${notes || ""}` 
          : `Tarefa Ignorada/Pulada: ${task.title}. Motivo: ${notes || ""}`,
        created_by: createdByResolved
      }]);

      if (task.cadence_id && task.step_id && outcome === 'done') {
        const { data: steps } = await supabase
          .from("taxmanagers_cadence_steps")
          .select("*")
          .eq("cadence_id", task.cadence_id)
          .order("step_order", { ascending: true });

        if (steps) {
          const currentStepIdx = steps.findIndex(s => s.id === task.step_id);
          if (currentStepIdx !== -1 && currentStepIdx < steps.length - 1) {
            const nextStep = steps[currentStepIdx + 1];
            const dueAt = new Date();
            dueAt.setDate(dueAt.getDate() + (nextStep.delay_days || 0));

            await supabase
              .from("taxmanagers_lead_cadences")
              .update({
                current_step_id: nextStep.id,
                next_due_at: dueAt.toISOString()
              })
              .eq("lead_id", task.lead_id)
              .eq("cadence_id", task.cadence_id);

            await supabase
              .from("taxmanagers_tasks")
              .insert([{
                lead_id: task.lead_id,
                partner_id: targetPartnerResolved,
                cadence_id: task.cadence_id,
                step_id: nextStep.id,
                type: nextStep.channel,
                channel: nextStep.channel,
                title: `${nextStep.subject_template || "Etapa " + nextStep.step_order}`,
                description: nextStep.body_template || "",
                due_at: dueAt.toISOString(),
                status: "pending"
              }]);

            await supabase.from("taxmanagers_interactions").insert([{
              lead_id: task.lead_id,
              partner_id: targetPartnerResolved,
              type: "status_change",
              direction: "internal",
              content: `Avançou na cadência para Etapa ${nextStep.step_order}: ${nextStep.subject_template}`,
              created_by: createdByResolved
            }]);
          } else {
            await supabase
              .from("taxmanagers_lead_cadences")
              .update({
                status: "completed",
                next_due_at: null
              })
              .eq("lead_id", task.lead_id)
              .eq("cadence_id", task.cadence_id);

            await supabase.from("taxmanagers_interactions").insert([{
              lead_id: task.lead_id,
              partner_id: targetPartnerResolved,
              type: "status_change",
              direction: "internal",
              content: `Cadência concluída com sucesso!`,
              created_by: createdByResolved
            }]);
          }
        }
      }

      if (selectedLead && selectedLead.id === task.lead_id) {
        fetchLeadInteractions(task.lead_id);
      }

      refreshCRMData();
    } catch (e) {
      console.error(e);
    }
  };

  // Carrega as interações do lead selecionado para a timeline
  const fetchLeadInteractions = async (leadId: string) => {
    setInteractionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("taxmanagers_interactions")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (data) {
        setInteractions(data);
      }
    } catch (e) {
      console.error("Erro ao buscar interações:", e);
    } finally {
      setInteractionsLoading(false);
    }
  };

  // Carrega a cadência ativa do lead
  const fetchActiveLeadCadence = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("taxmanagers_lead_cadences")
        .select("*, cadence:taxmanagers_cadences(*), current_step:taxmanagers_cadence_steps(*)")
        .eq("lead_id", leadId)
        .eq("status", "active")
        .limit(1);
      
      if (data && data.length > 0) {
        setActiveLeadCadence(data[0]);
      } else {
        setActiveLeadCadence(null);
      }
    } catch (e) {
      console.error("Erro ao buscar cadência ativa:", e);
    }
  };

  const renderTaskItem = (task: any) => {
    const isLogging = loggingTaskId === task.id;
    
    let channelIcon = <CheckSquare className="w-4 h-4" />;
    let iconBg = "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    if (task.channel === "linkedin_manual") {
      channelIcon = <Users className="w-4 h-4" />;
      iconBg = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    } else if (task.channel === "phone") {
      channelIcon = <CheckSquare className="w-4 h-4" />;
      iconBg = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    } else if (task.channel === "whatsapp_manual") {
      channelIcon = <MessageSquare className="w-4 h-4" />;
      iconBg = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    } else if (task.channel === "email") {
      channelIcon = <FileText className="w-4 h-4" />;
      iconBg = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }

    const handleExecuteTask = () => {
      const fullLead = leads.find(l => l.id === task.lead_id);
      if (!fullLead) return;
      
      if (task.channel === "linkedin_manual") {
        let textToCopy = "";
        if (task.title.includes("Passo 1") || task.title.toLowerCase().includes("conexão")) {
          textToCopy = fullLead.passo1_mensagem || "";
        } else if (task.title.includes("Passo 2")) {
          textToCopy = fullLead.passo2_mensagem || "";
        } else if (task.title.includes("Passo 3")) {
          textToCopy = fullLead.passo3_mensagem || "";
        } else {
          textToCopy = fullLead.passo1_mensagem || "";
        }

        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy);
          alert("Mensagem copiada para a área de transferência! Abrindo perfil do lead no LinkedIn...");
        } else {
          alert("Abrindo perfil do lead no LinkedIn...");
        }

        if (fullLead.url) {
          window.open(fullLead.url, "_blank");
        }
      } else if (task.channel === "whatsapp_manual" && fullLead.telefone) {
        let cleanPhone = fullLead.telefone.replace(/\D/g, "");
        if (!cleanPhone.startsWith("55") && cleanPhone.length >= 10) {
          cleanPhone = "55" + cleanPhone;
        }
        window.open(`https://wa.me/${cleanPhone}`, "_blank");
      }
      
      setLoggingTaskId(task.id);
      setLoggingNotes("");
    };

    const handleConfirmLog = async (outcome: 'done' | 'skipped') => {
      await completeTask(task.id, outcome, loggingNotes);
      setLoggingTaskId(null);
      setLoggingNotes("");
    };

    return (
      <div key={task.id} className="bg-[#111116] border border-white/5 rounded-xl p-4 transition-all hover:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg flex-shrink-0 mt-0.5 ${iconBg}`}>
              {channelIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-semibold text-sm text-white hover:text-cyan-400 cursor-pointer" onClick={() => {
                  const l = leads.find(lead => lead.id === task.lead_id);
                  if (l) setSelectedLead(l);
                }}>
                  {task.lead?.nome || "Lead Sem Nome"}
                </h5>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-xs text-slate-400">{task.lead?.cargo} na {task.lead?.empresa}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">{task.title}</p>
              {task.description && (
                <p className="text-[11px] text-slate-500 mt-1 italic">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {!isLogging ? (
              <>
                <button 
                  onClick={handleExecuteTask}
                  className="px-3.5 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Executar</span>
                </button>
                <button 
                  onClick={() => {
                    setLoggingTaskId(task.id);
                    setLoggingNotes("");
                  }}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Pular
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Preenchendo registro...</span>
            )}
          </div>
        </div>

        {isLogging && (
          <div className="mt-4 pt-4 border-t border-white/5 bg-black/20 p-3 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-slate-300">Registrar resultado da atividade:</p>
            <textarea 
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white h-16 focus:outline-none focus:border-cyan-500/50"
              placeholder="Notas extras (Ex: Respondeu dizendo que quer conversar na terça, ou caixa postal)..."
              value={loggingNotes}
              onChange={e => setLoggingNotes(e.target.value)}
            ></textarea>
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setLoggingTaskId(null)}
                className="text-xs text-slate-500 hover:text-slate-400"
              >
                Cancelar
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleConfirmLog('skipped')}
                  className="px-3 py-1 bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded text-xs font-semibold transition-all"
                >
                  Pular Etapa
                </button>
                <button 
                  onClick={() => handleConfirmLog('done')}
                  className="px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded text-xs font-semibold transition-all"
                >
                  ✓ Confirmar Envio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Utilitários para converter arquivos em base64 e registrar anexo
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (b64: string | null) => void,
    type: 'profile' | 'contact'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLead) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      setter(base64Str);

      const currentMetadata = selectedLead.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        [type === 'profile' ? 'has_profile_attachment' : 'has_contact_attachment']: true
      };

      const { error } = await supabase
        .from("taxmanagers_leads")
        .update({ metadata: updatedMetadata })
        .eq("id", selectedLead.id);

      if (!error) {
        const newLead = { ...selectedLead, metadata: updatedMetadata };
        setSelectedLead(newLead);
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? newLead : l));
      }
    };
    reader.readAsDataURL(file);
  };

  // Iniciar Edição do Lead
  const startEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditName(lead.nome || "");
    setEditEmail(lead.email || "");
    setEditPhone(lead.telefone || "");
    setEditAnniversary(lead.aniversario || "");
    setEditStatus(lead.status || "Pendente");
    setEditCampaignId(lead.campanha_id || "none");
    setEditCompany(lead.empresa || "");
    setEditCargo(lead.cargo || "");
    setActiveLeadSubTab("outreach");
  };

  // Contagem de Estatísticas
  const leadsCount = leads.length;
  const leadsAbordados = leads.filter(l => ["Passo 1", "Passo 2", "Passo 3", "Abordado"].includes(l.status)).length;
  const reunioesAgendadas = leads.filter(l => l.status === "Reunião Agendada").length;
  const faturadosCount = leads.filter(l => l.status === "Faturado").length;
  const totalReceita = sales.reduce((acc, curr) => acc + Number(curr.valor_contrato), 0);
  const comissaoAcumulada = profile ? profile.saldo_comissao : 0;

  // Barra de Progresso Gamificação Baseada em Faturamento/Contratos
  const getGamificationProgress = () => {
    const salesCount = sales.length;
    const revenue = totalReceita;

    if (salesCount === 0) {
      return { 
        name: "Faixa Branca", 
        color: "bg-white", 
        colorText: "text-white",
        next: "Faixa Azul", 
        progress: 0, 
        currentVal: 0, 
        targetVal: 1, 
        unit: "contrato",
        hint: "Feche seu 1º contrato para subir para a Faixa Azul!"
      };
    } else if (revenue < 10000) {
      return { 
        name: "Faixa Azul", 
        color: "bg-blue-500", 
        colorText: "text-blue-400",
        next: "Faixa Azul - 2º Grau", 
        progress: Math.min((revenue / 10000) * 100, 100), 
        currentVal: revenue, 
        targetVal: 10000, 
        unit: "R$",
        hint: "Gere R$ 10.000 em honorários gerais para subir para a Faixa Azul - 2º Grau!"
      };
    } else if (revenue < 30000) {
      return { 
        name: "Faixa Azul - 2º Grau", 
        color: "bg-blue-600", 
        colorText: "text-blue-500",
        next: "Faixa Verde", 
        progress: Math.min((revenue / 30000) * 100, 100), 
        currentVal: revenue, 
        targetVal: 30000, 
        unit: "R$",
        hint: "Gere R$ 30.000 em honorários gerais para subir para a Faixa Verde!"
      };
    } else if (revenue < 70000) {
      return { 
        name: "Faixa Verde", 
        color: "bg-emerald-500", 
        colorText: "text-emerald-400",
        next: "Faixa Verde - 2º Grau", 
        progress: Math.min((revenue / 70000) * 100, 100), 
        currentVal: revenue, 
        targetVal: 70000, 
        unit: "R$",
        hint: "Gere R$ 70.000 em honorários gerais para subir para a Faixa Verde - 2º Grau!"
      };
    } else if (revenue < 100000) {
      return { 
        name: "Faixa Verde - 2º Grau", 
        color: "bg-emerald-600", 
        colorText: "text-emerald-500",
        next: "Faixa Marrom", 
        progress: Math.min((revenue / 100000) * 100, 100), 
        currentVal: revenue, 
        targetVal: 100000, 
        unit: "R$",
        hint: "Gere R$ 100.000 em honorários gerais para subir para a Faixa Marrom!"
      };
    } else if (revenue < 300000) {
      return { 
        name: "Faixa Marrom", 
        color: "bg-amber-800", 
        colorText: "text-amber-700",
        next: "Faixa Preta", 
        progress: Math.min((revenue / 300000) * 100, 100), 
        currentVal: revenue, 
        targetVal: 300000, 
        unit: "R$",
        hint: "Gere R$ 300.000 em honorários gerais para subir para a Faixa Preta!"
      };
    } else {
      return { 
        name: "Faixa Preta", 
        color: "bg-slate-900 border border-slate-600", 
        colorText: "text-slate-200",
        next: "Mestre", 
        progress: 100, 
        currentVal: revenue, 
        targetVal: 300000, 
        unit: "R$",
        hint: "Você alcançou a Faixa Preta! Graduação máxima em honorários!"
      };
    }
  };
  const gamification = getGamificationProgress();

  // Filtragem local de leads
  const filteredLeads = (leads || []).filter(l => {
    if (!l) return false;
    if (l.import_status === "quarantine") return false;
    const safeText = (value: unknown) =>
      String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const searchable = [
      l.nome,
      l.empresa,
      l.cargo,
      l.email,
      l.telefone,
      l.url,
      l.linkedin_key,
      l.status
    ].map(safeText).join(" ");

    const matchSearch = searchable.includes(safeText(leadSearch));
    const matchStatus = leadStatusFilter === "all" || l.status === leadStatusFilter;
    const matchCampaign = selectedCampaignId === "all" || l.campanha_id === selectedCampaignId;
    return matchSearch && matchStatus && matchCampaign;
  });

  // Renderiza Tela de Importação do Bookmarklet
  if (location === "/taxmanagers/app/import") {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center px-4 font-sans text-slate-300">
        <div className="w-full max-w-sm bg-[#0d0d12]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl text-center">
          {importStatus === "loading" && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-sm">Importando lead para o Supabase...</p>
            </div>
          )}
          {importStatus === "success" && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
              <h2 className="text-lg font-bold text-white">Lead Importado!</h2>
              <div className="text-sm text-slate-300 mt-2 font-semibold">{importedLeadInfo?.name}</div>
              <div className="text-xs text-slate-500">{importedLeadInfo?.role} na {importedLeadInfo?.company}</div>
              <div className="text-xs text-cyan-400 font-bold mt-2 uppercase tracking-wider">{importedLeadInfo?.action}</div>
              <div className="text-[10px] text-slate-600 mt-4">Esta janela fechará em 2 segundos...</div>
            </div>
          )}
          {importStatus === "error" && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✗</div>
              <h2 className="text-lg font-bold text-white">Erro ao Importar</h2>
              <p className="text-xs text-slate-400">Não foi possível salvar o lead. Verifique se o CNPJ/Empresa ou dados estão corretos.</p>
              <button onClick={() => window.close()} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs mt-2 hover:bg-white/10">Fechar Janela</button>
            </div>
          )}
          {importStatus === "unauthenticated" && (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
              <h2 className="text-lg font-bold text-white">Não Autenticado</h2>
              <p className="text-xs text-slate-400">Você precisa estar logado no Painel TaxManagers para importar leads.</p>
              <a href="/taxmanagers/app" target="_blank" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs mt-2 font-semibold">Fazer Login</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderiza Tela de Login
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070709] flex font-sans">
        {/* Coluna Esquerda — Proposta de Valor */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0a0a0f] border-r border-white/5 px-14 py-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-4 mb-2">
            <img src="/logo-icon.png" alt="Tax Managers" className="w-14 h-14 object-contain" />
            <span className="text-white font-extrabold text-2xl tracking-tight">Tax Managers</span>
          </div>

          {/* Conteúdo central */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
            <div>
              <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold tracking-wide mb-6 uppercase">
                Portal restrito para parceiros TaxManagers
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white leading-tight mb-4 pr-8">
              Inteligência fiscal preditiva para consultorias tributárias
            </h2>

            <p className="text-blue-100 text-lg font-medium leading-relaxed mb-6 max-w-md">
              Amplie vendas e capacidade de entrega com IA, sales engagement tributário e retaguarda técnica TaxManagers.
            </p>

            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-md">
              O mercado tributário deixou de ser apenas corretivo ou preventivo. Com IA, dados e metodologia, passa a ser também preditivo: antecipando sinais de risco, identificando oportunidades fiscais e organizando abordagens comerciais com maior potencial de conversão.
            </p>

            <div className="space-y-6">
              {[
                { icon: <Radar className="w-5 h-5 text-cyan-400" />, title: "IA Fiscal Preditiva", desc: "Mapeamento inteligente de riscos, créditos, inconsistências e oportunidades a partir de arquivos fiscais, obrigações acessórias, documentos tributários e sinais relevantes da operação." },
                { icon: <Workflow className="w-5 h-5 text-cyan-400" />, title: "Sales Engagement Tributário", desc: "Leads, cadências, histórico de conversas, próximos passos e abordagem consultiva organizados para vendas B2B de alto valor no mercado fiscal." },
                { icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />, title: "Retaguarda Técnica TaxManagers", desc: "Diagnósticos, relatórios, revisão técnica e apoio tributário para que consultorias parceiras ampliem capacidade de entrega e atuação comercial sem montar uma estrutura interna complexa." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">{f.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-5 rounded-xl bg-blue-900/20 border border-blue-500/20">
              <p className="text-blue-100 text-sm font-medium italic">
                "Você entra com relacionamento, autoridade e acesso ao mercado. A TaxManagers entra com inteligência fiscal, tecnologia e retaguarda técnica."
              </p>
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500 font-medium max-w-md pr-8">
            Ambiente restrito para consultorias parceiras, operadores autorizados e profissionais convidados para o programa TaxManagers Partner.
          </p>
        </div>

        {/* Coluna Direita — Formulário */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative bg-[#070709]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/8 via-[#070709] to-[#070709]" />

          <div className="w-full max-w-sm relative z-10">
            {/* Logo e Copy mobile */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10">
              <img src="/logo-icon.png" alt="Tax Managers" className="w-16 h-16 mb-5 object-contain" />
              <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-semibold tracking-wide mb-4 uppercase">
                Portal restrito para parceiros
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Inteligência fiscal preditiva para consultorias tributárias</h2>
              <p className="text-sm text-blue-100 font-medium px-2">
                Amplie vendas e capacidade de entrega com IA, sales engagement tributário e retaguarda técnica TaxManagers.
              </p>
            </div>

            <div className="text-center mb-8">
              <h1 className="hidden lg:block text-2xl font-bold text-white mb-2">Acesse o Portal</h1>
              <p className="text-sm text-slate-400 px-4 lg:px-0">Entre para operar leads, oportunidades, diagnósticos e relacionamentos comerciais autorizados.</p>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
                <input
                  type="email"
                  className="w-full bg-[#0f0f17] border border-white/8 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
                <input
                  type="password"
                  className="w-full bg-[#0f0f17] border border-white/8 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-lg mt-2 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <a href="https://taxmanagers.com.br" className="inline-block w-full text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 font-medium transition-all py-3 rounded-lg">
                Solicitar avaliação como parceiro fundador
              </a>
              <p className="text-xs text-slate-500 px-6">
                Acesso restrito a parceiros TaxManagers, consultorias autorizadas e operadores internos.
              </p>
            </div>

            {/* Conteúdo de Valor - Visível apenas no Mobile abaixo do formulário */}
            <div className="lg:hidden mt-16 space-y-6 pb-8 border-t border-white/5 pt-10">
              <div className="mb-8">
                <p className="text-slate-400 text-sm leading-relaxed">
                  O mercado tributário deixou de ser apenas corretivo ou preventivo. Com IA, dados e metodologia, passa a ser também preditivo: antecipando sinais de risco, identificando oportunidades fiscais e organizando abordagens comerciais com maior potencial de conversão.
                </p>
              </div>

              {[
                { icon: <Radar className="w-5 h-5 text-cyan-400" />, title: "IA Fiscal Preditiva", desc: "Mapeamento inteligente de riscos, créditos, inconsistências e oportunidades a partir de arquivos fiscais, obrigações acessórias, documentos tributários e sinais relevantes da operação." },
                { icon: <Workflow className="w-5 h-5 text-cyan-400" />, title: "Sales Engagement Tributário", desc: "Leads, cadências, histórico de conversas, próximos passos e abordagem consultiva organizados para vendas B2B de alto valor no mercado fiscal." },
                { icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />, title: "Retaguarda Técnica TaxManagers", desc: "Diagnósticos, relatórios, revisão técnica e apoio tributário para que consultorias parceiras ampliem capacidade de entrega e atuação comercial sem montar uma estrutura interna complexa." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">{f.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
              
              <div className="mt-8 p-5 rounded-xl bg-blue-900/20 border border-blue-500/20">
                <p className="text-blue-100 text-sm font-medium italic">
                  "Você entra com relacionamento, autoridade e acesso ao mercado. A TaxManagers entra com inteligência fiscal, tecnologia e retaguarda técnica."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza Tela de Loading da App
  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col justify-center items-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
        <p className="text-slate-400 mt-4 text-sm">Carregando painel tributário...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-slate-300 font-sans flex flex-col selection:bg-cyan-950 selection:text-cyan-200">
      
      {/* Navbar Superior */}
      <header className="border-b border-white/5 bg-[#0b0b0f]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-icon.png" 
              alt="Tax Managers Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback caso a imagem falhe
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <span className="text-lg font-bold text-white tracking-tight block">Tax Managers</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block -mt-1">Painel do Parceiro</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Seletor de Parceiro para Administradores */}
            {profile?.is_admin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin:
                </span>
                <select 
                  className="bg-[#111116] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  value={selectedPartnerId}
                  onChange={e => setSelectedPartnerId(e.target.value)}
                >
                  <option value="all">Todos os Leads (Visão Admin)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Faixa {p.faixa})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status do Franqueado */}
            <div className="hidden md:flex items-center gap-4 border-l border-white/5 pl-6">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Olá, {profile?.nome}</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className={`w-2.5 h-2.5 rounded-full ${gamification.color}`}></span>
                  <span className="text-xs font-semibold text-slate-300">{gamification.name}</span>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-950/20 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-colors"
                title="Sair do painel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Grid Central */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Menu Lateral de Navegação */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-4 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab("hoje")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'hoje' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Operação Hoje</span>
            </button>
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>
            <button 
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'leads' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Users className="w-4 h-4" />
              <span>Gestão de Leads</span>
            </button>
            <button 
              onClick={() => setActiveTab("comissoes")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'comissoes' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Comissões e Splits</span>
            </button>
            {profile?.is_admin && (
              <button 
                onClick={() => setActiveTab("fruta_baixa")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'fruta_baixa' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Fila Fruta Baixa</span>
              </button>
            )}
          </div>

          {/* Gamificação Widget */}
          {profile && (
            <div className="bg-[#0c0c12] border border-cyan-500/10 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-cyan-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full"></div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Seu Progresso</h3>
              </div>
              <p className="text-xs text-slate-400 mb-2">Progresso para subir à <strong>{gamification.next}</strong>:</p>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>
                  {gamification.unit === "R$" 
                    ? `R$ ${Number(gamification.currentVal).toLocaleString("pt-BR")}`
                    : `${gamification.currentVal} ${gamification.unit}`}
                </span>
                <span className="text-slate-500">
                  / {gamification.unit === "R$" 
                    ? `R$ ${Number(gamification.targetVal).toLocaleString("pt-BR")}`
                    : `${gamification.targetVal} ${gamification.unit}`}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500`}
                  style={{ width: `${gamification.progress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 italic">{gamification.hint}</span>
            </div>
          )}
        </aside>

        {/* Painel Principal */}
        <main className="flex-1 min-w-0">
          
          {/* TAB: HOJE (TAREFAS OPERACIONAIS) */}
          {activeTab === "hoje" && (() => {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const pendingTasks = tasks.filter(t => t.status === "pending");
            const overdueTasks = pendingTasks.filter(t => new Date(t.due_at) < todayStart);
            const todayTasks = pendingTasks.filter(t => new Date(t.due_at) >= todayStart && new Date(t.due_at) <= todayEnd);
            const upcomingTasks = pendingTasks.filter(t => new Date(t.due_at) > todayEnd);
            
            const completedToday = tasks.filter(t => t.status === "done" && t.completed_at && new Date(t.completed_at) >= todayStart && new Date(t.completed_at) <= todayEnd).length;

            return (
              <div className="space-y-8">
                {/* KPIs de Operação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Pendentes Hoje</span>
                      <span className="text-2xl font-bold text-white mt-1 block">{todayTasks.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Tarefas Atrasadas</span>
                      <span className="text-2xl font-bold text-rose-500 mt-1 block">{overdueTasks.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Concluídas Hoje</span>
                      <span className="text-2xl font-bold text-emerald-400 mt-1 block">{completedToday}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Lista de Ações e Tarefas */}
                <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-6">
                  <div className="mb-6">
                    <h3 className="font-bold text-white text-base">Fila de Atividades</h3>
                    <p className="text-xs text-slate-500 mt-1">Siga a sequência cronológica para executar o outreach tributário.</p>
                  </div>

                  {pendingTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
                      <CheckSquare className="w-12 h-12 text-emerald-500/30" />
                      <p>Tudo em dia! Nenhuma tarefa pendente.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Grupo Atrasadas */}
                      {overdueTasks.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Atrasadas ({overdueTasks.length})
                          </h4>
                          <div className="space-y-3">
                            {overdueTasks.map(task => renderTaskItem(task))}
                          </div>
                        </div>
                      )}

                      {/* Grupo Hoje */}
                      {todayTasks.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Hoje ({todayTasks.length})
                          </h4>
                          <div className="space-y-3">
                            {todayTasks.map(task => renderTaskItem(task))}
                          </div>
                        </div>
                      )}

                      {/* Outras Tarefas (Próximas) */}
                      {upcomingTasks.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Futuras ({upcomingTasks.length})
                          </h4>
                          <div className="space-y-3">
                            {upcomingTasks.map(task => renderTaskItem(task))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: VISÃO GERAL (DASHBOARD) */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5">
                  <span className="text-xs text-slate-500 block">Total Carteira</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{leadsCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Leads atribuídos</span>
                </div>
                <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5">
                  <span className="text-xs text-slate-500 block">Abordados</span>
                  <span className="text-2xl font-bold text-cyan-400 mt-1 block">{leadsAbordados}</span>
                  <span className="text-[10px] text-cyan-500/50 block mt-1">Taxa: {leadsCount > 0 ? ((leadsAbordados/leadsCount)*100).toFixed(0) : 0}%</span>
                </div>
                <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5">
                  <span className="text-xs text-slate-500 block">Faturados</span>
                  <span className="text-2xl font-bold text-emerald-500 mt-1 block">{faturadosCount}</span>
                  <span className="text-[10px] text-emerald-500/50 block mt-1">Split de comissão ativo</span>
                </div>
                <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5">
                  <span className="text-xs text-slate-500 block">Sua Comissão</span>
                  <span className="text-2xl font-bold text-white mt-1 block">R$ {comissaoAcumulada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-amber-500 block mt-1">Saldo a receber</span>
                </div>
              </div>

              {/* Botão Resgatar Leads (Drip) */}
              <div className="bg-gradient-to-r from-blue-900/10 to-cyan-900/10 border border-blue-500/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Precisa de novas oportunidades?
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Resgate mais 50 leads qualificados da base central da TaxManagers para a sua carteira.</p>
                </div>
                <button 
                  onClick={handleDripLeads}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Resgatar 50 Leads</span>
                </button>
              </div>

              {/* Instalador do Capturador do LinkedIn (Chrome Extension) */}
              <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-6">
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-cyan-400" />
                  Instalar Capturador do LinkedIn (Extensão)
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Para importar leads diretamente do LinkedIn para sua carteira, instale a extensão oficial da Mentofranquia TaxManagers. Ela fica visível no topo do seu navegador para acesso rápido em qualquer perfil.
                </p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => alert("A extensão corporativa TaxManagers estará disponível na Chrome Web Store em breve. Fale com o administrador da rede.")}
                    className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5 border border-cyan-500/30"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span>Baixar Extensão do Chrome</span>
                  </button>
                </div>
              </div>

              {/* Últimas Ações / Vendas */}
              <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-6">
                <h3 className="font-bold text-white text-base mb-6">Últimas Comissões Registradas</h3>
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Nenhum contrato faturado nesta carteira ainda.</div>
                ) : (
                  <div className="space-y-4">
                    {sales.slice(-5).reverse().map(s => (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-[#111116] border border-white/5 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-white">Contrato Tributário</p>
                          <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">R$ {Number(s.comissao_parceiro).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] text-slate-500 block">Seu split de 30%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LEADS LIST */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              
              {/* Header de Gestão */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Gestão de Carteira</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Organize e qualifique os tomadores de decisão. {activeLeadsTotalCount > 0 && `Total: ${activeLeadsTotalCount} lead${activeLeadsTotalCount === 1 ? "" : "s"} ativos`}
                  </p>
                  {dbCounts && (
                    <div className="text-xs text-slate-400 mt-1.5 font-medium bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 inline-block">
                      📊 <strong className="text-cyan-400">Diagnóstico de Base:</strong> Total de leads: <span className="text-white font-bold">{dbCounts.total}</span> (Ativos: <span className="text-white font-bold">{dbCounts.active}</span> | Quarentena: <span className="text-white font-bold">{dbCounts.quarantine}</span> | Outros/Vazios: <span className="text-white font-bold">{dbCounts.other}</span>)
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowAddCampaignModal(true)}
                    className="px-4 py-2 rounded-lg bg-[#111116] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova Campanha
                  </button>
                  <button 
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Lead
                  </button>
                </div>
              </div>

              {/* Filtros e Buscas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome, empresa ou cargo..." 
                    className="w-full bg-[#0b0b0f] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                    value={leadSearch}
                    onChange={e => setLeadSearch(e.target.value)}
                  />
                </div>

                <div>
                  <select 
                    className="w-full bg-[#0b0b0f] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                  >
                    <option value="all">Todas as Campanhas</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select 
                    className="w-full bg-[#0b0b0f] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                    value={leadStatusFilter}
                    onChange={e => setLeadStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Passo 1">Passo 1 (Abordagem)</option>
                    <option value="Passo 2">Passo 2 (Newsletter)</option>
                    <option value="Passo 3">Passo 3 (Diagnóstico)</option>
                    <option value="Reunião Agendada">Reunião Agendada</option>
                    <option value="Faturado">Faturado / Ganho</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
              </div>

              {/* Tabela de Leads */}
              <div className="bg-[#0b0b0f] border border-white/5 rounded-xl overflow-hidden">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">Nenhum lead encontrado com os filtros atuais.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm table-fixed">
                      <colgroup>
                        <col className="w-[22%]" />
                        <col className="w-[22%]" />
                        <col className="w-[28%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[8%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-white/5 bg-[#101016]/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Lead / Cargo</th>
                          <th className="px-6 py-4">Empresa</th>
                          <th className="px-6 py-4">Abordagem</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Campanha</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredLeads.map(lead => {
                          const camp = campaigns.find(c => c.id === lead.campanha_id);
                          
                          // Detecção e limpeza se o banco tiver a mensagem no cargo/empresa
                          const isLikelyMessage = (text: string) => {
                            if (!text) return false;
                            const lower = text.toLowerCase();
                            if (text.length > 50 && (
                              lower.includes("olá") || 
                              lower.includes("tudo bem") || 
                              lower.includes("linkedin") || 
                              lower.includes("tribut") || 
                              lower.includes("sócio") || 
                              lower.includes("gestão") ||
                              lower.includes("encontrei")
                            )) return true;
                            if (text.includes("\n") || text.includes("\r")) return true;
                            return false;
                          };

                          const displayCargo = !lead.cargo || isLikelyMessage(lead.cargo) ? "N/A" : lead.cargo;
                          const displayEmpresa = !lead.empresa || isLikelyMessage(lead.empresa) ? "N/A" : lead.empresa;
                          
                          // Pega a mensagem de abordagem real se existir
                          const displayAbordagem = lead.passo1_mensagem || "";

                          return (
                            <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 min-w-0">
                                <div className="font-semibold text-white truncate" title={lead.nome}>{lead.nome}</div>
                                <div className="text-xs text-slate-500 truncate mt-1" title={displayCargo}>
                                  {displayCargo}
                                </div>
                              </td>
                              <td className="px-6 py-4 min-w-0">
                                <div className="text-slate-300 truncate" title={displayEmpresa}>
                                  {displayEmpresa}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono truncate mt-1" title={lead.email || "Sem e-mail"}>
                                  {lead.email || "Sem e-mail"}
                                </div>
                              </td>
                              <td className="px-6 py-4 min-w-0">
                                <div className="text-xs text-slate-400 line-clamp-2 break-words animate-pulse-subtle" title={displayAbordagem}>
                                  {displayAbordagem || "—"}
                                </div>
                              </td>
                              <td className="px-6 py-4 min-w-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  lead.status === 'Faturado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  lead.status === 'Reunião Agendada' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                  lead.status === 'Descartado' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 min-w-0">
                                <span className="text-slate-400 text-xs truncate block" title={camp?.nome || "Sem Campanha"}>
                                  {camp?.nome || "Sem Campanha"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right min-w-0">
                                <button 
                                  onClick={() => startEditLead(lead)}
                                  className="px-3.5 py-1.5 rounded-lg bg-[#111116] border border-white/10 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all text-xs font-semibold text-slate-300"
                                >
                                  Abrir Dossiê
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {leads.length < activeLeadsTotalCount && (
                  <div className="p-4 border-t border-white/5 bg-[#0b0b0f] flex justify-center">
                    <button
                      onClick={() => setActiveLeadsLimit(prev => prev + 50)}
                      className="px-4 py-2 rounded-lg bg-[#111116] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Carregar Mais Leads (Exibindo {leads.length} de {activeLeadsTotalCount})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: COMISSÕES E SPLITS */}
          {activeTab === "comissoes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Gestão Financeira & Splits</h2>
                  <p className="text-sm text-slate-500 mt-1">Registros de fechamento e comissionamento da rede de mentofranquia.</p>
                </div>
                {profile?.is_admin && (
                  <button 
                    onClick={() => setShowRegisterSaleModal(true)}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Registrar Fechamento
                  </button>
                )}
              </div>

              {/* Tabela de Splits de Comissão */}
              <div className="bg-[#0b0b0f] border border-white/5 rounded-xl overflow-hidden">
                {sales.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">Nenhuma comissão registrada para esta carteira.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#101016]/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Valor Contrato</th>
                          <th className="px-6 py-4">Split Franqueado (30%)</th>
                          <th className="px-6 py-4">Split Matriz (50%)</th>
                          <th className="px-6 py-4">Expert (10%)</th>
                          <th className="px-6 py-4">Autor Tese (10%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-white/[0.01]">
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">
                              R$ {Number(sale.valor_contrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-emerald-400 font-medium">
                              R$ {Number(sale.comissao_parceiro).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              R$ {Number(sale.comissao_taxmanagers).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              R$ {Number(sale.comissao_expert).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              R$ {Number(sale.comissao_autor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "fruta_baixa" && profile?.is_admin && (() => {
            const isSearchActive = !!debouncedSearch.trim();
            console.log("[FrutaBaixa render]", {
              activeTab,
              frutaBaixaLeadsLength: frutaBaixaLeads?.length,
              frutaBaixaError,
              frutaBaixaLoading,
              quarantineDatabaseCount,
              quarantineLoadedCount
            });
            return (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Fila Fruta Baixa (Quarentena Ranqueada)
                  </h2>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-sm text-slate-500">
                      Leads qualificados ranqueados por score comercial. Crie o Clone IA para apresentar e fechar vendas de demonstração.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-[#111116] border border-white/5 text-slate-400 px-2.5 py-1 rounded-md font-medium">
                        Base bruta: <strong className="text-slate-200">{quarantineDatabaseCount}</strong> leads
                      </span>
                      <span className="bg-[#111116] border border-white/5 text-slate-400 px-2.5 py-1 rounded-md font-medium">
                        Carregados agora: <strong className="text-slate-200">{frutaBaixaLeads.length}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400/90 font-medium mt-0.5">
                      {isSearchActive ? (
                        `Exibindo ${frutaBaixaLeads.length} de ${quarantineTotalCount} resultados encontrados na base bruta.`
                      ) : (
                        `Exibindo ${frutaBaixaLeads.length} leads priorizados a partir de uma amostra carregada. Base bruta total: ${quarantineDatabaseCount} leads.`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setAtaque50kMode(!ataque50kMode);
                      // O useEffect irá disparar fetchQuarantineLeads automaticamente
                    }}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                      ataque50kMode 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30' 
                      : 'bg-[#111116] border-white/10 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {ataque50kMode ? "Ataque 50k - Ativado" : "Ataque 50k - Julho"}
                  </button>
                  <button
                    onClick={fetchQuarantineLeads}
                    className="px-4 py-2.5 rounded-lg bg-[#111116] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    Atualizar Fila
                  </button>
                </div>
              </div>

              {/* Tabela de Fruta Baixa */}
              <div className="bg-[#0b0b0f] border border-white/5 rounded-xl overflow-hidden">
                {frutaBaixaLoading ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    Carregando base bruta...
                  </div>
                ) : frutaBaixaError ? (
                  <div className="text-center py-16 px-6">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                    <p className="text-rose-400 font-semibold text-sm">Erro ao carregar Fila Fruta Baixa</p>
                    <p className="text-xs text-slate-500 mt-2 font-mono max-w-md mx-auto break-all">{frutaBaixaError}</p>
                    <button
                      onClick={fetchQuarantineLeads}
                      className="mt-4 px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-semibold transition-all"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : frutaBaixaLeads.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">
                    Nenhum lead encontrado na base bruta com os filtros atuais.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm table-fixed min-w-[900px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#101016]/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4 w-[25%]">Score / Critérios</th>
                          <th className="px-6 py-4 w-[40%]">Lead / Cargo</th>
                          <th className="px-6 py-4 w-[25%]">Empresa / Email</th>
                          <th className="px-6 py-4 w-[10%] text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {frutaBaixaLeads.map((lead: any, index: number) => (
                          <tr key={lead.id || Math.random()} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-col items-start gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                                  (lead.score || 0) >= 50 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                  (lead.score || 0) >= 30 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {lead.score || 0} pts
                                </span>
                                
                                {ataque50kMode && lead.ataque50k_classificacao && (
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                    lead.ataque50k_classificacao === "Alto Fit" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                    lead.ataque50k_classificacao === "Médio Fit" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  }`}>
                                    {lead.ataque50k_classificacao}
                                  </span>
                                )}

                                {ataque50kMode && (
                                  <span className={`mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    index < 20 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                                    index < 50 ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                                    "bg-slate-800 text-slate-400 border border-slate-700"
                                  }`}>
                                    {index < 20 ? "🔥 Top 20 Imediato" : index < 50 ? "📅 Próximos 30 - Cadência" : "⏳ Em espera"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-2 max-w-full break-words whitespace-normal" title={String(lead.motivo_score || "")}>
                                {lead.motivo_score || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-semibold text-white">{lead.nome || "Sem nome"}</div>
                                {lead.is_prospect_parceiro && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider shrink-0">
                                    Prospect Parceiro
                                  </span>
                                )}
                                {ataque50kMode && lead.is_cliente_final_empresa && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider shrink-0">
                                    Cliente Final
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 truncate">{lead.cargo || "N/A"}</div>
                              
                              {lead.sugestao_mensagem && (
                                <div className="mt-2.5 p-2 rounded-lg bg-slate-950/45 border border-white/5 w-full text-xs text-left">
                                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    <span>Abordagem Sugerida</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(lead.sugestao_mensagem);
                                        setCopiedLeadId(lead.id);
                                        setTimeout(() => setCopiedLeadId(null), 2000);
                                      }}
                                      className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      {copiedLeadId === lead.id ? "Copiado!" : "Copiar"}
                                    </button>
                                  </div>
                                  <div className="text-slate-300 italic font-mono text-[11px] leading-relaxed break-words whitespace-normal">
                                    "{lead.sugestao_mensagem}"
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="text-slate-300 font-semibold truncate">{lead.empresa || "N/A"}</div>
                              <div className="text-xs text-slate-500 font-mono mt-1 break-all">{lead.email || "Sem e-mail"}</div>
                            </td>
                            <td className="px-6 py-4 text-right align-top">
                              <button
                                onClick={() => handleCreateAgentForLead(lead)}
                                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 w-full shadow-lg shadow-cyan-500/10"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Clone
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {frutaBaixaLeads.length < quarantineTotalCount && !frutaBaixaError && (
                  <div className="p-4 border-t border-white/5 bg-[#0b0b0f] flex justify-center">
                    <button
                      onClick={() => setQuarantineLeadsLimit(prev => prev + 50)}
                      className="px-4 py-2 rounded-lg bg-[#111116] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Carregar Mais (Exibindo {frutaBaixaLeads.length} de {quarantineTotalCount})
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

        </main>
      </div>

      {/* DRAWER / SIDEBAR DETALHES E EDIT DO LEAD */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLead(null)}></div>
          
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#0a0a0d] border-l border-white/10 flex flex-col shadow-2xl">
            {/* Header Drawer */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#0e0e14]">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold font-mono">Dossiê e Abordagem</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedLead.nome}</h3>
                <p className="text-xs text-slate-400">{selectedLead.cargo} na <strong>{selectedLead.empresa}</strong></p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas Sub-Drawer */}
            <div className="flex border-b border-white/5 bg-[#0e0e14] text-xs font-medium">
              <button 
                onClick={() => setActiveLeadSubTab("outreach")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'outreach' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Abordagem IA
              </button>
              {(profile?.is_admin || (agentProfile && agentProfile.status === 'client_active')) && (
                <button 
                  onClick={() => setActiveLeadSubTab("espelho")}
                  className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'espelho' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  Clone IA
                </button>
              )}
              <button 
                onClick={() => setActiveLeadSubTab("ia")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'ia' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Personalizar IA
              </button>
              <button 
                onClick={() => setActiveLeadSubTab("timeline")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'timeline' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Linha do Tempo
              </button>
              <button 
                onClick={() => setActiveLeadSubTab("files")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'files' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Arquivos VPS ({vpsFiles.length})
              </button>
              <button 
                onClick={() => setActiveLeadSubTab("chat")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'chat' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Chat IA
              </button>
              <button 
                onClick={() => setActiveLeadSubTab("edit")}
                className={`flex-1 py-3 border-b-2 text-center transition-all ${activeLeadSubTab === 'edit' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Dados Gerais
              </button>
            </div>

            {/* Conteúdo Drawer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
               {activeLeadSubTab === "espelho" && (
                 <div className="space-y-6">
                    {/* Painel de Controle e Status do Clone IA */}
                    <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                          <h4 className="font-bold text-white text-sm">Operação Clone IA Tributário</h4>
                        </div>
                        {agentProfile ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                            agentProfile.status === 'client_active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                            agentProfile.status === 'mirror_mode' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                            'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                          }`}>
                            {agentProfile.status === 'client_active' ? 'Clone Ativo' :
                             agentProfile.status === 'mirror_mode' ? 'Modo Demo' : 'Inativo'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-lg text-xs font-semibold">
                            Sem Clone
                          </span>
                        )}
                      </div>

                      {!agentProfile ? (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs text-slate-400">
                            Este prospect não possui um Clone IA criado. Crie o clone para estruturar as teses comerciais, ICP e potencial econômico antes de fechar a venda.
                          </p>
                          {profile?.is_admin && (
                            <button 
                              onClick={handleCreateAgent}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-lg text-xs transition-all shadow-lg flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Criar Clone IA
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2 border-t border-white/5">
                          {/* Campo Potencial Econômico Editável */}
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-semibold block">Potencial Econômico Estimado (R$):</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500/50 font-mono"
                                placeholder="Ex: R$ 350.000 a R$ 1.500.000"
                                value={potencialEco}
                                onChange={e => setPotencialEco(e.target.value)}
                              />
                              <button
                                onClick={handleSavePotencialEco}
                                className="px-3 py-1.5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>

                          {/* Seção de Ativação (Apenas Admin em Modo Demo) */}
                          {profile?.is_admin && agentProfile.status === 'mirror_mode' && (
                            <div className="bg-[#12121b] border border-cyan-500/10 rounded-lg p-4 space-y-4">
                              <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block">Painel de Ativação do Clone</span>
                              
                              <div className="flex flex-col gap-3">
                                {/* Botão Ativar Própria Operação */}
                                <button 
                                  onClick={handleActivateForMe}
                                  className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" /> Ativar para Minha Operação
                                </button>

                                <div className="relative flex py-1 items-center">
                                  <div className="flex-grow border-t border-white/5"></div>
                                  <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Ou</span>
                                  <div className="flex-grow border-t border-white/5"></div>
                                </div>

                                {/* Ativar para Parceiro */}
                                <div className="space-y-2">
                                  <label className="text-[11px] text-slate-400 block font-semibold">Atribuir Proprietário do Clone:</label>
                                  <div className="flex gap-2">
                                    <select
                                      className="bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 flex-1 focus:outline-none focus:border-cyan-500/50"
                                      value={assignClonePartnerId}
                                      onChange={e => setAssignClonePartnerId(e.target.value)}
                                    >
                                      <option value="">Selecione um parceiro...</option>
                                      {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} ({p.faixa})</option>
                                      ))}
                                    </select>
                                    <button 
                                      onClick={handleActivateForPartner}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all shadow-lg flex items-center gap-1.5"
                                    >
                                      Ativar para Parceiro
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {agentProfile.status === 'client_active' && (
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1 bg-emerald-950/20 border border-emerald-500/10 p-2 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Clone ativo e liberado para a operação do parceiro.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Renderizar os 7 blocos estruturados do Clone */}
                    {agentProfile && (
                      <div className="space-y-6">
                        {[
                          { tipo: "perfil_operacional", label: "1. Identidade do Clone", desc: "Perfil, autoridade e tom de voz mapeado do operador digital.", icon: <Users className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "tese", label: "2. Tese Tributária Recomendada", desc: "Principais oportunidades e focos fiscais indicados.", icon: <Award className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "icp", label: "3. ICP / Mercado-Alvo", desc: "Definição do perfil de cliente ideal e segmentos indicados.", icon: <Filter className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "lista_empresas", label: "4. Lista Inicial de Prospects Sugeridos", desc: "Lista de ataque recomendada com faturamento e tomador.", icon: <Layers className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "mensagens", label: "5. Mensagens de Abordagem", desc: "Sequência de mensagens customizadas de conexão e follow-up.", icon: <MessageSquare className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "cadencia", label: "6. Cadência de 7 Dias", desc: "Fluxo diário estruturado de pontos de contato multicanais.", icon: <Workflow className="w-4 h-4 text-cyan-400" /> },
                          { tipo: "next_actions", label: "7. Próximas Ações Recomendadas", desc: "Ações práticas para o início imediato do fluxo.", icon: <CheckSquare className="w-4 h-4 text-cyan-400" /> }
                        ].map(item => {
                          const block = agentOutputs.find(o => o.tipo === item.tipo);
                          const isEditing = editingBlockTipo === item.tipo;
                          
                          let statusBadge = "Pendente";
                          let statusClass = "bg-slate-500/10 border-slate-500/20 text-slate-400";
                          if (block) {
                            if (block.status === "success") {
                              statusBadge = "Gerado";
                              statusClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                            } else if (block.status === "user_edited") {
                              statusBadge = "Editado";
                              statusClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                            } else if (block.status === "error") {
                              statusBadge = "Erro";
                              statusClass = "bg-red-500/10 border-red-500/20 text-red-400";
                            }
                          }

                          return (
                            <div key={item.tipo} className="bg-[#111117] border border-white/5 rounded-xl p-5 space-y-3 transition-all hover:border-white/10">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {item.icon}
                                  <div>
                                    <h5 className="font-semibold text-sm text-white">{item.label}</h5>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${statusClass}`}>
                                  {statusBadge}
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="space-y-2 mt-2">
                                  <textarea 
                                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-sm text-white h-48 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
                                    value={editingBlockContent}
                                    onChange={e => setEditingBlockContent(e.target.value)}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => { setEditingBlockTipo(null); setEditingBlockContent(""); }}
                                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      onClick={() => handleSaveAgentBlock(item.tipo, editingBlockContent)}
                                      className="px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-600 hover:text-white bg-cyan-600/10 border border-cyan-500/20 rounded font-semibold transition-all"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <div className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed bg-[#0a0a0f] border border-white/5 rounded-lg p-3.5 max-h-64 overflow-y-auto font-mono">
                                    {block ? block.conteudo : "Aguardando geração do bloco..."}
                                  </div>
                                  {profile?.is_admin && (
                                    <button 
                                      onClick={() => {
                                        setEditingBlockTipo(item.tipo);
                                        setEditingBlockContent(block ? block.conteudo : "");
                                      }}
                                      className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded text-xs transition-all flex items-center gap-1.5"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Editar Bloco</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

               {activeLeadSubTab === "outreach" && (
                <div className="space-y-6">
                  {/* WIDGET DE CADÊNCIA */}
                  <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Workflow className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Cadência de Vendas (Roar)</h4>
                      </div>
                      {activeLeadCadence && (
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                          Ativa
                        </span>
                      )}
                    </div>

                    {activeLeadCadence ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{activeLeadCadence.cadence?.name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Etapa Atual: <strong className="text-cyan-400">{activeLeadCadence.current_step?.subject_template}</strong> (Ordem {activeLeadCadence.current_step?.step_order})
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Próxima ação prevista para: {activeLeadCadence.next_due_at ? new Date(activeLeadCadence.next_due_at).toLocaleDateString("pt-BR") : "N/A"}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-slate-500 italic">Cadência em andamento</span>
                          <button 
                            onClick={async () => {
                              const { error } = await supabase
                                .from("taxmanagers_lead_cadences")
                                .update({ status: "stopped" })
                                .eq("id", activeLeadCadence.id);
                              if (!error) {
                                await supabase
                                  .from("taxmanagers_tasks")
                                  .delete()
                                  .eq("lead_id", selectedLead.id)
                                  .eq("cadence_id", activeLeadCadence.cadence_id)
                                  .eq("status", "pending");
                                
                                const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
                                  ? (selectedLead?.parceiro_id || profile?.id)
                                  : (profile?.is_admin ? selectedPartnerId : profile?.id);
                                const targetPartnerResolved = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
                                const createdByResolved = profile?.id || null;
                                
                                await supabase.from("taxmanagers_interactions").insert([{
                                  lead_id: selectedLead.id,
                                  partner_id: targetPartnerResolved,
                                  type: "status_change",
                                  direction: "internal",
                                  content: `Cadência interrompida manualmente.`,
                                  created_by: createdByResolved
                                }]);

                                fetchActiveLeadCadence(selectedLead.id);
                                fetchLeadInteractions(selectedLead.id);
                                refreshCRMData();
                              }
                            }}
                            className="px-3 py-1 bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded text-xs font-semibold transition-all"
                          >
                            Parar Fluxo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cadences.length === 0 ? (
                          <>
                            <p className="text-xs text-slate-400">Nenhuma cadência de prospecção disponível no banco de dados.</p>
                            <button 
                              onClick={async () => {
                                if (profile) {
                                  await ensureDefaultCadences(profile.id);
                                  fetchCadences();
                                }
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              <span>Inicializar Cadência Padrão</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-slate-400">Este lead não está em nenhuma cadência de contato ativa. Escolha um fluxo para iniciar:</p>
                            <div className="flex gap-2">
                              <select 
                                id="cadence-starter-select"
                                className="flex-1 bg-[#111117] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                              >
                                {cadences.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => {
                                  const selectEl = document.getElementById("cadence-starter-select") as HTMLSelectElement;
                                  if (selectEl && selectEl.value) {
                                    startLeadCadence(selectedLead.id, selectEl.value);
                                  }
                                }}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                Iniciar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Passo 1 */}
                  <div className="bg-[#111117] border border-white/5 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Passo 1 (Conexão LinkedIn)</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLead.passo1_mensagem);
                          if (selectedLead.url) window.open(selectedLead.url, "_blank");
                        }}
                        className="px-3 py-1 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all text-xs font-semibold flex items-center gap-1"
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Copiar e Abrir Perfil
                      </button>
                    </div>
                    <textarea 
                      readOnly 
                      className="w-full bg-[#0a0a0e] border border-white/5 rounded-lg p-3 text-slate-300 text-sm h-24 font-sans focus:outline-none resize-none"
                      value={selectedLead.passo1_mensagem || "Nenhuma mensagem de conexão gerada ainda. Vá na aba 'Personalizar IA'."}
                    ></textarea>
                  </div>

                  {/* Passo 2 */}
                  <div className="bg-[#111117] border border-white/5 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Passo 2 (Newsletter/InMail)</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedLead.passo2_mensagem)}
                        className="px-3 py-1 rounded bg-[#111117] border border-white/10 hover:bg-white/5 text-slate-300 transition-all text-xs font-semibold flex items-center gap-1"
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Copiar Texto
                      </button>
                    </div>
                    <textarea 
                      readOnly 
                      className="w-full bg-[#0a0a0e] border border-white/5 rounded-lg p-3 text-slate-300 text-sm h-32 font-sans focus:outline-none resize-none"
                      value={selectedLead.passo2_mensagem || "Nenhuma mensagem de passo 2 gerada."}
                    ></textarea>
                  </div>

                  {/* Passo 3 */}
                  <div className="bg-[#111117] border border-white/5 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">Passo 3 (Diagnóstico Inicial)</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedLead.passo3_mensagem)}
                        className="px-3 py-1 rounded bg-[#111117] border border-white/10 hover:bg-white/5 text-slate-300 transition-all text-xs font-semibold flex items-center gap-1"
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Copiar Texto
                      </button>
                    </div>
                    <textarea 
                      readOnly 
                      className="w-full bg-[#0a0a0e] border border-white/5 rounded-lg p-3 text-slate-300 text-sm h-28 font-sans focus:outline-none resize-none"
                      value={selectedLead.passo3_mensagem || "Nenhuma abordagem de passo 3 gerada."}
                    ></textarea>
                  </div>
                </div>
              )}

              {/* SUBTAB: PERSONALIZAR IA */}
              {activeLeadSubTab === "ia" && (
                <div className="space-y-6">
                  {/* Foco de Tese */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Foco Tributário (Gatilho da Abordagem)</label>
                    <select 
                      className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      value={thesisFocus}
                      onChange={e => setThesisFocus(e.target.value)}
                    >
                      <option value="Automático">Automático (Setor / IA decide)</option>
                      <option value="Parceria Mentofranquia">Parceria Mentofranquia (Alexandre Florio)</option>
                      <option value="Créditos Legados PIS/COFINS">Créditos Legados PIS/COFINS</option>
                      <option value="Limitação de Compensação Judicial (Lei 14.873)">Limitação de Compensação Judicial (Lei 14.873)</option>
                      <option value="Subvenções de ICMS (Lei 14.789)">Subvenções de ICMS (Lei 14.789)</option>
                      <option value="Lei do Bem">Lei do Bem</option>
                      <option value="Exclusão do ICMS da Base do PIS/COFINS">Exclusão do ICMS da Base do PIS/COFINS</option>
                    </select>
                  </div>

                  {/* Upload de Prints para OCR/Vision */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111117] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-white/[0.01] transition-all">
                      <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
                      <span className="text-[10px] font-semibold text-slate-300">Print do Perfil (LinkedIn)</span>
                      <span className="text-[8px] text-slate-500 mt-1">Extrai formação, cargo e carreira</span>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleFileChange(e, setProfileImageBase64, 'profile')}
                      />
                      {profileImageBase64 && <span className="text-[10px] text-emerald-400 font-bold mt-2">✓ Carregado</span>}
                    </div>

                    <div className="bg-[#111117] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-white/[0.01] transition-all">
                      <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                      <span className="text-[10px] font-semibold text-slate-300">Print Aba de Contato</span>
                      <span className="text-[8px] text-slate-500 mt-1">Extrai E-mail, Celular, Niver</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => handleFileChange(e, setContactImageBase64, 'contact')}
                      />
                      {contactImageBase64 && <span className="text-[10px] text-emerald-400 font-bold mt-2">✓ Carregado</span>}
                    </div>
                  </div>

                  {/* Campo de Contexto Extra */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contexto adicional da conversa ou Observações</label>
                    <textarea 
                      className="w-full bg-[#111117] border border-white/10 rounded-lg p-3 text-sm text-white h-24 focus:outline-none focus:border-cyan-500/50"
                      placeholder="Ex: Citar que estudamos na mesma faculdade Mackenzie, ou que vi o post dele sobre reforma ontem..."
                      value={manualChatInput}
                      onChange={e => setManualChatInput(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Ação */}
                  <button 
                    onClick={handleRunAgentWorkflow}
                    disabled={iaLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
                  >
                    {iaLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Gerar Abordagem com IA</span>
                      </>
                    )}
                  </button>

                  {/* Logs IA */}
                  {iaLogs.length > 0 && (
                    <div className="bg-black/50 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-slate-400 h-32 overflow-y-auto space-y-1">
                      {iaLogs.map((log, idx) => (
                        <div key={idx} className={log.startsWith("❌") ? "text-red-400" : log.startsWith("✅") ? "text-emerald-400" : ""}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB: TIMELINE (HISTÓRICO & LINHA DO TEMPO) */}
              {activeLeadSubTab === "timeline" && (
                <div className="space-y-6">
                  {/* Formulário para adicionar nota rápida */}
                  <div className="bg-[#111117] border border-white/5 rounded-xl p-4 space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nova Anotação / Registrar Atividade</label>
                    <textarea 
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-xs text-white h-20 focus:outline-none focus:border-cyan-500/50"
                      placeholder="Registre um resumo de ligação, feedback do lead ou comentário..."
                      id="timeline-note-input"
                    ></textarea>
                    <div className="flex justify-end">
                      <button 
                        onClick={async () => {
                          const inputEl = document.getElementById("timeline-note-input") as HTMLTextAreaElement;
                          if (!inputEl || !inputEl.value.trim()) return;
                          const noteText = inputEl.value.trim();
                          
                          const resolvedPartnerId = (profile?.is_admin && selectedPartnerId === "all")
                            ? (selectedLead?.parceiro_id || profile?.id)
                            : (profile?.is_admin ? selectedPartnerId : profile?.id);
                          const targetPartnerResolved = resolvedPartnerId && resolvedPartnerId !== "all" ? resolvedPartnerId : (profile?.id || null);
                          const createdByResolved = profile?.id || null;
                          
                          // Inserir interação
                          const { error } = await supabase.from("taxmanagers_interactions").insert([{
                            lead_id: selectedLead.id,
                            partner_id: targetPartnerResolved,
                            type: "note",
                            direction: "internal",
                            content: noteText,
                            created_by: createdByResolved
                          }]);
                          
                          if (!error) {
                            inputEl.value = "";
                            fetchLeadInteractions(selectedLead.id);
                          } else {
                            alert("Erro ao salvar nota: " + error.message);
                          }
                        }}
                        className="px-4 py-1.5 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Registrar na Timeline
                      </button>
                    </div>
                  </div>

                  {/* Linha do Tempo Chronológica */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Atividades</h4>
                    
                    {interactionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                        <p className="text-xs text-slate-500 mt-2">Carregando histórico...</p>
                      </div>
                    ) : interactions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs italic">Nenhum evento registrado nesta linha do tempo.</div>
                    ) : (
                      <div className="relative border-l-2 border-white/5 pl-4 ml-2 space-y-6">
                        {interactions.map(evt => {
                          let title = "Atividade";
                          let iconColor = "text-slate-400 bg-slate-500/10 border border-slate-500/20";
                          
                          if (evt.type === "import") {
                            title = "Importação";
                            iconColor = "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20";
                          } else if (evt.type === "linkedin") {
                            title = "LinkedIn Outreach / Histórico Chat";
                            iconColor = "text-blue-400 bg-blue-500/10 border border-blue-500/20";
                          } else if (evt.type === "phone") {
                            title = "Ligação Telefônica";
                            iconColor = "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20";
                          } else if (evt.type === "whatsapp") {
                            title = "WhatsApp Outreach";
                            iconColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                          } else if (evt.type === "email") {
                            title = "E-mail";
                            iconColor = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
                          } else if (evt.type === "status_change") {
                            title = "Alteração de Status / Cadência";
                            iconColor = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
                          } else if (evt.type === "ai_suggestion") {
                            title = "Sugestão da IA";
                            iconColor = "text-purple-400 bg-purple-500/10 border border-purple-500/20";
                          } else if (evt.type === "note") {
                            title = "Anotação Interna";
                            iconColor = "text-slate-300 bg-slate-500/10 border border-white/10";
                          } else if (evt.type === "task_completed") {
                            title = "Tarefa Concluída";
                            iconColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                          }

                          return (
                            <div key={evt.id} className="relative group">
                              <div className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-[#0a0a0d] border-2 border-slate-700 group-hover:border-cyan-500 transition-colors"></div>
                              
                              <div className="bg-[#111116] border border-white/5 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${iconColor}`}>
                                    {title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(evt.created_at).toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                                  {evt.content}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB: ARQUIVOS VPS */}
              {activeLeadSubTab === "files" && (
                <div className="space-y-6">
                  <div className="bg-[#111117] border border-white/5 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Documentos Extraídos (Scraper VPS)
                    </h4>

                    {vpsFilesLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                      </div>
                    ) : vpsFiles.length === 0 ? (
                      <div className="text-slate-500 text-xs py-4 text-center">Nenhum arquivo de análise fiscal encontrado para este lead na VPS ainda.</div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {vpsFiles.map((file, idx) => (
                          <div key={idx} className="py-3 flex justify-between items-center text-xs">
                            <span className="font-mono text-slate-300 break-all pr-4">{file}</span>
                            <a 
                              href={`${VPS_API_URL}/recebidos/${encodeURIComponent(file)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded bg-[#1c1c24] border border-white/5 hover:bg-white/10 text-white font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>Baixar</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB: EDICAO DADOS GERAIS */}
              {activeLeadSubTab === "edit" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Empresa Alvo</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={editCompany}
                        onChange={e => setEditCompany(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cargo / Atuação</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={editCargo}
                        onChange={e => setEditCargo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
                      <input 
                        type="email" 
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Telefone</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aniversário</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 3 de Janeiro"
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        value={editAnniversary}
                        onChange={e => setEditAnniversary(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Campanha</label>
                      <select 
                        className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                        value={editCampaignId}
                        onChange={e => setEditCampaignId(e.target.value)}
                      >
                        <option value="none">Nenhuma</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status do Funil</label>
                    <select 
                      className="w-full bg-[#111117] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Abordado">Abordado</option>
                      <option value="Passo 1">Passo 1</option>
                      <option value="Passo 2">Passo 2</option>
                      <option value="Passo 3">Passo 3</option>
                      <option value="Reunião Agendada">Reunião Agendada</option>
                      <option value="Faturado">Faturado</option>
                      <option value="Descartado">Descartado</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleSaveLeadEdits}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg mt-4 transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}

              {/* SUBTAB: CHAT COPILOTO IA */}
              {activeLeadSubTab === "chat" && (
                <div className="flex flex-col h-[550px] border border-white/5 bg-[#0b0b0f] rounded-xl overflow-hidden font-sans">
                  {/* Mensagens */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed shadow-lg ${
                            msg.role === 'user' 
                              ? 'bg-cyan-600 text-white rounded-br-none' 
                              : 'bg-[#111116] border border-white/5 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div className="font-bold text-[10px] opacity-60 uppercase mb-1">
                            {msg.role === 'user' ? 'Você' : 'Copiloto TaxManagers'}
                          </div>
                          <div className="whitespace-pre-line leading-relaxed font-sans">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#111116] border border-white/5 text-slate-200 rounded-xl rounded-bl-none p-3.5 max-w-[85%] shadow-lg">
                          <div className="font-bold text-[10px] opacity-60 uppercase mb-1">Copiloto TaxManagers</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input do Chat */}
                  <div className="p-3 bg-[#0d0d12] border-t border-white/5 flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-[#15151f] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                      placeholder="Discuta detalhes, sugira abordagens ou peça um novo pitch..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendChatMessage();
                      }}
                    />
                    <button 
                      onClick={handleSendChatMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-1"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR LEAD MANUAL */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddLeadModal(false)}></div>
          
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Adicionar Novo Lead</h3>
            
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                  required
                  placeholder="Nome do decisor"
                  value={newLeadName}
                  onChange={e => setNewLeadName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Empresa</label>
                <input 
                  type="text" 
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                  required
                  placeholder="Razão Social ou Nome Fantasia"
                  value={newLeadCompany}
                  onChange={e => setNewLeadCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                    placeholder="Diretor Financeiro / CFO"
                    value={newLeadCargo}
                    onChange={e => setNewLeadCargo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Campanha</label>
                  <select 
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                    required
                    value={newLeadCampaign}
                    onChange={e => setNewLeadCampaign(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="none">Sem Campanha</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                    placeholder="email@exemplo.com"
                    value={newLeadEmail}
                    onChange={e => setNewLeadEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Telefone (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                    placeholder="(11) 99999-9999"
                    value={newLeadPhone}
                    onChange={e => setNewLeadPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">URL LinkedIn</label>
                <input 
                  type="url" 
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                  placeholder="https://linkedin.com/in/..."
                  value={newLeadUrl}
                  onChange={e => setNewLeadUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddLeadModal(false)}
                  className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA CAMPANHA */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCampaignModal(false)}></div>
          
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Nova Campanha</h3>
            
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Campanha</label>
                <input 
                  type="text" 
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                  required
                  placeholder="Ex: Agro_MatoGrosso ou Energia_CFOs"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddCampaignModal(false)}
                  className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR FECHAMENTO (ADMIN ONLY) */}
      {showRegisterSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegisterSaleModal(false)}></div>
          
          <div className="bg-[#0e0e14] border border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Venda e Comissões</h3>
            
            <form onSubmit={handleRegisterSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Lead Prospectado</label>
                <select 
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-cyan-500/50"
                  required
                  value={saleLeadId}
                  onChange={e => setSaleLeadId(e.target.value)}
                >
                  <option value="">Selecione o lead ganho...</option>
                  {leads.filter(l => l.status !== "Faturado").map(l => (
                    <option key={l.id} value={l.id}>{l.nome} ({l.empresa})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valor do Contrato (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
                  required
                  placeholder="Ex: 100000.00"
                  value={saleContractValue}
                  onChange={e => setSaleContractValue(e.target.value)}
                />
              </div>

              {saleContractValue && !isNaN(parseFloat(saleContractValue)) && (
                <div className="bg-[#12121b] border border-white/5 rounded-lg p-4 text-xs space-y-2 font-mono">
                  <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Demonstração de Splits:</div>
                  <div className="flex justify-between">
                    <span>Parceiro / Prospector (30%):</span>
                    <span className="text-emerald-400 font-bold">R$ {(parseFloat(saleContractValue) * 0.3).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TaxManagers Matriz (50%):</span>
                    <span className="text-slate-300">R$ {(parseFloat(saleContractValue) * 0.5).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expert Tributarista (10%):</span>
                    <span className="text-slate-400">R$ {(parseFloat(saleContractValue) * 0.1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Autor da Tese (10%):</span>
                    <span className="text-slate-400">R$ {(parseFloat(saleContractValue) * 0.1).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowRegisterSaleModal(false)}
                  className="flex-1 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/10"
                >
                  Faturar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
