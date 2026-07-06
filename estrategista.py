import os
import csv
import re
import sys
from datetime import datetime
from groq import Groq

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


# --- CONFIGURAÇÕES ---
GROQ_API_KEY = "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"
client = Groq(api_key=GROQ_API_KEY)
PASTA_OBSIDIAN = r"C:\Users\Alexandre\OneDrive\Documentos\Obsidian Vault\Prospecção_B2B"
PASTA_ISCAS = os.path.join(PASTA_OBSIDIAN, "Iscas_de_Conteudo")

if not os.path.exists(PASTA_ISCAS):
    os.makedirs(PASTA_ISCAS)

# --- MÓDULO 1: O CRIADOR DE ISCAS (INBOUND) ---
def gerar_isca_conteudo(setor):
    print(f"\n[ESTRATEGISTA] Gerando Isca de Alto Valor para o setor: {setor}...")
    
    # Mapear oportunidades específicas e NOVAS para 2026 (validadas pelo Fisco), evitando subvenções que estão saturadas
    setor_limpo = setor.lower().strip()
    if "agro" in setor_limpo:
        oportunidades_sugeridas = "Créditos de PIS/COFINS sobre despesas de ESG e Logística Reversa (como destinação de embalagens de defensivos e certificações obrigatórias) ou a estratégia de monetização acelerada de saldos credores de ICMS antes da transição da Reforma Tributária (IBS/CBS)."
    elif "energia" in setor_limpo:
        oportunidades_sugeridas = "A inconstitucionalidade da Limitação de Compensação Mensal de Créditos Judiciais (Lei 14.873/2024 / IN 2.314/2026) que está retendo o fluxo de caixa de grandes geradoras e transmissoras com créditos acima de R$ 10 milhões."
    elif "varejo" in setor_limpo or "comércio" in setor_limpo or "comercio" in setor_limpo:
        oportunidades_sugeridas = "A autuação indevida sobre Bonificações e Descontos Comerciais obtidos de fornecedores (Fisco tentando tributar descontos contratuais como receita financeira de PIS/COFINS e IRPJ/CSLL)."
    elif "indústria" in setor_limpo or "industria" in setor_limpo or "metal" in setor_limpo:
        oportunidades_sugeridas = "A estratégia contra a Limitação de Compensação de Créditos Judiciais (Lei 14.873/2024) que impede indústrias de compensar créditos judiciais de forma integral, impondo um parcelamento forçado pelo Fisco em até 60 meses, ou créditos de PIS/COFINS sobre licenciamento de softwares/SaaS essenciais na linha de produção."
    else:
        oportunidades_sugeridas = "O afastamento dos limites de compensação mensal de créditos tributários homologados judicialmente (Lei 14.873/2024) ou o mapeamento de riscos fiscais na transição de créditos acumulados para a Reforma Tributária."

    prompt = f"""Você é um Advogado Tributarista Sênior e Estrategista da TaxManagers.
Seu objetivo é criar o "Kit de Isca Inbound" para atrair CFOs e Diretores do setor: {setor}.

Crie o seguinte conteúdo EXATAMENTE com esta estrutura, utilizando formatação Markdown clara:

### 1. A "Isca" de Alto Valor
Crie um post de LinkedIn profundo e altamente técnico. Mencione OBRIGATORIAMENTE a seguinte oportunidade tributária (validada pelo Fisco, nunca fale o termo "tese" ou "teses") aplicável e crítica para o setor {setor}: {oportunidades_sugeridas}. Explique o risco/oportunidade de forma cirúrgica para um CFO. Termine chamando para a sua Newsletter.

### 2. Newsletter "Entrelinhas Tributárias"
Crie a chamada para a sua newsletter chamada "Entrelinhas Tributárias". Escreva o título do artigo focado na mesma oportunidade acima, e um resumo curto provando que o Fisco está autuando empresas do setor que ignoram essa oportunidade/legislação.

### 3. Diagnóstico e Abordagem Direta
Crie um texto de abordagem direta (focado em cold message de LinkedIn) propondo uma análise técnica inicial. Um parágrafo matador focado no setor {setor} para fazer o decisor aceitar uma breve ligação de 10 minutos.
"""
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        conteudo = completion.choices[0].message.content
        
        arquivo_isca = os.path.join(PASTA_ISCAS, f"Campanha_{setor.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.md")
        with open(arquivo_isca, "w", encoding="utf-8") as f:
            f.write(f"# Campanha Inbound: {setor}\n\n{conteudo}")
        print(f"  -> Iscas salvas em: {arquivo_isca}")
        return arquivo_isca, conteudo
    except Exception as e:
        print(f"Erro ao gerar iscas: {e}")
        return None, None

