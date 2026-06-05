import React from "react";
import { 
  ShieldCheck, 
  BarChart3, 
  FileSearch, 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Activity,
  Database,
  Network
} from "lucide-react";

export default function TaxManagers() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-50">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Tax Managers</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#solucoes" className="hover:text-cyan-400 transition-colors">Soluções</a>
            <a href="#metodo" className="hover:text-cyan-400 transition-colors">Método</a>
            <a href="#contato" className="px-5 py-2.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">
              Análise Inicial
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0c] to-[#0a0a0c]"></div>
        
        {/* Technical Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Activity className="w-3 h-3" />
              <span>Inteligência Tributária Aplicada</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
              Créditos fiscais e Reforma Tributária <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">sem achismo.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
              Identificamos oportunidades tributárias, saneamos créditos fiscais e estruturamos dossiês técnicos para empresas que precisam atravessar a Reforma Tributária com segurança, caixa e governança.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contato" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all group">
                Solicitar análise inicial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-24 border-y border-white/5 bg-[#0d0d11]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">A Reforma Tributária muda o jogo dos créditos.</h2>
              <p className="text-slate-400 mb-6 text-lg leading-relaxed">
                As regras de transição exigem governança e precisão. O que antes era uma tese contábil, hoje exige análise preditiva de dados e adequação imediata aos novos modelos de IBS e CBS.
              </p>
              <ul className="space-y-4">
                {[
                  "Complexidade na migração de regimes",
                  "Riscos de glosa por inconsistência documental",
                  "Perda de oportunidades na virada do modelo"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <div className="mt-1 bg-red-500/10 p-1 rounded border border-red-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl rounded-full"></div>
              <div className="relative bg-[#13131a] border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Relatório de Oportunidades 26/27
                  </h3>
                  <span className="text-xs font-mono text-slate-500">TAX.ANALYTICS.V2</span>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Análise de Malha Fiscal</span>
                      <span className="text-cyan-400 font-mono">Processando</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-3/4 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Cruzamento SPED/EFD</span>
                      <span className="text-blue-400 font-mono">Concluído</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-full rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Lines of Action */}
      <section id="solucoes" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Linhas de atuação técnica</h2>
            <p className="text-slate-400">Abordagem consultiva com lastro em dados e estrita conformidade legal.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: "Créditos Legados PIS/Cofins",
                desc: "Saneamento e mapeamento de créditos não apropriados na sistemática não cumulativa.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: ShieldCheck,
                title: "Credit Assurance IBS/CBS",
                desc: "Governança fiscal e modelagem de cenários para a transição do novo regime tributário.",
                color: "from-cyan-400 to-cyan-500"
              },
              {
                icon: FileSearch,
                title: "Lei do Bem",
                desc: "Estruturação de dossiês técnicos para fruição de incentivos à inovação tecnológica.",
                color: "from-indigo-500 to-indigo-600"
              },
              {
                icon: Briefcase,
                title: "IRPJ/CSLL",
                desc: "Identificação de oportunidades e adequação na apuração do lucro real e bases de cálculo.",
                color: "from-slate-400 to-slate-500"
              }
            ].map((sol, i) => (
              <div key={i} className="bg-[#111116] border border-white/5 hover:border-white/10 transition-colors rounded-xl p-6 group">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${sol.color} bg-opacity-10 flex items-center justify-center mb-6`}>
                  <sol.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-3">{sol.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section id="metodo" className="py-24 bg-[#0d0d11] border-y border-white/5 relative overflow-hidden">
        {/* Technical Grid */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Método Tax Managers</h2>
            <p className="text-slate-400 max-w-xl">Fluxo estruturado para segurança jurídica, minimizando exposições e assegurando fundamentação em cada etapa.</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: "01", name: "Diagnóstico", desc: "Análise preliminar de viabilidade." },
              { step: "02", name: "Relatório", desc: "Mapeamento de oportunidades identificáveis." },
              { step: "03", name: "Validação", desc: "Aprovação corporativa da empresa." },
              { step: "04", name: "Implementação", desc: "Execução técnica dos aproveitamentos." },
              { step: "05", name: "Dossiê", desc: "Entrega documental e acompanhamento." },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-[#16161d] border border-white/5 rounded-lg p-5 h-full relative z-10">
                  <div className="text-xs font-mono text-cyan-500 mb-4">{item.step}</div>
                  <h3 className="text-white font-medium mb-2">{item.name}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
                {i !== 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-[1px] bg-white/10 z-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commercial Model & CTA */}
      <section id="contato" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            
            {/* Value Prop */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-800/50 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <BarChart3 className="w-3 h-3" />
                <span>Modelo Orientado a Resultado</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Alinhamento de interesses com a sua empresa.
              </h2>
              
              <p className="text-slate-400 mb-8 text-lg">
                Atuamos mediante mapeamento técnico robusto. Sem aventuras jurídicas. Entregamos soluções onde o aproveitamento é sujeito à validação estrita e aprovação da empresa.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  "Governança fiscal priorizada",
                  "Dossiê técnico completo entregue",
                  "Equipe multidisciplinar sênior"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Form */}
            <div className="bg-[#0d0d11] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Solicitar análise inicial</h3>
              <p className="text-slate-400 text-sm mb-8">Nossa equipe de inteligência entrará em contato para agendar uma reunião técnica.</p>
              
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Nome Corporativo</label>
                  <input type="text" className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" placeholder="Nome Completo" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">E-mail Corporativo</label>
                    <input type="email" className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" placeholder="nome@empresa.com.br" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Telefone</label>
                    <input type="tel" className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Empresa / CNPJ</label>
                  <input type="text" className="w-full bg-[#13131a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" placeholder="Razão Social ou CNPJ" />
                </div>
                
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-lg mt-4 transition-colors">
                  Enviar Solicitação
                </button>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Seus dados estão seguros e serão utilizados apenas para contato corporativo.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Network className="w-3 h-3 text-slate-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-400">Tax Managers</span>
          </div>
          
          <div className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} Tax Managers. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
