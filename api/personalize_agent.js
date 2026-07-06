import { createClient } from "@supabase/supabase-js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function fallbackResponse(lead, reason) {
  const nome = lead?.nome || "este lead";
  const empresa = lead?.empresa || "a empresa";
  const cargo = lead?.cargo || "decisor";

  return {
    error: true,
    reason,
    short_note: `Olá ${nome}, vi sua atuação como ${cargo} em ${empresa}. Tenho uma hipótese tributária objetiva para avaliar oportunidade fiscal sem pedir documentos sensíveis neste primeiro contato.`,
    long_email: `Olá ${nome}, tudo bem?\n\nMapeei uma hipótese inicial para ${empresa}: avaliar oportunidades fiscais e pontos de saneamento tributário que podem gerar caixa, reduzir risco ou melhorar a preparação para a transição IBS/CBS.\n\nA ideia é começar por uma leitura executiva, sem pedido de SPED ou arquivo sensível no primeiro contato.\n\nSe fizer sentido, posso te mostrar um diagnóstico inicial em poucos minutos.`,
    article_pitch: `Para ${empresa}, eu começaria por um mapa rápido de riscos e oportunidades fiscais: créditos, classificação, transição da reforma e pontos de caixa oculto.`,
    strategy_summary: `Fallback estruturado gerado sem IA externa. Lead: ${nome}. Empresa: ${empresa}. Cargo: ${cargo}.`,
    next_step: "Revisar manualmente e enviar como abordagem inicial."
  };
}

async function processVisionImage(base64Image, type) {
  if (!base64Image) return null;
  const isProfile = type === "profile";
  const resultType = isProfile ? "profile_print" : "contact_print";

  const emptyEntities = {
    nome: "",
    cargo: "",
    empresa: "",
    email: "",
    telefone: "",
    linkedin: ""
  };

  if (!GROQ_API_KEY || GROQ_API_KEY.includes("YOUR_") || GROQ_API_KEY === "") {
    return {
      type: resultType,
      processed: false,
      reason: "image_received_but_not_processed",
      ocr_text: "",
      visual_summary: "",
      extracted_entities: emptyEntities
    };
  }

  try {
    const promptText = isProfile 
      ? "Extraia todo o texto visível deste print de perfil (LinkedIn), incluindo formação, cargo, descrição, empresa e histórico de carreira. Retorne o texto extraído em formato de OCR limpo e um resumo visual."
      : "Extraia todo o texto visível deste print de contato, incluindo e-mails, telefones, aniversários ou redes sociais. Retorne o texto extraído em formato de OCR limpo e um resumo visual.";

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (!content) {
        return {
          type: resultType,
          processed: false,
          reason: "vision_api_error",
          ocr_text: "",
          visual_summary: "",
          extracted_entities: emptyEntities
        };
      }
      return {
        type: resultType,
        processed: true,
        reason: null,
        ocr_text: content,
        visual_summary: `Processamento do anexo de ${isProfile ? "perfil" : "contato"} concluído com sucesso.`,
        extracted_entities: emptyEntities
      };
    } else {
      const errText = await response.text();
      console.error(`Groq Vision failed for ${type}:`, errText);
      return {
        type: resultType,
        processed: false,
        reason: "vision_api_error",
        ocr_text: "",
        visual_summary: "",
        extracted_entities: emptyEntities
      };
    }
  } catch (err) {
    console.error(`Error in processVisionImage for ${type}:`, err);
    return {
      type: resultType,
      processed: false,
      reason: "vision_api_error",
      ocr_text: "",
      visual_summary: "",
      extracted_entities: emptyEntities
    };
  }
}

