export const AmbiguityType = {
  PRAZO_VAGO: 'prazo_vago',
  RESPONSAVEL_AUSENTE: 'responsavel_ausente',
  CONDICIONAL_ABERTA: 'condicional_aberta',
  CONTRADICAO_INTERNA: 'contradicao_interna',
  TERMO_INDEFINIDO: 'termo_indefinido',
  FALTA_DE_METRICA: 'falta_de_metrica',
  REFERENCIA_QUEBRADA: 'referencia_quebrada'
} as const;

export type AmbiguityType = typeof AmbiguityType[keyof typeof AmbiguityType];

export interface AmbiguityTaxonomyInfo {
  type: AmbiguityType;
  label: string;
  description: string;
  examples: string[];
}

export const AMBIGUITY_TYPES: Record<AmbiguityType, AmbiguityTaxonomyInfo> = {
  [AmbiguityType.PRAZO_VAGO]: {
    type: AmbiguityType.PRAZO_VAGO,
    label: 'Prazo Vago',
    description: 'Quando o contrato não estabelece uma data ou um período específico para a conclusão de uma obrigação, utilizando termos genéricos e imprecisos.',
    examples: ['"O mais breve possível"', '"Em tempo hábil"', '"Futuramente"']
  },
  [AmbiguityType.RESPONSAVEL_AUSENTE]: {
    type: AmbiguityType.RESPONSAVEL_AUSENTE,
    label: 'Responsável Ausente',
    description: 'Quando a obrigação é descrita na voz passiva ou de forma impessoal, não deixando claro qual das partes é responsável por executá-la.',
    examples: ['"Será providenciado o alvará"', '"Os relatórios devem ser entregues"']
  },
  [AmbiguityType.CONDICIONAL_ABERTA]: {
    type: AmbiguityType.CONDICIONAL_ABERTA,
    label: 'Condicional Aberta',
    description: 'Quando as condições para um evento ocorrer são subjetivas, dependendo da interpretação de uma das partes, sem critérios objetivos de avaliação.',
    examples: ['"Se necessário"', '"Caso seja considerado adequado"', '"Quando aplicável"']
  },
  [AmbiguityType.CONTRADICAO_INTERNA]: {
    type: AmbiguityType.CONTRADICAO_INTERNA,
    label: 'Contradição Interna',
    description: 'Quando diferentes cláusulas ou anexos do mesmo contrato apresentam instruções conflitantes sobre o mesmo tema.',
    examples: ['Cláusula 2 diz que o pagamento é em 30 dias; Cláusula 5 diz que o pagamento é em 15 dias.']
  },
  [AmbiguityType.TERMO_INDEFINIDO]: {
    type: AmbiguityType.TERMO_INDEFINIDO,
    label: 'Termo Indefinido',
    description: 'Uso de jargões técnicos, siglas ou palavras ambíguas que não constam no glossário do contrato e podem ter múltiplos significados legais ou técnicos.',
    examples: ['"Força maior" (sem listar exemplos)', '"Sistema legado"', '"Padrão de mercado"']
  },
  [AmbiguityType.FALTA_DE_METRICA]: {
    type: AmbiguityType.FALTA_DE_METRICA,
    label: 'Falta de Métrica de Qualidade',
    description: 'A entrega ou serviço é exigido, mas não há um padrão de aceitação ou métrica objetiva de SLA (Service Level Agreement) para avaliar a qualidade e o aceite.',
    examples: ['"Manter o ambiente limpo"', '"Garantir a disponibilidade do sistema"']
  },
  [AmbiguityType.REFERENCIA_QUEBRADA]: {
    type: AmbiguityType.REFERENCIA_QUEBRADA,
    label: 'Referência Quebrada',
    description: 'Menção a anexos, leis, políticas internas ou cláusulas que não existem no documento ou estão numeradas/nomeadas incorretamente.',
    examples: ['"Conforme estipulado no Anexo III" (sendo que não há Anexo III)']
  }
};
