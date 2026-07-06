export default function TemplateSeoPage() {
  const slug = window.location.pathname.split('/').pop();
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0f172a] pt-24 pb-16 px-6 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 capitalize">
          Modelo: {slug?.replace(/-/g, ' ')}
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Pare de perder tempo anotando tudo. Transforme sua {slug?.replace(/-/g, ' ')} em um entendimento claro e validável em segundos.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-bold">Usar este template grátis</a>
        </div>
      </header>
      <section className="py-20 px-6 max-w-4xl mx-auto text-slate-800">
        <h2 className="text-2xl font-bold mb-4">A dor do mal-entendido</h2>
        <p className="mb-6">Quantas vezes você saiu de uma reunião achando que tudo estava claro, mas na semana seguinte a outra pessoa cobrou algo que não estava no escopo?</p>
        
        <h2 className="text-2xl font-bold mb-4 mt-12">O fim da Ata de Reunião</h2>
        <p className="mb-6">Com o ToDeAcordo, você não envia uma ata morta no Word. Você envia um link com Trilha de Auditoria, onde a outra parte clica em "Tô de Acordo".</p>
      </section>
    </div>
  );
}
