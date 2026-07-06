import { createClient } from "@supabase/supabase-js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("[chat_agent supabase mode]", {
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
  usingAdminClient: !!SUPABASE_SERVICE_ROLE_KEY
});

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Helper function to update metadata context summary asynchronously
async function updateContextSummaryIfNeeded(leadId, currentLead, chatHistoryMsgs) {
  if (!leadId || !chatHistoryMsgs || chatHistoryMsgs.length < 4) return;
  try {
    const prompt = `Resuma as informações operacionais cruciais sobre este lead com base na conversa a seguir.
Foque em: restrições, decisões (ex: "é prospect_parceiro", "não é cliente final", "atua em direito imobiliário"), objetivos ou novos combinados.
Seja extremamente curto (máximo de 3 frases).

Conversa:
${chatHistoryMsgs.map(m => `${m.role === 'user' ? 'Usuário' : 'Copiloto'}: ${m.content}`).join("\n")}

Retorne APENAS o resumo operacional em texto corrido.`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const summary = data?.choices?.[0]?.message?.content?.trim();
      if (summary) {
        const metadata = currentLead.metadata || {};
        metadata.context_summary = summary;
        
        await supabase
          .from("taxmanagers_leads")
          .update({ metadata })
          .eq("id", leadId);
          
        console.log("[chat_agent] Updated metadata.context_summary for lead", leadId);
      }
    }
  } catch (e) {
    console.error("Failed to update context summary:", e);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  const { lead: initialLead, messages, userMessage } = req.body || {};

  if (!initialLead) {
    return res.status(400).json({ error: true, message: "Missing lead details" });
  }

  if (!supabase) {
    return res.status(500).json({ error: true, message: "Configuração Supabase incompleta no backend" });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: true, message: "Missing Groq API Key configuration" });
  }

  let lead = initialLead;
  let agentProfile = null;
  let agentOutputs = null;
  let interactions = [];
  const leadId = lead.id;

  // Fetch latest data from Supabase if leadId exists
  if (leadId) {
    try {
      const { data: dbLead, error: dbLeadError } = await supabase
        .from("taxmanagers_leads")
        .select("*")
        .eq("id", leadId)
        .single();
      if (!dbLeadError && dbLead) {
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

      console.log("[chat_agent timeline debug]", {
        lead_id: leadId,
        interactions_count: interactions?.length || 0,
        interactions_preview: interactions?.slice(0, 3)?.map(i => ({
          id: i.id,
          type: i.type,
          direction: i.direction,
          content: i.content,
          created_at: i.created_at
        }))
      });
    } catch (err) {
      console.error("Error fetching latest lead/agent data in backend:", err);
    }
  }

  const metadata = lead.metadata || {};

  // Build context summary details
  const contextSummaryText = metadata.context_summary ? `\nResumo operacional acumulado do lead: ${metadata.context_summary}` : "";

  // Determine lead role using metadata.lead_type
  let leadType = metadata.lead_type || metadata.lead_role;
  let leadTypePromptStr = "";

  if (leadType) {
    leadTypePromptStr = `Tipo do lead definido pelo sistema: ${leadType}. Não altere essa classificação sem solicitação explícita do usuário.`;
  } else {
    // If not present, IA suggests a classification but marks as hypothesis
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

  // Format blocks
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

  let timelineBlockStr = "Sem conteúdo textual disponível na timeline.";
  if (interactions && interactions.length > 0) {
    const formatted = interactions
      .map(item => {
        const timeStr = item.created_at || "N/A";
        const contentStr = item.content ? item.content : "Sem conteúdo textual disponível na timeline.";
        return `- [${timeStr}] [${item.type || "N/A"}]: ${contentStr}`;
      })
      .filter(Boolean);
    if (formatted.length > 0) {
      timelineBlockStr = formatted.join("\n");
    }
  }
  const timelineBlock = `### TIMELINE DO LEAD
${timelineBlockStr}
`;

  // Build chat history for Groq (Limit to last 6 messages to avoid rate limits / token overflow)
  let chatHistoryToUse = messages || [];
  if (chatHistoryToUse.length > 6) {
    chatHistoryToUse = chatHistoryToUse.slice(-6);
  }

  const chatHistoryStr = chatHistoryToUse.map(msg => `${msg.role === 'assistant' ? 'Copiloto' : 'Usuário'}: ${msg.content}`).join("\n");
  const chatHistoryBlock = `====================================
CHAT HISTORY / ORIENTAÇÕES DO USUÁRIO
====================================
${chatHistoryStr || "Nenhum histórico ou orientação anterior."}
`;

  const attachmentsBlock = `====================================
ANEXOS PROCESSADOS
====================================
${JSON.stringify(metadata.attachments_processed || [], null, 2)}
`;

    const rulesBlock = `====================================
REGRAS DO SISTEMA
====================================
- Nunca invente fatos.
- Nunca trate hipótese como fato.
- Nunca altere lead_type definido pelo sistema.
- Se faltar informação, diga que falta.
- Se o lead_type for prospect_parceiro, não vender como cliente final.
- Se o lead_type for cliente_final_empresa, focar na empresa e tese tributária.
- Se qualquer anexo em attachments_processed tiver processed = false (ou se o anexo foi recebido mas não extraído/processado), você DEVE incluir a seguinte frase no início de sua resposta (na seção FATOS OBSERVADOS ou DIAGNÓSTICO):
  "Recebi indicação de anexo, mas o conteúdo visual ainda não foi extraído pelo sistema."
- Se houver processed = true em qualquer anexo, use explicitamente o conteúdo extraído dos anexos para responder e personalizar a análise.
- Proibir resposta final perguntando "O que você acha?". O agente deve recomendar uma ação.
- Para prospect_parceiro, não assumir automaticamente que a empresa dele é o cliente final. A pessoa pode ser parceiro potencial, originador, especialista de nicho, dono de relacionamento ou canal comercial.
- ${leadTypePromptStr}
`;

  const userQueryBlock = `====================================
PERGUNTA DO USUÁRIO
====================================
${userMessage || "Analise o lead com base nas informações fornecidas."}
`;

  // Build the final single message representing the user query blocks
  const fullPromptContext = `${oficialDataBlock}

${cloneIaBlock}

${timelineBlock}

${chatHistoryBlock}

${attachmentsBlock}

${rulesBlock}

${userQueryBlock}`;

  const conversation = [
    {
      role: "system",
      content: `Você é o Copiloto de Prospecção Tributária da TaxManagers.
Você está conversando com o Alexandre (operador master da TaxManagers) sobre como tratar o lead.

---
REGRA DE PRIORIDADE DE INTENÇÃO (MÁXIMA PRIORIDADE):
Se a pergunta ou instrução do usuário for curta e pontual, como "consegue ver?", "coloquei na timeline", "sugere mensagem?", "como respondo?":
NUNCA use o formato completo/dossiê (com FATOS OBSERVADOS, DIAGNÓSTICO, etc). Responda de forma cirúrgica, prática e direta.

Para perguntas sobre "consegue ver a timeline?":
- ATENÇÃO: O conteúdo da timeline ESTÁ no seu contexto, na seção "### TIMELINE DO LEAD". Leia essa seção!
- Se a seção "### TIMELINE DO LEAD" contiver os dados reais (ex: notas de reunião, resumos): responda iniciando exatamente com "Sim. Pelo conteúdo da timeline, os pontos principais são: " e complete com o resumo cirúrgico do que você leu.
- APENAS se a seção "### TIMELINE DO LEAD" disser explicitamente "Sem conteúdo textual disponível", responda: "Não recebi o conteúdo da timeline no contexto. Consigo apenas ver que ele foi mencionado."

---
REGRAS ADICIONAIS E CRÍTICAS DE CONTEXTO E FLUXO:

1. REGRA DE VERIFICAÇÃO DE CONTEXTO
Nunca minta dizendo que leu um arquivo se a seção TIMELINE DO LEAD ou ANEXOS PROCESSADOS não tiver o conteúdo real.
Se o usuário perguntar se você consegue ver, LEIA os blocos fornecidos. Se os blocos contiverem as informações, resuma-as. Se não contiverem, use a frase de fallback acima.

2. REGRA DE PÓS-REUNIÃO E ORDEM CRONOLÓGICA DA TIMELINE
A timeline deve ser interpretada em ordem cronológica. Dê prioridade absoluta aos registros mais recentes. A resposta deve considerar a anotação mais recente como fonte principal de verdade. Quando houver conflito entre uma anotação antiga e uma anotação nova, prevalece a anotação mais recente.
Se a mensagem do usuário OU a anotação MAIS RECENTE da timeline contiver expressões como: "fiz reunião", "tive reunião", "conversei com", "falamos sobre", "na reunião", "quando falei", "não fez sentido", "reunião que tivemos", "resumo da reunião", "após a reunião", "acabamos de falar", "ele participou", "na reunião ele disse", "tivemos a reunião", "depois da reunião" ou similares, você deve considerar o estágio mental do lead obrigatoriamente como "pós_reunião".
Sob a condição "pós_reunião":
- É PROIBIDO dizer ou sugerir que a reunião ainda acontecerá. Anotações antigas sobre agendamento devem ser tratadas apenas como histórico superado.
- NÃO USE as frases: "a reunião será", "aguardar a reunião", "preparar para a reunião", "reunião agendada", "discutir na reunião de hoje" ou similares.
- Priorize estruturar sua resposta contendo: resumo executivo, sinais de interesse, objeções, pendências, próximo passo concreto e mensagem de follow-up.

3. REGRA DE RESPOSTA PARA "COLOQUEI RESUMO NA TIMELINE"
Quando o usuário disser que colocou um resumo na timeline:
- Verifique se o conteúdo textual da timeline de fato veio no contexto.
- Se veio, resuma os pontos principais e sugira o próximo passo (NÃO repita o dossiê completo).
- Se não veio, diga explicitamente que o conteúdo não foi recebido e peça para reenviar ou verificar a integração.

4. REGRAS DE FIT E OBJEÇÕES DA TIMELINE
- Se a anotação mais recente contiver "não fez sentido", isso DEVE ser tratado como sinal negativo forte de fit comercial. NÃO transforme "não fez sentido" em "precisa de mais esclarecimentos", salvo se o usuário pedir tentativa de recuperação.
- Para perguntas como "é bom prospect_parceiro agora?" (ou similares sobre fit), responda de forma decisiva com uma destas opções: "bom fit", "fit moderado", "baixo fit imediato" ou "descartado por ora".
- Se a timeline mais recente indicar que o Clone IA não fez sentido para o lead, classifique como "baixo fit imediato". A mensagem sugerida deve ser de follow-up elegante (relacionamento/educação), não uma nova tentativa agressiva de venda.
- PROIBIDO repetir a área de atuação antiga (ex: "direito imobiliário") se a anotação mais recente indicar expressamente outra atuação (ex: Civil, Criminal, etc). A anotação mais recente prevalece sobre sugestões anteriores da IA.

---
INSTRUÇÕES CRÍTICAS DE ANÁLISE E FORMATO:

1. CLASSIFICAÇÃO INTERNA DA INTENÇÃO DO USUÁRIO
Antes de responder, você deve classificar internamente a intenção da pergunta em uma destas categorias:
- analise_lead
- melhorar_mensagem
- criar_mensagem
- criar_followup
- corrigir_dado
- definir_proximo_movimento
- responder_duvida

NÃO exiba essa classificação no texto da resposta final, a menos que o usuário peça explicitamente.

2. REGRAS DE FORMATO CONFORME A INTENÇÃO CLASSIFICADA:

Se a intenção for "melhorar_mensagem":
- NÃO repita FATOS OBSERVADOS, DIAGNÓSTICO, HIPÓTESES ou SCORE.
- Entregue diretamente uma versão melhorada da mensagem.
- Explique em até 3 bullets objetivos o que foi melhorado.
- Preserve a intenção comercial do usuário, mas melhore a clareza, força, concisão e aderência ao tipo de lead.

Se a intenção for "criar_mensagem":
- Entregue a mensagem pronta para envio.
- Limite máximo de 700 caracteres.
- Tom consultivo, direto, comercial e sem exagero.
- Evite linguagem institucional genérica.
- PROIBIDO usar frases vazias/institucionais como: "gostaria de apresentar uma oportunidade", "aumentar sua receita", "soluções inovadoras", "transformar seu negócio", "o que você acha?".

Se a intenção for "criar_followup":
- Entregue apenas o follow-up.
- Tom leve, direto e natural (não parecer cobrança).
- Limite máximo de 500 caracteres.

Se a intenção for "analise_lead" (ou se nenhuma das intenções cirúrgicas de mensagem/followup acima for o foco principal da pergunta):
Toda resposta deve seguir estritamente a ordem e títulos abaixo (sendo direta, cirúrgica e prática):
FATOS OBSERVADOS
DIAGNÓSTICO
HIPÓTESES
CONFIANÇA DAS INFORMAÇÕES
SCORE COMERCIAL
CLONE IA RECOMENDADO
PRÓXIMO MOVIMENTO
MENSAGEM SUGERIDA

3. DIRETRIZES DE CONTEÚDO CONFORME O TIPO DE LEAD (lead_type):

A) Se lead_type for "prospect_parceiro":
- Oriente a mensagem para venda de parceria com a TaxManagers, e NÃO para venda de consultoria tributária direta à empresa do lead.
- Posicione a TaxManagers como uma infraestrutura comercial-tributária completa para o parceiro, composta por:
  * Clone IA comercial-tributário;
  * Base própria de prospecção com aproximadamente 20.000 contatos;
  * Metodologia de abordagem;
  * Apoio na originação de oportunidades;
  * Retaguarda técnica sênior;
  * Apoio na qualificação, quantificação, validação e condução operacional das oportunidades;
  * Suporte para cumprimento de obrigações acessórias quando aplicável;
  * Possibilidade de o parceiro atuar sem depender exclusivamente da própria carteira pessoal.
- A mensagem deve deixar claro que a TaxManagers ajuda o parceiro a estruturar uma operação, e não apenas oferece um software.

B) Se o lead for contador, professor, consultor, advogado, tributarista, CFO, controller ou profissional com rede e autoridade (autoridade técnica):
- Valorize a autoridade técnica do prospect.
- Destaque o potencial de rede e a possibilidade de transformar conhecimento e relacionamento em operação comercial lucrativa.
- Enfatize o uso da estrutura da TaxManagers para originar e conduzir oportunidades e a parceria com retaguarda (não contratação de software).
- Exemplo de tom/direção: "Vi sua atuação como contador e professor e queria te apresentar uma possibilidade de parceria com a TaxManagers. Estamos estruturando uma operação com IA, base própria de prospecção e retaguarda técnica sênior para apoiar parceiros na originação e condução de oportunidades tributárias. Acho que pode conversar bem com seu perfil. Você teria 15 minutos na quinta ou sexta?"

C) Se lead_type for "cliente_final_empresa":
- NÃO venda parceria, clone do parceiro ou adesão à TaxManagers.
- Foque o teor em: diagnóstico tributário, saneamento fiscal, créditos, Reforma Tributária, riscos operacionais, oportunidades de caixa e reunião técnica.

4. REGRAS PARA "CLONE IA RECOMENDADO":
- Para "prospect_parceiro", o Clone IA sempre se aplica. NUNCA responda "Clone IA não se aplica", "Não se aplica nesse caso", ou "Não há clone recomendado" sem oferecer uma recomendação preliminar. Se faltar informação, use a fórmula: "Recomendação preliminar: Clone IA de Originação Comercial-Tributária para parceiro [perfil do lead]."
- Se o prospect_parceiro atuar em direito imobiliário, sugerir: "Clone IA de Originação Imobiliário-Tributária." A tese deste clone deve conectar obrigatoriamente o direito imobiliário com: Reforma Tributária, holdings, locações, compra e venda, sucessório, regularização, incorporação, estruturação patrimonial e oportunidades tributárias conduzidas com retaguarda TaxManagers. Exemplo de tese: "Usar a autoridade do parceiro em direito imobiliário para abrir conversas sobre impactos tributários em holdings, locações, sucessório, compra e venda, incorporação e estruturação patrimonial, com apoio técnico e operacional da TaxManagers na identificação, qualificação e condução das oportunidades."
- Exemplo para contador/professor: "Clone IA de Originação Contábil-Tributária, voltado a apoiar o parceiro na prospecção, qualificação e condução inicial de oportunidades tributárias junto a empresas da base TaxManagers ou da sua rede."

5. HIERARQUIA DE FATOS E HIPÓTESES:
- NUNCA invente setor, atuação, interesse ou dor do prospect.
- Separe sempre claramente o que é fato observado, o que é hipótese comercial e o que é sugestão de abordagem.
- Se não houver dados suficientes, use explicitamente: "Não encontrei informação suficiente para afirmar isso. A recomendação abaixo é preliminar."

6. REGRA DE NÃO REPETIÇÃO EM PEDIDOS PONTUAIS:
- Quando o usuário fizer pedidos pontuais como:
  * "consegue ver?"
  * "coloquei na timeline"
  * "sugere mensagem?"
  * "melhore a mensagem"
  * "como respondo?"
  * "o que mando agora?"
  o Copiloto NÃO deve responder com o relatório completo (a estrutura com todas as seções de FATOS, DIAGNÓSTICO, HIPÓTESES, SCORE e CLONE), salvo se o usuário pedir explicitamente uma análise completa. Nesses casos, responda de forma cirúrgica, prática e diretamente orientada ao próximo passo.

7. NUNCA finalize com perguntas abertas como "O que você acha?". Recomende uma ação concreta no Próximo Movimento (se aplicável ao formato).`
    },
    {
      role: "user",
      content: fullPromptContext
    }
  ];

  console.log("[chat_agent request]", {
    lead_id: leadId,
    hasLead: !!lead,
    chatHistoryLength: chatHistoryToUse?.length || 0,
    timelineLength: interactions?.length || 0,
    promptLength: conversation[0]?.content?.length || 0,
    hasGroqKey: !!GROQ_API_KEY
  });

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.25,
        messages: conversation
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[chat_agent] Groq main model failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Fallback model
      const fallbackResponse = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.25,
          messages: conversation
        })
      });

      if (!fallbackResponse.ok) {
        const fbErrorText = await fallbackResponse.text();
        console.error("[chat_agent] Groq fallback model failed:", {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
          error: fbErrorText
        });
        throw new Error("Both Groq models failed");
      }
      
      const data = await fallbackResponse.json();
      const content = data?.choices?.[0]?.message?.content || "";
      
      // Update summary in background
      if (leadId) {
        updateContextSummaryIfNeeded(leadId, lead, [...chatHistoryToUse, { role: "user", content: userMessage }, { role: "assistant", content }]);
      }

      return res.status(200).json({ error: false, content });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    
    // Update summary in background
    if (leadId) {
      updateContextSummaryIfNeeded(leadId, lead, [...chatHistoryToUse, { role: "user", content: userMessage }, { role: "assistant", content }]);
    }

    return res.status(200).json({ error: false, content });
  } catch (err) {
    console.error("[chat_agent]", err);
    return res.status(500).json({
      error: true,
      message: err.message || "Internal server error"
    });
  }
}