# --- MÓDULO 2: MOTOR DA CURVA ABC ---
def classificar_cargo(cargo):
    if not cargo:
        return "C"
    cargo = cargo.lower()
    
    # Palavras-chave Curva A (Decision Makers)
    a_keywords = ["ceo", "cfo", "diretor", "director", "sócio", "socio", "fundador", "founder", "owner", "partner", "presidente", "superintendente", "vp", "vice"]
    if any(k in cargo for k in a_keywords):
        return "A"
        
    # Palavras-chave Curva B (Influencers)
    b_keywords = ["gerente", "manager", "coordenador", "head", "advogado", "tributário", "fiscal", "controller"]
    if any(k in cargo for k in b_keywords):
        return "B"
        
    return "C"

def obter_palavras_chave_setor(setor):
    setor_limpo = setor.lower().strip()
    
    mapeamento = {
        "agronegócio": ["agro", "semente", "fertilizante", "agronegócio", "agronegocio", "cooperativa", "usina", "fazenda", "grão", "grao", "agrícola", "agricola", "rural", "pecuária", "pecuaria", "cereal", "nutrição animal", "nutricao animal", "trator", "lavoura", "cultivo"],
        "varejo": ["varejo", "retail", "supermercado", "hipermercado", "loja", "e-commerce", "ecommerce", "franquia", "comércio", "comercio", "magazine", "atacadista", "atacado", "boutique", "shopping", "outlet"],
        "energia": ["energia", "energy", "solar", "eólica", "eolica", "elétrica", "eletrica", "saneamento", "combustível", "combustivel", "óleo", "oleo", "gás", "gas", "petróleo", "petroleo", "geradora", "transmissora", "distribuidora", "biomassa", "renovável", "renovavel"],
        "tecnologia": ["tecnologia", "technology", "software", "saas", "tech", "digital", "ti", "it", "desenvolvimento", "sistemas", "inovação", "inovacao", "computação", "computacao"],
        "saúde": ["saúde", "saude", "hospital", "clínica", "clinica", "médico", "medico", "medicina", "laboratório", "laboratorio", "diagnóstico", "diagnostico", "farmácia", "farmacia", "farma", "odontologia", "odonto", "terapêutico", "terapeutico"],
        "indústria": ["indústria", "industria", "industrial", "fábrica", "fabrica", "manufatura", "metalúrgica", "metalurgica", "siderúrgica", "siderurgica", "química", "quimica", "plástico", "plastico", "máquinas", "maquinas", "caldeiraria", "ferramentaria"]
    }
    
    # Procura se o setor informado contém alguma das chaves ou vice-versa
    for chave, palavras in mapeamento.items():
        if chave in setor_limpo or setor_limpo in chave:
            return palavras
            
    # Fallback: divide em palavras e remove acentos
    palavras = [setor_limpo]
    setor_sem_acento = re.sub(r'[áàâãä]', 'a', setor_limpo)
    setor_sem_acento = re.sub(r'[éèêë]', 'e', setor_sem_acento)
    setor_sem_acento = re.sub(r'[íìîï]', 'i', setor_sem_acento)
    setor_sem_acento = re.sub(r'[óòôõö]', 'o', setor_sem_acento)
    setor_sem_acento = re.sub(r'[úùûü]', 'u', setor_sem_acento)
    setor_sem_acento = re.sub(r'[ç]', 'c', setor_sem_acento)
    
    if setor_sem_acento != setor_limpo:
        palavras.append(setor_sem_acento)
        
    return list(setor_limpo.split()) + palavras

