export const useCases = [
  {
    slug: 'advogados',
    title: 'ToDeAcordo para Advogados',
    persona: 'Advogados e Escritórios',
    pain: 'O cliente liga, muda a estratégia, você executa, e depois ele diz que não autorizou.',
    beforeTranscript: 'Cliente: "Acho que a gente devia tentar o acordo extrajudicial primeiro."\nVocê: "Ok, vou protocolar a petição com essa proposta."\nCliente: "Beleza, manda bala."',
    afterConsensus: 'Decisão: Cliente autorizou a proposta de acordo extrajudicial no valor de R$ 50k. Responsável: Advogado (Protocolar até sexta).',
    objections: 'Ata assusta o cliente. ToDeAcordo parece um checklist inofensivo.',
    cta: 'Blindar minhas ligações',
    keywords: ['advocacia', 'legal design', 'acordo extrajudicial', 'prova documental']
  },
  {
    slug: 'consultores',
    title: 'ToDeAcordo para Consultores Estratégicos',
    persona: 'Consultores B2B',
    pain: 'Você entrega o projeto e o cliente cobra uma planilha que ele "jurava que estava no escopo".',
    beforeTranscript: 'Cliente: "Você pode incluir aquela análise de mercado tbm?"\nVocê: "Posso dar uma olhada, mas não aprofundado."\nCliente: "Ótimo!"',
    afterConsensus: 'Obrigação: Consultor fará uma análise superficial (máx 2 páginas) do mercado. O aprofundamento não faz parte do escopo atual.',
    objections: 'Eu já gravo a reunião. (Quem vai ouvir 1h de áudio para provar um ponto?)',
    cta: 'Proteger meu escopo',
    keywords: ['consultoria B2B', 'scope creep', 'gestão de escopo']
  },
  {
    slug: 'agencias',
    title: 'ToDeAcordo para Agências de Marketing',
    persona: 'Agências e Produtoras',
    pain: 'O cliente reprova a arte alegando que pediu "mais vibrante", quando na call pediu "minimalista".',
    beforeTranscript: 'Cliente: "Eu queria algo mais clean, mas que chamasse atenção."\nAtendimento: "Tá, vamos focar no minimalismo com cores pontuais."\nCliente: "Isso!"',
    afterConsensus: 'Decisão: A direção de arte será minimalista com pontos de cor vibrante. Responsável: Atendimento (Briefing para Criação).',
    objections: 'O cliente não vai querer assinar. (Ele não assina, ele clica em "Tô de Acordo" no WhatsApp).',
    cta: 'Acabar com a refação',
    keywords: ['refação', 'aprovação de layout', 'briefing', 'agência de publicidade']
  },
  {
    slug: 'vendas-b2b',
    title: 'ToDeAcordo para Vendas B2B',
    persona: 'Executivos de Vendas (AE / SDR)',
    pain: 'Você faz o demo, manda proposta e toma ghosting porque os próximos passos não ficaram claros.',
    beforeTranscript: 'Lead: "Gostei muito. Vou falar com meu diretor."\nVocê: "Legal, quando podemos voltar a falar?"\nLead: "Semana que vem te dou um toque."',
    afterConsensus: 'Obrigação: Lead apresentará a plataforma ao Diretor até terça-feira. Próximo passo: Nova call quarta às 14h.',
    objections: 'Parece agressivo para vendas. (É profissionalismo puro. Quem tem intenção de compra, não foge de combinado).',
    cta: 'Fechar mais contratos',
    keywords: ['follow up B2B', 'ghosting', 'proposta comercial', 'BANT']
  }
];
