export interface RulePack {
  id: string;
  name: string;
  description: string;
  mandatoryQuestions: string[];
  risks: string[];
}

export const RULE_PACKS: RulePack[] = [
  {
    id: "rp_escopo",
    name: "Regras de Escopo",
    description: "Diretrizes para definição clara e exaustiva do escopo do projeto, evitando brechas e ambiguidades.",
    mandatoryQuestions: [
      "O escopo está definido de forma exaustiva (incluindo o que NÃO faz parte)?",
      "As métricas de aceitação estão quantificadas?",
      "Existem exclusões explícitas no escopo?"
    ],
    risks: [
      "Escopo aberto (Scope Creep) gerando custos adicionais",
      "Entregas rejeitadas por falta de critérios de aceitação",
      "Falta de clareza nas obrigações das partes"
    ]
  },
  {
    id: "rp_obra",
    name: "Regras para Obras e Engenharia",
    description: "Normas específicas para contratos de execução de obras civis e serviços de engenharia.",
    mandatoryQuestions: [
      "Existe cronograma físico-financeiro anexado e referenciado?",
      "A responsabilidade por licenças e alvarás está claramente atribuída?",
      "Há cláusula sobre descarte de resíduos (PGRCC)?"
    ],
    risks: [
      "Atrasos por falta de licenciamento prévio",
      "Multas ambientais por descarte irregular",
      "Aditivos contratuais frequentes por falhas de projeto"
    ]
  },
  {
    id: "rp_tributario",
    name: "Regras Tributárias e Fiscais",
    description: "Conjunto de regras para mitigar riscos de passivos fiscais e reter os impostos adequadamente.",
    mandatoryQuestions: [
      "As retenções de impostos (ISS, INSS, IRRF, CSRF) estão especificadas?",
      "Foi definido de quem é o ônus por variações na alíquota de impostos?",
      "Há exigência de certidões negativas (CNDs) para liberação de pagamentos?"
    ],
    risks: [
      "Responsabilidade solidária por débitos previdenciários (INSS)",
      "Autuações fiscais por falha na retenção de impostos",
      "Perda de rentabilidade devido a novos encargos tributários"
    ]
  },
  {
    id: "rp_trabalhista",
    name: "Regras Trabalhistas e Terceirização",
    description: "Controles para evitar passivos trabalhistas em contratos com cessão de mão de obra.",
    mandatoryQuestions: [
      "Há previsão de fiscalização mensal de obrigações trabalhistas?",
      "Existe proibição ou restrição à subcontratação (pejotização)?",
      "As regras de acesso às dependências da empresa (EPIs, crachás) estão claras?"
    ],
    risks: [
      "Vínculo empregatício ou responsabilidade subsidiária",
      "Acidentes de trabalho por falta de EPIs ou fiscalização",
      "Multas por descumprimento de normas regulamentadoras (NRs)"
    ]
  },
  {
    id: "rp_lgpd",
    name: "Privacidade e Proteção de Dados (LGPD)",
    description: "Cláusulas para conformidade com a legislação de proteção de dados pessoais (Lei 13.709/2018).",
    mandatoryQuestions: [
      "Haverá compartilhamento, acesso ou tratamento de dados pessoais?",
      "O contrato possui seção ou anexo específico de LGPD (DPA)?",
      "As responsabilidades em caso de vazamento de dados estão descritas?"
    ],
    risks: [
      "Multas da ANPD por tratamento inadequado de dados",
      "Danos à reputação da empresa por vazamento de informações",
      "Ações indenizatórias por titulares de dados"
    ]
  }
];