def processar_conexoes_csv(caminho_csv, setor_alvo=""):
    print("\n[ESTRATEGISTA] Analisando Conexões e criando Curva ABC...")
    if setor_alvo:
        palavras_chave = obter_palavras_chave_setor(setor_alvo)
        print(f"  -> Buscando conexões ligadas ao setor '{setor_alvo}' usando termos: {', '.join(palavras_chave)}")
    else:
        palavras_chave = []
        
    curva_a = []
    curva_b = []
    curva_c = []
    
    with open(caminho_csv, "r", encoding="utf-8", errors="replace") as f:
        # Pular as primeiras linhas do LinkedIn se houver metadados antes do cabeçalho
        linhas = f.readlines()
        
    inicio_csv = 0
    for i, linha in enumerate(linhas):
        if "Nome" in linha or "First Name" in linha:
            inicio_csv = i
            break
            
    reader = csv.reader(linhas[inicio_csv:])
    cabecalho = next(reader)
    
    # Mapear colunas (LinkedIn muda os nomes em PT e EN)
    idx_nome = 0
    idx_sobrenome = 1
    idx_empresa = 4
    idx_cargo = 5
    idx_url = 2  # Padrão
    
    for i, col in enumerate(cabecalho):
        c = col.lower()
        if "empresa" in c or "company" in c: idx_empresa = i
        elif "cargo" in c or "position" in c: idx_cargo = i
        elif "url" in c or "link" in c or "perfil" in c: idx_url = i
    
    total = 0
    for row in reader:
        if len(row) <= max(idx_nome, idx_sobrenome, idx_empresa, idx_cargo):
            continue
            
        nome = row[idx_nome].strip()
        sobrenome = row[idx_sobrenome].strip()
        empresa = row[idx_empresa].strip()
        cargo = row[idx_cargo].strip()
        url = row[idx_url].strip() if len(row) > idx_url else ""
        
        # Ignorar contatos sem empresa ou cargo
        if not empresa or not cargo:
            curva_c.append(row)
            continue
            
        # Filtro opcional por setor alvo (busca palavra-chave na empresa ou cargo)
        if setor_alvo:
            texto_busca = f"{empresa.lower()} {cargo.lower()}"
            if not any(pc in texto_busca for pc in palavras_chave):
                curva_c.append(row)
                continue
            
        classificacao = classificar_cargo(cargo)
        lead = {"nome": f"{nome} {sobrenome}", "empresa": empresa, "cargo": cargo, "url": url}
        
        if classificacao == "A":
            curva_a.append(lead)
        elif classificacao == "B":
            curva_b.append(lead)
        else:
            curva_c.append(lead)
        total += 1
        
    print(f"Total processado: {total} contatos")
    print(f"  -> Curva A (Ouro): {len(curva_a)}")
    print(f"  -> Curva B (Prata): {len(curva_b)}")
    
    return curva_a, curva_b

