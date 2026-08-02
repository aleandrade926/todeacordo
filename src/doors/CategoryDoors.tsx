import { useState } from 'react';
import { trackGrowthEvent } from '../growth/growthLogger';

export const ProtocolDoor = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-900 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl">🌐</div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Open Consensus Schema</h1>
          <p className="text-indigo-200 text-lg">
            O ToDeAcordo não é apenas um app. É uma nova camada da internet de trabalho. <br/>
            Conversas viram compromissos estruturados e verificáveis.
          </p>
        </div>
        <div className="p-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">A Estrutura Padrão (.todeacordo.json)</h2>
            <p className="text-slate-600 mb-6">
              Todo entendimento gerado na nossa plataforma é exportável em um formato universal portátil, abrindo portas para integração profunda com ERPs, CRMs, e sistemas de Governança corporativa (Legaltech & Govtech).
            </p>
            <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm text-green-400 overflow-x-auto shadow-inner">
              <pre>{`{
  "version": "1.0",
  "id": "cns_9823749823",
  "parties": ["joao@agencia.com", "maria@cliente.com"],
  "commitments": [
    { "type": "obligation", "owner": "joao", "deadline": "2024-12-01", "text": "Entregar layout v1" }
  ],
  "cryptographic_hash": "a8f5f167f44f4964e6c998dee827110c..."
}`}</pre>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-8">
            <button 
              onClick={() => {
                alert('Iniciando ambiente de desenvolvimento de API...');
                trackGrowthEvent('paywall_viewed', { feature: 'Protocol API' });
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl text-center transition-transform active:scale-95 shadow-md"
            >
              Acessar API Documentation
            </button>
            <a href="/" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl text-center transition-colors">
              Voltar ao Início
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AutopsyDoor = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-12 text-center border-b border-slate-700">
          <div className="text-5xl mb-4">🩻</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Autópsia da Reunião</h1>
          <p className="text-slate-400">Cole as anotações de um projeto que deu errado. Nós te diremos exatamente em qual frase o acordo morreu.</p>
        </div>
        <div className="p-10">
          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full h-40 bg-slate-900 border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none mb-6"
            placeholder="Ex: Combinamos que a entrega seria mais ou menos na sexta-feira, dependendo do time de design. O João ficou de ver isso depois..."
          ></textarea>
          
          <button 
            onClick={() => {
              setAnalyzing(true);
              setTimeout(() => setAnalyzing(false), 2000);
              trackGrowthEvent('validation_cta_clicked', { feature: 'Autopsy' });
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] active:scale-95"
          >
            {analyzing ? 'Analisando Causa da Morte...' : 'Iniciar Autópsia'}
          </button>

          {!analyzing && text.length > 30 && (
            <div className="mt-8 bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-red-200 animate-fadeIn">
              <h3 className="font-bold text-red-400 mb-2">Causa Mortis Detectada:</h3>
              <p className="mb-4 text-sm">"mais ou menos na sexta-feira, dependendo do time"</p>
              <ul className="list-disc ml-5 text-sm space-y-2 opacity-80">
                <li>O prazo é condicional e vago ("mais ou menos", "dependendo").</li>
                <li>O responsável ("João ficou de ver") não tem compromisso de entrega, apenas de investigação.</li>
              </ul>
              <div className="mt-6 border-t border-red-800/50 pt-4">
                <a href="/" className="text-red-400 hover:text-white font-bold text-sm underline">
                  Como o ToDeAcordo evitaria isso ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DoctorDoor = () => {
  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-teal-100 p-12 text-center">
        <div className="text-6xl mb-6">🩺</div>
        <h1 className="text-3xl font-extrabold text-teal-900 mb-4">Meeting Doctor (Linter)</h1>
        <p className="text-teal-700 mb-8 max-w-md mx-auto">
          Como um corretor ortográfico, mas para compromissos. O nosso **Consensus Linter** detecta escopo aberto, prazos vagos e pendências órfãs em tempo real.
        </p>
        <div className="bg-teal-900 p-6 rounded-xl text-left text-teal-100 font-mono text-sm mb-8 shadow-inner relative">
          <p>Combinado: Entregar layout <span className="text-red-400 border-b border-red-400">semana que vem</span>.</p>
          <div className="absolute top-1/2 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            Linter Error: Prazo Vago
          </div>
        </div>
        <a href="/waitlist" className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform active:scale-95">
          Entrar na Lista de Espera da API
        </a>
      </div>
    </div>
  );
};

export const BenchmarkDoor = () => {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 text-white">
        <div className="p-12 text-center border-b border-slate-700">
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Índice Nacional de Clareza de Reuniões
          </h1>
          <p className="text-slate-400 text-lg">
            Analisamos dados agregados e anonimizados de milhares de reuniões no Brasil.
          </p>
        </div>
        <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
            <div className="text-4xl font-black text-red-400 mb-2">68%</div>
            <p className="text-slate-300 text-sm font-medium uppercase tracking-wider">Acordam sem Prazo Fixo</p>
          </div>
          <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
            <div className="text-4xl font-black text-amber-400 mb-2">42%</div>
            <p className="text-slate-300 text-sm font-medium uppercase tracking-wider">Escopo Condicional</p>
          </div>
          <div className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600">
            <div className="text-4xl font-black text-indigo-400 mb-2">89%</div>
            <p className="text-slate-300 text-sm font-medium uppercase tracking-wider">Geram Mal-entendidos</p>
          </div>
        </div>
        <div className="p-12 bg-slate-900/50 text-center">
          <h3 className="text-xl font-bold mb-4">Descubra onde você se encaixa</h3>
          <a href="/analisar" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            Calcular Meu Índice Pessoal
          </a>
        </div>
      </div>
    </div>
  );
};

export const IntelligenceDoor = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Moat de Dados (Admin Intelligence)</h1>
        <p className="text-slate-500 mb-8">Painel interno rastreando a Taxonomia de Ambiguidade global da plataforma.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Risco Mais Comum</h4>
            <div className="text-xl font-black text-slate-800">Prazo_Vago (42%)</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Persona + Confusa</h4>
            <div className="text-xl font-black text-slate-800">Agências de Mkt</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ressalvas/Mês</h4>
            <div className="text-xl font-black text-slate-800">1.402</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm bg-indigo-600 text-white">
            <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Valor Protegido</h4>
            <div className="text-xl font-black">R$ 14.5M (Est.)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConsultantKitDoor = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-12 text-center text-white">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">Profissionais de Elite</span>
          <h1 className="text-3xl font-extrabold mb-4">O Kit do Consultor Blindado</h1>
          <p className="text-indigo-200">Distribuição por Identidade: Mostre ao cliente que reuniões com você são diferentes.</p>
        </div>
        <div className="p-8 grid gap-6">
          <div className="border border-slate-200 rounded-xl p-6 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Badge de Confiança</h3>
              <p className="text-sm text-slate-500">Para sua bio do LinkedIn e propostas comerciais.</p>
            </div>
            <button className="bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded">Baixar Selo</button>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-6 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Rodapé de Proposta (Legal Design)</h3>
              <p className="text-sm text-slate-500 text-mono">"Reuniões de alinhamento deste projeto serão registradas com ToDeAcordo."</p>
            </div>
            <button className="bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded">Copiar</button>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Assinatura de Calendar</h3>
              <p className="text-sm text-slate-500">Gere um link automático para suas descrições no Google Calendar.</p>
            </div>
            <a href="/assinatura-email" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">Gerar Assinatura</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmailSignatureDoor = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans flex justify-center items-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Assinatura Dinâmica</h1>
        <p className="text-slate-500 mb-6 text-sm">Cole isso no rodapé dos seus e-mails ou convites do Calendar para construir autoridade.</p>
        
        <div className="bg-slate-100 p-6 rounded-lg mb-6 border border-slate-200 text-left">
          <p className="text-slate-800 font-medium text-sm">Atenciosamente,</p>
          <p className="text-slate-800 font-bold text-sm mb-4">Seu Nome</p>
          <div className="border-t border-slate-300 pt-3 flex items-center gap-2">
            <span className="text-indigo-600 text-lg">🛡️</span>
            <span className="text-xs text-slate-500 font-medium">Reuniões comigo terminam com <b>ToDeAcordo</b>.</span>
          </div>
        </div>
        
        <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          Copiar HTML para Gmail
        </button>
      </div>
    </div>
  );
};
