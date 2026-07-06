export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Plano Founder (Beta)</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Os primeiros 100 usuários garantem R$ 29,90/mês vitalício.</p>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Enviado com sucesso!"); }}>
          <input required placeholder="Nome" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm focus:border-indigo-500 outline-none" />
          <input required type="email" placeholder="E-mail" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm focus:border-indigo-500 outline-none" />
          <input required type="tel" placeholder="WhatsApp" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm focus:border-indigo-500 outline-none" />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
            Entrar na Lista
          </button>
        </form>
      </div>
    </div>
  );
}