# --- MÓDULO 3: GERADOR DE CADÊNCIA (REASON TO CALL) ---
def gerar_mensagens_abordagem(leads_a, setor, conteudo_isca=""):
    print("\n[ESTRATEGISTA] Escrevendo a Cadência Ultra-Personalizada (Llama)...")
    
    lista_ataque = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{setor.replace(' ', '_')}.csv")
    with open(lista_ataque, "w", encoding="utf-8", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Nome", "Empresa", "Cargo", "URL", "Passo 1 (Conexão Ultra-Personalizada)", "Passo 2 (Newsletter)", "Passo 3 (Diagnóstico)", "Status"])
        
        # Gerar o template estático para os Passos 2 e 3 (Follow-ups) para garantir estabilidade
        prompt_template = f"""Você é um Estrategista de Vendas B2B.
Crie dois textos curtos para o setor {setor} baseados na isca abaixo:
\"\"\"
{conteudo_isca[:500]}
\"\"\"
Use [Nome] para o nome da pessoa e [Empresa] para a empresa.
        PASSO 2 (Newsletter): "[Nome], detalhei os impactos do [Oportunidade da Isca] na newsletter 'Entrelinhas Tributárias'. Te convido a assinar para receber as atualizações."
        PASSO 3 (Diagnóstico): "[Nome], como o impacto do [Oportunidade da Isca] varia por empresa, preparei um resumo dos riscos específicos para a [Empresa]. Faz sentido agendarmos uma rápida conversa de 10 min para eu te apresentar?"
        Retorne APENAS os 2 templates separados por "|||". Exemplo: Temp2|||Temp3
"""
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt_template}],
                temperature=0.2,
                max_tokens=500
            )
            templates = completion.choices[0].message.content.strip().split('|||')
            if len(templates) < 2:
                templates = ["Erro 2", "Erro 3"]
        except Exception:
            templates = ["Erro 2", "Erro 3"]
            
        msg2_template = templates[0].strip()
        msg3_template = templates[1].strip() if len(templates) > 1 else templates[0].strip()
        
        limite = min(50, len(leads_a))
        
        # Gerar Passo 1 (Ultra-Personalizado) em lotes de 10
        for i in range(0, limite, 10):
            lote = leads_a[i:i+10]
            leads_texto = "\n".join([f"ID {idx}: {l['nome']} | Cargo: {l['cargo']} | Empresa: {l['empresa']}" for idx, l in enumerate(lote)])
            
            prompt_lote = f"""Você é um Estrategista de Vendas B2B focado em Tributário.
Crie o "Passo 1" (Reason to Call) para CADA UM dos {len(lote)} leads abaixo.

OPORTUNIDADE DA ISCA PUBLICADA:
{conteudo_isca[:500]}

REGRAS DE ULTRA-PERSONALIZAÇÃO:
1. Agregue muito valor: Use o CARGO ou a EMPRESA do lead na mensagem e conecte com o risco/oportunidade tributária da oportunidade publicada (validada pelo Fisco, sem citar a palavra "tese").
Exemplo: "João, como CFO da Gerdau, imagino que o impacto da Lei 14.873 no fluxo de caixa seja um desafio real. Publiquei hoje um diagnóstico..."
2. Sem vender: Apenas deixe a porta aberta ("lembrei do seu radar de riscos", "um abraço").
3. Máximo 280 caracteres por mensagem.

LEADS:
{leads_texto}

Retorne APENAS as {len(lote)} mensagens prontas, separadas EXATAMENTE por "|||". Sem numeração, sem formatação extra.
Exemplo de saída esperada:
Msg do ID 0|||Msg do ID 1|||Msg do ID 2...
"""
            try:
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt_lote}],
                    temperature=0.3,
                    max_tokens=1500
                )
                mensagens_p1 = completion.choices[0].message.content.strip().split('|||')
                
                for j, lead in enumerate(lote):
                    primeiro_nome = lead['nome'].split()[0] if lead['nome'] else ""
                    msg1 = mensagens_p1[j].strip() if j < len(mensagens_p1) else "Erro na geração ultra-personalizada."
                    msg2 = msg2_template.replace("[Nome]", primeiro_nome).replace("[Empresa]", lead['empresa'])
                    msg3 = msg3_template.replace("[Nome]", primeiro_nome).replace("[Empresa]", lead['empresa'])
                    
                    writer.writerow([lead['nome'], lead['empresa'], lead['cargo'], lead.get('url', ''), msg1, msg2, msg3, "Pendente"])
                    
                print(f"  -> Lote ultra-personalizado {i//10 + 1} processado.")
            except Exception as e:
                print(f"Erro na geração do lote ultra-personalizado: {e}")
                
    print(f"\n[SUCESSO] Lista de Ataque finalizada com Cadência de 3 Passos: {lista_ataque}")
    return lista_ataque

