export type OpportunityType = 'api' | 'white_label' | 'partner' | 'enterprise' | 'integration';

export interface OpportunityLead {
  id: string;
  type: OpportunityType;
  name: string;
  email: string;
  company?: string;
  volume?: string;
  interest?: string;
  created_at: number;
}

export const OpportunityLogger = {
  logOpportunity: (lead: Omit<OpportunityLead, 'id' | 'created_at'>) => {
    const opportunities: OpportunityLead[] = JSON.parse(localStorage.getItem('tda_opportunities') || '[]');
    opportunities.push({
      ...lead,
      id: `opp_${Date.now()}`,
      created_at: Date.now()
    });
    localStorage.setItem('tda_opportunities', JSON.stringify(opportunities));
    console.log('[ToDeAcordo] Opportunity Captured:', lead);
  },
  
  getOpportunities: (): OpportunityLead[] => {
    return JSON.parse(localStorage.getItem('tda_opportunities') || '[]');
  }
};
