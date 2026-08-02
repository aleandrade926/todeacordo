import { useEffect, useState } from "react";
import { supabase } from "../storage/supabaseClient";

export default function MarketAffiliate() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });

  useEffect(() => {
    async function fetchAffiliateData() {
      if (!supabase) {
        const mockCode = "AFF-" + Math.random().toString(36).substring(7).toUpperCase();
        setProfile({ id: "mock", email: "mock@todeacordo.com.br", affiliate_code: mockCode });
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Temporário: Auto-cadastro mock para o MVP caso não esteja logado
          const mockCode = "AFF-" + Math.random().toString(36).substring(7).toUpperCase();
          setProfile({ id: "mock", email: "mock@todeacordo.com.br", affiliate_code: mockCode });
          setLoading(false);
          return;
        }

        const user = session.user;
        let { data: prof, error } = await supabase
          .from('market_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error || !prof) {
          // Cria o perfil do afiliado se não existir
          const newCode = "AF-" + user.id.substring(0, 6).toUpperCase();
          const { data: newProf, error: insErr } = await supabase
            .from('market_profiles')
            .insert({ id: user.id, affiliate_code: newCode, role: 'affiliate' })
            .select()
            .single();
            
          if (!insErr && newProf) {
            prof = newProf;
          }
        }
        
        setProfile(prof);

        if (prof) {
          // Busca saldo na View
          const { data: balData } = await supabase
            .from('market_affiliate_balances')
            .select('*')
            .eq('affiliate_id', prof.id)
            .single();
            
          if (balData) {
            setBalance({ 
              available: Number(balData.total_available || 0), 
              pending: Number(balData.total_pending || 0) 
            });
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAffiliateData();
  }, []);

  const copyLink = () => {
    if (!profile) return;
    const link = `${window.location.origin}/market?ref=${profile.affiliate_code}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado: " + link);
  };

  const navigate = (path: string) => {
    window.location.replace(`?route=${path}`);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Carregando painel de afiliado...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 w-full">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Meu Painel de Parceiro</h1>
          <button onClick={() => navigate('/market')} className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
            Voltar para o Market
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Saldo Disponível</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">R$ {balance.available.toFixed(2).replace('.', ',')}</p>
            <button disabled className="mt-4 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed">
              Solicitar Saque
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Saldo Pendente (30 dias)</h3>
            <p className="text-4xl font-bold text-amber-500 mt-2">R$ {balance.pending.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs text-slate-400 mt-4">Liberado após período de garantia.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Seu Link Exclusivo</h2>
          <p className="text-slate-600 mb-6">
            Compartilhe este link. Qualquer venda feita através dele gerará comissão automaticamente para você, de qualquer SaaS do Market.
          </p>
          
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              readOnly 
              value={profile ? `${window.location.origin}/market?ref=${profile.affiliate_code}` : ''} 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-700 outline-none"
            />
            <button onClick={copyLink} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm cursor-pointer">
              Copiar Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
