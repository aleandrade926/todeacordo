import { trackGrowthEvent } from '../growth/growthLogger';

export const CopyEngines = {
  getWhatsAppCopy: (tone: 'cordial' | 'objetivo' | 'firme' | 'executivo', link: string) => {
    trackGrowthEvent('copy_link_clicked', { channel: 'whatsapp', tone });
    
    switch (tone) {
      case 'cordial':
        return `Oi, gerei um ToDeAcordo da nossa conversa para evitar qualquer ruído depois. Você pode confirmar ou apontar ressalvas aqui: ${link}\n\nGerado com ToDeAcordo.`;
      case 'objetivo':
        return `Segue o entendimento da reunião para validação: ${link}\n\nGerado com ToDeAcordo.`;
      case 'firme':
        return `Antes de avançarmos, preciso confirmar se este foi o combinado da reunião: ${link}\n\nGerado com ToDeAcordo.`;
      case 'executivo':
        return `Resumo validável da reunião, com combinados, pendências e responsáveis: ${link}\n\nGerado com ToDeAcordo.`;
      default:
        return `Confira nosso entendimento aqui: ${link}`;
    }
  },

  getEmailCopy: (link: string) => {
    trackGrowthEvent('copy_link_clicked', { channel: 'email' });
    return {
      subject: 'Confirmação do entendimento da nossa reunião',
      body: `Olá, para evitar qualquer ruído futuro, gerei um registro da nossa conversa.\n\nPor favor, revise as obrigações e decisões, confirme o aceite ou aponte ressalvas acessando este link seguro:\n${link}\n\nEste registro documenta a confirmação operacional do entendimento.\n\n--\nGerado com ToDeAcordo - Reuniões sem mal-entendido.\nCrie o seu em todeacordo.com.br`
    };
  }
};

export const useWebShare = () => {
  const share = async (title: string, text: string, url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        trackGrowthEvent('share_clicked', { method: 'native_share' });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        trackGrowthEvent('share_clicked', { method: 'clipboard_copy' });
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };
  return { share };
};
