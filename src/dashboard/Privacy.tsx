

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-10 text-center text-white border-b border-slate-800">
          <div className="mx-auto bg-gradient-to-tr from-amber-400 to-amber-200 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
          <p className="mt-2 text-slate-400 font-medium">ToDeAcordo</p>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10 space-y-6 leading-relaxed text-slate-600">
          <p className="text-lg font-medium text-slate-900">
            O ToDeAcordo é uma extensão e aplicação destinada a ajudar usuários a registrar e organizar reuniões realizadas no Google Meet.
          </p>

          <hr className="border-slate-100" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Captura e Coleta de Dados
            </h2>
            <p>
              A extensão pode capturar conteúdo disponível ao usuário durante a reunião, como legendas, transcrições, nomes de participantes e informações exibidas na aba do Google Meet, quando o próprio usuário inicia o uso da extensão.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Finalidade do Uso dos Dados
            </h2>
            <p>
              Esses dados são utilizados exclusivamente para gerar resumos, combinados, decisões, obrigações, próximos passos e links de validação relacionados à reunião.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Compromisso de Não Comercialização e Não Rastreamento
            </h2>
            <p>
              O ToDeAcordo não vende dados pessoais, não utiliza os dados para publicidade comportamental e não rastreia a navegação do usuário fora da finalidade de funcionamento da extensão.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Compartilhamento e Processamento
            </h2>
            <p>
              Os dados podem ser enviados aos servidores do ToDeAcordo ou a provedores de processamento de inteligência artificial somente para executar as funcionalidades solicitadas pelo usuário.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Boas Práticas de Uso
            </h2>
            <p>
              O usuário deve evitar inserir informações sensíveis que não sejam necessárias para o registro da reunião.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Armazenamento
            </h2>
            <p>
              Podemos armazenar dados temporários ou registros necessários para funcionamento, continuidade da captura, geração dos resultados e melhoria operacional do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
              Contato e Direitos do Usuário
            </h2>
            <p>
              O usuário pode solicitar informações, correções ou exclusão de dados entrando em contato pelo e-mail:{' '}
              <a href="mailto:suporte@andradeflorio.com.br" className="text-indigo-600 hover:text-indigo-800 font-semibold underline">
                suporte@andradeflorio.com.br
              </a>
            </p>
          </section>

          <hr className="border-slate-100" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2">
            <p>Esta política poderá ser atualizada conforme evolução do produto.</p>
            <p className="font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded">Última atualização: 06/07/2026</p>
          </div>
        </div>

        {/* Footer Link back */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-center">
          <a href="index.html" className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors">
            ← Voltar para Início
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
