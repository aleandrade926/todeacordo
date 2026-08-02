import { copyBank } from '../data/copyBank';

export default function WhatsAppViralKit() {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-green-50 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-green-900 mb-4 text-center">Kit Viral de WhatsApp</h1>
        <p className="text-lg text-green-700 mb-12 text-center">Use as copys abaixo para engajar clientes, enviar entendimentos e convidar parceiros.</p>

        <div className="space-y-6">
          {copyBank.whatsapp.map((msg, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-green-200">
              <p className="text-slate-800 text-lg mb-4 whitespace-pre-wrap">"{msg.replace('[LINK]', 'https://todeacordo.com.br/valida/meet-demo')}"</p>
              <div className="flex gap-4">
                <button onClick={() => handleCopy(msg.replace('[LINK]', 'https://todeacordo.com.br/valida/meet-demo'))} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                  Copiar
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(msg.replace('[LINK]', 'https://todeacordo.com.br/valida/meet-demo'))}`} target="_blank" rel="noreferrer" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm flex items-center gap-2">
                  <span>📱</span> Enviar no WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
