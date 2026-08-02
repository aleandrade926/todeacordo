import { useEffect, useState } from "react";
import { supabase } from "../storage/supabaseClient";

type Product = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  benefits: string[];
  price: number;
  commission_rate: number;
  access_link: string;
  is_active: boolean;
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-todeacordo",
    name: "ToDeAcordo",
    description: "Plataforma de Acordos e Resolução de Conflitos Online.",
    image_url: "https://todeacordo.com.br/logo.png",
    benefits: ["Acordos com validade jurídica", "Economia de tempo", "Sem necessidade de ir ao fórum"],
    price: 97.00,
    commission_rate: 30.00,
    access_link: "https://todeacordo.com.br",
    is_active: true,
  },
  {
    id: "prod-taxmanagers",
    name: "TaxManagers",
    description: "CRM Inteligente e Agentes IA para Tributaristas e Contadores.",
    image_url: "https://taxmanagers.com.br/logo.png",
    benefits: ["Prospecção Automática", "Teses Tributárias Atualizadas", "Integração PJe"],
    price: 497.00,
    commission_rate: 20.00,
    access_link: "https://taxmanagers.com.br",
    is_active: true,
  },
  {
    id: "prod-contratoapp",
    name: "Contrato App",
    description: "Geração inteligente e gestão automatizada de contratos.",
    image_url: "https://via.placeholder.com/150",
    benefits: ["Modelos jurídicos revisados", "Assinatura digital integrada", "Gestão de vencimentos"],
    price: 147.00,
    commission_rate: 25.00,
    access_link: "#",
    is_active: false,
  },
  {
    id: "prod-certidoes",
    name: "Microsaas Certidões",
    description: "Automação na emissão e controle de certidões negativas.",
    image_url: "https://via.placeholder.com/150",
    benefits: ["Monitoramento automático", "Alertas de vencimento", "Integração com tribunais"],
    price: 97.00,
    commission_rate: 30.00,
    access_link: "#",
    is_active: false,
  },
  {
    id: "prod-enterprise",
    name: "Enterprise Bridge",
    description: "Conecte sistemas legados e soluções SaaS com facilidade.",
    image_url: "https://via.placeholder.com/150",
    benefits: ["APIs escaláveis", "Alta disponibilidade", "Monitoramento em tempo real"],
    price: 997.00,
    commission_rate: 15.00,
    access_link: "#",
    is_active: false,
  },
  {
    id: "prod-tamarcado",
    name: "TáMarcado",
    description: "Agendamento simples e rápido. Sua agenda online, sem conflitos de horário.",
    image_url: "https://via.placeholder.com/150",
    benefits: ["Página pública de agendamento", "Sincronização de eventos", "Fuso horário automático"],
    price: 27.00,
    commission_rate: 40.00,
    access_link: "/tamarcado",
    is_active: true,
  },
  {
    id: "prod-integrador",
    name: "Agente Integrador",
    description: "Automações baseadas em IA para conectar fluxos de trabalho.",
    image_url: "https://via.placeholder.com/150",
    benefits: ["Workflows customizados", "Redução de trabalho manual", "Integração multi-plataforma"],
    price: 297.00,
    commission_rate: 20.00,
    access_link: "#",
    is_active: false,
  }
];

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for ?ref= URL param
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      localStorage.setItem('market_ref', refCode);
      console.log("Rastreamento afiliado salvo:", refCode);
    }

    async function fetchProducts() {
      if (!supabase) {
        setProducts(MOCK_PRODUCTS.filter(p => p.is_active));
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('market_products')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(MOCK_PRODUCTS.filter(p => p.is_active));
        }
      } catch (err) {
        console.warn("Usando produtos mockados:", err);
        setProducts(MOCK_PRODUCTS.filter(p => p.is_active));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const navigate = (path: string) => {
    window.location.replace(`?route=${path}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            KSaaS - Casa do SaaS
          </h1>
          <p className="mt-4 text-xl text-slate-500">
            Descubra as melhores soluções digitais e impulsione seus negócios.
          </p>
          <div className="mt-6 flex justify-center gap-4">
               <button onClick={() => navigate('/market/afiliado')} className="px-6 py-2 bg-slate-800 text-white rounded-md font-medium hover:bg-slate-700 transition cursor-pointer z-10 relative">
                 Área do Afiliado
               </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Carregando produtos...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="h-48 bg-slate-200 w-full flex items-center justify-center relative overflow-hidden">
                   {product.image_url ? (
                     <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-slate-400 font-medium">Sem Imagem</span>
                   )}
                   <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-indigo-600 shadow-sm backdrop-blur-sm">
                     R$ {product.price.toFixed(2).replace('.', ',')}/mês
                   </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Benefícios</h4>
                    <ul className="space-y-1">
                      {(typeof product.benefits === 'string' ? JSON.parse(product.benefits) : product.benefits)?.map((benefit: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto relative z-10">
                      <button onClick={() => navigate(`/market/checkout/${product.id}`)} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm cursor-pointer">
                        Assinar Agora
                      </button>
                      <button onClick={() => navigate('/market/afiliado')} className="w-full py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 transition cursor-pointer">
                        Quero Ser Afiliado ({product.commission_rate}% comissão)
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