# --- MÓDULO 4: PAINEL DE CONTROLE (OBSIDIAN) ---
def obter_caminho_relativo_vault(caminho_completo):
    diretorio = os.path.dirname(caminho_completo)
    while diretorio and diretorio != os.path.dirname(diretorio):
        if os.path.exists(os.path.join(diretorio, ".obsidian")):
            return os.path.relpath(caminho_completo, diretorio).replace("\\", "/")
        diretorio = os.path.dirname(diretorio)
    # Fallback
    pai_obsidian = os.path.dirname(PASTA_OBSIDIAN)
    if os.path.exists(pai_obsidian):
        return os.path.relpath(caminho_completo, pai_obsidian).replace("\\", "/")
    return os.path.basename(caminho_completo)

def atualizar_painel(setor, arquivo_isca, total_a, lista_ataque):
    painel = os.path.join(PASTA_OBSIDIAN, "Painel_Estrategista.md")
    
    # Calcular o caminho relativo do arquivo de iscas dentro do Vault
    link_isca = obter_caminho_relativo_vault(arquivo_isca).replace(".md", "")
    
    # Calcular o link relativo para a lista de ataque no Obsidian e no sistema de arquivos
    link_ataque_vault = obter_caminho_relativo_vault(lista_ataque)
    link_excel_local = lista_ataque.replace("\\", "/")
    
    tabela_leads = ""
    if os.path.exists(lista_ataque):
        try:
            with open(lista_ataque, "r", encoding="utf-8") as csv_file:
                reader = csv.reader(csv_file)
                header = next(reader)
                rows = list(reader)
                if rows:
                    tabela_leads = "\n| Nome | Empresa | Cargo | Passo 1 (Conexão) |\n| --- | --- | --- | --- |\n"
                    # Mostra no máximo 15 leads no painel para visualização rápida
                    for row in rows[:15]:
                        url = ""
                        if len(row) >= 7:
                            nome, empresa, cargo, url, msg = row[0], row[1], row[2], row[3], row[4]
                        elif len(row) >= 5: # Fallback caso a cadência tenha sido gerada com menos colunas
                            nome, empresa, cargo, url, msg = row[0], row[1], row[2], row[3], row[4]
                        else:
                            continue
                            
                        # Limpar pipes e quebras de linha para não quebrar a tabela markdown
                        nome_clean = nome.replace("|", "\\|")
                        empresa_clean = empresa.replace("|", "\\|")
                        cargo_clean = cargo.replace("|", "\\|")
                        msg_clean = msg.replace("\n", " ").replace("\r", "").replace("|", "\\|")
                        
                        if url:
                            tabela_leads += f"| [**{nome_clean}**]({url}) | {empresa_clean} | *{cargo_clean}* | {msg_clean} |\n"
                        else:
                            tabela_leads += f"| **{nome_clean}** | {empresa_clean} | *{cargo_clean}* | {msg_clean} |\n"
                    if len(rows) > 15:
                        tabela_leads += f"\n*E mais {len(rows) - 15} contatos na planilha completa.*\n"
        except Exception as e:
            tabela_leads = f"\n*Erro ao carregar visualização da tabela: {e}*\n"
            
    conteudo = f"""# 🧠 PAINEL DO ESTRATEGISTA (Curva ABC)
*Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M')}*

## 🎯 Campanha Ativa: {setor}

### 1. Marketing Inbound (O que postar hoje)
A IA gerou iscas de alto valor baseadas em Soluções de Consulta/CARF.
👉 [[{link_isca}|Ver Posts e Newsletter]]

### 2. Curva ABC (Outbound)
Encontramos **{total_a}** leads Classe A (Decisores: CFOs, Sócios, Diretores) no seu LinkedIn alinhados com essa campanha.

### 3. Lista de Ataque (Reason to Call)
As mensagens hiper-personalizadas já foram escritas pela IA para você copiar e colar no Waalaxy ou disparar manualmente.

📂 **Acessar Planilha:**
* [👉 Abrir Planilha no Excel (Local)](file:///{link_excel_local})
* [[{link_ataque_vault}|👉 Visualizar Planilha no Obsidian]]

📋 **Visualização Rápida (Copie e Cole daqui):**
{tabela_leads}
---
*Para gerar uma nova campanha, basta rodar o script estrategista.py apontando para um novo arquivo CSV e um novo setor.*
"""
    with open(painel, "w", encoding="utf-8") as f:
        f.write(conteudo)