function buildPrompt(lead, contextExtra, agentProfile, agentOutputs, interactions, leadType, leadTypePromptStr) {
  const metadata = lead?.metadata || {};

  // 1. Oficial data block
  const oficialDataBlock = `====================================
DADOS ESTRUTURADOS - FONTE OFICIAL
====================================
lead_id: ${lead.id || "N/A"}
nome: ${lead.nome || "N/A"}
cargo: ${lead.cargo || "N/A"}
empresa: ${lead.empresa || "N/A"}
email: ${lead.email || "N/A"}
telefone: ${lead.telefone || "N/A"}
url: ${lead.url || "N/A"}
linkedin_key: ${lead.linkedin_key || "N/A"}
status: ${lead.status || "N/A"}
import_status: ${lead.import_status || "N/A"}
lead_type: ${leadType}
metadata: ${JSON.stringify(metadata, null, 2)}
`;

  // 2. Clone IA block
  const cloneIaBlock = `====================================
CLONE IA
====================================
agent_profile: ${agentProfile ? JSON.stringify(agentProfile, null, 2) : "N/A"}
agent_outputs:
- perfil_operacional: ${agentOutputs?.perfil_operacional || "N/A"}
- tese: ${agentOutputs?.tese || "N/A"}
- icp: ${agentOutputs?.icp || "N/A"}
- lista_empresas: ${agentOutputs?.lista_empresas || "N/A"}
- mensagens: ${agentOutputs?.mensagens || "N/A"}
- cadencia: ${agentOutputs?.cadencia || "N/A"}
- next_actions: ${agentOutputs?.next_actions || "N/A"}
`;

  // 3. Timeline block
  let timelineBlockStr = "Nenhuma atividade ou interação registrada na timeline.";
  if (interactions && interactions.length > 0) {
    timelineBlockStr = interactions.map(item => {
      const date = item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "N/A";
      return `- [${date}] (${item.type}): ${item.content || ""}`;
    }).join("\n");
  }
  const timelineBlock = `====================================
TIMELINE / ATIVIDADES
====================================
${timelineBlockStr}
`;

  // 4. Chat history block
  const chatHistoryBlock = `====================================
CHAT HISTORY / ORIENTAÇÕES DO USUÁRIO
====================================
${lead?.chat_history || "Nenhum histórico ou orientação anterior."}
`;

  // 5. Attachments block
  const attachmentsBlock = `====================================
ANEXOS PROCESSADOS
====================================
${JSON.stringify(metadata.attachments_processed || [], null, 2)}
`;

  // Segment instructions based on the leadType
  let roleContextInstruction = "";
  if (leadType === "prospect_parceiro") {
    roleContextInstruction = `
O lead é classificado como **prospect_parceiro** (um advogado, contador ou consultor que queremos atrair para o ecossistema).
Portanto, o Clone IA sendo personalizado representa a **demonstração do próprio Clone IA comercial-tributário desse parceiro**.
Suas mensagens geradas ("short_note", "long_email", "article_pitch") devem ser escritas *da perspectiva do clone do prospect parceiro* direcionadas a potenciais *clientes finais* (empresas operacionais, diretores financeiros, CFOs).
Por exemplo:
- "short_note": Mensagem rápida no LinkedIn escrita por ${lead?.nome || "este profissional"} para um decisor de indústria/varejo, sugerindo avaliar oportunidades de saneamento fiscal sem pedir documentos sensíveis.
- "long_email": E-mail estruturado escrito por ${lead?.nome || "este profissional"} para o CFO de uma empresa operacional apresentando teses de transição da Reforma Tributária ou recuperação tributária focada em gerar caixa.
- "article_pitch": Uma provocação rápida ou tese sobre créditos fiscais que o clone dele enviaria.
- "strategy_summary": Explicação técnica do posicionamento de mercado que o Clone IA de ${lead?.nome || "este profissional"} adotará.
- "next_step": Próxima ação recomendada para o operador master (Alexandre) apresentar esse clone em modo demo para o prospect e fechar a adesão.`;
  } else if (leadType === "cliente_final_empresa") {
    roleContextInstruction = `
O lead é classificado como **cliente_final_empresa** (uma indústria, varejo, agro, etc.).
Portanto, o Clone IA sendo personalizado representa o clone comercial de um parceiro ativo (ou da TaxManagers) prospectando essa empresa.
Suas mensagens geradas devem abordar diretamente esta empresa (${lead?.empresa || "empresa alvo"}) com foco nas teses fiscais mais adequadas para o segmento dela.`;
  } else {
    roleContextInstruction = `
O papel do lead é indefinido. Estruture abordagens sugerindo a hipótese provável.`;
  }

  const rulesBlock = `====================================
REGRAS
====================================
- Nunca invente fatos.
- Nunca trate hipótese como fato.
- Nunca altere lead_type definido pelo sistema.
- Se faltar informação, diga que falta.
- Se o lead_type for prospect_parceiro, não vender como cliente final.
- Se o lead_type for cliente_final_empresa, focar na empresa e tese tributária.
- Se qualquer anexo em attachments_processed tiver processed = false (ou se o anexo foi recebido mas não extraído/processado), você DEVE obrigatoriamente incluir a seguinte frase no início de strategy_summary:
  "Recebi indicação de anexo, mas o conteúdo visual ainda não foi extraído pelo sistema."
- Se houver processed = true em qualquer anexo, você DEVE usar de forma explícita e clara o conteúdo extraído dos anexos para personalizar:
  - short_note
  - long_email
  - strategy_summary
  - next_step
- Não prometa recuperação garantida nas abordagens.
- Não peça SPED/EFD no primeiro contato.
- Importante: Se o histórico de conversas ou observações contiverem regras explícitas (ex: "ele trabalha com direito imobiliário", "não oferecer tese federal geral", "foco em parcerias comerciais", "não é cliente final"), você DEVE respeitar rigorosamente essas diretrizes na personalização das mensagens.
- Use linguagem executiva, curta, concreta e persuasiva.
- ${leadTypePromptStr}
`;

  return `
Você é o motor de personalização de Clones IA da TaxManagers.
A TaxManagers não vende "CRM com IA". A TaxManagers cria Clones IA comerciais-tributários que operam antes da contratação do serviço de parceria. O CRM é apenas a interface. O produto é o Clone IA.

Instrução de Contexto para o Papel:
${roleContextInstruction}

${oficialDataBlock}

${cloneIaBlock}

${timelineBlock}

${chatHistoryBlock}

${attachmentsBlock}

${rulesBlock}

====================================
TAREFA
====================================
Gere a estratégia de abordagem do lead.
A observação adicional do operador é: ${contextExtra || "Nenhuma"}
Retorne SOMENTE JSON válido, sem qualquer tipo de markdown ou texto externo.

Formato obrigatório do JSON:
{
  "short_note": "...",
  "long_email": "...",
  "article_pitch": "...",
  "strategy_summary": "...",
  "next_step": "..."
}
`;
}

