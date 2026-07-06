import React from "react";
import { ArrowLeft, ShieldCheck, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function TaxManagersPrivacy() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-50">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-icon.png" 
              className="h-10 w-10 object-contain rounded-lg" 
              alt="Tax Managers Logo" 
            />
            <span className="text-xl font-bold tracking-tight text-white">Tax Managers</span>
          </div>
          <div>
            <Link href="/taxmanagers" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Início
            </Link>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0c] to-[#0a0a0c]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Segurança & Conformidade LGPD</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4 font-sans">
            Política de Privacidade
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Esta política descreve como a Tax Managers coleta, utiliza e protege suas informações ao interagir com nosso site corporativo.
          </p>
          <div className="mt-6 text-sm text-slate-500 font-mono">
            Última atualização: 1 de Julho de 2026
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#0d0d11] border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl space-y-10 leading-relaxed text-slate-350">
            
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                1. Compromisso com a Privacidade
              </h2>
              <p className="mb-4">
                A <strong className="text-white">Tax Managers</strong> valoriza a sua privacidade e se compromete a proteger os dados pessoais de seus clientes, parceiros e visitantes. Esta Política de Privacidade explica de forma transparente como tratamos as informações coletadas por meio de nossa página e canais de contato, em estrita conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados Pessoais (LGPD) - Lei nº 13.709/2018</strong>.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                2. Informações que Coletamos
              </h2>
              <p className="mb-4">
                Coletamos apenas as informações estritamente necessárias para viabilizar o contato comercial de inteligência fiscal. Ao preencher o formulário "Solicitar análise inicial" em nosso site, coletamos:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4 text-slate-300">
                <li><strong className="text-white">Nome Corporativo:</strong> Para sabermos com quem estamos nos comunicando.</li>
                <li><strong className="text-white">E-mail Corporativo:</strong> O canal principal para o envio de propostas e comunicações de negócios.</li>
                <li><strong className="text-white">Telefone:</strong> Para contatos rápidos ou agendamento de reuniões técnicas.</li>
                <li><strong className="text-white">Empresa / CNPJ:</strong> Para realizarmos uma pré-análise básica sobre o perfil fiscal e tributário da sua empresa.</li>
              </ul>
              <p>
                Não coletamos intencionalmente dados pessoais sensíveis, conforme definidos pela LGPD, tais como convicção religiosa, dados de saúde, ou opiniões políticas.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                3. Finalidade e Base Legal do Tratamento
              </h2>
              <p className="mb-4">
                Tratamos os dados coletados com finalidades legítimas e baseadas nas seguintes hipóteses legais da LGPD:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li><strong className="text-white">Procedimentos Pré-Contratuais:</strong> Entrar em contato após o seu pedido de análise inicial, permitindo a elaboração de estudos de viabilidade fiscal e agendamento de reuniões (Art. 7º, V, da LGPD).</li>
                <li><strong className="text-white">Consentimento:</strong> Ao preencher voluntariamente o nosso formulário e clicar em enviar, você nos dá consentimento claro para processar seus dados de contato comerciais para este fim específico (Art. 7º, I, da LGPD).</li>
                <li><strong className="text-white">Legítimo Interesse:</strong> Para melhorar nossos serviços, entender a demanda do mercado e otimizar a experiência do site (Art. 7º, IX, da LGPD).</li>
              </ul>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                4. Compartilhamento e Armazenamento dos Dados
              </h2>
              <p className="mb-4">
                A Tax Managers <strong className="text-white">não vende, não aluga e não compartilha</strong> seus dados de contato corporativos com terceiros para fins de marketing ou atividades comerciais não autorizadas.
              </p>
              <p className="mb-4">
                Seus dados serão armazenados de forma segura em nossos servidores hospedados em nuvem com criptografia de ponta e controle de acesso rígido. Mantemos os dados apenas pelo período necessário para cumprir as finalidades comerciais descritas ou conforme exigido por obrigações legais ou regulatórias.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                5. Seus Direitos sob a LGPD
              </h2>
              <p className="mb-4">
                Como titular dos dados pessoais, você possui os seguintes direitos assegurados pelo Artigo 18 da LGPD, que podem ser exercidos a qualquer momento:
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                {[
                  "Confirmação da existência de tratamento dos seus dados",
                  "Acesso facilitado aos seus dados pessoais armazenados",
                  "Correção de dados incompletos, inexatos ou desatualizados",
                  "Eliminação ou anonimização de dados desnecessários ou tratados com consentimento",
                  "Revogação do consentimento previamente concedido",
                  "Portabilidade dos dados a outro fornecedor de serviço"
                ].map((direito, index) => (
                  <div key={index} className="flex gap-2.5 items-start p-3 bg-white/5 border border-white/5 rounded-lg text-sm text-slate-350">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{direito}</span>
                  </div>
                ))}
              </div>
              <p>
                Para exercer qualquer um de seus direitos, basta entrar em contato com o nosso time de privacidade através do e-mail comercial indicado na seção 7.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                6. Cookies e Tecnologias de Navegação
              </h2>
              <p>
                Utilizamos cookies em nosso site principalmente para garantir o funcionamento técnico adequado da página, segurança do formulário, e para entender o tráfego de forma anônima. Você pode gerenciar as permissões de cookies diretamente no seu navegador, embora a desativação de cookies essenciais possa afetar a experiência e a submissão de formulários em nossa plataforma.
              </p>
            </div>

            <hr className="border-white/5" />

            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                7. Contato de Privacidade (DPO)
              </h2>
              <p>
                Se você tiver dúvidas sobre esta Política de Privacidade, sobre como gerenciamos seus dados comerciais, ou se desejar exercer qualquer um de seus direitos garantidos pela LGPD, entre em contato diretamente com o nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) pelo e-mail:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/30 inline-block text-cyan-400 font-semibold font-mono">
                contato@taxmanagers.com.br
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-icon.png" 
              className="h-8 w-8 object-contain rounded-md" 
              alt="Tax Managers Logo" 
            />
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