def detectar_csv_automatico():
    caminhos_comuns = [
        os.path.join(os.path.expanduser("~"), "Downloads", "Basic_LinkedInDataExport_06-11-2026.zip", "Connections.csv"),
        os.path.join(os.path.expanduser("~"), "Downloads", "Connections.csv"),
        os.path.join(os.path.expanduser("~"), "OneDrive", "Downloads", "Connections.csv"),
        os.path.join(os.path.expanduser("~"), "OneDrive", "Documentos", "Connections.csv"),
    ]
    
    for caminho in caminhos_comuns:
        if os.path.exists(caminho):
            return caminho
            
    # Varre a pasta Downloads por pastas descompactadas do LinkedIn
    pasta_downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    if os.path.exists(pasta_downloads):
        try:
            for item in os.listdir(pasta_downloads):
                subdir = os.path.join(pasta_downloads, item)
                if os.path.isdir(subdir) and "LinkedInDataExport" in item:
                    arq_pos = os.path.join(subdir, "Connections.csv")
                    if os.path.exists(arq_pos):
                        return arq_pos
        except:
            pass
    return None

if __name__ == "__main__":
    print("="*50)
    print("🤖 INICIANDO O ROBÔ ESTRATEGISTA")
    print("="*50)
    
    # 1. Parâmetros da Campanha
    import sys
    setor_alvo = ""
    caminho_csv = ""
    
    if len(sys.argv) >= 2:
        setor_alvo = sys.argv[1]
    if len(sys.argv) >= 3:
        caminho_csv = sys.argv[2]
        
    if not setor_alvo:
        setor_alvo = input("Qual setor será o alvo desta campanha? (Ex: Agronegócio, Energia, Varejo): ").strip()
        if not setor_alvo:
            setor_alvo = "Agronegócio"
            
    if not caminho_csv:
        caminho_csv = detectar_csv_automatico()
        if caminho_csv:
            print(f"[AUTO] Base do LinkedIn encontrada em: {caminho_csv}")
        else:
            caminho_csv = input("Cole o caminho do seu arquivo Connections.csv do LinkedIn: ").strip()
        
    if not caminho_csv or not os.path.exists(caminho_csv):
        print(f"[ERRO] Arquivo não encontrado: {caminho_csv}")
        print("Certifique-se de que exportou os dados do LinkedIn e descompactou o arquivo CSV.")
        exit(1)
        
    # 2. Execução
    arquivo_isca, conteudo_isca = gerar_isca_conteudo(setor_alvo)
    
    if arquivo_isca:
        curva_a, curva_b = processar_conexoes_csv(caminho_csv, setor_alvo)
        if curva_a:
            lista_ataque = gerar_mensagens_abordagem(curva_a, setor_alvo, conteudo_isca)
            atualizar_painel(setor_alvo, arquivo_isca, len(curva_a), lista_ataque)
            print("\n✅ Processo finalizado com sucesso! Abra o _PAINEL_ESTRATEGISTA no Obsidian.")
        else:
            print("\nNenhum lead de Curva A encontrado para esse setor nas suas conexões.")