async function callGroq(model, prompt) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content: "Você gera JSON válido para prospecção B2B tributária. Não use markdown. Retorne exclusivamente o JSON puro."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq ${model} failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  
  // Clean JSON formatting if LLM wrapped it in markdown code blocks
  let cleanContent = content.trim();
  if (cleanContent.startsWith("```json")) {
    cleanContent = cleanContent.slice(7);
  } else if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith("```")) {
    cleanContent = cleanContent.slice(0, -3);
  }
  cleanContent = cleanContent.trim();

  return JSON.parse(cleanContent);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  console.log("[personalize_agent body keys]", Object.keys(req.body || {}));

  const { lead: initialLead, context_extra, profile_image, contact_image } = req.body || {};
  const profile_image_base64 = profile_image;
  const contact_image_base64 = contact_image;

  console.log("[personalize_agent attachments]", {
    has_profile_image: !!profile_image_base64,
    has_contact_image: !!contact_image_base64,
    profile_image_size: profile_image_base64?.length || 0,
    contact_image_size: contact_image_base64?.length || 0
  });

  if (!initialLead) {
    return res.status(400).json(fallbackResponse({}, "missing_lead"));
  }

  if (!GROQ_API_KEY) {
    return res.status(200).json(fallbackResponse(initialLead, "missing_groq_api_key"));
  }

  let lead = initialLead;
  let agentProfile = null;
  let agentOutputs = null;
  let interactions = [];
  const leadId = lead.id;

  // Fetch latest data from Supabase if leadId is available
  if (leadId) {
    try {
      const { data: dbLead } = await supabase
        .from("taxmanagers_leads")
        .select("*")
        .eq("id", leadId)
        .single();
      if (dbLead) {
        lead = dbLead;
      }

      const { data: profileData } = await supabase
        .from("taxmanagers_agent_profiles")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();
      agentProfile = profileData;

      const { data: outputsData } = await supabase
        .from("taxmanagers_agent_outputs")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();
      agentOutputs = outputsData;

      const { data: interactionsData } = await supabase
        .from("taxmanagers_interactions")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (interactionsData) {
        interactions = interactionsData;
      }
    } catch (err) {
      console.error("Error fetching latest lead/agent data in personalize_agent backend:", err);
    }
  }

  // Process attachments if they are in the request payload
  const attachmentsProcessed = [];
  if (profile_image_base64) {
    const resImg = await processVisionImage(profile_image_base64, "profile");
    if (resImg) attachmentsProcessed.push(resImg);
  }
  if (contact_image_base64) {
    const resImg = await processVisionImage(contact_image_base64, "contact");
    if (resImg) attachmentsProcessed.push(resImg);
  }

  if (attachmentsProcessed.length > 0) {
    const currentMetadata = lead.metadata || {};
    // Clean flag so we know it has been processed
    const updatedMetadata = {
      ...currentMetadata,
      has_profile_attachment: profile_image_base64 ? false : currentMetadata.has_profile_attachment,
      has_contact_attachment: contact_image_base64 ? false : currentMetadata.has_contact_attachment,
      attachments_processed: [
        ...(currentMetadata.attachments_processed || []).filter(
          item => !attachmentsProcessed.some(newItem => newItem.type === item.type)
        ),
        ...attachmentsProcessed
      ]
    };
    
    try {
      await supabase
        .from("taxmanagers_leads")
        .update({ metadata: updatedMetadata })
        .eq("id", leadId);
      lead.metadata = updatedMetadata;
      console.log("[personalize_agent] Saved attachments_processed to Supabase for lead", leadId);
    } catch (dbErr) {
      console.error("Error updating lead metadata with attachments_processed:", dbErr);
    }
  }

  const metadata = lead.metadata || {};

  // Determine lead role using metadata.lead_type
  let leadType = metadata.lead_type || metadata.lead_role;
  let leadTypePromptStr = "";

  if (leadType) {
    leadTypePromptStr = `Tipo do lead definido pelo sistema: ${leadType}. Não altere essa classificação sem solicitação explícita do usuário.`;
  } else {
    // If not present, suggest classification as hypothesis
    const cargo = (lead?.cargo || "").toLowerCase();
    const empresa = (lead?.empresa || "").toLowerCase();

    const partnerKeywords = [
      "advogado", "advogada", "consultor", "consultora", "contador", "contadora", 
      "tax", "fiscal", "tributario", "tributaria", "advisory", "partner", "socio", 
      "socia", "founder", "cfo", "controller", "diretor fiscal", "diretora fiscal", 
      "financeiro", "financeira", "boutique", "escritorio", "direito", "contabilidade"
    ];

    const isPartnerRelated = partnerKeywords.some(kw => cargo.includes(kw) || empresa.includes(kw));
    let suggestedRole = "indefinido";
    if (isPartnerRelated) {
      suggestedRole = "prospect_parceiro";
    } else {
      const companyKeywords = [
        "industria", "industrial", "varejo", "varejista", "agro", "agronegocio", 
        "energia", "construcao", "incorporadora", "logistica", "grupo", "holding", 
        "comercio", "comercial", "servicos", "transportadora", "distribuidora", "fabrica"
      ];
      const isCompanyRelated = companyKeywords.some(kw => cargo.includes(kw) || empresa.includes(kw));
      if (isCompanyRelated) {
        suggestedRole = "cliente_final_empresa";
      }
    }
    leadType = suggestedRole;
    leadTypePromptStr = `lead_type ausente. Sugestão: ${suggestedRole}. Marque esta classificação claramente como uma hipótese.`;
  }

  const prompt = buildPrompt(lead, context_extra, agentProfile, agentOutputs, interactions, leadType, leadTypePromptStr);

  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ];

  for (const model of models) {
    try {
      const result = await callGroq(model, prompt);

      return res.status(200).json({
        error: false,
        model,
        short_note: result.short_note || "",
        long_email: result.long_email || "",
        article_pitch: result.article_pitch || "",
        strategy_summary: result.strategy_summary || "",
        next_step: result.next_step || "",
        updated_metadata: lead.metadata
      });
    } catch (err) {
      console.error("[personalize_agent]", model, err);
    }
  }

  return res.status(200).json(fallbackResponse(lead, "groq_failed"));
}
