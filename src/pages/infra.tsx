import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, MapPin, Zap, TrendingUp, Layers } from 'lucide-react';
import '../infra.css';

import { supabase } from '../lib/supabase';

const InfraPage = () => {
  // Navigation scrolling
  const formRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = "TailorSpace Infra | Engenharia Financeira & Geração Distribuída";
  }, []);

  const scrollToForm = (tab: 'demand' | 'supply') => {
    setActiveTab(tab);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Form State
  const [activeTab, setActiveTab] = useState<'demand' | 'supply'>('demand');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demand Fields (Público A)
  const [companyName, setCompanyName] = useState('');
  const [demandEmail, setDemandEmail] = useState('');
  const [powerDemand, setPowerDemand] = useState('');
  const [gargalo, setGargalo] = useState('');

  // Supply Fields (Público B)
  const [supplyName, setSupplyName] = useState('');
  const [supplyEmail, setSupplyEmail] = useState('');
  const [supplyPhone, setSupplyPhone] = useState('');
  const [location, setLocation] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [highVoltage, setHighVoltage] = useState('');

  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !demandEmail || !powerDemand || !gargalo) return;
    setLoading(true);
    setError(null);

    const payload = {
      name: companyName.trim(),
      email: demandEmail.trim().toLowerCase(),
      whatsapp: 'N/A',
      region: powerDemand.trim(),
      stage: `Gargalo: ${gargalo}`,
      source: 'infra_demand'
    };

    const { error: supabaseError } = await supabase
      .from('leads')
      .insert([payload]);

    setLoading(false);
    if (supabaseError) {
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } else {
      setSubmitted(true);
    }
  };

  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyName || !supplyEmail || !location || !areaSize || !highVoltage) return;
    setLoading(true);
    setError(null);

    const payload = {
      name: supplyName.trim(),
      email: supplyEmail.trim().toLowerCase(),
      whatsapp: supplyPhone.trim() || 'N/A',
      region: location.trim(),
      stage: `Área: ${areaSize.trim()} | Média/Alta Tensão: ${highVoltage}`,
      source: 'infra_supply'
    };

    const { error: supabaseError } = await supabase
      .from('leads')
      .insert([payload]);

    setLoading(false);
    if (supabaseError) {
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="infra-container">
      {/* Hero Section */}
      <section className="infra-hero">
        <div className="infra-hero-grid">
          <div className="infra-hero-content">
            <h1 className="infra-brand">TailorSpace Infra</h1>
            <h2 className="infra-hero-title">
              Estruturação e originação de ativos de infraestrutura energética off-market.
            </h2>
            <p className="infra-hero-subtitle">
              Conectamos o suprimento de áreas estratégicas de baixo custo em pequenos municípios com a demanda corporativa de alta potência para mobilidade, geração e borda.
            </p>
            <div className="infra-cta-group">
              <button onClick={() => scrollToForm('demand')} className="infra-btn-primary">
                Demandas de Potência (B2B)
              </button>
              <button onClick={() => scrollToForm('supply')} className="infra-btn-secondary">
                Cadastrar Área Operacional
              </button>
            </div>
          </div>

          {/* Visual Técnico com Mapa de Conexões de Elétrons do Brasil */}
          <div className="infra-hero-visual">
            <div className="infra-hero-image-wrapper">
              <img 
                src="/mapa-brasil.jpg" 
                alt="Grid de Infraestrutura Energética e Mapeamento de Elétrons no Brasil" 
                className="infra-hero-img" 
              />
              <div className="infra-hero-image-overlay" />
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Build to Suit de Elétrons */}
      <section className="infra-bts-block-container">
        <div className="infra-bts-block">
          <div className="infra-bts-grid">
            <div className="infra-bts-info">
              <div className="infra-bts-badge">CONCEITO OPERACIONAL</div>
              <h3 className="infra-bts-title">Build to Suit de Elétrons</h3>
              <p className="infra-bts-text">
                Grandes corporações e operadores logísticos enfrentam gargalos de conexão elétrica em áreas metropolitanas densas, onde a malha de distribuição está saturada. A TailorSpace Infra inverte o fluxo tradicional: em vez de esperar anos por subestações da concessionária em capitais, nós originamos, licenciamos e montamos **infraestrutura dedicada sob medida** em localizações periféricas de altíssima viabilidade e custo reduzido.
              </p>
              <div className="infra-bts-features">
                <div className="infra-bts-feat-item">
                  <Zap className="w-5 h-5 text-gold" />
                  <span>Contratos de infraestrutura de longo prazo (15 a 20 anos) garantindo segurança jurídica.</span>
                </div>
                <div className="infra-bts-feat-item">
                  <Layers className="w-5 h-5 text-gold" />
                  <span>Modularidade técnica total, do lote bruto à entrega da subestação chave na mão.</span>
                </div>
              </div>
            </div>
            
            {/* Imagem de Ativo de Mobilidade/Geração (Oásis de Recarga com Solar) */}
            <div className="infra-bts-visual">
              <div className="infra-bts-img-wrapper">
                <img 
                  src="/oasis-recarga.jpg" 
                  alt="Estrutura Build to Suit de Elétrons - Eletroposto e Geração Solar Descentralizada" 
                  className="infra-bts-img" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Arbitragem de CEP */}
      <section className="infra-arbitragem">
        <div className="infra-arbitragem-content">
          <div className="infra-section-header-left">
            <span className="infra-pre-title">TESE EXCLUSIVA</span>
            <h2 className="infra-section-title-left">Arbitragem de CEP</h2>
          </div>
          <div className="infra-arbitragem-grid">
            <div className="infra-arbitragem-desc-block">
              <div className="infra-arbitragem-desc">
                <p>
                  A disputa imobiliária por terrenos nos principais eixos logísticos urbanos inflaciona o custo de implantação de frotas e hubs tecnológicos. Nossa tese de **Arbitragem de CEP** consiste no garimpo sistemático de áreas industriais e rurais subutilizadas em municípios de pequeno porte (micromunicípios).
                </p>
                <br />
                <p>
                  Essas regiões oferecem um custo de aquisição ou arrendamento territorial até 90% menor, acompanhado de incentivos fiscais locais agressivos. Ao associar a terra abundante e barata com a proximidade a linhas de transmissão de média/alta tensão, convertemos restrições territoriais em ativos de alta potência energética estruturados para frotas comerciais, cogeração e data centers.
                </p>
              </div>
              <div className="infra-arbitragem-stats">
                <div className="infra-stat-card">
                  <span className="infra-stat-num">90%</span>
                  <span className="infra-stat-label">Redução no custo do arrendamento de solo</span>
                </div>
                <div className="infra-stat-card">
                  <span className="infra-stat-num">100%</span>
                  <span className="infra-stat-label">Ativos validados juridicamente e prontos para SPE</span>
                </div>
              </div>
            </div>
            
            {/* Imagem de Mapeamento Técnico de Conexões */}
            <div className="infra-arbitragem-visual">
              <div className="infra-arbitragem-img-wrapper">
                <img 
                  src="/arbitragem-cep.jpg" 
                  alt="Mapeamento Territorial de Arbitragem de CEP e Conexões Elétricas" 
                  className="infra-arbitragem-img" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Linhas de Infraestrutura Section */}
      <section className="infra-linhas">
        <div className="infra-linhas-content">
          <h2 className="infra-section-title">Pilares de Atuação Estratégica</h2>
          <div className="infra-cards-grid">
            <div className="infra-card">
              <div className="infra-card-icon-wrapper">
                <TrendingUp className="w-6 h-6 text-gold" />
              </div>
              <h3>Redução de Custo Energético</h3>
              <p>
                Estruturação de mini usinas solares (Geração Distribuída), biomassa e cogeração off-grid. Conectamos sua operação industrial a contratos de longo prazo (PPA), reduzindo a tarifa de consumo real em até 30% sem investimento inicial em ativos Capex.
              </p>
            </div>
            <div className="infra-card">
              <div className="infra-card-icon-wrapper">
                <Zap className="w-6 h-6 text-gold" />
              </div>
              <h3>Mobilidade Elétrica Regional</h3>
              <p>
                Implantação de hubs de recarga ultrarrápida (150kW a 350kW) dedicados ao longo de corredores logísticos intermunicipais. Viabilizamos a transição energética de frotas de transporte pesado e distribuição regional de última milha.
              </p>
            </div>
            <div className="infra-card">
              <div className="infra-card-icon-wrapper">
                <Layers className="w-6 h-6 text-gold" />
              </div>
              <h3>Infraestrutura de Borda (Edge)</h3>
              <p>
                Mapeamento de CEPs estratégicos fora das capitais para a implantação de micro data centers modulares e sistemas de armazenamento em bateria (BESS), reduzindo a latência operacional e gerando redundância elétrica para plantas industriais complexas.
              </p>
            </div>
            <div className="infra-card">
              <div className="infra-card-icon-wrapper">
                <MapPin className="w-6 h-6 text-gold" />
              </div>
              <h3>Hubs Multimodais Futuros</h3>
              <p>
                Planejamento de infraestrutura futura para logística autônoma: mapeamento e estruturação de áreas preparadas para suportar rotas de drones de carga e vertipontos para veículos elétricos de decolagem vertical (eVTOL).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="infra-engenharia">
        <div className="infra-engenharia-content">
          <h2 className="infra-section-title">A Engenharia da Operação</h2>
          <div className="infra-steps">
            <div className="infra-step">
              <span className="infra-step-number">1</span>
              <div>
                <h4>Originação e Mapeamento</h4>
                <p className="infra-step-desc">Identificação de proprietários de terra e ativos off-market em municípios com conexão viável à rede básica de energia.</p>
              </div>
            </div>
            <div className="infra-step">
              <span className="infra-step-number">2</span>
              <div>
                <h4>Due Diligence Técnica & Regulatória</h4>
                <p className="infra-step-desc">Auditoria profunda de passivos ambientais, restrições dominiais, zoneamento e estudo preliminar de acesso junto à concessionária de energia.</p>
              </div>
            </div>
            <div className="infra-step">
              <span className="infra-step-number">3</span>
              <div>
                <h4>Modelagem Jurídica e Fiscal</h4>
                <p className="infra-step-desc">Redação de minutas de arrendamento com cláusulas de carência de implantação, renúncia a indenização e estruturação societária (SPE).</p>
              </div>
            </div>
            <div className="infra-step">
              <span className="infra-step-number">4</span>
              <div>
                <h4>Conexão Demand & Supply</h4>
                <p className="infra-step-desc">Apresentação e matchmaking dos ativos originados para grandes consumidores livres, fundos imobiliários e operadores de eletromobilidade.</p>
              </div>
            </div>
            <div className="infra-step">
              <span className="infra-step-number">5</span>
              <div>
                <h4>Ativação e Gestão de Longo Prazo</h4>
                <p className="infra-step-desc">Formalização de contratos Built to Suit de elétrons e PPAs estruturados, gerando receita líquida e proteção patrimonial.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário Duplo (B2B Demand & Supply) */}
      <footer className="infra-footer" ref={formRef}>
        <div className="infra-footer-content-custom">
          <div className="infra-form-container">
            <h3 className="infra-form-main-title">Conecte-se à Operação TailorSpace Infra</h3>
            
            <p className="infra-form-desc">
              Se você é uma empresa buscando estruturar capacidade energética, ou um proprietário/corretor com uma área ociosa com potencial, preencha o formulário para iniciarmos o diagnóstico.
            </p>

            {!submitted ? (
              <div className="infra-form-box">
                {/* Seleção de Perfil (Tabs) */}
                <div className="infra-form-tabs">
                  <button 
                    type="button" 
                    className={`infra-form-tab ${activeTab === 'demand' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('demand'); setError(null); }}
                  >
                    Demanda (Empresas & Operadores)
                  </button>
                  <button 
                    type="button" 
                    className={`infra-form-tab ${activeTab === 'supply' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('supply'); setError(null); }}
                  >
                    Oferta (Proprietários & Corretores)
                  </button>
                </div>

                {/* Formulário A: Demanda */}
                {activeTab === 'demand' && (
                  <form onSubmit={handleDemandSubmit} className="infra-active-form">
                    <div className="infra-input-group">
                      <label>Nome Corporativo / Contato</label>
                      <input 
                        type="text" 
                        required 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nome da sua empresa ou corporação"
                      />
                    </div>
                    
                    <div className="infra-input-group">
                      <label>E-mail Corporativo</label>
                      <input 
                        type="email" 
                        required 
                        value={demandEmail}
                        onChange={(e) => setDemandEmail(e.target.value)}
                        placeholder="contato@empresa.com.br"
                      />
                    </div>

                    <div className="infra-input-group">
                      <label>Demanda Estimada de Potência (kW / MW)</label>
                      <input 
                        type="text" 
                        required 
                        value={powerDemand}
                        onChange={(e) => setPowerDemand(e.target.value)}
                        placeholder="Ex: 500 kW, 5 MW ou Não sei"
                      />
                    </div>

                    <div className="infra-input-group">
                      <label>Principal Gargalo Técnico/Logístico</label>
                      <select 
                        required
                        value={gargalo}
                        onChange={(e) => setGargalo(e.target.value)}
                      >
                        <option value="" disabled>Selecione o gargalo principal...</option>
                        <option value="recarga_frota">Recarga de frotas comerciais leves/pesadas</option>
                        <option value="subestacao">Necessidade de subestação dedicada</option>
                        <option value="custo_tarifa">Alto custo da tarifa de energia contratada</option>
                        <option value="data_center">Estruturação de edge data center / infra de borda</option>
                        <option value="outro">Outro gargalo de infraestrutura complexa</option>
                      </select>
                    </div>

                    {error && <p className="infra-form-error">{error}</p>}
                    
                    <button type="submit" disabled={loading} className="infra-btn-primary infra-btn-submit">
                      {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Processando...</> : 'Solicitar Análise de Viabilidade (Demand)'}
                    </button>
                  </form>
                )}

                {/* Formulário B: Oferta */}
                {activeTab === 'supply' && (
                  <form onSubmit={handleSupplySubmit} className="infra-active-form">
                    <div className="infra-input-group-row">
                      <div className="infra-input-group">
                        <label>Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          value={supplyName}
                          onChange={(e) => setSupplyName(e.target.value)}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="infra-input-group">
                        <label>WhatsApp / Telefone de Contato</label>
                        <input 
                          type="tel" 
                          required 
                          value={supplyPhone}
                          onChange={(e) => setSupplyPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="infra-input-group">
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        required 
                        value={supplyEmail}
                        onChange={(e) => setSupplyEmail(e.target.value)}
                        placeholder="contato@seuprovedor.com"
                      />
                    </div>

                    <div className="infra-input-group">
                      <label>Localização da Área (Cidade / UF)</label>
                      <input 
                        type="text" 
                        required 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ex: Ribeirão Preto / SP"
                      />
                    </div>

                    <div className="infra-input-group-row">
                      <div className="infra-input-group">
                        <label>Área Estimada (m² ou hectares)</label>
                        <input 
                          type="text" 
                          required 
                          value={areaSize}
                          onChange={(e) => setAreaSize(e.target.value)}
                          placeholder="Ex: 5.000 m², 2 hectares"
                        />
                      </div>

                      <div className="infra-input-group">
                        <label>Proximidade com Média/Alta Tensão?</label>
                        <select 
                          required
                          value={highVoltage}
                          onChange={(e) => setHighVoltage(e.target.value)}
                        >
                          <option value="" disabled>Selecione...</option>
                          <option value="sim_proxima">Sim, passa rede na calçada / proximidades</option>
                          <option value="nao_distante">Não, área muito afastada da rede básica</option>
                          <option value="nao_sei">Não sei informar a distância da rede</option>
                        </select>
                      </div>
                    </div>

                    {error && <p className="infra-form-error">{error}</p>}
                    
                    <button type="submit" disabled={loading} className="infra-btn-primary infra-btn-submit">
                      {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Processando...</> : 'Enviar Ativo para Pré-Auditoria (Supply)'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="infra-success-box">
                <CheckCircle2 className="infra-success-icon" />
                <h4>Atendimento Iniciado!</h4>
                <p>Nossos Assessores de Infraestrutura energética analisarão os dados técnicos fornecidos e entrarão em contato em breve.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="infra-footer-copy">
          <p>&copy; {new Date().getFullYear()} TailorSpace Infra. Todos os direitos reservados. Operação Suplementar Imobiliária e Energética.</p>
        </div>
      </footer>
    </div>
  );
};

export default InfraPage;
