import os
import csv
import json
import re
import webbrowser
import threading
import time
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import base64
import urllib.request
import subprocess
from groq import Groq
from ddgs import DDGS


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

# Chave de API do Groq
GROQ_API_KEY = "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"

# Configure stdout to use UTF-8 on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

# --- CONFIGURAÇÕES ---
PASTA_OBSIDIAN = r"C:\Users\Alexandre\OneDrive\Documentos\Obsidian Vault\Prospecção_B2B"

import uuid
import random

PARCEIROS_PATH = os.path.join(PASTA_OBSIDIAN, "parceiros.json")
ATRIBUICOES_PATH = os.path.join(PASTA_OBSIDIAN, "atribuicoes.json")
VENDAS_PATH = os.path.join(PASTA_OBSIDIAN, "vendas.json")
ACTIVE_SESSIONS = {}

def load_json_file(path, default):
    if not os.path.exists(path): return default
    try:
        with open(path, "r", encoding="utf-8") as f: return json.load(f)
    except: return default

def save_json_file(path, data):
    try:
        with open(path, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except: return False

def get_current_user(headers):
    cookie = headers.get('Cookie', '')
    if 'session_token=' in cookie:
        token = cookie.split('session_token=')[1].split(';')[0]
        return ACTIVE_SESSIONS.get(token)
    return None



# --- INTEGRAÇÃO SUPABASE & VPS (INBOUND LEADS) ---
STATUS_INBOUND_PATH = os.path.join(PASTA_OBSIDIAN, "status_inbound.json")
ENGAGEMENT_EVENTS_PATH = os.path.join(PASTA_OBSIDIAN, "engagement_events.json")

def get_engagement_events():
    if not os.path.exists(ENGAGEMENT_EVENTS_PATH):
        return []
    try:
        with open(ENGAGEMENT_EVENTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_engagement_event(event_data):
    events = get_engagement_events()
    events.append(event_data)
    try:
        with open(ENGAGEMENT_EVENTS_PATH, "w", encoding="utf-8") as f:
            json.dump(events[-100:], f, indent=2, ensure_ascii=False)
        return True
    except:
        return False


def get_inbound_statuses():
    if not os.path.exists(STATUS_INBOUND_PATH):
        return {}
    try:
        with open(STATUS_INBOUND_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_inbound_status(email, status):
    statuses = get_inbound_statuses()
    statuses[email] = status
    try:
        with open(STATUS_INBOUND_PATH, "w", encoding="utf-8") as f:
            json.dump(statuses, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print("Erro ao salvar status inbound:", e)
        return False

def fetch_inbound_leads_from_supabase():
    import ssl
    import traceback
    url = "https://mqncmwtgpoflbbscrelp.supabase.co/rest/v1/taxmanagers_leads?select=*&order=created_at.desc"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmNtd3RncG9mbGJic2NyZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk3ODUsImV4cCI6MjA5MDIwNTc4NX0.veEeqzcSk2FTx8sYI1i9MKRbuzXhpfgk9XG-zJzXA7g",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmNtd3RncG9mbGJic2NyZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk3ODUsImV4cCI6MjA5MDIwNTc4NX0.veEeqzcSk2FTx8sYI1i9MKRbuzXhpfgk9XG-zJzXA7g"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        # Bypassa a verificação de SSL que costuma falhar no Windows
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data
    except Exception as e:
        err_msg = f"Erro Supabase: {e}\n{traceback.format_exc()}"
        print(err_msg)
        return []


def push_lead_to_supabase(lead_data, parceiro_id="admin", parceiro_nome="Admin"):
    import urllib.request
    import ssl
    import json
    import traceback
    
    url = "https://mqncmwtgpoflbbscrelp.supabase.co/rest/v1/taxmanagers_crm_leads"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmNtd3RncG9mbGJic2NyZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk3ODUsImV4cCI6MjA5MDIwNTc4NX0.veEeqzcSk2FTx8sYI1i9MKRbuzXhpfgk9XG-zJzXA7g",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmNtd3RncG9mbGJic2NyZWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mjk3ODUsImV4cCI6MjA5MDIwNTc4NX0.veEeqzcSk2FTx8sYI1i9MKRbuzXhpfgk9XG-zJzXA7g",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    payload = {
        "parceiro_id": parceiro_id,
        "parceiro_nome": parceiro_nome,
        "nome": lead_data.get("nome", ""),
        "empresa": lead_data.get("empresa", ""),
        "cargo": lead_data.get("cargo", ""),
        "email": lead_data.get("email", ""),
        "telefone": lead_data.get("telefone", ""),
        "url_linkedin": lead_data.get("url", ""),
        "aniversario": lead_data.get("aniversario", ""),
        "historico_chat": lead_data.get("chat_history", "")
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context, timeout=5) as response:
            print(f"[SUPABASE] Lead {payload['nome']} enviado para a matriz com sucesso!")
            return True
    except Exception as e:
        print(f"[SUPABASE] Erro ao enviar lead: {e}")
        return False

def fetch_vps_files():
    import traceback
    key_path = r"C:\Users\Alexandre\.ssh\oracle-vps.key"
    cmd = [
        "ssh", "-i", key_path,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=NUL",
        "ubuntu@147.15.112.40",
        "ls -la /home/ubuntu/recebidos/"
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5, encoding='utf-8', errors='replace')
        if result.returncode == 0:
            files = []
            for line in result.stdout.split('\n'):
                parts = line.split()
                if len(parts) >= 9:
                    filename = parts[-1]
                    if filename not in [".", ".."]:
                        files.append(filename)
            return files
        else:
            err_msg = f"Erro SSH (code {result.returncode}): {result.stderr}"
            print(err_msg)
            with open("log_erro_inbound.txt", "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now()}] {err_msg}\n")
    except Exception as e:
        err_msg = f"Erro SSH Exception: {e}\n{traceback.format_exc()}"
        print(err_msg)
        try:
            with open("log_erro_inbound.txt", "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now()}] {err_msg}\n")
        except:
            pass
    return []


def sanitize_company_for_file(company):
    if not company:
        return ""
    return "".join(c if c.isalnum() else "_" for c in company).strip("_").lower()

def is_file_matching_lead(filename, company, email, name):
    filename_lower = filename.lower()
    
    # 1. Correspondência direta por email ou prefixo do email
    if email:
        email_lower = email.lower().strip()
        if email_lower in filename_lower:
            return True
        email_prefix = email_lower.split('@')[0]
        if len(email_prefix) > 4 and email_prefix in filename_lower:
            return True
            
    # 2. Correspondência por dígitos numéricos (CNPJ formatado ou não)
    if company:
        company_digits = "".join(c for c in company if c.isdigit())
        if len(company_digits) >= 8:
            filename_digits = "".join(c for c in filename_lower if c.isdigit())
            if company_digits in filename_digits or company_digits[:8] in filename_digits:
                return True
                
    # 3. Correspondência por nome limpo da empresa (ignorando sufixos corporativos como Ltda, S/A)
    if company:
        company_clean = sanitize_company_for_file(company)
        company_clean = re.sub(r'_(ltda|sa|s_a|limitada|servicos|serviços|consultoria|assessoria|group|grupo|holding)$', '', company_clean)
        if len(company_clean) > 2:
            if company_clean in filename_lower:
                return True
            if company_clean.replace('_', '') in filename_lower.replace('_', ''):
                return True

    # 4. Correspondência por primeiro e último nome do decisor
    if name:
        name_clean = "".join(c if c.isalnum() else "_" for c in name).strip("_").lower()
        parts = [p for p in name_clean.split('_') if len(p) > 2]
        if len(parts) >= 2:
            if parts[0] in filename_lower and parts[-1] in filename_lower:
                return True
                
    return False

def get_inbound_leads_data():
    raw_leads = fetch_inbound_leads_from_supabase()
    vps_files = fetch_vps_files()
    statuses = get_inbound_statuses()
    
    leads = []
    for rl in raw_leads:
        email = rl.get("email", "") or ""
        company = rl.get("cnpj", "") or ""
        name = rl.get("name", "") or ""
        phone = rl.get("phone", "") or ""
        created_at_raw = rl.get("created_at", "") or ""
        
        try:
            dt = datetime.fromisoformat(created_at_raw.replace('Z', '+00:00'))
            created_at = dt.strftime("%d/%m/%Y %H:%M")
        except:
            created_at = created_at_raw
            
        matching_files = []
        for vf in vps_files:
            if is_file_matching_lead(vf, company, email, name):
                matching_files.append(vf)
                
        if matching_files:
            files_str = "".join([f"<li><code>{f}</code></li>" for f in matching_files])
            files_html = f"<ul style='margin-left: 16px; margin-top: 4px;'>{files_str}</ul>"
        else:
            files_html = "<em style='color: var(--text-secondary);'>Nenhum arquivo encontrado associado a este lead na VPS.</em>"
            
        if matching_files:
            status = "Respondido"
            if statuses.get(email) != "Respondido":
                save_inbound_status(email, "Respondido")
        else:
            status = statuses.get(email, "Pendente")
        
        p1 = (
            f"📥 <strong>Lead Inbound via site</strong><br><br>"
            f"📅 <strong>Data:</strong> {created_at}<br>"
            f"🏢 <strong>Empresa:</strong> {company}<br>"
            f"👤 <strong>Decisor/Contato:</strong> {name}<br>"
            f"📧 <strong>E-mail:</strong> {email}<br>"
            f"📞 <strong>WhatsApp:</strong> {phone}<br><br>"
            f"📂 <strong>Arquivos na VPS:</strong>{files_html}"
        )
        p2 = (
            "Para visualizar e baixar os arquivos fiscais deste lead, abra o <strong>WinSCP</strong> "
            "e acesse a pasta:<br><code>/home/ubuntu/recebidos</code> na sua VPS Oracle."
        )
        p3 = (
            f"Os arquivos estão disponíveis de forma segura no seu servidor. Você pode analisar o SPED do "
            f"cliente e entrar em contato pelo WhatsApp <strong>{phone}</strong> para agendar a apresentação do diagnóstico."
        )

        leads.append({
            "nome": name,
            "empresa": company,
            "cargo": "Lead Inbound (Site)",
            "url": "",
            "email": email,
            "telefone": phone,
            "aniversario": "",
            "passo1": p1,
            "passo2": p2,
            "passo3": p3,
            "status": status,
            "campaign": "Inbound (Site)"
        })
    return leads


# Oportunidades tributárias por setor para geração automática de novas campanhas
OPORTUNIDADES_POR_SETOR = {
    "agro": "Créditos de PIS/COFINS sobre insumos agrícolas (ESG e logística reversa) e monetização de saldos credores de ICMS antes da Reforma Tributária.",
    "energia": "Inconstitucionalidade da Limitação de Compensação de Créditos Judiciais (Lei 14.873/2024) para grandes geradoras e transmissoras.",
    "varejo": "Autuação indevida sobre bonificações e descontos comerciais tributados como receita financeira (PIS/COFINS/IRPJ/CSLL).",
    "industria": "Estratégia contra a Limitação de Compensação de Créditos Judiciais (Lei 14.873/2024) e créditos de PIS/COFINS sobre SaaS/licenciamentos de software na linha de produção.",
    "saude": "Imunidade tributária de entidades filantrópicas hospitalares e créditos de PIS/COFINS sobre insumos da atividade hospitalar.",
    "tecnologia": "Créditos de PIS/COFINS sobre aquisição de licenças de software e exclusão de transferências de subvenções fiscais de estados da base do IRPJ/CSLL.",
    "mineracao": "Exclusão do ICMS da base de cálculo do PIS/COFINS e créditos sobre royalties pagos na extração mineral.",
    "construcao": "Regime especial de tributação do IRPJ/CSLL no regime do lucro presumido e créditos de PIS/COFINS sobre insumos da construção civil.",
    "transporte": "Créditos de PIS/COFINS sobre combustíveis, manutenção de frota e pedágios como insumos essenciais da atividade.",
    "financeiro": "Exclusão do ISS da base do PIS/COFINS para instituições financeiras e créditos sobre serviços contratados de terceiros.",
    "reforma": "Transição de regimes para o IBS/CBS: Planejamento imediato de contratos de longo prazo, monetização preventiva de saldos credores acumulados de ICMS/IPI e reestruturação da cadeia de fornecedores para evitar o travamento de créditos no período de transição.",
    "geral": "Limitação de Compensação de Créditos Judiciais (Lei 14.873/2024) e os riscos fiscais da transição de regimes para o IBS/CBS da Reforma Tributária.",
}

def list_campaigns():
    if not os.path.exists(PASTA_OBSIDIAN):
        return []
    campaigns = []
    campaigns.append("Inbound (Site)")
    for file in os.listdir(PASTA_OBSIDIAN):
        if file.startswith("Lista_Ataque_") and file.endswith(".csv"):
            name = file[len("Lista_Ataque_"):-4]
            campaigns.append(name)
    return campaigns

def read_campaign_leads(campaign_name):
    if campaign_name == "Inbound (Site)":
        return get_inbound_leads_data()

    file_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{campaign_name}.csv")
    if not os.path.exists(file_path):
        return []


    leads = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return []

        headers_norm = [h.strip() for h in headers]
        idx_map = {h: i for i, h in enumerate(headers_norm)}

        name_key = next((h for h in headers_norm if "nome" in h.lower()), "Nome")
        company_key = next((h for h in headers_norm if "empresa" in h.lower() or "company" in h.lower()), "Empresa")
        role_key = next((h for h in headers_norm if "cargo" in h.lower() or "position" in h.lower()), "Cargo")
        url_key = next((h for h in headers_norm if "url" in h.lower() or "perfil" in h.lower() or "link" in h.lower()), "URL")
        email_key = next((h for h in headers_norm if "email" in h.lower() or "e-mail" in h.lower()), "Email")
        tel_key = next((h for h in headers_norm if "telefone" in h.lower() or "phone" in h.lower() or "tel" in h.lower()), "Telefone")
        aniv_key = next((h for h in headers_norm if "aniversario" in h.lower() or "aniversário" in h.lower() or "birthday" in h.lower() or "nasc" in h.lower()), "Aniversario")
        p1_key = next((h for h in headers_norm if "passo 1" in h.lower() or "conex" in h.lower() or "mensagem" in h.lower() or "abordagem" in h.lower()), "Mensagem de Abordagem")
        p2_key = next((h for h in headers_norm if "passo 2" in h.lower() or "news" in h.lower()), "Passo 2 (Newsletter)")
        p3_key = next((h for h in headers_norm if "passo 3" in h.lower() or "evento" in h.lower() or "diagnost" in h.lower() or "reuniao" in h.lower()), "Passo 3 (Diagnóstico)")
        status_key = next((h for h in headers_norm if "status" in h.lower()), "Status")

        for row in reader:
            if not row:
                continue

            def get_col(key, default=""):
                if key in idx_map and idx_map[key] < len(row):
                    return row[idx_map[key]].strip()
                return default

            nome = get_col(name_key)
            empresa = get_col(company_key)
            cargo = get_col(role_key)
            url = get_col(url_key)
            email = get_col(email_key)
            telefone = get_col(tel_key)
            aniversario = get_col(aniv_key)
            p1 = get_col(p1_key)
            p2 = get_col(p2_key)
            p3 = get_col(p3_key)
            status = get_col(status_key, "Pendente")

            if not status:
                status = "Pendente"

            leads.append({
                "nome": nome,
                "empresa": empresa,
                "cargo": cargo,
                "url": url,
                "email": email,
                "telefone": telefone,
                "aniversario": aniversario,
                "passo1": p1,
                "passo2": p2,
                "passo3": p3,
                "status": status,
                "campaign": campaign_name
            })
    leads.reverse()
    return leads

# --- NOVA FUNÇÃO: Busca Global em Todos os CSVs ---
def sanitize_campaign_name(name):
    """Remove acentos e caracteres especiais para uso seguro em nomes de arquivo."""
    import unicodedata
    # Normaliza e remove marcas diacríticas (acentos)
    normalized = unicodedata.normalize('NFD', name)
    without_accents = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    # Remove caracteres inválidos para nomes de arquivo no Windows
    safe = re.sub(r'[\\/:*?"<>|]', '', without_accents)
    # Substitui espaços por underscore e limpa pontos/reticências no final
    safe = safe.strip().rstrip('.')
    return safe

def search_all_leads(query):
    """Pesquisa por nome, empresa ou cargo em todas as campanhas."""
    query_lower = query.lower().strip()
    if not query_lower:
        return []

    all_leads = []
    campaigns = list_campaigns()
    for campaign in campaigns:
        leads = read_campaign_leads(campaign)
        for lead in leads:
            if (query_lower in lead["nome"].lower() or
                query_lower in lead["empresa"].lower() or
                query_lower in lead["cargo"].lower()):
                all_leads.append(lead)

    return all_leads

def find_existing_lead(name, url=None):
    """Procura por um lead pelo nome ou URL do LinkedIn em todas as campanhas.
    Retorna o nome da campanha caso o lead seja encontrado, ou None se não existir."""
    name_lower = name.lower().strip()
    url_clean = url.lower().strip() if url else ""
    if url_clean:
        # Remove parâmetros UTM e barra final para comparação robusta
        url_clean = url_clean.split('?')[0].rstrip('/')

    campaigns = list_campaigns()
    for campaign in campaigns:
        leads = read_campaign_leads(campaign)
        for lead in leads:
            # 1. Verifica correspondência exata de URL se fornecida
            lead_url = lead.get("url", "").lower().strip()
            if lead_url:
                lead_url_clean = lead_url.split('?')[0].rstrip('/')
                if url_clean and url_clean == lead_url_clean:
                    return campaign
            
            # 2. Se não bateu pela URL (ou não há URL), verifica por Nome exato
            lead_name = lead.get("nome", "").lower().strip()
            if name_lower == lead_name and name_lower != "":
                return campaign
    return None

# --- NOVA FUNÇÃO: upgrade_csv_headers_if_needed e Append Lead em CSV ---
def upgrade_csv_headers_if_needed(file_path):
    """Verifica se o CSV tem as colunas de contato (Email, Telefone, Aniversario).
    Caso contrário, migra o CSV para o formato completo, preenchendo as colunas vazias
    para manter compatibilidade e não quebrar o alinhamento das colunas."""
    if not os.path.exists(file_path):
        return

    # Lê as linhas existentes
    rows = []
    headers = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return
        rows = list(reader)

    headers_norm = [h.strip().lower() for h in headers]
    
    # Verifica se já possui as colunas essenciais de contato
    has_email = any("email" in h for h in headers_norm)
    has_tel = any("telefone" in h or "phone" in h or "tel" in h for h in headers_norm)
    has_aniv = any("aniversario" in h or "birthday" in h or "nasc" in h for h in headers_norm)

    if not (has_email and has_tel and has_aniv):
        # Mapeia colunas existentes para migração
        idx_map = {h.strip(): i for i, h in enumerate(headers)}
        
        def find_idx(keys, default_idx):
            for k in keys:
                for h in headers:
                    if k in h.lower():
                        return idx_map[h.strip()]
            return default_idx

        name_idx = find_idx(["nome"], 0)
        empresa_idx = find_idx(["empresa", "company"], 1)
        cargo_idx = find_idx(["cargo", "position"], 2)
        url_idx = find_idx(["url", "perfil", "link"], 3)
        p1_idx = find_idx(["passo 1", "conex", "mensagem", "abordagem"], 4)
        p2_idx = find_idx(["passo 2", "news"], 5)
        p3_idx = find_idx(["passo 3", "evento", "diagnost", "reuniao"], 6)
        status_idx = find_idx(["status"], 7)

        new_headers = ["Nome", "Empresa", "Cargo", "URL", "Email", "Telefone", "Aniversario",
                       "Passo 1 (Conexão Ultra-Personalizada)", "Passo 2 (Newsletter)",
                       "Passo 3 (Diagnóstico)", "Status"]

        new_rows = []
        for r in rows:
            if not r:
                continue
            # Preenche colunas ausentes na linha
            while len(r) < len(headers):
                r.append("")
            
            new_row = [
                r[name_idx] if name_idx < len(r) else "",
                r[empresa_idx] if empresa_idx < len(r) else "",
                r[cargo_idx] if cargo_idx < len(r) else "",
                r[url_idx] if url_idx < len(r) else "",
                "", # Email
                "", # Telefone
                "", # Aniversario
                r[p1_idx] if p1_idx < len(r) else "",
                r[p2_idx] if p2_idx < len(r) else "",
                r[p3_idx] if p3_idx < len(r) else "",
                r[status_idx] if status_idx < len(r) else "Pendente"
            ]
            new_rows.append(new_row)

        with open(file_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(new_headers)
            writer.writerows(new_rows)
        print(f"[PAINEL] Planilha {file_path} atualizada com novas colunas de contato.")

def append_lead_to_csv(campaign_name, lead_data):
    """Adiciona um lead ao CSV da campanha. Cria o arquivo se não existir.
    Sanitiza o nome da campanha para compatibilidade com o sistema de arquivos Windows/OneDrive."""
    # Sanitiza o nome para o arquivo (sem acentos / chars especiais)
    safe_name = sanitize_campaign_name(campaign_name)
    file_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{safe_name}.csv")
    headers = ["Nome", "Empresa", "Cargo", "URL", "Email", "Telefone", "Aniversario",
               "Passo 1 (Conexão Ultra-Personalizada)", "Passo 2 (Newsletter)",
               "Passo 3 (Diagnóstico)", "Status"]

    row = [
        lead_data.get("nome", ""),
        lead_data.get("empresa", ""),
        lead_data.get("cargo", ""),
        lead_data.get("url", ""),
        lead_data.get("email", ""),
        lead_data.get("telefone", ""),
        lead_data.get("aniversario", ""),
        lead_data.get("passo1", ""),
        lead_data.get("passo2", ""),
        lead_data.get("passo3", ""),
        "Pendente"
    ]

    def _write(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        file_exists = os.path.exists(path)
        needs_upgrade = False
        
        if file_exists:
            headers_norm = []
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    reader = csv.reader(f)
                    try:
                        hdr = next(reader)
                        headers_norm = [h.strip().lower() for h in hdr]
                    except StopIteration:
                        pass
            except Exception as e:
                print(f"[PAINEL] Erro ao verificar cabecalhos de {path}: {e}")
            
            if headers_norm:
                has_email = any("email" in h for h in headers_norm)
                has_tel = any("telefone" in h or "phone" in h or "tel" in h for h in headers_norm)
                has_aniv = any("aniversario" in h or "birthday" in h or "nasc" in h for h in headers_norm)
                if not (has_email and has_tel and has_aniv):
                    needs_upgrade = True
        
        if needs_upgrade:
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    reader = csv.reader(f)
                    try:
                        old_headers = next(reader)
                    except StopIteration:
                        old_headers = []
                    old_rows = list(reader)
                
                idx_map = {h.strip(): i for i, h in enumerate(old_headers)}
                def find_idx(keys, default_idx):
                    for k in keys:
                        for h in old_headers:
                            if k in h.lower():
                                return idx_map[h.strip()]
                    return default_idx

                name_idx = find_idx(["nome"], 0)
                empresa_idx = find_idx(["empresa", "company"], 1)
                cargo_idx = find_idx(["cargo", "position"], 2)
                url_idx = find_idx(["url", "perfil", "link"], 3)
                p1_idx = find_idx(["passo 1", "conex", "mensagem", "abordagem"], 4)
                p2_idx = find_idx(["passo 2", "news"], 5)
                p3_idx = find_idx(["passo 3", "evento", "diagnost", "reuniao"], 6)
                status_idx = find_idx(["status"], 7)

                new_rows = []
                for r in old_rows:
                    if not r:
                        continue
                    while len(r) < len(old_headers):
                        r.append("")
                    new_rows.append([
                        r[name_idx] if name_idx < len(r) else "",
                        r[empresa_idx] if empresa_idx < len(r) else "",
                        r[cargo_idx] if cargo_idx < len(r) else "",
                        r[url_idx] if url_idx < len(r) else "",
                        "", # Email
                        "", # Telefone
                        "", # Aniversario
                        r[p1_idx] if p1_idx < len(r) else "",
                        r[p2_idx] if p2_idx < len(r) else "",
                        r[p3_idx] if p3_idx < len(r) else "",
                        r[status_idx] if status_idx < len(r) else "Pendente"
                    ])
                
                new_rows.append(row)
                
                with open(path, "w", encoding="utf-8", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(headers)
                    writer.writerows(new_rows)
                print(f"[PAINEL] Planilha {path} migrada e lead adicionado em uma unica transacao.")
                return
            except Exception as e:
                print(f"[PAINEL] Erro na migracao combinada: {e}. Tentando append direto...")

        with open(path, "a", encoding="utf-8", newline='') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(headers)
            writer.writerow(row)

    try:
        _write(file_path)
        print(f"[PAINEL] Lead salvo em: {file_path}")
    except PermissionError as e:
        # Fallback: salva na pasta local do projeto caso o OneDrive esteja bloqueando
        fallback_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "leads_locais")
        fallback_path = os.path.join(fallback_dir, f"Lista_Ataque_{safe_name}.csv")
        print(f"[PAINEL] PermissionError no OneDrive ({e}). Salvando em fallback local: {fallback_path}")
        _write(fallback_path)
        file_path = fallback_path

    # Tenta atualizar o painel do Obsidian em background (evita travar a thread HTTP principal)
    try:
        threading.Thread(target=atualizar_painel_obsidian, args=(safe_name,), daemon=True).start()
    except Exception as e:
        print(f"[PAINEL] Aviso: nao foi possivel iniciar thread para atualizar o painel Obsidian: {e}")

    return True, safe_name

def update_lead_status(campaign_name, lead_name, lead_company, new_status):
    if campaign_name == "Inbound (Site)":
        leads = get_inbound_leads_data()
        for l in leads:
            if l["nome"] == lead_name and l["empresa"] == lead_company:
                return save_inbound_status(l["email"], new_status)
        return False

    file_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{campaign_name}.csv")
    if not os.path.exists(file_path):
        return False


    rows = []
    headers = []
    updated = False

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return False

        headers_norm = [h.strip() for h in headers]
        if "Status" not in headers_norm:
            headers.append("Status")
            headers_norm.append("Status")

        status_idx = headers_norm.index("Status")
        name_key = next((h for h in headers_norm if "nome" in h.lower()), "Nome")
        company_key = next((h for h in headers_norm if "empresa" in h.lower() or "company" in h.lower()), "Empresa")
        name_idx = headers_norm.index(name_key)
        company_idx = headers_norm.index(company_key)

        for row in reader:
            while len(row) < len(headers):
                row.append("")
            if (name_idx < len(row) and row[name_idx].strip() == lead_name.strip() and
                company_idx < len(row) and row[company_idx].strip() == lead_company.strip()):
                row[status_idx] = new_status
                updated = True
            rows.append(row)

    if updated:
        with open(file_path, "w", encoding="utf-8", newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        try:
            threading.Thread(target=atualizar_painel_obsidian, args=(campaign_name,), daemon=True).start()
        except Exception as e:
            print(f"[PAINEL] Aviso: erro ao atualizar painel Obsidian em background: {e}")
        return True
    return False

def update_lead_passo2(campaign_name, lead_name, lead_company, new_msg):
    file_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{campaign_name}.csv")
    if not os.path.exists(file_path):
        return False

    rows = []
    headers = []
    updated = False

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return False

        headers_norm = [h.strip() for h in headers]
        name_key = next((h for h in headers_norm if "nome" in h.lower()), "Nome")
        company_key = next((h for h in headers_norm if "empresa" in h.lower() or "company" in h.lower()), "Empresa")
        p2_key = next((h for h in headers_norm if "passo 2" in h.lower() or "news" in h.lower()), "Passo 2 (Newsletter)")

        if name_key not in headers_norm or company_key not in headers_norm or p2_key not in headers_norm:
            return False

        name_idx = headers_norm.index(name_key)
        company_idx = headers_norm.index(company_key)
        p2_idx = headers_norm.index(p2_key)

        for row in reader:
            while len(row) < len(headers):
                row.append("")
            if (name_idx < len(row) and row[name_idx].strip() == lead_name.strip() and
                company_idx < len(row) and row[company_idx].strip() == lead_company.strip()):
                row[p2_idx] = new_msg
                updated = True
            rows.append(row)

    if updated:
        with open(file_path, "w", encoding="utf-8", newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        try:
            threading.Thread(target=atualizar_painel_obsidian, args=(campaign_name,), daemon=True).start()
        except Exception as e:
            print(f"[PAINEL] Aviso: erro ao atualizar painel Obsidian em background: {e}")
        return True
    return False

def update_lead_passo1(campaign_name, lead_name, lead_company, new_msg):
    file_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{campaign_name}.csv")
    if not os.path.exists(file_path):
        return False

    rows = []
    headers = []
    updated = False

    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return False

        headers_norm = [h.strip() for h in headers]
        name_key = next((h for h in headers_norm if "nome" in h.lower()), "Nome")
        company_key = next((h for h in headers_norm if "empresa" in h.lower() or "company" in h.lower()), "Empresa")
        p1_key = next((h for h in headers_norm if "passo 1" in h.lower() or "conex" in h.lower() or "mensagem" in h.lower() or "abordagem" in h.lower()), "Mensagem de Abordagem")

        if name_key not in headers_norm or company_key not in headers_norm or p1_key not in headers_norm:
            return False

        name_idx = headers_norm.index(name_key)
        company_idx = headers_norm.index(company_key)
        p1_idx = headers_norm.index(p1_key)

        for row in reader:
            while len(row) < len(headers):
                row.append("")
            if (name_idx < len(row) and row[name_idx].strip() == lead_name.strip() and
                company_idx < len(row) and row[company_idx].strip() == lead_company.strip()):
                row[p1_idx] = new_msg
                updated = True
            rows.append(row)

    if updated:
        with open(file_path, "w", encoding="utf-8", newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        try:
            threading.Thread(target=atualizar_painel_obsidian, args=(campaign_name,), daemon=True).start()
        except Exception as e:
            print(f"[PAINEL] Aviso: erro ao atualizar painel Obsidian em background: {e}")
        return True
    return False

def obter_caminho_relativo_vault(caminho_completo):
    diretorio = os.path.dirname(caminho_completo)
    while diretorio and diretorio != os.path.dirname(diretorio):
        if os.path.exists(os.path.join(diretorio, ".obsidian")):
            return os.path.relpath(caminho_completo, diretorio).replace("\\", "/")
        diretorio = os.path.dirname(diretorio)
    pai_obsidian = os.path.dirname(PASTA_OBSIDIAN)
    if os.path.exists(pai_obsidian):
        return os.path.relpath(caminho_completo, pai_obsidian).replace("\\", "/")
    return os.path.basename(caminho_completo)

def atualizar_painel_obsidian(campaign_name):
    csv_path = os.path.join(PASTA_OBSIDIAN, f"Lista_Ataque_{campaign_name}.csv")
    if not os.path.exists(csv_path):
        return

    leads = read_campaign_leads(campaign_name)
    total_leads = len(leads)
    stats = {"Pendente": 0, "Passo 1 Enviado": 0, "Passo 2 Enviado": 0, "Passo 3 Enviado": 0, "Respondido": 0}
    for l in leads:
        st = l["status"]
        if st in stats:
            stats[st] += 1
        else:
            stats["Pendente"] += 1

    pasta_iscas = os.path.join(PASTA_OBSIDIAN, "Iscas_de_Conteudo")
    isca_file = ""
    if os.path.exists(pasta_iscas):
        for f in os.listdir(pasta_iscas):
            if f.startswith(f"Campanha_{campaign_name.replace(' ', '_')}_") and f.endswith(".md"):
                isca_file = os.path.join(pasta_iscas, f)
                break

    link_isca = ""
    if isca_file:
        link_isca = obter_caminho_relativo_vault(isca_file).replace(".md", "")

    link_ataque_vault = obter_caminho_relativo_vault(csv_path)
    link_excel_local = csv_path.replace("\\", "/")

    tabela_leads = "\n| Nome | Empresa | Cargo | Status | Passo 1 |\n| --- | --- | --- | --- | --- |\n"
    for lead in leads[:15]:
        nome = lead["nome"].replace("|", "\\|")
        empresa = lead["empresa"].replace("|", "\\|")
        cargo = lead["cargo"].replace("|", "\\|")
        status = lead["status"]
        msg = lead["passo1"].replace("\n", " ").replace("\r", "").replace("|", "\\|")

        status_emoji = "⏳"
        if status == "Passo 1 Enviado": status_emoji = "🔵 P1"
        elif status == "Passo 2 Enviado": status_emoji = "🟣 P2"
        elif status == "Passo 3 Enviado": status_emoji = "🟢 P3"
        elif status == "Respondido": status_emoji = "🔥 Resp"

        if lead["url"]:
            tabela_leads += f"| [**{nome}**]({lead['url']}) | {empresa} | *{cargo}* | {status_emoji} | {msg[:100]}... |\n"
        else:
            tabela_leads += f"| **{nome}** | {empresa} | *{cargo}* | {status_emoji} | {msg[:100]}... |\n"

    if len(leads) > 15:
        tabela_leads += f"\n*E mais {len(leads) - 15} contatos na planilha completa.*\n"

    painel_path = os.path.join(PASTA_OBSIDIAN, "Painel_Estrategista.md")
    conteudo = f"""# 🧠 PAINEL DO ESTRATEGISTA (Curva ABC)
*Última atualização: {datetime.now().strftime('%d/%m/%Y %H:%M')}*

## 🎯 Campanha Ativa: {campaign_name}

### 📈 Estatísticas de Prospecção
* **Total de Leads Classe A:** {total_leads}
* ⏳ **Pendentes:** {stats['Pendente']}
* 🔵 **Passo 1 (Conexão):** {stats['Passo 1 Enviado']}
* 🟣 **Passo 2 (Newsletter):** {stats['Passo 2 Enviado']}
* 🟢 **Passo 3 (Diagnóstico):** {stats['Passo 3 Enviado']}
* 🔥 **Respondido / Reunião:** {stats['Respondido']}

### 1. Marketing Inbound (O que postar hoje)
{"👉 [[ " + link_isca + " | Ver Posts e Newsletter]]" if link_isca else "*Nenhuma isca vinculada encontrada.*"}

### 2. Lista de Ataque (Reason to Call)
As mensagens hiper-personalizadas já foram escritas pela IA. Use o Painel Web (rodar_painel.bat) para disparar de forma automatizada.

📂 **Acessar Planilha:**
* [👉 Abrir Planilha no Excel (Local)](file:///{link_excel_local})
* [[{link_ataque_vault}|👉 Visualizar Planilha no Obsidian]]

📋 **Visualização Rápida dos Leads:**
{tabela_leads}
---
*Painel sincronizado automaticamente com o Painel Web do Estrategista.*
"""
    with open(painel_path, "w", encoding="utf-8") as f:
        f.write(conteudo)


# --- SERVIDOR WEB ---

# --- BOOKMARKLET JS ---
BOOKMARKLET_JS = '''
(function(){
    try {
        let nameNode = document.querySelector('h1.text-heading-xlarge') || 
                       document.querySelector('.pv-text-details__left-panel h1') ||
                       document.querySelector('.text-heading-xlarge') ||
                       document.querySelector('main h1') ||
                       document.querySelector('h1');
        let name = nameNode ? nameNode.innerText.trim() : '';
        
        // Fallback for name if first h1 is empty or logo
        if(!name || name.length < 2) {
            const h1s = Array.from(document.querySelectorAll('h1'));
            const validH1 = h1s.find(h => h.innerText.trim().length > 1);
            if(validH1) name = validH1.innerText.trim();
        }

        let roleNode = document.querySelector('.pv-text-details__left-panel .text-body-medium') || 
                       document.querySelector('.text-body-medium.break-words') || 
                       document.querySelector('main .text-body-medium') ||
                       document.querySelector('.text-body-medium');
        let rawRole = roleNode ? roleNode.innerText.trim() : '';
        if(!rawRole) {
            const headlineNode = document.querySelector('[data-field="headline"]') || document.querySelector('.pv-text-details__left-panel div');
            if(headlineNode) rawRole = headlineNode.innerText.trim();
        }

        let role = rawRole, company = '';
        if(rawRole.includes(' at ')) {
            [role, company] = rawRole.split(' at ').map(s => s.trim());
        } else if(rawRole.includes(' na ')) {
            [role, company] = rawRole.split(' na ').map(s => s.trim());
        } else if(rawRole.includes(' no ')) {
            [role, company] = rawRole.split(' no ').map(s => s.trim());
        } else if(rawRole.includes(' em ')) {
            [role, company] = rawRole.split(' em ').map(s => s.trim());
        }

        // --- VERIFICAÇÃO DE SEGURANÇA SE FALHAR O PARSER AUTOMÁTICO ---
        if(!name) {
            name = prompt("Não conseguimos capturar o Nome automaticamente. Por favor, digite o nome do lead:");
            if(!name) return;
            name = name.trim();
        }
        if(!role) {
            const userCargo = prompt("Não conseguimos capturar o Cargo automaticamente. Digite o cargo e empresa (ex: Sócio na Consultoria X):");
            if(userCargo) {
                rawRole = userCargo.trim();
                role = rawRole;
                if(rawRole.includes(' at ')) {
                    [role, company] = rawRole.split(' at ').map(s => s.trim());
                } else if(rawRole.includes(' na ')) {
                    [role, company] = rawRole.split(' na ').map(s => s.trim());
                } else if(rawRole.includes(' no ')) {
                    [role, company] = rawRole.split(' no ').map(s => s.trim());
                } else if(rawRole.includes(' em ')) {
                    [role, company] = rawRole.split(' em ').map(s => s.trim());
                }
            }
        }

        const url = window.location.href;
        let email = '', phone = '', birthday = '';
        const emailNode = Array.from(document.querySelectorAll('a')).find(a => a.href.startsWith('mailto:'));
        if(emailNode) email = emailNode.href.replace('mailto:', '').trim();
        const phoneSec = document.querySelector('.ci-phone,[class*=phone]');
        if(phoneSec) phone = phoneSec.innerText.replace(/Telefone|Celular|Trabalho/gi, '').trim().replace(/\\\\n/g, ' ');
        const bdaySec = document.querySelector('.ci-birthday,[class*=birthday],[class*=aniversario]');
        if(bdaySec) birthday = bdaySec.innerText.replace(/Aniversário|Birthday/gi, '').trim().replace(/\\\\n/g, ' ');
        
        let chatHistory = '';
        const bubble = document.querySelector('.msg-overlay-conversation-bubble--is-focused,.msg-thread');
        if(bubble){
            const msgs = bubble.querySelectorAll('.msg-s-message-list__event,.msg-s-event-listitem');
            if(msgs.length > 0){
                chatHistory = Array.from(msgs).map(el => {
                    const senderNode = el.querySelector('.msg-s-message-group__name,[class*=name]');
                    const sender = senderNode ? senderNode.innerText.trim() : 'Contato';
                    const textNode = el.querySelector('.msg-s-event-listitem__body,[class*=body]');
                    const text = textNode ? textNode.innerText.trim() : '';
                    return text ? sender + ': ' + text : '';
                }).filter(t => t !== '').slice(-8).join('\\\\n');
            }
        } else {
            const msgs = document.querySelectorAll('.msg-s-message-list__event,.msg-s-event-listitem');
            if(msgs.length > 0){
                chatHistory = Array.from(msgs).map(el => {
                    const senderNode = el.querySelector('.msg-s-message-group__name,[class*=name]');
                    const sender = senderNode ? senderNode.innerText.trim() : 'Contato';
                    const textNode = el.querySelector('.msg-s-event-listitem__body,[class*=body]');
                    const text = textNode ? textNode.innerText.trim() : '';
                    return text ? sender + ': ' + text : '';
                }).filter(t => t !== '').slice(-8).join('\\\\n');
            }
        }
        
        let inputStr = prompt(
            "Capturado:\\\\n" + name + "\\\\n" + (company ? role + " na " + company : role) + "\\\\n" +
            "Email: " + email + "\\\\n" +
            "Telefone: " + phone + "\\\\n" +
            "Chat: " + (chatHistory ? "Sim (Msn Recentes)" : "Não Encontrado") + "\\\\n\\\\n" +
            "Qual ação?\\\\n" +
            "1 - Apenas Importar\\\\n" +
            "2 - Curtiu Artigo\\\\n" +
            "3 - Assinou Newsletter\\\\n" +
            "4 - Respondeu Chat\\\\n" +
            "5 - Aceitou Conexão\\\\n\\\\n" +
            "Ou simplesmente COLE A CONVERSA do chat aqui (Ctrl+V) para usar com a IA:",
            "1"
        );
        if(!inputStr) return; // cancelado
        
        inputStr = inputStr.trim();
        let action = "Importado";
        if(inputStr === "1") action = "Importado";
        else if(inputStr === "2") action = "Curtiu Artigo";
        else if(inputStr === "3") action = "Assinou Newsletter";
        else if(inputStr === "4") action = "Respondeu Chat";
        else if(inputStr === "5") action = "Aceitou Conexão";
        else if(inputStr.length > 5) {
            action = "Respondeu Chat";
            chatHistory = inputStr;
            if(chatHistory.length > 10000) {
                chatHistory = chatHistory.substring(chatHistory.length - 10000);
            }
        }

        const importUrl = '{{ORIGIN}}/api/import_page?name=' + encodeURIComponent(name) +
            '&role=' + encodeURIComponent(role) +
            '&company=' + encodeURIComponent(company) +
            '&url=' + encodeURIComponent(url) +
            '&action=' + encodeURIComponent(action) +
            '&email=' + encodeURIComponent(email) +
            '&telefone=' + encodeURIComponent(phone) +
            '&aniversario=' + encodeURIComponent(birthday) +
            '&chat_history=' + encodeURIComponent(chatHistory);
        window.open(importUrl, '_blank', 'width=400,height=300');
    } catch(e) {
        alert("Erro no bookmarklet: " + e);
    }
})();
'''



def clean_raw_linkedin_chat(text, lead_name="Lead"):
    if not text:
        return ""
    ignore_keywords = [
        "escreva uma mensagem", "enviar", "pressione enter", "anexar", "gif", 
        "emoji", "carregar", "mensagens", "digite", "visualizado", "entregue",
        "ver mais", "linkedin", "conectar", "mensagem enviada", "digitar",
        "abrir seletor", "adicionar mídia", "carregar foto"
    ]
    lines = [line.strip() for line in text.split("\n")]
    cleaned_lines = []
    current_sender = ""
    current_time = ""
    user_name = "Alexandre"
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if any(kw in line.lower() for kw in ignore_keywords) and len(line) < 50:
            i += 1
            continue
        is_user = user_name.lower() in line.lower()
        is_lead = lead_name.lower() in line.lower() or (lead_name.split()[0].lower() in line.lower() if lead_name.split() else False)
        time_match = re.search(r'\b\d{1,2}:\d{2}\b', line)
        if is_user or is_lead:
            current_sender = "Alexandre" if is_user else lead_name
            if time_match:
                current_time = time_match.group(0)
            else:
                if i + 1 < len(lines) and re.match(r'^\d{1,2}:\d{2}$', lines[i+1].strip()):
                    current_time = lines[i+1].strip()
                    i += 1
            i += 1
            continue
        if re.match(r'^\d{1,2}:\d{2}$', line) or re.match(r'^\d{1,2}\s+de\s+[a-z]{3}\.?$', line, re.IGNORECASE):
            current_time = line
            i += 1
            continue
        if current_sender:
            time_str = f" ({current_time})" if current_time else ""
            cleaned_lines.append(f"**{current_sender}**{time_str}: {line}")
            current_time = ""
        else:
            cleaned_lines.append(line)
        i += 1
    return "\n\n".join(cleaned_lines)


class DashboardHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)

        if path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            host = self.headers.get('Host', 'localhost:5000')
            protocol = 'https' if 'trycloudflare' in host or self.headers.get('X-Forwarded-Proto', '') == 'https' else 'http'
            current_origin = f"{protocol}://{host}"
            html_content = INDEX_HTML.replace('{{ORIGIN}}', current_origin)
            self.wfile.write(html_content.encode('utf-8'))

        elif path == '/bookmarklet.js':
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript; charset=utf-8')
            self.end_headers()
            host = self.headers.get('Host', 'localhost:5000')
            protocol = 'https' if 'trycloudflare' in host or self.headers.get('X-Forwarded-Proto', '') == 'https' else 'http'
            current_origin = f"{protocol}://{host}"
            js_content = BOOKMARKLET_JS.replace('{{ORIGIN}}', current_origin)
            self.wfile.write(js_content.encode('utf-8'))

        elif path == '/api/import_page':
            name = query.get('name', [''])[0]
            role = query.get('role', [''])[0]
            company = query.get('company', [''])[0]
            url = query.get('url', [''])[0]
            action = query.get('action', ['Importado'])[0]
            
            email = query.get('email', [''])[0]
            telefone = query.get('telefone', [''])[0]
            aniversario = query.get('aniversario', [''])[0]
            
            # Save to CSV
            lead_data = {
                "nome": name,
                "empresa": company,
                "cargo": role,
                "url": url,
                "email": email,
                "telefone": telefone,
                "aniversario": aniversario
            }
            append_lead_to_csv("Leads Capturados", lead_data)

            # Save Chat History in Obsidian if present
            chat_history = query.get('chat_history', [''])[0]
            if chat_history:
                chat_history = clean_raw_linkedin_chat(chat_history, name)
                conversas_dir = os.path.join(PASTA_OBSIDIAN, "Historico_Conversas")
                os.makedirs(conversas_dir, exist_ok=True)
                chat_file = os.path.join(conversas_dir, f"{sanitize_campaign_name(name)}.md")
                try:
                    with open(chat_file, "w", encoding="utf-8") as f_chat:
                        f_chat.write(f"# 💬 Histórico de Conversa: {name} ({company})\n")
                        f_chat.write(f"*Capturado via Bookmarklet em: {datetime.now().strftime('%d/%m/%Y %H:%M')}*\n\n")
                        f_chat.write("## Mensagens Recentes:\n")
                        f_chat.write(chat_history)
                    print(f"[PAINEL] Histórico de conversa salvo em: {chat_file}")
                except Exception as e:
                    print(f"[PAINEL] Erro ao salvar histórico de conversa: {e}")
            
            # --- INTEGRAÇÃO SUPABASE (CENTRAL TAXMANAGERS) ---
            try:
                user = get_current_user(self.headers)
                p_id = user['id'] if user else "admin"
                p_nome = user['nome'] if user else "Admin"
                
                # Atualizar lead_data com chat_history
                lead_data_for_supabase = lead_data.copy()
                lead_data_for_supabase['chat_history'] = chat_history
                
                # Disparar envio para a matriz
                push_lead_to_supabase(lead_data_for_supabase, parceiro_id=p_id, parceiro_nome=p_nome)
            except Exception as supabase_err:
                print(f"[PAINEL] Falha silenciosa no envio ao Supabase: {supabase_err}")
                

            # If engagement action, log to engagement events
            if action in ["Curtiu Artigo", "Assinou Newsletter", "Respondeu Chat", "Aceitou Conexão"]:
                evt = {
                    "id": int(time.time()),
                    "name": name,
                    "company": company,
                    "event": "aceitou a conexão" if action == "Aceitou Conexão" else action.lower()
                }
                save_engagement_event(evt)
            
            # Return beautiful success HTML page that auto-closes
            success_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Lead Importado</title>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        text-align: center;
                        padding: 40px;
                        background: #0f172a;
                        color: #f1f5f9;
                    }}
                    .card {{
                        background: #1e293b;
                        border-radius: 8px;
                        padding: 24px;
                        border: 1px solid #334155;
                        display: inline-block;
                        max-width: 350px;
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    }}
                    h2 {{ color: #10b981; margin-top: 0; }}
                    p {{ margin: 8px 0; color: #cbd5e1; }}
                    .footer {{ font-size: 0.8em; color: #64748b; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>✓ Lead Importado!</h2>
                    <p><strong>{name}</strong></p>
                    <p>{role}</p>
                    <p style="color: #60a5fa; font-weight: bold;">{action}</p>
                    <div class="footer">Esta janela fechará em 2 segundos...</div>
                </div>
                <script>
                    setTimeout(function() {{ window.close(); }}, 2000);
                </script>
            </body>
            </html>
            """
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(success_html.encode('utf-8'))

        
        elif path == '/api/session':
            user = get_current_user(self.headers)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if user:
                self.wfile.write(json.dumps({"logged_in": True, "user": user}).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({"logged_in": False}).encode('utf-8'))

        elif path == '/api/campaigns':
            campaigns = list_campaigns()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(campaigns).encode('utf-8'))

        elif path == '/api/campaign':
            campaign_name = query.get('name', [None])[0]
            if campaign_name:
                leads = read_campaign_leads(campaign_name)
                user = get_current_user(self.headers)
                if user and user.get('role') != 'admin':
                    atribuicoes = load_json_file(ATRIBUICOES_PATH, {})
                    user_id = user['id']
                    assigned_keys = [k for k, v in atribuicoes.items() if v == user_id]
                    leads = [L for L in leads if f"{L.get('empresa','')}_{L.get('nome','')}" in assigned_keys]
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(leads).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()

        elif path == '/api/search_leads':
            q = query.get('q', [''])[0]
            results = search_all_leads(q)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results).encode('utf-8'))


        elif path == '/api/agent_alerts':
            events = get_engagement_events()
            # Logic: If Edilberto or Renato have recent opens, return a smart prompt
            alerts = []
            for evt in events[-5:]: # Last 5 events
                lead_name = evt.get('name', 'Lead')
                company = evt.get('company', 'Empresa')
                action = evt.get('event', 'abriu o email')
                alerts.append({
                    "id": evt.get('id', int(time.time())),
                    "message": f"🚨 ALERTA QUENTE: {lead_name} ({company}) acabou de {action}. Sugestão: Faça o Cold Call agora!",
                    "lead_name": lead_name,
                    "company": company
                })
            # Add a mock alert if empty just for UI demonstration of the Sales Engagement agent
            if not alerts:
                 alerts.append({
                    "id": 999,
                    "message": "💡 ALERTA ROAR: Renato Arroyo (Kepler Weber) engajou com seu artigo sobre Subvenções há 10 minutos. Sugestão: Iniciar Warm Call.",
                    "lead_name": "Renato Arroyo",
                    "company": "Kepler Weber"
                 })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(alerts).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):

        if self.path == '/api/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            username = data.get('username', '')
            password = data.get('password', '')
            
            parceiros = load_json_file(PARCEIROS_PATH, [])
            user = next((p for p in parceiros if p.get('id') == username and p.get('password') == password), None)
            
            if user:
                token = str(uuid.uuid4())
                user_copy = {k: v for k, v in user.items() if k != 'password'}
                ACTIVE_SESSIONS[token] = user_copy
                
                self.send_response(200)
                self.send_header('Set-Cookie', f'session_token={token}; Path=/; HttpOnly')
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "user": user_copy}).encode('utf-8'))
            else:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Usuário ou senha inválidos"}).encode('utf-8'))
            return
            
        elif self.path == '/api/logout':
            cookie = self.headers.get('Cookie', '')
            if 'session_token=' in cookie:
                token = cookie.split('session_token=')[1].split(';')[0]
                if token in ACTIVE_SESSIONS:
                    del ACTIVE_SESSIONS[token]
            self.send_response(200)
            self.send_header('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            return

        elif self.path == '/api/request_leads':
            user = get_current_user(self.headers)
            if not user or user.get('role') == 'admin':
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Only partners can request leads')
                return
                
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            campaign_name = data.get('campaign', '')
            
            leads = read_campaign_leads(campaign_name)
            atribuicoes = load_json_file(ATRIBUICOES_PATH, {})
            
            # Find unassigned leads
            unassigned = []
            for L in leads:
                key = f"{L.get('empresa','')}_{L.get('nome','')}"
                if key not in atribuicoes:
                    unassigned.append(key)
            
            if len(unassigned) == 0:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Nenhum lead disponvel na base."}).encode('utf-8'))
                return
                
            # Assign up to 50
            to_assign = unassigned[:50]
            for key in to_assign:
                atribuicoes[key] = user['id']
            
            save_json_file(ATRIBUICOES_PATH, atribuicoes)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "count": len(to_assign)}).encode('utf-8'))
            return
            
        elif self.path == '/api/register_sale':
            user = get_current_user(self.headers)
            if not user:
                self.send_response(401)
                self.end_headers()
                return
                
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            
            total_value = float(data.get('total_value', 0))
            lead_name = data.get('lead_name', '')
            company = data.get('company', '')
            
            taxmanagers_split = total_value * 0.50
            prospector_split = total_value * 0.30
            expert_split = total_value * 0.10
            author_split = total_value * 0.10
            
            venda = {
                "id": str(uuid.uuid4()),
                "lead": f"{company}_{lead_name}",
                "total_value": total_value,
                "splits": {
                    "taxmanagers": taxmanagers_split,
                    "prospector": prospector_split,
                    "expert": expert_split,
                    "author": author_split
                },
                "prospector_id": user['id'] if user['role'] != 'admin' else 'admin'
            }
            
            vendas = load_json_file(VENDAS_PATH, [])
            vendas.append(venda)
            save_json_file(VENDAS_PATH, vendas)
            
            # Update partner balance
            parceiros = load_json_file(PARCEIROS_PATH, [])
            for p in parceiros:
                if p['id'] == venda['prospector_id']:
                    p['balance'] = p.get('balance', 0) + prospector_split
            save_json_file(PARCEIROS_PATH, parceiros)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "venda": venda}).encode('utf-8'))
            return

        if self.path == '/api/update':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))
            campaign = params.get('campaign')
            lead_name = params.get('name')
            lead_company = params.get('company')
            new_status = params.get('status')
            success = update_lead_status(campaign, lead_name, lead_company, new_status)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': success}).encode('utf-8'))


        elif self.path == '/api/webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))
            evt = {
                "id": int(time.time()),
                "name": params.get('name', 'Desconhecido'),
                "company": params.get('company', 'Desconhecida'),
                "event": params.get('event', 'interagiu')
            }
            save_engagement_event(evt)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

        elif self.path == '/api/personalize_agent':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))

            lead_name = params.get('name', '')
            lead_company = params.get('company', '')
            lead_role = params.get('role', '')
            image_b64 = params.get('image_base64')
            text_input = params.get('text_input', '')
            thesis_focus = params.get('thesis_focus', 'Automático')

            try:
                groq_client = Groq(api_key=GROQ_API_KEY)
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"short_note": f"Erro: {str(e)}", "long_email": str(e)}).encode('utf-8'))
                return

            profile_context = text_input
            if image_b64:
                try:
                    is_pdf = image_b64.startswith("data:application/pdf")
                    if ',' in image_b64:
                        image_b64_data = image_b64.split(',')[1]
                    else:
                        image_b64_data = image_b64

                    if is_pdf:
                        import pypdf
                        import io
                        pdf_bytes = base64.b64decode(image_b64_data)
                        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                        pdf_text = ""
                        for page in reader.pages:
                            pdf_text += page.extract_text() + "\n"
                        profile_context += "\n\n[Contexto Extraído do PDF do Perfil]:\n" + pdf_text
                        print("[PAINEL] Extração de texto do PDF realizada com sucesso.")
                    else:
                        vision_prompt = (
                            "Você é um assistente de inteligência comercial. Extraia as seguintes informações deste "
                            "print de perfil do LinkedIn se estiverem visíveis: 1. Cargo atual e há quanto tempo está nele, "
                            "2. Cargos e empresas anteriores relevantes (especialmente se passou por Big Four, consultorias "
                            "ou grandes escritórios), 3. Formação acadêmica (universidades, MBAs). Resuma tudo em tópicos curtos."
                        )
                        vision_response = groq_client.chat.completions.create(
                            model="meta-llama/llama-4-scout-17b-16e-instruct",
                            messages=[{
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": vision_prompt},
                                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64_data}"}},
                                ],
                            }],
                            temperature=0.2,
                            max_tokens=400
                        )
                        profile_context += "\n\n[Contexto Visual Extraído do Print]:\n" + vision_response.choices[0].message.content
                        print("[PAINEL] Extração visual realizada com sucesso pelo Llama 4 Scout.")
                except Exception as e:
                    print("[PAINEL] Erro na análise do arquivo/perfil:", e)
                    profile_context += f"\n[Aviso: Não foi possível analisar o arquivo: {str(e)}]"

            company_context = "Nenhuma informação externa relevante encontrada."
            if lead_company:
                try:
                    import unicodedata
                    def strip_accents(text):
                        return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
                    clean_company = re.sub(r'\s+(S/A|S\.A\.|LTDA|Ltda|SA|Limitada)\b.*$', '', lead_company, flags=re.IGNORECASE).strip()
                    clean_company_search = strip_accents(clean_company)
                    query_str = f'"{clean_company_search}" (imposto OR tributario OR fiscal OR judicial OR processo)'
                    print(f"[PAINEL] Buscando na web por: {query_str}")
                    results = DDGS().text(query_str, max_results=3)
                    if not results:
                        results = DDGS().text(f'"{clean_company_search}"', max_results=3)
                    if results:
                        company_context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
                        print(f"[PAINEL] Pesquisa web bem-sucedida para: {clean_company}")
                except Exception as e:
                    print("[PAINEL] Erro na busca web:", e)

            if thesis_focus == "Automático":
                thesis_instruction = (
                    "Escolha a oportunidade tributária mais apropriada baseada no setor de atuação da empresa "
                    "(ex: créditos de PIS/COFINS sobre insumos agrícolas para o agronegócio, "
                    "subvenções de ICMS para investimentos para indústrias/varejo, "
                    "limitação de compensação judicial, exclusão do ICMS da base do PIS/COFINS). "
                    "Apresente essa oportunidade específica (validada pelo Fisco) como gancho técnico. NUNCA fale termos genéricos e NUNCA use a palavra 'tese' ou 'teses'."
                )
            else:
                thesis_instruction = f"Você deve focar especificamente na seguinte oportunidade fiscal validada pelo Fisco: {thesis_focus}. NUNCA use a palavra 'tese' ou 'teses'."

                        # Carrega histórico de conversa do Obsidian se existir
            chat_file = os.path.join(PASTA_OBSIDIAN, "Historico_Conversas", f"{sanitize_campaign_name(lead_name)}.md")
            if os.path.exists(chat_file):
                try:
                    with open(chat_file, "r", encoding="utf-8") as f_chat:
                        chat_content = f_chat.read()
                    profile_context += "\n\n[HISTÓRICO DA CONVERSA REAL COM O LEAD]:\n" + chat_content
                    print(f"[PAINEL] Histórico de conversa incorporado para a IA: {lead_name}")
                except Exception as e:
                    print(f"[PAINEL] Erro ao ler histórico de conversa: {e}")

            if thesis_focus == "Parceria Mentofranquia":
                system_prompt = f"""Você é Alexandre Florio, Fundador da Taxmanagers (uma das principais plataformas de infraestrutura e inteligência tributária do Brasil).
Sua missão é escrever abordagens B2B hiper-personalizadas no LinkedIn para propor uma parceria estratégica (Mentofranquia/Mentofranqueado) para {lead_name} ({lead_role} na empresa {lead_company}).

Sobre a Taxmanagers e a Parceria:
- Nós fornecemos toda a infraestrutura operacional, inteligência de dados, IA personalizada e execução técnica do trabalho tributário complexo de alto ticket (PIS/COFINS, subvenções de ICMS, Lei do Bem, etc.) nos bastidores.
- O parceiro atua focado puramente em prospecção, relacionamento e fechamento comercial com decisores (CFOs/Diretores) que fornecemos através de lotes qualificados de leads da nossa base de 20.000 contatos.
- Modelo de split atrativo: 30% do sucesso para ele (Prospector), 50% para a Taxmanagers (leads + infra) e 10% para o expert executor e 10% autor da tese.

Use os seguintes dados sobre o lead (extraídos do perfil do LinkedIn):
{profile_context}

Instruções Críticas de Redação e Personalização (Obrigatórias):
- O seu texto DEVE conter obrigatoriamente um quebra-gelo natural baseado na trajetória do lead (ex: citar sua transição recente de cargo de CFO/Controller para consultor, ou o tempo de casa na consultoria dele, etc.).
- Nunca fale de "venda de curso" ou "comprar franquia". Fale sobre "parceria estratégica de negócios", "infraestrutura operacional completa da Taxmanagers" e "acelerador de fechamento/receptividade de prospecção com inteligência de dados".
- Seja conciso e direto. A mensagem deve parecer 100% escrita por Alexandre Florio de forma pessoal.
- Crie DUAS opções de mensagens.
- 1. 'short_note' (LinkedIn Connection Request): Máx 280 caracteres. Direta, elogia a trajetória ou a transição para consultoria e propõe uma breve troca de ideias sobre a parceria para alavancar fechamentos.
- 2. 'long_email' (Inmail / Cold Mail): Máx 500 caracteres. Usa a bagagem corporativa dele como CFO/Controller para construir um argumento forte de por que a infraestrutura operacional da Taxmanagers combinada com a rede de relacionamento dele é altamente lucrativa.
- 3. 'article_pitch' (Mensagem Pós-Aceite): Máx 400 caracteres. Roteiro curto propondo uma conversa de 15 minutos para apresentar o painel de leads e a tecnologia do ecossistema.
- Responda ESTRITAMENTE em formato JSON:
{{
  "short_note": "Sua mensagem curta aqui",
  "long_email": "Sua mensagem longa aqui",
  "article_pitch": "Sua abordagem pós-aceite aqui"
}}"""
            else:
                system_prompt = f"""Você é um Consultor Tributário Sênior (Sócio de Boutique Fiscal renomada).
Sua missão é escrever abordagens B2B hiper-personalizadas de prospecção fria para {lead_name} ({lead_role} na empresa {lead_company}).

Instrução Fiscal Tributária:
{thesis_instruction}

Use os seguintes dados sobre o lead (extraídos do perfil do LinkedIn):
{profile_context}

Use os seguintes fatos recentes sobre a empresa (via pesquisa web - se houver):
{company_context}

Instruções Críticas de Redação e Personalização (Obrigatórias):
- O seu texto DEVE conter obrigatoriamente um quebra-gelo natural baseado nos dados profissionais do lead (ex: citar a transição recente de cargo, o tempo de casa na empresa, o histórico em alguma empresa anterior, ou a faculdade onde estudou).
- Se a empresa for do agronegócio (como a Agrícola Famosa S/A), fale de temas do agro.
- NUNCA use termos como 'otimização fiscal automática', 'liderança inspiradora', ou modelos prontos e robóticos como 'espero que esteja bem'.
- Seja conciso e direto. A mensagem deve parecer 100% escrita por um humano especialista que estudou a carreira do lead antes de mandar o convite.
- Crie DUAS opções de mensagens.
- 1. 'short_note' (LinkedIn Connection Request): Máx 280 caracteres. Direta, elogia a trajetória ou cita o momento da empresa, e propõe uma breve troca de ideias sobre otimização fiscal. Não seja vago.
- 2. 'long_email' (Inmail / Cold Mail): Máx 500 caracteres. Usa um fato do mercado ou a experiência da pessoa para construir um argumento forte de por que vocês deveriam falar agora sobre o foco fiscal escolhido.
- 3. 'article_pitch' (Mensagem Pós-Aceite): Máx 400 caracteres. Roteiro curto e simpático focado no envio do artigo/newsletter sobre a oportunidade fiscal discutida, para ser enviado após o lead aceitar a conexão.
- Responda ESTRITAMENTE em formato JSON:
{{
  "short_note": "Sua mensagem curta aqui",
  "long_email": "Sua mensagem longa aqui",
  "article_pitch": "Sua abordagem pós-aceite focada no artigo aqui"
}}"""

            model_used = "Llama 3.3 70B"
            try:
                chat_completion = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": system_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.5,
                    response_format={"type": "json_object"}
                )
                result_json = json.loads(chat_completion.choices[0].message.content)
            except Exception as e_primary:
                print(f"[PAINEL] Erro com Llama 3.3 70B: {e_primary}. Tentando fallback...")
                model_used = "Llama 3.1 8B (Fallback)"
                try:
                    chat_completion = groq_client.chat.completions.create(
                        messages=[{"role": "user", "content": system_prompt}],
                        model="llama-3.1-8b-instant",
                        temperature=0.5,
                        response_format={"type": "json_object"}
                    )
                    result_json = json.loads(chat_completion.choices[0].message.content)
                except Exception as e_fallback:
                    print(f"[ERRO PAINEL] Falha em ambos os modelos: {e_fallback}")
                    err_msg = str(e_fallback)
                    if "rate_limit_exceeded" in err_msg.lower() or "rate limit" in err_msg.lower():
                        friendly_error = "Erro: Limite diário de tokens do Groq atingido. Por favor, aguarde alguns instantes ou troque de chave."
                    else:
                        friendly_error = f"Erro na chamada do modelo: {err_msg}"
                    result_json = {"short_note": friendly_error, "long_email": "Não foi possível gerar as opções."}
                    model_used = "Nenhum (Erro)"

            result_json["model_used"] = model_used
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result_json).encode('utf-8'))

        elif self.path == '/api/save_personalization':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))
            campaign = params.get('campaign')
            lead_name = params.get('name')
            lead_company = params.get('company')
            new_msg = params.get('message')
            step = int(params.get('step', 1))
            if step == 2:
                success = update_lead_passo2(campaign, lead_name, lead_company, new_msg)
            else:
                success = update_lead_passo1(campaign, lead_name, lead_company, new_msg)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': success}).encode('utf-8'))

        # ---------------------------------------------------------------
        # NOVO: Ingestão de Lead via Print - Fluxo de Preview
        # ---------------------------------------------------------------
        elif self.path == '/api/ingest_lead_preview':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))

            image_b64 = params.get('image_base64')
            contact_image_base64 = params.get('contact_image_base64')
            linkedin_url = params.get('linkedin_url', '')
            log = []

            try:
                groq_client = Groq(api_key=GROQ_API_KEY)
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Erro ao inicializar Groq: {str(e)}", "log": []}).encode('utf-8'))
                return

            # --- Etapa 1: Extrair dados do perfil via Visão ou PDF ---
            profile_context = ""
            extracted = {"nome": "", "empresa": "", "cargo": ""}

            if image_b64:
                try:
                    is_pdf = image_b64.startswith("data:application/pdf")
                    b64_data = image_b64.split(',')[1] if ',' in image_b64 else image_b64

                    if is_pdf:
                        import pypdf, io
                        pdf_bytes = base64.b64decode(b64_data)
                        reader_pdf = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                        pdf_text = "".join([p.extract_text() + "\n" for p in reader_pdf.pages])
                        profile_context = pdf_text
                        log.append("✅ PDF processado: texto extraído com sucesso.")
                    else:
                        log.append("🔍 Analisando imagem do perfil com Llama Vision (Llama 4 Scout)...")
                        vision_prompt = (
                            "Você é um extrator de dados de perfis do LinkedIn. Analise esta imagem e extraia EXATAMENTE:\n"
                            "1. Nome completo da pessoa\n"
                            "2. Cargo atual\n"
                            "3. Empresa atual\n"
                            "4. Empresa e cargo anteriores relevantes (se visíveis)\n"
                            "5. Formação acadêmica (se visível)\n"
                            "6. Qualquer dado relevante para personalizar uma abordagem comercial B2B tributária.\n"
                            "Seja específico e detalhado. Responda em tópicos claros em português."
                        )
                        vision_resp = groq_client.chat.completions.create(
                            model="meta-llama/llama-4-scout-17b-16e-instruct",
                            messages=[{
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": vision_prompt},
                                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}},
                                ],
                            }],
                            temperature=0.1,
                            max_tokens=500
                        )
                        profile_context = vision_resp.choices[0].message.content
                        log.append(f"✅ Perfil analisado com Llama Vision:\n{profile_context[:200]}...")
                except Exception as e:
                    log.append(f"⚠️ Erro na análise visual do perfil: {str(e)}")
                    profile_context = "Não foi possível extrair dados visuais do perfil."

            # --- Etapa 1.5: Extrair dados de contato do print de contato se fornecido ---
            contact_details = {"email": "", "telefone": "", "aniversario": "", "linkedin_url": ""}
            if contact_image_base64:
                try:
                    log.append("🔍 Analisando imagem de contato com Llama Vision (Llama 4 Scout)...")
                    b64_data_contact = contact_image_base64.split(',')[1] if ',' in contact_image_base64 else contact_image_base64
                    contact_vision_prompt = (
                        "Você é um extrator de dados de contato. Analise esta imagem da aba de contato (geralmente do LinkedIn) e extraia os seguintes campos se estiverem visíveis:\n"
                        "1. Endereço de e-mail (ex: toviporceli76@gmail.com)\n"
                        "2. Número de telefone ou contato telefônico (ex: +55... ou 0800... ou celular)\n"
                        "3. Data de aniversário (ex: 3 de janeiro)\n"
                        "4. Link do perfil do LinkedIn (ex: linkedin.com/in/antonio-porceli-29b07167)\n"
                        "\n"
                        "Responda ESTRITAMENTE em formato JSON com as chaves \"email\", \"telefone\", \"aniversario\", \"linkedin_url\". "
                        "Se algum campo não for encontrado ou não estiver visível na imagem, retorne string vazia \"\" para a chave correspondente. "
                        "Não inclua blocos markdown (como ```json) ou qualquer outro texto explicativo."
                    )
                    contact_vision_resp = groq_client.chat.completions.create(
                        model="meta-llama/llama-4-scout-17b-16e-instruct",
                        messages=[{
                            "role": "user",
                            "content": [
                                {"type": "text", "text": contact_vision_prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data_contact}"}},
                            ],
                        }],
                        temperature=0.1,
                        response_format={"type": "json_object"},
                        max_tokens=250
                    )
                    contact_details = json.loads(contact_vision_resp.choices[0].message.content)
                    log.append(f"✅ Contatos identificados: E-mail='{contact_details.get('email', '')}' | Tel='{contact_details.get('telefone', '')}' | Aniv='{contact_details.get('aniversario', '')}' | URL='{contact_details.get('linkedin_url', '')}'")
                except Exception as e_contact:
                    log.append(f"⚠️ Erro ao extrair dados de contato do print: {str(e_contact)}")

            # --- Etapa 2: Extrair Nome, Empresa, Cargo do texto do perfil via LLM ---
            log.append("🧠 Identificando Nome, Cargo e Empresa...")
            try:
                extract_prompt = f"""Do texto abaixo extraído de um perfil do LinkedIn, retorne APENAS um JSON com:
- "nome": nome completo da pessoa
- "empresa": empresa atual
- "cargo": cargo atual

Texto:
{profile_context[:1500]}

Responda somente o JSON, sem mais nada."""
                extract_resp = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": extract_prompt}],
                    model="llama-3.1-8b-instant",
                    temperature=0.1,
                    response_format={"type": "json_object"},
                    max_tokens=150
                )
                extracted = json.loads(extract_resp.choices[0].message.content)
                log.append(f"✅ Dados extraídos: {extracted.get('nome', '?')} | {extracted.get('cargo', '?')} | {extracted.get('empresa', '?')}")
            except Exception as e:
                log.append(f"⚠️ Erro ao extrair dados estruturados: {str(e)}")

            nome = extracted.get("nome", "Lead sem nome")
            empresa = extracted.get("empresa", "Empresa desconhecida")
            cargo = extracted.get("cargo", "Cargo desconhecido")

            # --- Etapa 3: Pesquisa Web sobre a Empresa ---
            company_context = "Nenhuma informação web encontrada."
            if empresa and empresa != "Empresa desconhecida":
                try:
                    import unicodedata
                    def strip_accents(text):
                        return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
                    clean_co = re.sub(r'\s+(S/A|S\.A\.|LTDA|Ltda|SA|Limitada)\b.*$', '', empresa, flags=re.IGNORECASE).strip()
                    clean_co_s = strip_accents(clean_co)
                    log.append(f"🌐 Pesquisando notícias recentes sobre '{clean_co}'...")
                    q1 = f'"{clean_co_s}" (imposto OR tributario OR fiscal OR investimento OR expansao)'
                    results = DDGS().text(q1, max_results=4)
                    if not results:
                        results = DDGS().text(f'"{clean_co_s}"', max_results=3)
                    if results:
                        company_context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
                        log.append(f"✅ {len(results)} resultado(s) encontrado(s) sobre a empresa.")
                    else:
                        log.append("⚠️ Nenhuma notícia encontrada. Usando contexto genérico do setor.")
                except Exception as e:
                    log.append(f"⚠️ Erro na pesquisa web: {str(e)}")

            # --- Etapa 4: Classificar Lead na Campanha Correta ---
            campaigns = list_campaigns()
            campaigns_str = ", ".join(campaigns) if campaigns else "Nenhuma campanha existente"
            log.append(f"🎯 Classificando lead nas campanhas existentes: [{campaigns_str}]...")

            suggested_campaign = "Geral"
            new_campaign_created = False
            try:
                classify_prompt = f"""Você é um especialista em segmentação B2B tributária.

Lead para classificar:
- Nome: {nome}
- Cargo: {cargo}
- Empresa: {empresa}
- Contexto: {profile_context[:500]}

Campanhas existentes: {campaigns_str}

Sua tarefa:
1. Se o lead se encaixa em alguma das campanhas existentes, retorne o nome EXATO dessa campanha no campo "campaign".
2. Se NÃO se encaixa em nenhuma, sugira um nome curto e descritivo para uma NOVA campanha (ex: "Saude_e_Hospitais", "Mineracao", "Financeiro") no campo "campaign" e coloque "true" em "is_new".
3. Explique em 1 frase sua razão no campo "reason".

Responda APENAS em JSON:
{{
  "campaign": "nome da campanha",
  "is_new": false,
  "reason": "porque..."
}}"""
                classify_resp = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": classify_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.2,
                    response_format={"type": "json_object"},
                    max_tokens=200
                )
                classify_data = json.loads(classify_resp.choices[0].message.content)
                suggested_campaign = classify_data.get("campaign", "Geral")
                new_campaign_created = classify_data.get("is_new", False)
                reason = classify_data.get("reason", "")
                if new_campaign_created:
                    log.append(f"🆕 Novo setor identificado! Será criada a campanha: '{suggested_campaign}'")
                else:
                    log.append(f"✅ Lead classificado em: '{suggested_campaign}'. Motivo: {reason}")
            except Exception as e:
                log.append(f"⚠️ Erro na classificação: {str(e)}. Usando campanha 'Geral'.")

            # --- Etapa 5: Gerar Oportunidade e Mensagens (Passos 1, 2, 3) ---
            log.append("✍️ Redigindo abordagem cirúrgica baseada em oportunidade tributária e contexto real...")

            # Determinar oportunidade baseada no setor
            setor_lower = suggested_campaign.lower()
            oportunidade = OPORTUNIDADES_POR_SETOR.get("geral", "")
            for key, val in OPORTUNIDADES_POR_SETOR.items():
                if key in setor_lower:
                    oportunidade = val
                    break

            gen_prompt = f"""Você é um Consultor Tributário Sênior de uma boutique fiscal de elite.
Gere uma cadência de 3 mensagens B2B hiper-personalizadas para {nome} ({cargo} na {empresa}).

Oportunidade Tributária Central (validada pelo Fisco, não use a palavra 'tese') para o setor '{suggested_campaign}':
{oportunidade}

Dados do perfil do decisor:
{profile_context[:800]}

Dados recentes sobre a empresa:
{company_context[:600]}

REGRAS ABSOLUTAS:
- Passo 1 (Conexão LinkedIn): máx 280 caracteres. Use um fato real da carreira ou da empresa. Nunca seja genérico.
- Passo 2 (Newsletter): 1 parágrafo. Mencione o nome da newsletter "Entrelinhas da Reforma" e o benefício específico para o setor.
- Passo 3 (Diagnóstico): 1 parágrafo. Proponha um pré-diagnóstico técnico inicial de 15 min. Seja específico ao risco da empresa.
- Nunca use "espero que esteja bem", "liderança inspiradora" ou frases robóticas.
- Cada mensagem deve soar 100% humana e consultiva.

Responda APENAS em JSON:
{{
  "passo1": "mensagem de conexão aqui",
  "passo2": "mensagem de newsletter aqui",
  "passo3": "mensagem de diagnóstico aqui"
}}"""

            cadencia = {"passo1": "", "passo2": "", "passo3": ""}
            model_used_ingest = "Llama 3.3 70B"
            try:
                gen_resp = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": gen_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.5,
                    response_format={"type": "json_object"},
                    max_tokens=700
                )
                cadencia = json.loads(gen_resp.choices[0].message.content)
                log.append("✅ Cadência de 3 mensagens gerada com sucesso!")
            except Exception as e_gen:
                log.append(f"⚠️ Fallback para Llama 3.1 8B: {str(e_gen)}")
                model_used_ingest = "Llama 3.1 8B (Fallback)"
                try:
                    gen_resp = groq_client.chat.completions.create(
                        messages=[{"role": "user", "content": gen_prompt}],
                        model="llama-3.1-8b-instant",
                        temperature=0.5,
                        response_format={"type": "json_object"},
                        max_tokens=700
                    )
                    cadencia = json.loads(gen_resp.choices[0].message.content)
                    log.append("✅ Cadência gerada via fallback!")
                except Exception as e_fb:
                    log.append(f"❌ Erro fatal na geração de mensagens: {str(e_fb)}")
                    model_used_ingest = "Nenhum (Erro)"
            # Caso o usuário não tenha inserido a URL do LinkedIn no input manual,
            # tenta pegar a URL extraída do print da aba de contatos
            if not linkedin_url:
                extracted_url = contact_details.get("linkedin_url", "")
                if extracted_url:
                    if not extracted_url.startswith("http"):
                        linkedin_url = "https://" + extracted_url
                    else:
                        linkedin_url = extracted_url

            # Verifica se o lead já está cadastrado em alguma campanha (evita duplicação)
            already_exists_in = find_existing_lead(nome, linkedin_url)

            result = {
                "nome": nome,
                "empresa": empresa,
                "cargo": cargo,
                "url": linkedin_url,
                "email": contact_details.get("email", ""),
                "telefone": contact_details.get("telefone", ""),
                "aniversario": contact_details.get("aniversario", ""),
                "passo1": cadencia.get("passo1", ""),
                "passo2": cadencia.get("passo2", ""),
                "passo3": cadencia.get("passo3", ""),
                "campaign": suggested_campaign,
                "is_new_campaign": new_campaign_created,
                "already_exists_in": already_exists_in,
                "model_used": model_used_ingest,
                "log": log
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))

        # ---------------------------------------------------------------
        # NOVO: Salvar Lead Aprovado no CSV
        # ---------------------------------------------------------------
        elif self.path == '/api/ingest_lead_save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            params = json.loads(post_data.decode('utf-8'))

            lead_data = {
                "nome": params.get("nome", ""),
                "empresa": params.get("empresa", ""),
                "cargo": params.get("cargo", ""),
                "url": params.get("url", ""),
                "email": params.get("email", ""),
                "telefone": params.get("telefone", ""),
                "aniversario": params.get("aniversario", ""),
                "passo1": params.get("passo1", ""),
                "passo2": params.get("passo2", ""),
                "passo3": params.get("passo3", ""),
            }
            campaign_name = params.get("campaign", "Geral")

            try:
                success, saved_campaign = append_lead_to_csv(campaign_name, lead_data)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': success, 'campaign': saved_campaign}).encode('utf-8'))
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))


        elif path == '/api/agent_alerts':
            events = get_engagement_events()
            # Logic: If Edilberto or Renato have recent opens, return a smart prompt
            alerts = []
            for evt in events[-5:]: # Last 5 events
                lead_name = evt.get('name', 'Lead')
                company = evt.get('company', 'Empresa')
                action = evt.get('event', 'abriu o email')
                alerts.append({
                    "id": evt.get('id', int(time.time())),
                    "message": f"🚨 ALERTA QUENTE: {lead_name} ({company}) acabou de {action}. Sugestão: Faça o Cold Call agora!",
                    "lead_name": lead_name,
                    "company": company
                })
            # Add a mock alert if empty just for UI demonstration of the Sales Engagement agent
            if not alerts:
                 alerts.append({
                    "id": 999,
                    "message": "💡 ALERTA ROAR: Renato Arroyo (Kepler Weber) engajou com seu artigo sobre Subvenções há 10 minutos. Sugestão: Iniciar Warm Call.",
                    "lead_name": "Renato Arroyo",
                    "company": "Kepler Weber"
                 })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(alerts).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()


# --- FRONTEND (HTML / CSS / JS) ---
INDEX_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaxManagers B2B - Painel de Prospecção</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #0B0F19;
            --bg-sidebar: #0F172A;
            --bg-card: #1E293B;
            --border-color: #334155;
            --text-primary: #F8FAFC;
            --text-secondary: #94A3B8;
            --accent-purple: #8B5CF6;
            --accent-purple-hover: #7C3AED;
            --accent-blue: #3B82F6;
            --accent-cyan: #06B6D4;
            --accent-green: #10B981;
            --accent-yellow: #F59E0B;
            --accent-red: #EF4444;
            --accent-orange: #F97316;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-main);
            color: var(--text-primary);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background-color: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .logo-container {
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 34px;
            height: 34px;
            background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 16px;
            color: white;
            flex-shrink: 0;
        }

        .logo-text {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 18px;
            background: linear-gradient(to right, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-secondary);
            margin-bottom: 10px;
        }

        .campaign-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 24px;
        }

        .campaign-item {
            padding: 10px 14px;
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .campaign-item:hover {
            background-color: rgba(255, 255, 255, 0.07);
            border-color: var(--border-color);
        }

        .campaign-item.active {
            background: linear-gradient(to right, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.05));
            border-color: var(--accent-purple);
        }

        .campaign-name { font-size: 13px; font-weight: 500; }

        .sidebar-stats {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background-color: rgba(255, 255, 255, 0.02);
            padding: 14px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            margin-top: auto;
        }

        .stat-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .stat-label { color: var(--text-secondary); }
        .stat-value { font-weight: 600; }

        /* Main Content */
        .main-content { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; }

        /* Top Bar */
        .top-bar {
            padding: 16px 28px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            background-color: rgba(15, 23, 42, 0.3);
            backdrop-filter: blur(10px);
            flex-wrap: wrap;
        }

        .campaign-title-container h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 700;
        }

        .campaign-subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

        .top-bar-right {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        /* Search */
        .search-wrapper { display: flex; align-items: center; gap: 8px; }

        .search-container { position: relative; width: 280px; }

        .search-input {
            width: 100%;
            padding: 9px 14px 9px 34px;
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 13px;
            outline: none;
            transition: all 0.2s ease;
        }

        .search-input:focus {
            border-color: var(--accent-purple);
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .search-input::placeholder { color: var(--text-secondary); }

        .search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 14px;
            color: var(--text-secondary);
            pointer-events: none;
        }

        .global-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--text-secondary);
            cursor: pointer;
            white-space: nowrap;
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background: rgba(255,255,255,0.02);
            transition: all 0.2s;
        }
        .global-toggle:hover { color: var(--text-primary); border-color: var(--accent-purple); }
        .global-toggle.active { color: var(--accent-cyan); border-color: var(--accent-cyan); background: rgba(6, 182, 212, 0.08); }

        .global-toggle input[type="checkbox"] { accent-color: var(--accent-cyan); width: 14px; height: 14px; cursor: pointer; }

        /* Ingest Button */
        .btn-ingest {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 16px;
            background: linear-gradient(135deg, #F97316, #EF4444);
            color: white;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            outline: none;
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .btn-ingest:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(249, 115, 22, 0.45);
        }

        /* Filter Tabs */
        .filter-tabs-container {
            padding: 10px 28px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            gap: 8px;
            overflow-x: auto;
        }

        .filter-tab {
            padding: 6px 14px;
            background: none;
            border: 1px solid transparent;
            border-radius: 20px;
            color: var(--text-secondary);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .filter-tab:hover { color: var(--text-primary); background-color: rgba(255, 255, 255, 0.03); }
        .filter-tab.active { background-color: rgba(139, 92, 246, 0.15); color: #d8b4fe; border-color: rgba(139, 92, 246, 0.3); }

        /* Leads Viewport */
        .leads-viewport { flex: 1; padding: 28px; overflow-y: auto; }

        .leads-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
            gap: 20px;
        }

        @media (max-width: 1100px) { .leads-grid { grid-template-columns: 1fr; } }

        /* Lead Card */
        .lead-card {
            background-color: rgba(30, 41, 59, 0.45);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            position: relative;
            overflow: hidden;
        }

        .lead-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 4px; height: 100%;
            background-color: var(--border-color);
            transition: background-color 0.2s ease;
        }

        .lead-card.status-pendente::before { background-color: var(--text-secondary); }
        .lead-card.status-p1::before { background-color: var(--accent-blue); }
        .lead-card.status-p2::before { background-color: var(--accent-purple); }
        .lead-card.status-p3::before { background-color: var(--accent-cyan); }
        .lead-card.status-respondido::before { background-color: var(--accent-green); }

        .lead-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            border-color: rgba(255, 255, 255, 0.08);
        }

        .lead-header { display: flex; gap: 14px; align-items: flex-start; }

        .lead-avatar {
            width: 44px; height: 44px;
            border-radius: 10px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif;
            font-weight: 700; font-size: 16px; color: white; flex-shrink: 0;
        }

        .lead-meta { flex: 1; overflow: hidden; }

        .lead-name-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }

        .lead-name { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .lead-status-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }

        .badge-pendente { background-color: #475569; color: #f1f5f9; }
        .badge-p1 { background-color: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-p2 { background-color: rgba(139, 92, 246, 0.2); color: #d8b4fe; border: 1px solid rgba(139, 92, 246, 0.3); }
        .badge-p3 { background-color: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.3); }
        .badge-respondido { background-color: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-campaign { background-color: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }

        .lead-role { font-size: 12px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lead-company { font-size: 11px; font-weight: 500; color: var(--accent-cyan); margin-top: 2px; }

        .cadence-container { display: flex; flex-direction: column; gap: 10px; }

        .step-block { border: 1px solid #334155; border-radius: 8px; overflow: hidden; background-color: rgba(15, 23, 42, 0.2); }

        .step-header {
            padding: 8px 12px;
            background-color: rgba(15, 23, 42, 0.4);
            border-bottom: 1px solid #334155;
            display: flex; justify-content: space-between; align-items: center;
            font-size: 11px; font-weight: 600;
        }

        .step-title-text { display: flex; align-items: center; gap: 6px; }
        .step-body { padding: 12px; font-size: 12px; line-height: 1.5; color: var(--text-primary); }
        .step-actions { display: flex; justify-content: flex-end; margin-top: 8px; gap: 6px; }

        .btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 7px 12px; border-radius: 6px;
            font-size: 11px; font-weight: 600; cursor: pointer;
            transition: all 0.2s ease; border: none; outline: none;
        }

        .btn-copy { background-color: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); }
        .btn-copy:hover { background-color: rgba(255, 255, 255, 0.1); }
        .btn-primary-action { background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue)); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); }
        .btn-primary-action:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35); }
        .btn-linkedin { background-color: #0077b5; color: white; }
        .btn-linkedin:hover { background-color: #006097; }

        .card-footer { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
        .footer-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }

        .status-button-group { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }

        .status-btn {
            padding: 7px 2px; border-radius: 5px; font-size: 9px; font-weight: 700;
            text-align: center; cursor: pointer;
            background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color);
            color: var(--text-secondary); transition: all 0.2s ease;
            display: flex; align-items: center; justify-content: center; outline: none;
        }
        .status-btn:hover { background-color: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
        .status-btn.active-pendente { background: #475569; border-color: #64748b; color: white; }
        .status-btn.active-p1 { background: rgba(59, 130, 246, 0.2); border-color: var(--accent-blue); color: #93c5fd; }
        .status-btn.active-p2 { background: rgba(139, 92, 246, 0.2); border-color: var(--accent-purple); color: #d8b4fe; }
        .status-btn.active-p3 { background: rgba(6, 182, 212, 0.2); border-color: var(--accent-cyan); color: #67e8f9; }
        .status-btn.active-respondido { background: rgba(16, 185, 129, 0.2); border-color: var(--accent-green); color: #6ee7b7; }

        .empty-state {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            height: 100%; color: var(--text-secondary); text-align: center; padding: 40px;
        }
        .empty-state h3 { font-family: 'Outfit', sans-serif; color: var(--text-primary); font-size: 18px; margin-bottom: 8px; }
        .empty-state p { max-width: 380px; font-size: 13px; line-height: 1.5; }

        /* Toast */
        .toast-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 99999; }
        .toast {
            background-color: #1e293b; border-left: 4px solid var(--accent-purple); color: var(--text-primary);
            padding: 14px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
            display: flex; align-items: center; gap: 10px;
            animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .toast-success { border-left-color: var(--accent-green); }
        .toast-error { border-left-color: var(--accent-red); }

        /* ===== MODALS SHARED ===== */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(11, 15, 25, 0.88); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .modal-overlay.open { opacity: 1; pointer-events: all; }
        .agent-modal {
            background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px;
            width: 820px; max-width: 96vw; max-height: 92vh;
            display: flex; flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); overflow: hidden;
            transform: translateY(24px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-overlay.open .agent-modal { transform: translateY(0); }
        .modal-header {
            padding: 18px 22px; border-bottom: 1px solid var(--border-color);
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(15, 23, 42, 0.5);
        }
        .modal-title { font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .close-modal { cursor: pointer; color: var(--text-secondary); font-size: 22px; line-height: 1; transition: color 0.2s; }
        .close-modal:hover { color: white; }
        .modal-body { padding: 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }

        /* Drop Zone */
        .drop-zone {
            border: 2px dashed var(--border-color); border-radius: 12px; padding: 24px;
            text-align: center; color: var(--text-secondary); cursor: pointer;
            transition: all 0.2s ease; position: relative; background: rgba(255,255,255,0.02);
            min-height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        }
        .drop-zone.drag-over { border-color: var(--accent-purple); background: rgba(139, 92, 246, 0.1); color: var(--text-primary); }
        .drop-zone.selected-zone { border-color: var(--accent-purple); box-shadow: 0 0 8px rgba(139, 92, 246, 0.4); background: rgba(139, 92, 246, 0.04); color: var(--text-primary); }
        .drop-zone img { max-height: 140px; border-radius: 8px; margin-top: 8px; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

        .select-thesis {
            padding: 10px 14px; background: var(--bg-main); border: 1px solid var(--border-color);
            border-radius: 8px; color: var(--text-primary); width: 100%; outline: none; font-size: 13px;
        }
        .select-thesis:focus { border-color: var(--accent-purple); }

        /* Agent console */
        .agent-console {
            background: #060a14; border-radius: 8px; padding: 14px; font-family: monospace;
            font-size: 12px; color: #10B981; min-height: 60px; display: none; border: 1px solid #1e293b;
            max-height: 200px; overflow-y: auto;
        }

        .typing-indicator { display: inline-block; width: 7px; height: 14px; background: #10B981; animation: blink 1s step-end infinite; vertical-align: bottom; margin-left: 2px; }
        @keyframes blink { 50% { opacity: 0; } }

        .generated-options { display: none; flex-direction: column; gap: 14px; }
        .option-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; }
        .option-header { font-size: 11px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; }

        /* ===== INGEST MODAL SPECIFIC ===== */
        #ingestModal .agent-modal { width: 860px; }

        .ingest-step-indicator {
            display: flex; align-items: center; gap: 0; margin-bottom: 4px;
        }
        .ingest-step {
            flex: 1; text-align: center; padding: 8px; font-size: 11px; font-weight: 600;
            color: var(--text-secondary); border-bottom: 2px solid var(--border-color);
            transition: all 0.3s;
        }
        .ingest-step.active { color: var(--accent-cyan); border-bottom-color: var(--accent-cyan); }
        .ingest-step.done { color: var(--accent-green); border-bottom-color: var(--accent-green); }

        /* Ingest Preview Fields */
        .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .preview-field { display: flex; flex-direction: column; gap: 4px; }
        .preview-field label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .preview-field input, .preview-field textarea {
            padding: 9px 12px; background: var(--bg-main); border: 1px solid var(--border-color);
            border-radius: 7px; color: var(--text-primary); font-size: 13px; outline: none;
            transition: border-color 0.2s; resize: vertical;
        }
        .preview-field input:focus, .preview-field textarea:focus { border-color: var(--accent-purple); }

        .campaign-suggestion {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px; border-radius: 10px;
            background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.05));
            border: 1px solid rgba(249, 115, 22, 0.3);
        }
        .campaign-suggestion .label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .campaign-suggestion .value { font-size: 15px; font-weight: 700; color: #fb923c; font-family: 'Outfit', sans-serif; }
        .campaign-suggestion .new-badge { background: rgba(249, 115, 22, 0.2); color: #fb923c; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; border: 1px solid rgba(249, 115, 22, 0.4); }

        .campaign-select-row { display: flex; align-items: center; gap: 10px; }
        .campaign-select-row select { flex: 1; }
        .btn-ingest-save {
            padding: 11px 22px; background: linear-gradient(135deg, #F97316, #EF4444);
            color: white; border-radius: 8px; font-size: 13px; font-weight: 700;
            cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            transition: all 0.2s;
        }
        .btn-ingest-save:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(249, 115, 22, 0.45); }

        .ingest-log-line { display: block; line-height: 1.6; }
        .ingest-log-line:last-child { color: #a7f3d0; }

        /* Search global result badge */
        .campaign-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 2px 8px; border-radius: 10px;
            background: rgba(249, 115, 22, 0.12); color: #fb923c;
            border: 1px solid rgba(249, 115, 22, 0.25); font-size: 10px; font-weight: 700;
        }

        .global-search-notice {
            padding: 8px 28px; font-size: 12px; color: var(--accent-cyan);
            background: rgba(6, 182, 212, 0.05); border-bottom: 1px solid rgba(6, 182, 212, 0.1);
            display: none;
        }
    
        /* Login Overlay */
        #loginOverlay {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: var(--bg-main);
            z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            flex-direction: column;
        }
        .login-box {
            background: var(--bg-card);
            padding: 40px; border-radius: 12px;
            border: 1px solid var(--border-color);
            width: 320px; text-align: center;
        }
        .login-box input {
            width: 100%; margin-top: 15px;
            box-sizing: border-box;
        }
        .login-box button {
            width: 100%; margin-top: 20px;
        }
        
        .partner-widget {
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid var(--accent-purple);
            border-radius: 8px;
            padding: 15px;
            margin: 20px;
            color: white;
            display: none;
        }
        .tier-badge {
            background: var(--accent-purple);
            padding: 4px 8px; border-radius: 12px;
            font-size: 11px; font-weight: bold;
        }

    </style>
</head>
<body>

    <!-- LOGIN OVERLAY -->
    <div id="loginOverlay" style="display:none;">
        <div class="login-box">
            <h2 style="color:white; margin-top:0;">TaxManagers</h2>
            <p style="color:var(--text-secondary); font-size:14px;">Acesso Parceiro</p>
            <input type="text" id="loginUser" class="search-input" placeholder="Usuário (ex: parceiro1)">
            <input type="password" id="loginPass" class="search-input" placeholder="Senha">
            <button class="btn btn-primary-action" onclick="doLogin()">Entrar</button>
            <div id="loginError" style="color:#ef4444; margin-top:10px; font-size:13px; display:none;"></div>
        </div>
    </div>

    <div class="sidebar">

    <div class="partner-widget" id="partnerWidget">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong id="partnerName">Partner</strong>
            <span class="tier-badge" id="partnerTier">Faixa</span>
        </div>
        <div style="margin-top:10px; font-size:18px; font-weight:bold; color:#10b981;">
            R$ <span id="partnerBalance">0,00</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary);">Comissões (30%)</div>
        
        <button class="btn btn-primary-action" style="width:100%; margin-top:15px; font-size:12px; padding:8px;" onclick="requestLeads()">📥 Puxar 50 Leads</button>
        <button class="btn" style="width:100%; margin-top:10px; font-size:12px; padding:8px; border-color:var(--border-color); color:var(--text-secondary);" onclick="doLogout()">Sair da Conta</button>
    </div>

        <div class="logo-container">
            <div class="logo-icon">TM</div>
            <div class="logo-text">TaxManagers</div>
        </div>

        <h2 class="section-title">Campanhas Ativas</h2>
        <ul class="campaign-list" id="campaignList">
            <!-- Loaded dynamically -->
        </ul>

        <div class="sidebar-stats" id="sidebarStats" style="display: none;">
            <h2 class="section-title" style="margin-bottom: 4px;">Métricas</h2>
            <div class="stat-row"><span class="stat-label">Total Leads</span><span class="stat-value" id="statTotal">0</span></div>
            <div class="stat-row"><span class="stat-label">⏳ Pendentes</span><span class="stat-value" id="statPendente">0</span></div>
            <div class="stat-row"><span class="stat-label">🔵 Passo 1</span><span class="stat-value" id="statP1">0</span></div>
            <div class="stat-row"><span class="stat-label">🟣 Passo 2</span><span class="stat-value" id="statP2">0</span></div>
            <div class="stat-row"><span class="stat-label">🟢 Passo 3</span><span class="stat-value" id="statP3">0</span></div>
            <div class="stat-row"><span class="stat-label">🔥 Respondido</span><span class="stat-value" id="statResp">0</span></div>
        </div>
    </div>

    <div class="main-content">
        <div class="top-bar">
            <div class="campaign-title-container">
                <h1 id="activeCampaignName">Painel de Prospecção</h1>
                <div class="campaign-subtitle" id="activeCampaignSubtitle">Selecione uma campanha ou use a busca global.</div>
            </div>
            <div class="top-bar-right">
                <div class="search-wrapper">
                    <div class="search-container">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" id="searchInput" placeholder="Buscar por nome, empresa...">
                    </div>
                    <label class="global-toggle" id="globalToggle">
                        <input type="checkbox" id="globalSearchCheck"> 🌐 Global
                    </label>
                </div>
                <button class="btn btn-copy" id="btnReload" onclick="actionReloadCurrentCampaign()" style="height: 38px; padding: 0 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                    🔄 Atualizar
                </button>
                <button class="btn-ingest" id="btnOpenIngest" onclick="openIngestModal()">
                    ⚡ + Lead via Print
                </button>
            </div>
        </div>

        <div id="globalSearchNotice" class="global-search-notice">
            🌐 Modo de Busca Global Ativo — pesquisando em todas as campanhas
        </div>

        <div class="filter-tabs-container" id="filterTabs" style="display: none;">
            <button class="filter-tab active" data-filter="Todos">Todos</button>
            <button class="filter-tab" data-filter="Pendente">⏳ Pendentes</button>
            <button class="filter-tab" data-filter="Passo 1 Enviado">🔵 Passo 1</button>
            <button class="filter-tab" data-filter="Passo 2 Enviado">🟣 Passo 2</button>
            <button class="filter-tab" data-filter="Passo 3 Enviado">🟢 Passo 3</button>
            <button class="filter-tab" data-filter="Respondido">🔥 Respondidos</button>
        </div>

        <div class="leads-viewport">
            
        <!-- Bookmarklet Help Section -->
        <div id="bookmarkletInstallSection" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; color: var(--accent-purple);">&#128279; Instalar Bot&#227;o de Captura do LinkedIn</h3>
            <p style="font-size: 0.9em; margin-bottom: 12px; color: var(--text-secondary);">
                <strong>Como instalar:</strong><br>
                1&#176; Clique em <strong>&#128203; Copiar C&#243;digo</strong> abaixo.<br>
                2&#176; No Chrome: aperte <strong>Ctrl+Shift+O</strong> &rarr; clique em &ldquo;+ Adicionar&rdquo; &rarr; cole o c&#243;digo no campo <strong>URL</strong>.<br>
                3&#176; Use o favorito quando estiver no perfil de um lead no LinkedIn.
            </p>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
                <span id="bookmarkletAnchorWrap">
                    <a id="bookmarkletDragBtn" href="#" style="display:inline-block; background:var(--accent-purple); color:#fff; padding:8px 16px; border-radius:6px; font-weight:bold; text-decoration:none; cursor:grab;" title="Arraste para a barra de favoritos">
                        &#128640; Capturar Lead (Arraste para Favoritos)
                    </a>
                </span>
                <button onclick="copyBookmarkletCode()" style="background:var(--accent-blue); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.9em;">
                    &#128203; Copiar C&#243;digo
                </button>
                <span id="bookmarkletCopyMsg" style="color:var(--accent-green); font-size:0.85em; display:none;">&#9989; Copiado! Cole no campo URL de um favorito novo.</span>
            </div>
            <script>
            (function() {
                var ORIGIN = window.location.origin;
                var js = '(function(){try{'
                  + 'var nameNode=document.querySelector("h1.text-heading-xlarge")||document.querySelector(".pv-text-details__left-panel h1")||document.querySelector(".text-heading-xlarge")||document.querySelector("main h1")||document.querySelector("h1");'
                  + 'var name=nameNode?nameNode.innerText.trim():"";'
                  + 'if(!name||name.length<2){var h1s=Array.from(document.querySelectorAll("h1"));var v=h1s.find(function(h){return h.innerText.trim().length>1;});if(v)name=v.innerText.trim();}'
                  + 'var roleNode=document.querySelector(".pv-text-details__left-panel .text-body-medium")||document.querySelector(".text-body-medium.break-words")||document.querySelector("main .text-body-medium")||document.querySelector(".text-body-medium");'
                  + 'var rawRole=roleNode?roleNode.innerText.trim():"";'
                  + 'if(!rawRole){var hn=document.querySelector("[data-field=\\"headline\\"]");if(hn)rawRole=hn.innerText.trim();}'
                  + 'var role=rawRole,company="";'
                  + 'if(rawRole.indexOf(" at ")>-1){var p=rawRole.split(" at ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" na ")>-1){var p=rawRole.split(" na ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" no ")>-1){var p=rawRole.split(" no ");role=p[0].trim();company=p[1].trim();}'
                  + 'else if(rawRole.indexOf(" em ")>-1){var p=rawRole.split(" em ");role=p[0].trim();company=p[1].trim();}'
                  + 'if(!name){name=prompt("Digite o nome do lead:");if(!name)return;name=name.trim();}'
                  + 'if(!role){var uc=prompt("Digite cargo e empresa (ex: CFO na Empresa X):");if(uc){rawRole=uc.trim();role=rawRole;if(rawRole.indexOf(" na ")>-1){var p=rawRole.split(" na ");role=p[0].trim();company=p[1].trim();}}}'
                  + 'var url=window.location.href;'
                  + 'var email="";var emailNode=Array.from(document.querySelectorAll("a")).filter(function(a){return a.href.indexOf("mailto:")===0;})[0];if(emailNode)email=emailNode.href.replace("mailto:","").trim();'
                  + 'var chatHistory="";var msgs=document.querySelectorAll(".msg-s-message-list__event,.msg-s-event-listitem");'
                  + 'if(msgs.length>0){chatHistory=Array.from(msgs).map(function(el){var sn=el.querySelector(".msg-s-message-group__name");var sender=sn?sn.innerText.trim():"Contato";var tn=el.querySelector(".msg-s-event-listitem__body");var text=tn?tn.innerText.trim():"";return text?sender+": "+text:"";}).filter(function(t){return t!=="";}).slice(-8).join("\\n");}'
                  + 'var inputStr=prompt("Capturado:\\n"+name+"\\n"+(company?role+" na "+company:role)+"\\n\\nAcao:\\n1-Importar\\n2-Curtiu Artigo\\n3-Newsletter\\n4-Respondeu Chat\\n5-Aceitou Conexao\\n\\nOu cole a conversa:","1");'
                  + 'if(!inputStr)return;inputStr=inputStr.trim();'
                  + 'var action="Importado";'
                  + 'if(inputStr==="1")action="Importado";'
                  + 'else if(inputStr==="2")action="Curtiu Artigo";'
                  + 'else if(inputStr==="3")action="Assinou Newsletter";'
                  + 'else if(inputStr==="4")action="Respondeu Chat";'
                  + 'else if(inputStr==="5")action="Aceitou Conexao";'
                  + 'else if(inputStr.length>5){action="Respondeu Chat";chatHistory=inputStr;if(chatHistory.length>10000){chatHistory=chatHistory.substring(chatHistory.length-10000);}}'
                  + 'var importUrl="' + ORIGIN + '/api/import_page?name="+encodeURIComponent(name)+"&role="+encodeURIComponent(role)+"&company="+encodeURIComponent(company)+"&url="+encodeURIComponent(url)+"&action="+encodeURIComponent(action)+"&email="+encodeURIComponent(email)+"&chat_history="+encodeURIComponent(chatHistory);'
                  + 'window.open(importUrl,"_blank","width=500,height=400");'
                  + '}catch(e){alert("Erro no bookmarklet: "+e);}})();';
                var fullCode = 'javascript:' + js;
                window._bookmarkletCode = fullCode;
                var a = document.getElementById('bookmarkletDragBtn');
                if(a) a.href = fullCode;
            })();
            function copyBookmarkletCode() {
                if(!window._bookmarkletCode){ alert('Codigo nao gerado, recarregue a pagina.'); return; }
                if(navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(window._bookmarkletCode).then(function(){
                        var m = document.getElementById('bookmarkletCopyMsg');
                        if(m){ m.style.display='inline'; setTimeout(function(){ m.style.display='none'; }, 5000); }
                    }).catch(function(){
                        prompt('Copie tudo abaixo (Ctrl+A, Ctrl+C):', window._bookmarkletCode);
                    });
                } else {
                    prompt('Copie tudo abaixo (Ctrl+A, Ctrl+C):', window._bookmarkletCode);
                }
            }
            </script>
        </div>

        </div>

        <!-- Frutas Baixas Section -->
        <div id="frutas-baixas" style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent-green); border-radius: 8px; padding: 16px; margin-bottom: 24px; display: none;">
            <h3 style="color: var(--accent-green); margin-top: 0;">🍎 Frutas Baixas (Oportunidades Quentes)</h3>
            <div id="frutas-baixas-content" style="color: var(--text-primary); font-size: 0.95em;"></div>
        </div>

        <div id="leadsList" class="leads-grid">

                <div class="empty-state">
                    <h3>🎯 Painel Pronto</h3>
                    <p>Selecione uma campanha na barra lateral, use a busca global para encontrar qualquer lead, ou clique em <strong>⚡ + Lead via Print</strong> para cadastrar um novo contato.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="toast-container" id="toastContainer"></div>

    <!-- ==================== MODAL: AGENT HYPER-PERSONALIZE ==================== -->
    <div class="modal-overlay" id="agentModalOverlay">
        <div class="agent-modal">
            <div class="modal-header">
                <div class="modal-title">🤖 IA Agentic: Hyper-Personalizar</div>
                <div class="close-modal" onclick="closeAgentModal()">&times;</div>
            </div>
            <div class="modal-body">
                <div>
                    <div style="font-size: 12px; font-weight: 600; margin-bottom:8px; color:var(--text-secondary);">1. Insira o perfil do Decisor (LinkedIn)</div>
                    <div class="drop-zone" id="dropZone">
                        <div id="dropText">Dê <b>Ctrl+V</b> aqui para colar o print do perfil<br>ou arraste uma imagem/PDF.</div>
                        <img id="previewImage" src="" alt="Preview">
                        <div>
                            <label for="fileInputProfile" class="btn btn-copy" style="cursor:pointer; font-size:11px; margin-top:8px;">
                                📂 Selecionar Arquivo (JPG, PNG, PDF)
                            </label>
                            <input type="file" id="fileInputProfile" accept="image/*,.pdf" style="display:none;">
                        </div>
                    </div>
                </div>
                <div>
                    <div style="font-size: 12px; font-weight: 600; margin-bottom:8px; color:var(--text-secondary);">2. Foco Tributário</div>
                    <select class="select-thesis" id="thesisSelect">
                        <option value="Automático">Automático (IA decide baseada na pesquisa)</option>
                        <option value="Parceria Mentofranquia">Parceria Mentofranquia Taxmanagers</option>
                        <option value="Revisão de PIS/COFINS">Revisão de PIS/COFINS</option>
                        <option value="Subvenções para Investimento / ICMS">Subvenções para Investimento / ICMS</option>
                        <option value="Limitação de Compensação Judicial">Limitação de Compensação Judicial (Recente)</option>
                        <option value="Exclusão do ICMS da base do PIS/COFINS (Entendimento do STF)">Exclusão do ICMS da base do PIS/COFINS</option>
                    </select>
                    <button class="btn btn-primary-action" id="btnSuggestThesis" onclick="sugerirTese()" style="background: var(--accent-blue); margin-top: 8px; width: 100%;">
                        🧠 Sugerir Tese e Abordagem Rápida (IA)
                    </button>
                    <div id="tese-result" style="margin-top: 10px; font-size: 0.9em; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; display: none; line-height: 1.4;"></div>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary-action" id="btnGenerate" onclick="runAgentWorkflow()">🚀 Iniciar Pesquisa e Geração</button>
                </div>
                <div class="agent-console" id="agentConsole">
                    <span id="consoleText">Iniciando Agente...</span><span class="typing-indicator"></span>
                </div>
                <div id="modelIndicator" style="display:none; font-size:11px; color:var(--text-secondary); text-align:right; gap:4px; align-items:center; justify-content:flex-end;">
                    ⚡ via <span id="lblModelUsed" style="font-weight:600; color:var(--accent-cyan); background:rgba(6, 182, 212, 0.1); padding:2px 6px; border-radius:4px;">Llama 3.3 70B</span>
                </div>
                <div class="generated-options" id="generatedOptions">
                    <div class="option-card">
                        <div class="option-header"><span>Opção 1: Connection Request (Curto)</span></div>
                        <textarea class="select-thesis" id="txtShortNote" rows="4"></textarea>
                        <div style="margin-top:10px; text-align:right;">
                            <button class="btn btn-primary-action" onclick="saveAndUse('short_note')">Salvar e Usar Esta</button>
                        </div>
                    </div>
                    <div class="option-card">
                        <div class="option-header"><span style="color:var(--accent-purple);">Opção 2: Inmail / Cold Mail</span></div>
                        <textarea class="select-thesis" id="txtLongEmail" rows="6"></textarea>
                        <div style="margin-top:10px; text-align:right;">
                            <button class="btn btn-primary-action" onclick="saveAndUse('long_email')" style="background:var(--accent-purple);">Salvar e Usar Esta</button>
                        </div>
                    </div>
                    <div class="option-card">
                        <div class="option-header"><span style="color:var(--accent-green);">Opção 3: Passo 2 - Envio de Artigo (Pós-Aceite)</span></div>
                        <textarea class="select-thesis" id="txtArticlePitch" rows="5"></textarea>
                        <div style="margin-top:10px; text-align:right;">
                            <button class="btn btn-primary-action" onclick="saveAndUse('article_pitch')" style="background:var(--accent-green);">Salvar e Usar Esta</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ==================== MODAL: INGEST LEAD VIA PRINT ==================== -->
    <div class="modal-overlay" id="ingestModal">
        <div class="agent-modal" style="width: 860px;">
            <div class="modal-header">
                <div class="modal-title">⚡ Cadastrar Novo Lead via Print do Perfil</div>
                <div class="close-modal" onclick="closeIngestModal()">&times;</div>
            </div>
            <div class="modal-body">
                <!-- Step indicators -->
                <div class="ingest-step-indicator">
                    <div class="ingest-step active" id="istep1">1. Upload do Print</div>
                    <div class="ingest-step" id="istep2">2. IA Investigando</div>
                    <div class="ingest-step" id="istep3">3. Revisar e Aprovar</div>
                </div>

                <!-- Step 1: Upload -->
                <div id="ingestStep1">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">1. Print ou PDF do Perfil (Obrigatório)</div>
                            <div class="drop-zone selected-zone" id="ingestDropZone">
                                <div id="ingestDropText">🖼️ Cole (Ctrl+V) aqui ou arraste o print do perfil</div>
                                <img id="ingestPreviewImg" src="" alt="Preview" style="max-height:120px; border-radius:8px; display:none;">
                                <div style="margin-top:10px;">
                                    <label for="ingestFileInput" class="btn btn-copy" style="cursor:pointer; font-size:11px;">
                                        📂 Selecionar Perfil
                                    </label>
                                    <input type="file" id="ingestFileInput" accept="image/*,.pdf" style="display:none;">
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">2. Print de Contato (Opcional - E-mail, Fone, Aniv)</div>
                            <div class="drop-zone" id="ingestContactDropZone">
                                <div id="ingestContactDropText">📇 Cole (Ctrl+V) aqui ou arraste o print de contatos</div>
                                <img id="ingestContactPreviewImg" src="" alt="Preview" style="max-height:120px; border-radius:8px; display:none;">
                                <div style="margin-top:10px;">
                                    <label for="ingestContactFileInput" class="btn btn-copy" style="cursor:pointer; font-size:11px;">
                                        📂 Selecionar Contato
                                    </label>
                                    <input type="file" id="ingestContactFileInput" accept="image/*" style="display:none;">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:12px;">
                        <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">Link do Perfil LinkedIn (Opcional)</div>
                        <input type="text" id="ingestLinkedinUrl" class="select-thesis" placeholder="https://www.linkedin.com/in/nome-do-lead..." style="font-size:13px; height:40px;">
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-top:14px;">
                        <button class="btn btn-primary-action" id="btnIngestAnalyze" onclick="runIngestWorkflow()" style="background: linear-gradient(135deg, #F97316, #EF4444); box-shadow: 0 4px 12px rgba(249,115,22,0.3);">
                            🔍 Investigar e Classificar Lead
                        </button>
                    </div>
                </div>

                <!-- Step 2: AI Processing Console -->
                <div id="ingestStep2" style="display:none;">
                    <div class="agent-console" id="ingestConsole" style="display:block; min-height:160px;">
                        <span id="ingestConsoleText"></span><span class="typing-indicator"></span>
                    </div>
                </div>

                <!-- Step 3: Preview & Approve -->
                <div id="ingestStep3" style="display:none;">
                    <div id="duplicateWarning" style="display:none; padding:12px 16px; background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); border-radius:8px; color:#fca5a5; font-size:13px; font-weight:500; margin-bottom:14px; align-items:center; gap:8px;">
                        ⚠️ <b>Atenção:</b> Este lead já está cadastrado na campanha <span id="duplicateCampaignName" style="font-weight:700; color:white;"></span>.
                    </div>
                    <div id="ingestModelBadge" style="font-size:11px; color:var(--text-secondary); text-align:right; margin-bottom:8px;">
                        ⚡ via <span id="ingestModelLabel" style="font-weight:600; color:var(--accent-cyan); background:rgba(6,182,212,0.1); padding:2px 6px; border-radius:4px;"></span>
                    </div>
                    <div class="preview-grid">
                        <div class="preview-field">
                            <label>Nome Completo</label>
                            <input type="text" id="prevNome" placeholder="Nome detectado pela IA">
                        </div>
                        <div class="preview-field">
                            <label>Cargo</label>
                            <input type="text" id="prevCargo" placeholder="Cargo detectado">
                        </div>
                        <div class="preview-field">
                            <label>Empresa</label>
                            <input type="text" id="prevEmpresa" placeholder="Empresa detectada">
                        </div>
                        <div class="preview-field">
                            <label>URL LinkedIn</label>
                            <input type="text" id="prevUrl" placeholder="https://linkedin.com/in/...">
                        </div>
                        <div class="preview-field">
                            <label>📧 E-mail</label>
                            <input type="text" id="prevEmail" placeholder="e-mail detectado">
                        </div>
                        <div class="preview-field">
                            <label>📞 Telefone</label>
                            <input type="text" id="prevTelefone" placeholder="telefone detectado">
                        </div>
                        <div class="preview-field" style="grid-column: 1 / -1;">
                            <label>📅 Aniversário</label>
                            <input type="text" id="prevAniversario" placeholder="aniversário detectado (ex: 3 de janeiro)">
                        </div>
                        <div class="preview-field" style="grid-column: 1 / -1;">
                            <label>✉️ Passo 1 — Conexão (Connection Request)</label>
                            <textarea id="prevPasso1" rows="3"></textarea>
                        </div>
                        <div class="preview-field" style="grid-column: 1 / -1;">
                            <label>📰 Passo 2 — Newsletter</label>
                            <textarea id="prevPasso2" rows="3"></textarea>
                        </div>
                        <div class="preview-field" style="grid-column: 1 / -1;">
                            <label>🩺 Passo 3 — Diagnóstico</label>
                            <textarea id="prevPasso3" rows="3"></textarea>
                        </div>
                    </div>

                    <div id="campaignSuggestion" class="campaign-suggestion" style="margin-top:12px;">
                        <div>
                            <div class="label">Campanha Sugerida pela IA</div>
                            <div class="value" id="prevCampaignName">—</div>
                        </div>
                        <span class="new-badge" id="newCampaignBadge" style="display:none;">🆕 Novo Setor</span>
                    </div>

                    <div class="campaign-select-row" style="margin-top:10px;">
                        <div style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">Ou escolha manualmente:</div>
                        <select class="select-thesis" id="prevCampaignSelect" style="flex:1; height:38px;">
                        </select>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; gap:10px;">
                        <button class="btn btn-copy" onclick="resetIngestModal()" style="flex-shrink:0;">← Novo Upload</button>
                        <button class="btn-ingest-save" id="btnSaveLead" onclick="saveLead()">
                            ✅ Aprovar e Salvar no CRM
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentCampaign = '';
        let leadsData = [];
        let activeFilter = 'Todos';
        let isGlobalSearch = false;
        let searchTimeout = null;
        let currentPage = 1;
        const pageSize = 50;

        // ========== CAMPAIGNS ==========
        
    let currentUser = null;
    
    async function checkSession() {
        try {
            const res = await fetch('/api/session');
            const data = await res.json();
            if(data.logged_in) {
                currentUser = data.user;
                document.getElementById('loginOverlay').style.display = 'none';
                
                if(currentUser.role !== 'admin') {
                    document.getElementById('partnerWidget').style.display = 'block';
                    document.getElementById('partnerName').innerText = currentUser.name;
                    document.getElementById('partnerTier').innerText = currentUser.tier || 'Faixa Branca';
                    document.getElementById('partnerBalance').innerText = parseFloat(currentUser.balance || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2});
                    
                    document.getElementById('campaignList').style.display = 'none';
                    // Auto load CRM_Unificado
                    selectCampaign('CRM_Unificado', null);
                } else {
                    // Show logout for admin
                    const btnOut = document.createElement('button');
                    btnOut.className = 'btn';
                    btnOut.innerHTML = 'Sair (Admin)';
                    btnOut.style.margin = '20px';
                    btnOut.style.width = 'calc(100% - 40px)';
                    btnOut.onclick = doLogout;
                    document.querySelector('.sidebar').appendChild(btnOut);
                    // Also load campaigns for admin
                    fetchCampaigns();
                }
            } else {
                document.getElementById('loginOverlay').style.display = 'flex';
            }
        } catch(e) {
            console.error(e);
            document.getElementById('loginOverlay').style.display = 'flex';
        }
    }
    
    async function doLogin() {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        const res = await fetch('/api/login', {
            method:'POST', body: JSON.stringify({username:u, password:p})
        });
        const data = await res.json();
        if(data.success) {
            window.location.reload();
        } else {
            document.getElementById('loginError').innerText = data.error;
            document.getElementById('loginError').style.display = 'block';
        }
    }
    
    async function doLogout() {
        await fetch('/api/logout', {method:'POST'});
        window.location.reload();
    }
    
    async function requestLeads() {
        const res = await fetch('/api/request_leads', {
            method: 'POST', body: JSON.stringify({campaign: 'CRM_Unificado'})
        });
        const data = await res.json();
        if(data.success) {
            alert(data.count + " novos leads foram adicionados ao seu painel!");
            window.location.reload();
        } else {
            alert(data.error || "Nenhum lead disponível na base central.");
        }
    }
    
    async function registerSale(leadName, company) {
        const val = prompt(`Registrar Contrato para ${company}\n\nDigite o Valor Total do Contrato (ex: 50000):`);
        if(!val) return;
        const total = parseFloat(val);
        if(isNaN(total)) return alert("Valor inválido.");
        
        const res = await fetch('/api/register_sale', {
            method: 'POST', body: JSON.stringify({lead_name: leadName, company: company, total_value: total})
        });
        const data = await res.json();
        if(data.success) {
            alert(`Venda Registrada com Sucesso!\n\nSplits processados:\n- Taxmanagers (50%): R$ ${data.venda.splits.taxmanagers.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n- Seu Split (30%): R$ ${data.venda.splits.prospector.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
            window.location.reload();
        }
    }

        async function fetchCampaigns() {
            try {
                const res = await fetch('/api/campaigns');
                const campaigns = await res.json();
                const list = document.getElementById('campaignList');
                list.innerHTML = '';
                if (campaigns.length === 0) {
                    list.innerHTML = `<li style="color:var(--text-secondary);font-size:12px;list-style:none;">Nenhuma planilha encontrada.</li>`;
                    return;
                }
                campaigns.forEach(c => {
                    const li = document.createElement('li');
                    li.className = 'campaign-item';
                    if (c === 'Inbound (Site)') {
                        li.innerHTML = `<span class="campaign-name" style="color: var(--accent-cyan); font-weight: 700;">📥 ${c}</span>`;
                    } else {
                        li.innerHTML = `<span class="campaign-name">${c}</span>`;
                    }
                    li.addEventListener('click', () => selectCampaign(c, li));
                    list.appendChild(li);
                });

                // Preencher o select de campanhas no modal de ingestão
                const sel = document.getElementById('prevCampaignSelect');
                sel.innerHTML = '<option value="">-- Selecionar Campanha --</option>';
                campaigns.forEach(c => {
                    if (c !== 'Inbound (Site)') {
                        const o = document.createElement('option');
                        o.value = c; o.textContent = c;
                        sel.appendChild(o);
                    }
                });
            } catch (err) {

                console.error("Erro ao carregar campanhas:", err);
            }
        }

        async function selectCampaign(name, element) {
            document.querySelectorAll('.campaign-item').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
            currentCampaign = name;
            isGlobalSearch = false;
            document.getElementById('globalSearchCheck').checked = false;
            document.getElementById('globalToggle').classList.remove('active');
            document.getElementById('globalSearchNotice').style.display = 'none';
            document.getElementById('searchInput').value = '';
            if (name === 'Inbound (Site)') {
                document.getElementById('activeCampaignName').innerText = `📥 Leads: ${name}`;
                document.getElementById('activeCampaignSubtitle').innerText = `Sincronizado via Supabase (taxmanagers.com.br)`;
            } else {
                document.getElementById('activeCampaignName').innerText = `Campanha: ${name}`;
                document.getElementById('activeCampaignSubtitle').innerText = `Lista_Ataque_${name}.csv`;
            }

            document.getElementById('filterTabs').style.display = 'flex';
            document.getElementById('sidebarStats').style.display = 'flex';
            await loadLeads(name);
        }

        async function loadLeads(campaignName) {
            try {
                currentPage = 1;
                const res = await fetch(`/api/campaign?name=${encodeURIComponent(campaignName)}`);
                leadsData = await res.json();
                leadsData.forEach((l, i) => l._id = i);
                renderLeads(false);
                calculateStats();
            } catch (err) {
                console.error("Erro ao carregar leads:", err);
            }
        }

        function calculateStats() {
            const total = leadsData.length;
            const stats = { Pendente: 0, 'Passo 1 Enviado': 0, 'Passo 2 Enviado': 0, 'Passo 3 Enviado': 0, Respondido: 0 };
            leadsData.forEach(l => {
                if (stats[l.status] !== undefined) stats[l.status]++;
                else stats.Pendente++;
            });
            document.getElementById('statTotal').innerText = total;
            document.getElementById('statPendente').innerText = stats.Pendente;
            document.getElementById('statP1').innerText = stats['Passo 1 Enviado'];
            document.getElementById('statP2').innerText = stats['Passo 2 Enviado'];
            document.getElementById('statP3').innerText = stats['Passo 3 Enviado'];
            document.getElementById('statResp').innerText = stats.Respondido;
        }

        function getInitials(name) {
            if (!name) return 'LD';
            const parts = name.trim().split(' ');
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return name.substring(0, 2).toUpperCase();
        }

        // ========== SEARCH ==========
        document.getElementById('searchInput').addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            if (isGlobalSearch && query.length >= 2) {
                searchTimeout = setTimeout(() => runGlobalSearch(query), 350);
            } else if (!isGlobalSearch) {
                renderLeads(false);
            } else {
                if (!query) { renderLeads(true); }
            }
        });

        document.getElementById('globalSearchCheck').addEventListener('change', function() {
            isGlobalSearch = this.checked;
            const toggle = document.getElementById('globalToggle');
            const notice = document.getElementById('globalSearchNotice');
            if (isGlobalSearch) {
                toggle.classList.add('active');
                notice.style.display = 'block';
                document.getElementById('filterTabs').style.display = 'none';
                const q = document.getElementById('searchInput').value.trim();
                if (q.length >= 2) runGlobalSearch(q);
                else renderLeads(true);
            } else {
                toggle.classList.remove('active');
                notice.style.display = 'none';
                if (currentCampaign) {
                    document.getElementById('filterTabs').style.display = 'flex';
                    renderLeads(false);
                }
            }
        });

        async function runGlobalSearch(query) {
            document.getElementById('activeCampaignName').innerText = `🔍 Busca: "${query}"`;
            document.getElementById('activeCampaignSubtitle').innerText = 'Pesquisando em todas as campanhas...';
            try {
                const res = await fetch(`/api/search_leads?q=${encodeURIComponent(query)}`);
                const results = await res.json();
                renderGlobalResults(results, query);
                document.getElementById('activeCampaignSubtitle').innerText = `${results.length} lead(s) encontrado(s) em todas as campanhas`;
            } catch (err) {
                console.error("Erro na busca global:", err);
            }
        }

        function renderGlobalResults(leads, query) {
            const list = document.getElementById('leadsList');
            list.innerHTML = '';
            if (leads.length === 0) {
                list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Nenhum lead encontrado</h3><p>Tente outros termos de busca.</p></div>`;
                return;
            }
            leads.forEach((lead, i) => {
                lead._id = 'g_' + i;
                list.appendChild(buildLeadCard(lead, true));
            });
        }

        function renderLeads(isEmpty) {
            const list = document.getElementById('leadsList');
            list.innerHTML = '';
            if (isEmpty || !currentCampaign) {
                list.innerHTML = `<div class="empty-state"><h3>🎯 Painel Pronto</h3><p>Selecione uma campanha ou use a busca global para encontrar leads.</p></div>`;
                return;
            }
            const search = document.getElementById('searchInput').value.toLowerCase();
            const filtered = leadsData.filter(lead => {
                const matchSearch = !search || lead.nome.toLowerCase().includes(search) || lead.empresa.toLowerCase().includes(search) || lead.cargo.toLowerCase().includes(search);
                const matchTab = activeFilter === 'Todos' || lead.status === activeFilter;
                return matchSearch && matchTab;
            });
            if (filtered.length === 0) {
                list.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Nenhum lead encontrado</h3><p>Tente ajustar a busca ou o filtro.</p></div>`;
                return;
            }
            const visibleLeads = filtered.slice(0, currentPage * pageSize);
            visibleLeads.forEach(lead => list.appendChild(buildLeadCard(lead, false)));
            
            if (filtered.length > currentPage * pageSize) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'btn';
                loadMoreBtn.style = 'grid-column: 1 / -1; margin: 20px auto; display: block; background: var(--accent-cyan); color: black; font-weight: 600; padding: 12px 30px; border: none; border-radius: 6px; cursor: pointer;';
                loadMoreBtn.innerText = `Carregar mais (+${filtered.length - visibleLeads.length} restantes)...`;
                loadMoreBtn.onclick = () => {
                    currentPage++;
                    renderLeads(false);
                };
                list.appendChild(loadMoreBtn);
            }
        }

        function buildLeadCard(lead, isGlobal) {
            const card = document.createElement('div');
            let statusClass = 'status-pendente';
            if (lead.status === 'Passo 1 Enviado') statusClass = 'status-p1';
            else if (lead.status === 'Passo 2 Enviado') statusClass = 'status-p2';
            else if (lead.status === 'Passo 3 Enviado') statusClass = 'status-p3';
            else if (lead.status === 'Respondido') statusClass = 'status-respondido';

            card.className = `lead-card ${statusClass}`;

            let badgeClass = 'badge-pendente', badgeText = 'Pendente';
            if (lead.status === 'Passo 1 Enviado') { badgeClass = 'badge-p1'; badgeText = 'Passo 1'; }
            else if (lead.status === 'Passo 2 Enviado') { badgeClass = 'badge-p2'; badgeText = 'Passo 2'; }
            else if (lead.status === 'Passo 3 Enviado') { badgeClass = 'badge-p3'; badgeText = 'Passo 3'; }
            else if (lead.status === 'Respondido') { badgeClass = 'badge-respondido'; badgeText = 'Respondido'; }

            const initials = getInitials(lead.nome);
            const campaignBadgeHtml = isGlobal && lead.campaign
                ? `<span class="campaign-badge">🏷️ ${lead.campaign}</span>` : '';

            const idAttr = JSON.stringify({nome: lead.nome, empresa: lead.empresa, campaign: lead.campaign || currentCampaign});
            const idEsc = idAttr.replace(/"/g, '&quot;');

            let contactInfoHtml = '';
            if (lead.email || lead.telefone || lead.aniversario) {
                const parts = [];
                if (lead.email) parts.push(`📧 ${lead.email}`);
                if (lead.telefone) parts.push(`📞 ${lead.telefone}`);
                if (lead.aniversario) parts.push(`📅 ${lead.aniversario}`);
                contactInfoHtml = `
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 4px;">
                        ${parts.join(' <span style="opacity:0.3;">|</span> ')}
                    </div>
                `;
            }

            const isInc = lead.campaign === 'Inbound (Site)';

            card.innerHTML = `
                <div class="lead-header">
                    <div class="lead-avatar">${initials}</div>
                    <div class="lead-meta">
                        <div class="lead-name-row">
                            <span class="lead-name" title="${lead.nome}">${lead.nome}</span>
                            <span class="lead-status-badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <div class="lead-role" title="${lead.cargo}">${lead.cargo}</div>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                            <div class="lead-company" title="${lead.empresa}">${lead.empresa}</div>
                            ${campaignBadgeHtml}
                        </div>
                        ${contactInfoHtml}
                    </div>
                </div>

                <div class="cadence-container">
                    <div class="step-block">
                        <div class="step-header">
                            <span class="step-title-text">${isInc ? '📥 Detalhes do Lead & Arquivos' : '🔵 Passo 1 (Conexão)'}</span>
                            ${isInc ? '' : `<button class="btn" style="background:linear-gradient(135deg,#8B5CF6,#06B6D4);color:white;padding:3px 8px;font-size:10px;" onclick="openAgentModalFromCard('${idEsc}')">✨ Hyper-Personalizar</button>`}
                        </div>
                        <div class="step-body">
                            <div>${lead.passo1 || '<em style="color:var(--text-secondary);">Mensagem não gerada.</em>'}</div>
                            <div class="step-actions">
                                ${isInc ? `<button class="btn btn-copy" onclick="robustCopy('${lead.telefone}') || showToast('WhatsApp copiado!', 'success')">Copiar WhatsApp</button>` : (lead.url ? `<button class="btn btn-linkedin" onclick="actionCopiarEAbrir('${idEsc}')">Copiar e Abrir LinkedIn</button>` : '')}
                                ${isInc ? '' : `<button class="btn btn-copy" onclick="actionCopiarDireto('${idEsc}', 'passo1')">Apenas Copiar</button>`}
                            </div>
                        </div>
                    </div>

                    <div class="step-block">
                        <div class="step-header"><span class="step-title-text">${isInc ? '📂 Localização dos Arquivos' : '🟣 Passo 2 (Newsletter)'}</span></div>
                        <div class="step-body">
                            <div>${lead.passo2 || '<em style="color:var(--text-secondary);">—</em>'}</div>
                            <div class="step-actions">
                                ${isInc ? '' : `<button class="btn btn-copy" onclick="actionCopiarDireto('${idEsc}', 'passo2')">Copiar</button>`}
                            </div>
                        </div>
                    </div>

                    <div class="step-block">
                        <div class="step-header"><span class="step-title-text">${isInc ? '🎯 Próximos Passos' : '🟢 Passo 3 (Diagnóstico)'}</span></div>
                        <div class="step-body">
                            <div>${lead.passo3 || '<em style="color:var(--text-secondary);">—</em>'}</div>
                            <div class="step-actions">
                                ${isInc ? '' : `<button class="btn btn-copy" onclick="actionCopiarDireto('${idEsc}', 'passo3')">Copiar</button>`}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-footer">
                    <span class="footer-label">Mudar Status:</span>
                    <div class="status-button-group">
                        <button class="status-btn ${lead.status === 'Pendente' ? 'active-pendente' : ''}" onclick="actionUpdateStatus('${idEsc}', 'Pendente')">Pend</button>
                        <button class="status-btn ${lead.status === 'Passo 1 Enviado' ? 'active-p1' : ''}" onclick="actionUpdateStatus('${idEsc}', 'Passo 1 Enviado')">P1</button>
                        <button class="status-btn ${lead.status === 'Passo 2 Enviado' ? 'active-p2' : ''}" onclick="actionUpdateStatus('${idEsc}', 'Passo 2 Enviado')">P2</button>
                        <button class="status-btn ${lead.status === 'Passo 3 Enviado' ? 'active-p3' : ''}" onclick="actionUpdateStatus('${idEsc}', 'Passo 3 Enviado')">P3</button>
                        <button class="status-btn ${lead.status === 'Respondido' ? 'active-respondido' : ''}" onclick="actionUpdateStatus('${idEsc}', 'Respondido')">Resp</button>
                    </div>
                </div>

            `;
            return card;
        }

        // ========== FILTER TABS ==========
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
                tab.classList.add('active');
                activeFilter = tab.getAttribute('data-filter');
                renderLeads(false);
            });
        });

        // ========== TOAST ==========
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
            toast.innerHTML = `<span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'none'; toast.offsetHeight;
                toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        async function actionReloadCurrentCampaign() {
            if (currentCampaign) {
                showToast("Recarregando dados...", "info");
                const btn = document.getElementById('btnReload');
                if (btn) { btn.disabled = true; btn.innerText = "⏳ Carregando..."; }
                try {
                    await loadLeads(currentCampaign);
                    showToast("Painel atualizado com sucesso!", "success");
                } catch(err) {
                    showToast("Erro ao recarregar dados.", "error");
                } finally {
                    if (btn) { btn.disabled = false; btn.innerText = "🔄 Atualizar"; }
                }
            } else {
                showToast("Nenhuma campanha ativa para recarregar.", "error");
            }
        }

        // ========== CLIPBOARD ==========
        function fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.focus(); ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            document.body.removeChild(ta);
        }

        function robustCopy(text) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
            } else { fallbackCopy(text); }
        }

        // ========== LEAD ACTIONS (new signature using JSON id) ==========
        function parseLeadId(idStr) {
            try { return JSON.parse(idStr); } catch(e) { return null; }
        }

        function findLeadById(idObj) {
            if (!idObj) return null;
            return leadsData.find(l => l.nome === idObj.nome && l.empresa === idObj.empresa);
        }

        function actionCopiarEAbrir(idStr) {
            const info = parseLeadId(idStr);
            const lead = findLeadById(info);
            if (!lead && !info) return;
            const passo1 = lead ? lead.passo1 : '';
            const url = lead ? lead.url : '';
            robustCopy(passo1);
            showToast("Mensagem copiada! Abrindo perfil...", "success");
            if (url && url.trim()) window.open(url, '_blank');
            actionUpdateStatus(idStr, 'Passo 1 Enviado');
        }

        function actionCopiarDireto(idStr, passo) {
            const info = parseLeadId(idStr);
            const lead = findLeadById(info);
            if (!lead) return;
            robustCopy(lead[passo] || '');
            showToast("Mensagem copiada para a área de transferência!", "success");
        }

        async function actionUpdateStatus(idStr, newStatus) {
            const info = parseLeadId(idStr);
            if (!info) return;
            const campaign = info.campaign || currentCampaign;
            try {
                await fetch('/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ campaign, name: info.nome, company: info.empresa, status: newStatus })
                });
                // Update local data and re-render
                const lead = findLeadById(info);
                if (lead) { lead.status = newStatus; }
                if (!isGlobalSearch) { renderLeads(false); calculateStats(); }
                else {
                    const q = document.getElementById('searchInput').value.trim();
                    if (q.length >= 2) runGlobalSearch(q);
                }
                showToast(`Status atualizado para: ${newStatus}`, 'success');
            } catch (err) { showToast("Erro ao salvar status.", "error"); }
        }

        // ========== AGENT MODAL (Hyper-Personalizar) ==========
        let currentAgentLeadInfo = null;
        let pastedImageBase64 = null;

        function openAgentModal(leadId) {
            document.getElementById('tese-result').style.display = 'none';
            document.getElementById('tese-result').innerHTML = '';
            currentAgentLeadInfo = typeof leadId === 'string' ? parseLeadId(leadId) : null;
            pastedImageBase64 = null;
            document.getElementById('dropText').style.display = 'block';
            document.getElementById('previewImage').style.display = 'none';
            document.getElementById('previewImage').src = '';
            document.getElementById('agentConsole').style.display = 'none';
            document.getElementById('modelIndicator').style.display = 'none';
            document.getElementById('generatedOptions').style.display = 'none';
            document.getElementById('btnGenerate').disabled = false;
            document.getElementById('agentModalOverlay').classList.add('open');
        }

        function openAgentModalFromCard(idEscaped) {
            openAgentModal(idEscaped);
        }

        function closeAgentModal() {
            document.getElementById('agentModalOverlay').classList.remove('open');
        }

        let activePasteZone = 'profile'; // 'profile' or 'contact'
        let ingestContactImageBase64 = null;

        window.addEventListener('paste', e => {
            const agentOpen = document.getElementById('agentModalOverlay').classList.contains('open');
            const ingestOpen = document.getElementById('ingestModal').classList.contains('open');
            if (!agentOpen && !ingestOpen) return;
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file') {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        if (agentOpen) {
                            pastedImageBase64 = event.target.result;
                            document.getElementById('previewImage').src = pastedImageBase64;
                            document.getElementById('previewImage').style.display = 'block';
                            document.getElementById('dropText').style.display = 'none';
                        } else if (ingestOpen) {
                            if (activePasteZone === 'profile') {
                                ingestImageBase64 = event.target.result;
                                document.getElementById('ingestPreviewImg').src = ingestImageBase64;
                                document.getElementById('ingestPreviewImg').style.display = 'block';
                                document.getElementById('ingestDropText').style.display = 'none';
                                // Auto shift paste focus to contact zone
                                setActivePasteZone('contact');
                            } else {
                                ingestContactImageBase64 = event.target.result;
                                document.getElementById('ingestContactPreviewImg').src = ingestContactImageBase64;
                                document.getElementById('ingestContactPreviewImg').style.display = 'block';
                                document.getElementById('ingestContactDropText').style.display = 'none';
                            }
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            }
        });

        const dropZone = document.getElementById('dropZone');
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault(); dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                const reader = new FileReader();
                reader.onload = ev => {
                    pastedImageBase64 = ev.target.result;
                    if (file.type.startsWith('image/')) {
                        document.getElementById('previewImage').src = pastedImageBase64;
                        document.getElementById('previewImage').style.display = 'block';
                        document.getElementById('dropText').style.display = 'none';
                    } else {
                        document.getElementById('dropText').innerHTML = `✅ <b>${file.name}</b><br><small style="color:#10B981;">PDF pronto para análise.</small>`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('fileInputProfile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                pastedImageBase64 = ev.target.result;
                if (file.type.startsWith('image/')) {
                    document.getElementById('previewImage').src = pastedImageBase64;
                    document.getElementById('previewImage').style.display = 'block';
                    document.getElementById('dropText').style.display = 'none';
                } else {
                    document.getElementById('dropText').innerHTML = `✅ <b>${file.name}</b> carregado.<br><small style='color:#10B981;'>Pronto para análise de texto.</small>`;
                    document.getElementById('dropText').style.display = 'block';
                    document.getElementById('previewImage').style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        });

        async function runAgentWorkflow() {
            const info = currentAgentLeadInfo;
            if (!info) return;

            document.getElementById('btnGenerate').disabled = true;
            document.getElementById('agentConsole').style.display = 'block';
            document.getElementById('modelIndicator').style.display = 'none';
            document.getElementById('generatedOptions').style.display = 'none';

            const consoleText = document.getElementById('consoleText');
            const thesis = document.getElementById('thesisSelect').value;

            consoleText.innerText = ">> Inicializando modelo de visão (Llama 4 Scout)...";
            setTimeout(() => {
                if (document.getElementById('generatedOptions').style.display === 'none')
                    consoleText.innerText = `>> Realizando OSINT e pesquisa web sobre [${info.empresa}]...`;
            }, 2500);
            setTimeout(() => {
                if (document.getElementById('generatedOptions').style.display === 'none')
                    consoleText.innerText = ">> Sintetizando e redigindo abordagem (Llama 3.3 70B)...";
            }, 5500);

            try {
                const res = await fetch('/api/personalize_agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: info.nome, company: info.empresa,
                        role: leadsData.find(l => l.nome === info.nome)?.cargo || '',
                        thesis_focus: thesis,
                        image_base64: pastedImageBase64,
                        text_input: ''
                    })
                });
                const data = await res.json();
                document.getElementById('agentConsole').style.display = 'none';

                const lblModel = document.getElementById('lblModelUsed');
                if (data.model_used) {
                    lblModel.innerText = data.model_used;
                    if (data.model_used.includes("Fallback")) { lblModel.style.color = "var(--accent-purple)"; }
                    else if (data.model_used.includes("Erro")) { lblModel.style.color = "var(--accent-red)"; }
                    else { lblModel.style.color = "var(--accent-cyan)"; }
                    document.getElementById('modelIndicator').style.display = 'flex';
                }
                document.getElementById('generatedOptions').style.display = 'flex';
                document.getElementById('txtShortNote').value = data.short_note || '';
                document.getElementById('txtLongEmail').value = data.long_email || '';
                document.getElementById('txtArticlePitch').value = data.article_pitch || '';
            } catch (err) {
                consoleText.innerText = ">> [ERRO] Falha ao conectar com a IA.";
                document.getElementById('btnGenerate').disabled = false;
            }
        }

        async function saveAndUse(optionType) {
            const info = currentAgentLeadInfo;
            if (!info) return;
            const msg = optionType === 'short_note'
                ? document.getElementById('txtShortNote').value
                : (optionType === 'article_pitch' ? document.getElementById('txtArticlePitch').value : document.getElementById('txtLongEmail').value);
            const campaign = info.campaign || currentCampaign;
            const step = optionType === 'article_pitch' ? 2 : 1;
            try {
                const res = await fetch('/api/save_personalization', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ campaign, name: info.nome, company: info.empresa, message: msg, step: step })
                });
                const data = await res.json();
                if (data.success) {
                    const lead = findLeadById(info);
                    if (lead) {
                        if (step === 2) lead.passo2 = msg;
                        else lead.passo1 = msg;
                    }
                    renderLeads(!currentCampaign);
                    robustCopy(msg);
                    showToast("Mensagem salva na planilha e copiada!", "success");
                    closeAgentModal();
                } else { showToast("Erro ao salvar no CSV.", "error"); }
            } catch (err) { showToast("Erro de rede.", "error"); }
        }

        // ========== INGEST MODAL ==========
        let ingestImageBase64 = null;
        let ingestPreviewData = null;

        function openIngestModal() {
            resetIngestModal();
            document.getElementById('ingestModal').classList.add('open');
        }

        function closeIngestModal() {
            document.getElementById('ingestModal').classList.remove('open');
        }

        function setActivePasteZone(zone) {
            activePasteZone = zone;
            const profileDZ = document.getElementById('ingestDropZone');
            const contactDZ = document.getElementById('ingestContactDropZone');
            if (zone === 'profile') {
                profileDZ.classList.add('selected-zone');
                contactDZ.classList.remove('selected-zone');
            } else {
                contactDZ.classList.add('selected-zone');
                profileDZ.classList.remove('selected-zone');
            }
        }

        function resetIngestModal() {
            ingestImageBase64 = null;
            ingestContactImageBase64 = null;
            ingestPreviewData = null;
            
            const btnSave = document.getElementById('btnSaveLead');
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = '✅ Aprovar e Salvar no CRM';
            }
            
            document.getElementById('duplicateWarning').style.display = 'none';
            document.getElementById('ingestStep1').style.display = 'block';
            document.getElementById('ingestStep2').style.display = 'none';
            document.getElementById('ingestStep3').style.display = 'none';
            
            document.getElementById('ingestPreviewImg').style.display = 'none';
            document.getElementById('ingestPreviewImg').src = '';
            document.getElementById('ingestDropText').style.display = 'block';
            document.getElementById('ingestDropText').innerHTML = '🖼️ Cole (Ctrl+V) aqui ou arraste o print do perfil';
            
            document.getElementById('ingestContactPreviewImg').style.display = 'none';
            document.getElementById('ingestContactPreviewImg').src = '';
            document.getElementById('ingestContactDropText').style.display = 'block';
            document.getElementById('ingestContactDropText').innerHTML = '📇 Cole (Ctrl+V) aqui ou arraste o print de contatos';
            
            document.getElementById('ingestLinkedinUrl').value = '';
            document.getElementById('btnIngestAnalyze').disabled = false;
            
            // Reset step indicators
            document.getElementById('istep1').className = 'ingest-step active';
            document.getElementById('istep2').className = 'ingest-step';
            document.getElementById('istep3').className = 'ingest-step';
            
            setActivePasteZone('profile');
        }

        // Ingest drop zone events
        const ingestDZ = document.getElementById('ingestDropZone');
        ingestDZ.addEventListener('dragover', e => { e.preventDefault(); ingestDZ.classList.add('drag-over'); });
        ingestDZ.addEventListener('dragleave', () => ingestDZ.classList.remove('drag-over'));
        ingestDZ.addEventListener('drop', e => {
            e.preventDefault(); ingestDZ.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleIngestFile(e.dataTransfer.files[0], 'profile');
            }
        });
        ingestDZ.addEventListener('click', () => setActivePasteZone('profile'));

        const ingestContactDZ = document.getElementById('ingestContactDropZone');
        ingestContactDZ.addEventListener('dragover', e => { e.preventDefault(); ingestContactDZ.classList.add('drag-over'); });
        ingestContactDZ.addEventListener('dragleave', () => ingestContactDZ.classList.remove('drag-over'));
        ingestContactDZ.addEventListener('drop', e => {
            e.preventDefault(); ingestContactDZ.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleIngestFile(e.dataTransfer.files[0], 'contact');
            }
        });
        ingestContactDZ.addEventListener('click', () => setActivePasteZone('contact'));

        document.getElementById('ingestFileInput').addEventListener('change', function(e) {
            if (e.target.files[0]) handleIngestFile(e.target.files[0], 'profile');
        });
        document.getElementById('ingestContactFileInput').addEventListener('change', function(e) {
            if (e.target.files[0]) handleIngestFile(e.target.files[0], 'contact');
        });

        function handleIngestFile(file, type) {
            const reader = new FileReader();
            reader.onload = ev => {
                if (type === 'profile') {
                    ingestImageBase64 = ev.target.result;
                    if (file.type.startsWith('image/')) {
                        document.getElementById('ingestPreviewImg').src = ingestImageBase64;
                        document.getElementById('ingestPreviewImg').style.display = 'block';
                        document.getElementById('ingestDropText').style.display = 'none';
                    } else {
                        document.getElementById('ingestDropText').innerHTML = `✅ <b>${file.name}</b><br><small style="color:#10B981;">PDF pronto para análise.</small>`;
                    }
                    setActivePasteZone('contact');
                } else {
                    ingestContactImageBase64 = ev.target.result;
                    if (file.type.startsWith('image/')) {
                        document.getElementById('ingestContactPreviewImg').src = ingestContactImageBase64;
                        document.getElementById('ingestContactPreviewImg').style.display = 'block';
                        document.getElementById('ingestContactDropText').style.display = 'none';
                    } else {
                        document.getElementById('ingestContactDropText').innerHTML = `✅ <b>${file.name}</b><br><small style="color:#10B981;">Arquivo pronto para análise.</small>`;
                    }
                }
            };
            reader.readAsDataURL(file);
        }

        function setIngestConsoleLog(lines) {
            const el = document.getElementById('ingestConsoleText');
            el.innerHTML = lines.map(l => `<span class="ingest-log-line">${l}</span>`).join('<br>');
            el.parentElement.scrollTop = el.parentElement.scrollHeight;
        }

        async function runIngestWorkflow() {
            const linkedinUrl = document.getElementById('ingestLinkedinUrl').value.trim();

            if (!ingestImageBase64) {
                showToast("Por favor, faça o upload de um print ou PDF do perfil.", "error");
                return;
            }

            // Switch to step 2 (console)
            document.getElementById('btnIngestAnalyze').disabled = true;
            document.getElementById('ingestStep1').style.display = 'none';
            document.getElementById('ingestStep2').style.display = 'block';
            document.getElementById('istep1').className = 'ingest-step done';
            document.getElementById('istep2').className = 'ingest-step active';

            setIngestConsoleLog(['⏳ Iniciando investigação do perfil...']);

            // Simulate progressive log updates while waiting
            const fakeLog = [
                '🔍 Analisando imagem do perfil com Llama Vision (Llama 4 Scout)...',
                '🌐 Realizando pesquisa OSINT sobre a empresa...',
                '🎯 Classificando lead nas campanhas existentes...',
                '✍️ Redigindo cadência de abordagem personalizada...'
            ];
            let fakeIdx = 0;
            const fakeInterval = setInterval(() => {
                if (fakeIdx < fakeLog.length) {
                    setIngestConsoleLog(fakeLog.slice(0, fakeIdx + 1));
                    fakeIdx++;
                }
            }, 1800);

            try {
                const res = await fetch('/api/ingest_lead_preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_base64: ingestImageBase64,
                        contact_image_base64: ingestContactImageBase64,
                        linkedin_url: linkedinUrl
                    })
                });
                const data = await res.json();
                clearInterval(fakeInterval);

                if (data.error) {
                    setIngestConsoleLog(['❌ Erro: ' + data.error]);
                    document.getElementById('btnIngestAnalyze').disabled = false;
                    return;
                }

                // Show full real log
                setIngestConsoleLog(data.log || ['✅ Processamento concluído.']);

                // Small delay to show final log before switching to preview
                setTimeout(() => {
                    ingestPreviewData = data;
                    showIngestPreview(data);
                }, 1000);

            } catch (err) {
                clearInterval(fakeInterval);
                setIngestConsoleLog(['❌ Erro de rede ao conectar com o servidor.']);
                document.getElementById('btnIngestAnalyze').disabled = false;
            }
        }

        function showIngestPreview(data) {
            document.getElementById('ingestStep2').style.display = 'none';
            document.getElementById('ingestStep3').style.display = 'block';
            document.getElementById('istep2').className = 'ingest-step done';
            document.getElementById('istep3').className = 'ingest-step active';

            // Reset o estado do botao de aprovar/salvar para ativo
            const btnSave = document.getElementById('btnSaveLead');
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = '✅ Aprovar e Salvar no CRM';
            }

            // Mostra aviso de duplicidade se o lead já existir em alguma campanha
            const dupWarning = document.getElementById('duplicateWarning');
            if (data.already_exists_in) {
                document.getElementById('duplicateCampaignName').innerText = data.already_exists_in;
                dupWarning.style.display = 'flex';
            } else {
                dupWarning.style.display = 'none';
            }

            document.getElementById('prevNome').value = data.nome || '';
            document.getElementById('prevCargo').value = data.cargo || '';
            document.getElementById('prevEmpresa').value = data.empresa || '';
            document.getElementById('prevUrl').value = data.url || '';
            document.getElementById('prevEmail').value = data.email || '';
            document.getElementById('prevTelefone').value = data.telefone || '';
            document.getElementById('prevAniversario').value = data.aniversario || '';
            document.getElementById('prevPasso1').value = data.passo1 || '';
            document.getElementById('prevPasso2').value = data.passo2 || '';
            document.getElementById('prevPasso3').value = data.passo3 || '';

            document.getElementById('prevCampaignName').innerText = data.campaign || 'Geral';
            document.getElementById('newCampaignBadge').style.display = data.is_new_campaign ? 'inline-flex' : 'none';

            const sel = document.getElementById('prevCampaignSelect');
            // Pré-selecionar a campanha sugerida
            const opts = Array.from(sel.options);
            const match = opts.find(o => o.value === data.campaign);
            if (match) { sel.value = data.campaign; }
            else {
                // Add new campaign option
                const opt = document.createElement('option');
                opt.value = data.campaign; opt.textContent = `🆕 ${data.campaign} (Nova)`;
                sel.appendChild(opt);
                sel.value = data.campaign;
            }

            if (data.model_used) {
                document.getElementById('ingestModelLabel').innerText = data.model_used;
            }
        }

        async function saveLead() {
            const nome = document.getElementById('prevNome').value.trim();
            const cargo = document.getElementById('prevCargo').value.trim();
            const empresa = document.getElementById('prevEmpresa').value.trim();
            const url = document.getElementById('prevUrl').value.trim();
            const email = document.getElementById('prevEmail').value.trim();
            const telefone = document.getElementById('prevTelefone').value.trim();
            const aniversario = document.getElementById('prevAniversario').value.trim();
            const passo1 = document.getElementById('prevPasso1').value.trim();
            const passo2 = document.getElementById('prevPasso2').value.trim();
            const passo3 = document.getElementById('prevPasso3').value.trim();
            const campaign = document.getElementById('prevCampaignSelect').value || document.getElementById('prevCampaignName').innerText;

            if (!nome || !empresa) {
                showToast("Nome e empresa são obrigatórios para salvar.", "error");
                return;
            }

            document.getElementById('btnSaveLead').disabled = true;
            document.getElementById('btnSaveLead').innerText = '⏳ Salvando...';

            try {
                const res = await fetch('/api/ingest_lead_save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, cargo, empresa, url, email, telefone, aniversario, passo1, passo2, passo3, campaign })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(`✅ Lead "${nome}" salvo na campanha "${data.campaign}"!`, "success");
                    closeIngestModal();
                    // Refresh campaign list (may have new campaign)
                    await fetchCampaigns();
                    // If we're on the same campaign, reload
                    if (currentCampaign === campaign) await loadLeads(campaign);
                } else {
                    showToast("Erro ao salvar lead: " + (data.error || "desconhecido"), "error");
                    document.getElementById('btnSaveLead').disabled = false;
                    document.getElementById('btnSaveLead').innerText = '✅ Aprovar e Salvar no CRM';
                }
            } catch (err) {
                showToast("Erro de rede.", "error");
                document.getElementById('btnSaveLead').disabled = false;
                document.getElementById('btnSaveLead').innerText = '✅ Aprovar e Salvar no CRM';
            }
        }

        // ========== INIT ==========
        checkSession();
    </script>

        <script>
        // AI Sales Engagement Agent (Roar Panel)
        async function pollAgentAlerts() {
            try {
                const res = await fetch('/api/agent_alerts');
                if (res.ok) {
                    const alerts = await res.json();
                    if (alerts.length > 0) {
                        const alertContainer = document.getElementById('agent-alerts-container') || createAlertContainer();
                        // Show the latest alert if not already shown
                        const latest = alerts[alerts.length - 1];
                        if (!document.getElementById('alert-' + latest.id)) {
                            const el = document.createElement('div');
                            el.id = 'alert-' + latest.id;
                            el.style = "background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 15px; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b; font-size: 14px; animation: slideIn 0.3s ease-out;";
                            el.innerHTML = `<strong>Agente Roar:</strong> ${latest.message} <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; font-weight: bold;">X</button>`;
                            alertContainer.prepend(el);
                            
                            // Remove after 15 seconds
                            setTimeout(() => { if (el.parentElement) el.remove(); }, 15000);
                        }
                    }
                }
            } catch (e) {
                console.error("Erro no Agente Roar:", e);
            }
        }
        
        function createAlertContainer() {
            const container = document.createElement('div');
            container.id = 'agent-alerts-container';
            container.style = "position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 320px;";
            document.body.appendChild(container);
            
            // Add keyframes for animation
            const style = document.createElement('style');
            style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
            document.head.appendChild(style);
            
            return container;
        }
        
        setInterval(pollAgentAlerts, 10000); // Poll every 10s
        setTimeout(pollAgentAlerts, 2000); // Initial poll
        </script>
        </body>

</html>
"""

def open_browser():
    time.sleep(1.2)
    print("\n[PAINEL] Abrindo o Painel do Estrategista no seu navegador...")
    webbrowser.open("http://localhost:5000")

if __name__ == "__main__":
    print("="*55)
    print("🧠 PAINEL CRM INTELIGENTE - TAXMANAGERS")
    print("="*55)
    print("[TESTE] Testando conexão com Supabase...")
    leads = fetch_inbound_leads_from_supabase()
    print(f"[TESTE] Supabase retornou {len(leads)} leads.")
    print("[TESTE] Testando conexão SSH com VPS...")
    files = fetch_vps_files()
    print(f"[TESTE] VPS retornou {len(files)} arquivos.")


    threading.Thread(target=open_browser, daemon=True).start()

    server_address = ('', 5000)
    try:
        httpd = ThreadingHTTPServer(server_address, DashboardHandler)
        print("\n✅ Servidor rodando em http://localhost:5000")
        print("   Pressione Ctrl+C para encerrar.\n")
        httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:
            print("[ALERTA] Porta 5000 em uso. Abrindo navegador...")
            webbrowser.open("http://localhost:5000")
        else:
            print(f"[ERRO] {e}")
    except KeyboardInterrupt:
        print("\nServidor encerrado pelo usuário.")
