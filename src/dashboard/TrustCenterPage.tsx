export default function TrustCenterPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 md:p-16">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="text-4xl">🔒</span> Central de Confiança
        </h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-indigo-700 mb-3">O que o ToDeAcordo captura?</h2>
            <p className="text-slate-600 leading-relaxed">
              A extensão lê estritamente o texto das legendas geradas automaticamente pelo Google Meet durante a reunião. Capturamos o texto (transcript) e o associamos a quem o disse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-indigo-700 mb-3">O que NÃO capturamos?</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Não gravamos áudio. Não gravamos vídeo. Não gravamos a sua tela.
            </p>
            <p className="text-slate-600 leading-relaxed mt-2">
              Não utilizamos bots intrusivos que entram na sala como "participantes". O ToDeAcordo roda de forma silenciosa e segura apenas na aba do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-indigo-700 mb-3">Como a IA processa os dados?</h2>
            <p className="text-slate-600 leading-relaxed">
              Ao clicar em "Gerar Entendimento", enviamos o texto coletado para o nosso backend na Vercel, que processa a informação utilizando a API da OpenAI (sem retenção de dados para treinamento). O resultado estruturado é devolvido imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-indigo-700 mb-3">Limitações Jurídicas</h2>
            <p className="text-slate-600 leading-relaxed">
              O ToDeAcordo gera um registro de <strong className="text-slate-900">aceite operacional</strong>. A Rubrica e o Hash SHA-256 garantem integridade visual e lógica, mas não substituem uma assinatura eletrônica qualificada sob a ICP-Brasil ou a formalização de um contrato em casos exigidos por lei.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
