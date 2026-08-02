
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [authorName, setAuthorName] = useState('Você');
  const [showWaWidget, setShowWaWidget] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['todeacordo_user_name'], (result: any) => {
        if (result && result.todeacordo_user_name && result.todeacordo_user_name !== 'Meu Perfil') {
          setAuthorName(result.todeacordo_user_name);
        }
      });
    } else {
      const local = localStorage.getItem('todeacordo_user_name');
      if (local && local !== 'Meu Perfil') {
        setAuthorName(local);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2 shrink-0">
           <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm md:text-base">✓</div>
           <span className="font-bold text-lg md:text-xl tracking-tight">ToDeAcordo</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#solucao" className="hover:text-slate-900 transition-colors">Solução</a>
          <a href="#casos" className="hover:text-slate-900 transition-colors">Casos de Uso</a>
          <a href="#planos" className="hover:text-slate-900 transition-colors">Planos</a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <a href="/app" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:block">Entrar</a>
          <a href="/app" className="bg-indigo-600 text-white text-xs md:text-sm font-semibold px-3 py-2 md:px-5 md:py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center whitespace-nowrap">
            <span className="md:hidden">Baixar grátis</span>
            <span className="hidden md:inline">Adicionar ao Chrome — É grátis</span>
          </a>
        </div>
      </nav>

      <main>
        {/* Bloco 1: Headline de inadequação */}
        <section className="pt-24 pb-16 px-6 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Novo padrão para reuniões
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              As pessoas não brigam pelo que foi dito. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Brigam pelo que cada uma entendeu.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Mais do que uma transcrição. O ToDeAcordo transforma conversas em um <strong>pacto de entendimento</strong> invisível e sem burocracia, que a outra pessoa confirma com um clique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <a href="/app" className="bg-indigo-600 text-white text-base font-bold px-8 py-4 rounded-full hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 text-center flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6 0-5.302 4.298-9.6 9.6-9.6 5.302 0 9.6 4.298 9.6 9.6 0 5.302-4.298 9.6-9.6 9.6zm0-15.6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"/>
                </svg>
                Instalar Extensão — É Grátis
              </a>
              <a href="#exemplo" className="bg-white text-slate-700 border border-slate-200 text-base font-bold px-8 py-4 rounded-full hover:bg-slate-50 transition-all shadow-sm text-center">
                Colar conversa agora
              </a>
            </div>
            <p className="text-sm text-slate-500 font-medium ml-2 flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-amber-400 text-lg">★★★★★</span> Não exige cartão de crédito
            </p>
          </div>
          
          <div className="relative">
            {/* Mockup CSS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden relative z-10 transform lg:translate-x-4">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
                <div className="mx-auto bg-white border border-slate-200 rounded-md px-4 py-1 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <span className="opacity-50">🔒</span> todeacordo.com.br/valida/xyz
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Combinado do Projeto</h3>
                  <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-1 rounded">Aguardando aceite</span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs shrink-0 mt-0.5 border border-indigo-100">✓</div>
                    <p className="text-sm text-slate-600 leading-snug">O João vai fazer a edição do vídeo e entregar até terça-feira.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs shrink-0 mt-0.5 border border-indigo-100">✓</div>
                    <p className="text-sm text-slate-600 leading-snug">A Maria ficou de mandar as imagens de apoio até segunda de manhã.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm shadow">Tô de acordo</button>
                  <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-sm shadow-sm">Tenho ressalvas</button>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-full blur-3xl -z-10"></div>
          </div>
        </section>

        {/* Bloco 2: Identificação da dor */}
        <section className="py-24 bg-white border-y border-slate-100 text-center px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 tracking-tight">Todo mundo já viveu isso.</h2>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {['"Achei que estava incluído."', '"Mas eu entendi diferente."', '"Você nunca falou isso."', '"Não foi esse o combinado."', '"Depois a gente resolve."'].map((frase, i) => (
                <div key={frase} className={`bg-slate-50 border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-medium text-lg transition-transform hover:scale-105 shadow-sm ${i % 2 === 0 ? 'rotate-1 hover:rotate-0' : '-rotate-1 hover:rotate-0'}`}>
                  {frase}
                </div>
              ))}
            </div>
            <p className="text-xl md:text-2xl text-slate-800 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              O problema não é a conversa.<br/>
              <span className="text-indigo-600 font-bold mt-2 inline-block">É cada um sair dela com uma versão diferente.</span>
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left mt-8">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <div className="text-red-500 font-bold mb-2 flex items-center gap-2"><span className="text-xl">⏱️</span> Perda de Tempo</div>
                <p className="text-slate-700 text-sm leading-relaxed">Horas gastas tentando lembrar quem ficou de fazer o quê e buscando mensagens antigas.</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <div className="text-amber-600 font-bold mb-2 flex items-center gap-2"><span className="text-xl">🤝</span> Desgaste na Relação</div>
                <p className="text-slate-700 text-sm leading-relaxed">O clima pesa. A outra pessoa jura que você prometeu algo que você tem certeza que não prometeu.</p>
              </div>
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <div className="text-slate-600 font-bold mb-2 flex items-center gap-2"><span className="text-xl">🔋</span> Dreno de Energia</div>
                <p className="text-slate-700 text-sm leading-relaxed">O estresse silencioso de depender da memória e ficar com a sensação de que algo ficou para trás.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 3: Inimigo comum */}
        <section className="py-24 bg-slate-900 text-white text-center px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 -z-10"></div>
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
              O inimigo não é falta de anotação.<br/>É falta de confirmação.
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-light">
              Transcrição ajuda a lembrar. Resumo ajuda a organizar.<br/>
              <strong className="text-white font-medium mt-2 inline-block bg-white/10 px-4 py-1 rounded-lg">Mas só a confirmação mostra que os dois entenderam a mesma coisa.</strong>
            </p>
          </div>
        </section>

        {/* Bloco 4: Antes e depois */}
        <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">A diferença aparece quando surge a dúvida.</h2>
            
            <div className="space-y-6">
              {/* Card 1 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Antes</span>
                  <div className="text-slate-600 italic text-lg font-medium ml-2">"Mas eu achei que..."</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-green-200 shadow-md flex flex-col justify-center relative bg-gradient-to-r from-green-50 to-white">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 ml-2">Com ToDeAcordo</span>
                  <div className="text-slate-900 font-bold flex items-center gap-2 ml-2">
                    <span className="text-green-600">✔</span> Confirmado em 04/07 às 15:42.
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Antes</span>
                  <div className="text-slate-600 italic text-lg font-medium ml-2">"Não foi isso que combinamos."</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-md flex flex-col justify-center relative bg-gradient-to-r from-amber-50 to-white">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 ml-2">Com ToDeAcordo</span>
                  <div className="text-slate-900 font-bold flex items-center gap-2 ml-2">
                    <span className="text-amber-500">⚠</span> João adicionou uma ressalva.
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Antes</span>
                  <div className="text-slate-600 italic text-lg font-medium ml-2">"Eu tinha entendido outra coisa."</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md flex flex-col justify-center relative bg-gradient-to-r from-indigo-50 to-white">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 rounded-l-2xl"></div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 ml-2">Com ToDeAcordo</span>
                  <div className="text-slate-900 font-bold flex items-center gap-2 ml-2">
                    <span className="text-indigo-600">✔</span> Ambas as partes confirmaram o entendimento.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 5: Mecanismo único */}
        <section id="solucao" className="py-24 bg-white px-6 border-t border-slate-100">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Enquanto outros aplicativos apenas "anotam", o ToDeAcordo amarra a conversa e fecha o combinado.
            </h2>
            <p className="text-lg text-slate-500 mb-16 max-w-2xl mx-auto">
              O passo a passo simples para não deixar nada no ar.
            </p>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 relative max-w-4xl mx-auto">
              {/* Fluxo */}
              {[
                { step: '1', title: 'Conversa', desc: 'No Meet ou Zoom', icon: '🗣️' },
                { step: '2', title: 'IA Organiza', desc: 'Extrai o que importa', icon: '🤖' },
                { step: '3', title: 'Você Revisa', desc: 'Ajusta os detalhes', icon: '👀' },
                { step: '4', title: 'Envia Link', desc: 'Via WhatsApp/Email', icon: '🔗' },
                { step: '5', title: 'Confirmação', desc: 'Aceite ou ressalva', icon: '🤝' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center relative z-10 w-full md:w-auto flex-1">
                  <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4 group hover:border-indigo-500 hover:shadow-md transition-all">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
              {/* Linha conectora desktop */}
              <div className="hidden md:block absolute top-8 left-16 right-16 h-0.5 bg-slate-100 -z-10"></div>
            </div>
          </div>
        </section>

        {/* Bloco 6: Demonstração visual */}
        <section id="exemplo" className="py-24 bg-slate-50 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Você saiu da reunião achando que estava tudo certo. A outra pessoa também?</h2>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[10px]">✓</div>
                <span className="font-bold text-slate-800 text-sm">ToDeAcordo</span>
              </div>
              <span className="text-xs text-slate-500 font-bold px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm uppercase tracking-wider">Simulação</span>
            </div>
            
            <div className="p-6 md:p-12">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Reunião de Escopo: Projeto Alfa</h3>
              <p className="text-sm text-slate-500 mb-10">Gerado hoje • Por {authorName}</p>
              
              <div className="space-y-8 mb-10">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumo da Conversa</h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    Definimos os passos para a próxima sprint. O foco será entregar a infraestrutura em nuvem antes de avançar para as integrações front-end.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Combinados Firmados
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <div className="text-indigo-600 font-bold mt-0.5">1.</div>
                      <span className="text-slate-700">A equipe fará o setup do banco até sexta-feira (18/08).</span>
                    </li>
                    <li className="flex gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <div className="text-indigo-600 font-bold mt-0.5">2.</div>
                      <span className="text-slate-700">A Maria ficou de comprar as passagens antes de quarta-feira.</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Pendências e Alertas
                  </h4>
                  <div className="bg-amber-50 text-amber-900 p-5 rounded-2xl border border-amber-100 font-medium text-sm">
                    ⚠️ Ficou de fora o escopo de migração de dados antigos (será orçado em fase 2).
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                <a href="/demo" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2 text-lg">
                  <span>👍</span> Tô de acordo
                </a>
                <a href="/demo" className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-lg">
                  <span>✍️</span> Tenho ressalvas
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 6.5: Loop Viral (Como funciona a validação) */}
        <section className="py-24 bg-indigo-600 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-700 text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-6 shadow-inner">
                Simples e Mágico
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
                Sem atrito.<br/>Você envia o link, eles só precisam clicar.
              </h2>
              <p className="text-lg text-indigo-100 mb-6 leading-relaxed">
                Ninguém gosta de burocracia. Por isso, a outra pessoa <strong className="text-white">não precisa criar conta</strong>, instalar aplicativo ou fazer login. 
                Ela simplesmente recebe um link super leve que abre direto no celular. Em 30 segundos ela lê e clica em "Tô de acordo". E pronto! O combinado está amarrado para sempre.
              </p>
              <p className="text-lg text-indigo-200 font-medium leading-relaxed">
                A experiência é tão simples e profissional que quem recebe vai querer usar em todas as próprias conversas.
              </p>
            </div>
            <div className="bg-white/10 p-3 md:p-6 rounded-3xl border border-white/20 backdrop-blur-md shadow-2xl transform lg:rotate-2">
              <div className="bg-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl shadow-inner border border-indigo-100">📱</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Link Público Recebido</h4>
                    <p className="text-xs text-slate-500 font-medium">todeacordo.com.br/valida/a8b9</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs shadow-sm font-bold">1</span> 
                    Abre direto no WhatsApp ou E-mail
                  </div>
                  <div className="flex items-center gap-4 text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs shadow-sm font-bold">2</span> 
                    Lê o checklist em 30 segundos
                  </div>
                  <div className="flex items-center gap-4 text-slate-900 font-bold bg-green-50 border border-green-200 p-4 rounded-xl">
                    <span className="w-6 h-6 rounded bg-green-600 text-white flex items-center justify-center text-xs shadow-sm font-bold">✓</span> 
                    Valida com 1 clique (sem login)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 7: Casos reais de uso */}
        <section id="casos" className="py-24 bg-white px-6 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">Serve para qualquer conversa em que uma dúvida pode custar caro.</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { target: 'Reuniões de Equipe', sit: 'Definição de próximos passos.', risk: 'Ninguém sabe quem é o responsável pela tarefa.', solve: 'Deixa claro os responsáveis e prazos.' },
                { target: 'Alinhamento com Sócios', sit: 'Decisões importantes.', risk: '"Eu nunca concordei com isso".', solve: 'Registra o que foi decidido de forma inquestionável.' },
                { target: 'Projetos', sit: 'Mudança de rota.', risk: 'Refazer trabalho por falta de clareza.', solve: 'Valida a nova direção antes de começar.' },
                { target: 'Parcerias', sit: 'Combinados rápidos.', risk: 'Achar que o outro ia resolver.', solve: 'Amarra os combinados para os dois lados.' },
                { target: 'Obra / Reforma', sit: 'Mudança no combinado.', risk: 'Cobranças inesperadas no final.', solve: 'Cada mudança fica documentada e validada.' },
                { target: 'Negociações', sit: 'Acordos verbais.', risk: '"Eu entendi que era para mês que vem".', solve: 'Crava as condições sem ambiguidades.' },
              ].map(card => (
                <a href="/demo" key={card.target} className="block bg-slate-50 border border-slate-200 p-8 rounded-3xl hover:border-indigo-300 hover:shadow-md transition-all group">
                  <h3 className="font-bold text-slate-900 text-xl mb-6 group-hover:text-indigo-600 transition-colors">{card.target}</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-black tracking-widest mb-1">Situação</span>
                      <span className="text-slate-700 font-medium text-sm">{card.sit}</span>
                    </div>
                    <div>
                      <span className="text-red-400 block text-[10px] uppercase font-black tracking-widest mb-1">Risco</span>
                      <span className="text-slate-700 text-sm">{card.risk}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <span className="text-indigo-600 block text-[10px] uppercase font-black tracking-widest mb-1">Solução ToDeAcordo</span>
                      <span className="text-slate-900 font-bold text-sm">{card.solve}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 8: Prova lógica */}
        <section className="py-24 bg-indigo-50 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white border border-indigo-100 text-4xl flex items-center justify-center rounded-3xl mx-auto mb-8 shadow-sm">🧠</div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 tracking-tight">Por que isso funciona?</h2>
            <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-medium">
              "Quando a outra pessoa confirma o entendimento, você deixa de depender de memória, de um print perdido de WhatsApp ou de interpretações posteriores. <strong className="text-indigo-700 bg-indigo-100/50 px-2 rounded">Um '👍' no lugar certo evita semanas de desgaste.</strong>"
            </p>
          </div>
        </section>

        {/* Bloco 9: Comparação */}
        <section className="py-24 bg-white px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">Não é só transcrição. Não é só resumo.</h2>
            
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="flex-1 p-8 md:border-r border-slate-200 border-b md:border-b-0">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4 text-center">Transcrição</h3>
                <p className="text-slate-600 text-center text-sm">Guarda exatamente as palavras ditas. Fica longo, desorganizado e chato de ler depois.</p>
              </div>
              <div className="flex-1 p-8 md:border-r border-slate-200 border-b md:border-b-0 bg-slate-50">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4 text-center">Resumo de IA</h3>
                <p className="text-slate-600 text-center text-sm">Organiza as ideias para você mesmo ler depois. É unilateral e não sela compromisso.</p>
              </div>
              <div className="flex-1 p-8 bg-indigo-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">✓</div>
                <h3 className="font-bold text-indigo-700 uppercase tracking-widest text-xs mb-4 text-center">ToDeAcordo</h3>
                <p className="text-indigo-900 font-bold text-center text-base">Confirma o entendimento entre as partes com validade prática imediata.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 10: Segurança e privacidade */}
        <section className="py-24 bg-slate-900 text-white px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full max-w-2xl h-full bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 -z-10"></div>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center z-10 relative">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-10 tracking-tight text-white">Simples, revisável e sem gravar áudio.</h2>
              <ul className="space-y-8">
                <li className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold border border-indigo-500/30">1</div>
                  <p className="text-slate-300 text-lg leading-relaxed"><strong className="text-white">Você revisa antes de enviar:</strong> A IA cria um rascunho. Você tem controle total para editar antes que a outra pessoa veja.</p>
                </li>
                <li className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold border border-indigo-500/30">2</div>
                  <p className="text-slate-300 text-lg leading-relaxed"><strong className="text-white">A outra parte pode discordar:</strong> O fluxo não é uma imposição. Se a pessoa achar que faltou algo, ela aponta a ressalva na hora.</p>
                </li>
                <li className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold border border-indigo-500/30">3</div>
                  <p className="text-slate-300 text-lg leading-relaxed"><strong className="text-white">Focado no Entendimento:</strong> Não substitui um contrato formal com advogados. Serve para alinhar o trabalho do dia a dia.</p>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-800 rounded-3xl p-8 lg:p-10 border border-slate-700 shadow-2xl relative">
              <div className="flex flex-col gap-6 relative z-10">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700">🎤</div>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">Privacidade Total</h4>
                    <p className="text-sm text-slate-400">Processamos apenas o texto. Nenhum áudio da sua reunião é salvo.</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700">✏️</div>
                  <div>
                    <h4 className="font-bold text-white text-base mb-1">Edição Livre</h4>
                    <p className="text-sm text-slate-400">Só o que você aprova e envia vira um acordo final e oficial.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blocos 11 e 12: Ofertas */}
        <section id="planos" className="py-24 bg-slate-50 px-6 border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">Escolha o plano ideal para as suas reuniões.</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free */}
              <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Comece sem compromisso</h3>
                <p className="text-slate-500 mb-8 min-h-[48px]">Perfeito para testar o fluxo em algumas conversas cruciais.</p>
                <div className="text-5xl font-black text-slate-900 mb-10">Grátis</div>
                
                <ul className="space-y-5 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px]">✓</span> Teste inicial prático</li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px]">✓</span> Alguns entendimentos por mês</li>
                  <li className="flex items-center gap-3 text-slate-700 font-medium"><span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px]">✓</span> Link básico de confirmação</li>
                </ul>
                
                <a href="/app" className="block w-full bg-slate-100 text-slate-800 text-center font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">Começar grátis</a>
              </div>

              {/* Pro */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl flex flex-col relative transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                  Mais Popular
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Para quem vive de combinados</h3>
                <p className="text-slate-400 mb-8 min-h-[48px]">Para pessoas e equipes que querem acabar com a confusão após as reuniões.</p>
                <div className="flex items-end gap-1 mb-10">
                  <span className="text-5xl font-black text-white">R$ 29,90</span>
                  <span className="text-slate-400 mb-2 font-medium">/mês</span>
                </div>
                
                <ul className="space-y-5 mb-10 flex-1">
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">✓</span> Entendimentos ilimitados</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">✓</span> Histórico completo na nuvem</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">✓</span> Gestão de links e ressalvas</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">✓</span> Exportação em PDF (em breve)</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">✓</span> Prioridade nas features do Beta</li>
                </ul>
                
                <a href="/app" className="block w-full bg-indigo-600 text-white text-center font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">Assinar Plano Pro</a>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco 13: FAQ - Quebra de objeções */}
        <section id="faq" className="py-24 bg-white px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16 tracking-tight">Perguntas Frequentes</h2>
            
            <div className="space-y-4">
              {[
                { q: 'A outra pessoa precisa instalar ou criar conta?', a: 'Não. O link de confirmação abre em qualquer navegador ou celular. A pessoa lê o acordo, clica em "Tô de acordo" ou aponta ressalvas, sem precisar fazer login.' },
                { q: 'Isso substitui um contrato?', a: 'Não. O ToDeAcordo serve para alinhar o dia a dia (ex: tarefas de uma sprint, ajustes de uma obra, combinados de uma reunião comercial). Ele evita ruídos operacionais, mas não substitui validade jurídica de um contrato formal.' },
                { q: 'Posso editar antes de enviar o link?', a: 'Sim! A IA faz o rascunho pesado, mas a tela do Dashboard permite que você edite, exclua ou adicione pontos cruciais antes de gerar o link final para a outra pessoa.' },
                { q: 'Funciona sem Google Meet?', a: 'Sim. Você pode colar o áudio transcrito ou as anotações brutas de qualquer outra fonte no nosso painel, e a IA organizará da mesma forma.' },
                { q: 'O ToDeAcordo grava áudio?', a: 'Não salvamos nenhum áudio nos servidores. Nossa extensão processa apenas o texto gerado na reunião para estruturar o acordo, garantindo a sua privacidade e dos participantes.' },
                { q: 'E se a pessoa discordar do que está escrito?', a: 'Ela clica em "Tenho ressalvas". Isso bloqueia a validação e permite que ela escreva o motivo (ex: "Não foi dia 15, foi dia 20"). O entendimento volta para você ajustar. Muito melhor descobrir isso na hora do que 1 mês depois.' },
                { q: 'Qual a diferença para outras ferramentas de transcrição?', a: 'Embora o ToDeAcordo possa ser usado como uma simples ferramenta de transcrição (com o menor preço e os maiores limites do mercado), ele vai muito além disso. Enquanto ferramentas de IA padrão geram longas atas que morrem no e-mail, nós geramos um checklist direto focado em validação bilateral com assinatura informal.' }
              ].map((faq, i) => (
                <details key={i} className="group bg-slate-50 border border-slate-200 rounded-2xl open:bg-white open:border-indigo-200 transition-all">
                  <summary className="font-bold text-slate-800 p-6 cursor-pointer list-none flex justify-between items-center text-lg">
                    {faq.q}
                    <span className="text-indigo-600 group-open:rotate-180 transition-transform flex-shrink-0 ml-4">▼</span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 14: CTA Emocional */}
        <section className="py-32 bg-indigo-600 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-10 tracking-tight leading-tight">
              Antes que cada um lembre de um jeito,<br/>gere um ToDeAcordo.
            </h2>
            <a href="/app" className="inline-block bg-white text-indigo-700 text-lg font-bold px-10 py-5 rounded-full hover:bg-slate-50 hover:scale-105 transition-all shadow-xl">
              Começar grátis agora
            </a>
          </div>
        </section>

      </main>

      {/* Bloco 15: Rodapé robusto */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">✓</div>
              <span className="font-bold text-white text-lg tracking-tight">ToDeAcordo</span>
            </div>
            <p className="text-sm leading-relaxed">Garantindo que todos saiam da conversa entendendo a mesma coisa.</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Produto</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Extensão Chrome</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integração Meet</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gestor de Acordos</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos e Preços</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Casos de Uso</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#casos" className="hover:text-white transition-colors">Para Equipes</a></li>
              <li><a href="#casos" className="hover:text-white transition-colors">Para Sócios</a></li>
              <li><a href="#casos" className="hover:text-white transition-colors">Para Projetos</a></li>
              <li><a href="#casos" className="hover:text-white transition-colors">Para Negócios</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Privacidade</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Segurança (Trust Center)</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium">© {new Date().getFullYear()} ToDeAcordo. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors text-lg">𝕏</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors font-bold text-lg">in</a>
          </div>
        </div>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {showWaWidget && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl mb-4 w-72 animate-fadeIn relative text-left">
            <button 
              onClick={() => setShowWaWidget(false)}
              className="absolute top-3 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  💬
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suporte</h4>
                <p className="text-sm font-bold text-slate-800">ToDeAcordo</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Fale diretamente com nossa equipe:<br />
              <strong className="text-slate-800 text-sm font-bold mt-1 block select-all font-mono">(11) 97867-1067</strong>
            </p>
            <a 
              href="https://wa.me/5511978671067?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20ToDeAcordo."
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-green-500 hover:bg-green-600 text-white text-xs font-bold text-center py-3 rounded-xl transition-all shadow-md hover:shadow-green-100"
            >
              Iniciar no WhatsApp
            </a>
          </div>
        )}
        
        <button
          onClick={() => setShowWaWidget(!showWaWidget)}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-green-100 flex items-center justify-center transition-all duration-300 transform hover:scale-105 relative cursor-pointer group"
          title="Fale conosco no WhatsApp"
        >
          {/* Pulsing indicator */}
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-30 group-hover:animate-ping"></span>
          
          {/* WhatsApp SVG icon */}
          <svg className="w-7 h-7 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.56 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
