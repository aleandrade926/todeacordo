import os
import re
import json
import base64
import traceback
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from groq import Groq
from duckduckgo_search import DDGS
import pypdf
import io

app = FastAPI(title="TaxManagers VPS API Bridge", version="1.0.0")

# Habilitar CORS para permitir requisições do frontend hospedado (ex: Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todos os origens em dev; em prod pode restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chave de API do Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")

# Diretório de arquivos recebidos da VPS
RECEBIDOS_DIR = "/home/ubuntu/recebidos"
if not os.path.exists(RECEBIDOS_DIR):
    RECEBIDOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recebidos")
    os.makedirs(RECEBIDOS_DIR, exist_ok=True)

# Monta arquivos recebidos estaticamente para download direto
app.mount("/recebidos", StaticFiles(directory=RECEBIDOS_DIR), name="recebidos")

# --- MODELOS PYDANTIC ---
class PersonalizeRequest(BaseModel):
    name: str
    role: Optional[str] = ""
    company: str
    thesis_focus: Optional[str] = "Automático"
    text_input: Optional[str] = ""
    image_base64: Optional[str] = None # PDF do perfil ou imagem
    contact_image_base64: Optional[str] = None

# --- AUXILIARES ---
def sanitize_company_for_file(company: str) -> str:
    if not company:
        return ""
    return "".join(c if c.isalnum() else "_" for c in company).strip("_").lower()

def is_file_matching_lead(filename: str, company: str, email: str, name: str) -> bool:
    filename_lower = filename.lower()
    
    # 1. Correspondência direta por email
    if email:
        email_lower = email.lower().strip()
        if email_lower in filename_lower:
            return True
        email_prefix = email_lower.split('@')[0]
        if len(email_prefix) > 4 and email_prefix in filename_lower:
            return True
            
    # 2. Correspondência por dígitos (CNPJ)
    if company:
        company_digits = "".join(c for c in company if c.isdigit())
        if len(company_digits) >= 8:
            filename_digits = "".join(c for c in filename_lower if c.isdigit())
            if company_digits in filename_digits or company_digits[:8] in filename_digits:
                return True
                
    # 3. Correspondência por nome da empresa
    if company:
        company_clean = sanitize_company_for_file(company)
        company_clean = re.sub(r'_(ltda|sa|s_a|limitada|servicos|servicos|consultoria|assessoria|group|grupo|holding)$', '', company_clean)
        if len(company_clean) > 2:
            if company_clean in filename_lower:
                return True
            if company_clean.replace('_', '') in filename_lower.replace('_', ''):
                return True

    # 4. Correspondência por primeiro e último nome
    if name:
        name_clean = "".join(c if c.isalnum() else "_" for c in name).strip("_").lower()
        parts = [p for p in name_clean.split('_') if len(p) > 2]
        if len(parts) >= 2:
            if parts[0] in filename_lower and parts[-1] in filename_lower:
                return True
                
    return False

# --- ENPOINTS ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "TaxManagers VPS API Bridge is active"}

@app.get("/api/vps_files")
def get_vps_files(cnpj: Optional[str] = "", email: Optional[str] = "", name: Optional[str] = ""):
    """Varre o diretório local da VPS para encontrar arquivos associados ao Lead."""
    try:
        if not os.path.exists(RECEBIDOS_DIR):
            return {"files": []}
            
        all_files = os.listdir(RECEBIDOS_DIR)
        matched = []
        for file in all_files:
            if os.path.isfile(os.path.join(RECEBIDOS_DIR, file)):
                if is_file_matching_lead(file, cnpj, email, name):
                    matched.append(file)
        return {"files": matched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar arquivos: {str(e)}")

@app.post("/api/personalize_agent")
def personalize_agent(req: PersonalizeRequest):
    """Executa a análise por visão computacional, buscas web e geração de mensagens hiper-personalizadas por IA."""
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao inicializar Groq Client: {str(e)}")

    profile_context = req.text_input or ""
    
    # 1. Extração do PDF ou Print do perfil
    if req.image_base64:
        try:
            is_pdf = req.image_base64.startswith("data:application/pdf")
            b64_data = req.image_base64.split(',')[1] if ',' in req.image_base64 else req.image_base64
            
            if is_pdf:
                pdf_bytes = base64.b64decode(b64_data)
                reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                pdf_text = ""
                for page in reader.pages:
                    pdf_text += page.extract_text() + "\n"
                profile_context += "\n\n[Contexto Extraído do PDF do Perfil]:\n" + pdf_text
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
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}},
                        ],
                    }],
                    temperature=0.2,
                    max_tokens=400
                )
                profile_context += "\n\n[Contexto Visual Extraído do Print]:\n" + vision_response.choices[0].message.content
        except Exception as e:
            print(f"[VPS API] Erro na análise visual do perfil: {e}")
            profile_context += f"\n[Não foi possível analisar o perfil: {str(e)}]"

    # 2. Extração da aba de contato
    if req.contact_image_base64:
        try:
            b64_data_contact = req.contact_image_base64.split(',')[1] if ',' in req.contact_image_base64 else req.contact_image_base64
            contact_vision_prompt = (
                "Você é um extrator de dados de contato. Analise esta imagem da aba de contato (geralmente do LinkedIn) e extraia os seguintes campos se estiverem visíveis:\n"
                "1. Endereço de e-mail (ex: toviporceli76@gmail.com)\n"
                "2. Número de telefone ou contato telefônico (ex: +55...)\n"
                "3. Data de aniversário (ex: 3 de janeiro)\n"
                "4. Link do perfil do LinkedIn\n"
                "Responda ESTRITAMENTE em formato JSON com as chaves \"email\", \"telefone\", \"aniversario\", \"linkedin_url\"."
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
            profile_context += "\n\n[Contexto de Contatos Extraídos]:\n" + contact_vision_resp.choices[0].message.content
        except Exception as e_contact:
            print(f"[VPS API] Erro na extração de contatos: {e_contact}")

    # 3. Busca de Notícias da Empresa no DuckDuckGo
    company_context = "Nenhuma informação externa relevante encontrada."
    if req.company and req.company != "Empresa desconhecida":
        try:
            import unicodedata
            def strip_accents(text):
                return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
            
            clean_company = re.sub(r'\s+(S/A|S\.A\.|LTDA|Ltda|SA|Limitada)\b.*$', '', req.company, flags=re.IGNORECASE).strip()
            clean_company_search = strip_accents(clean_company)
            query_str = f'"{clean_company_search}" (imposto OR tributario OR fiscal OR judicial OR processo)'
            
            results = DDGS().text(query_str, max_results=3)
            if not results:
                results = DDGS().text(f'"{clean_company_search}"', max_results=3)
            if results:
                company_context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
        except Exception as e:
            print(f"[VPS API] Erro na busca web: {e}")

    # 4. Escrita do Pitch e Instrução Fiscal
    if req.thesis_focus == "Automático":
        thesis_instruction = (
            "Escolha a oportunidade tributária mais apropriada baseada no setor de atuação da empresa "
            "(ex: créditos de PIS/COFINS sobre despesas de ESG/Logística para agro, subvenções de ICMS para indústrias/varejo, "
            "limitação de compensação judicial Lei 14.873). Apresente essa oportunidade específica validada pelo Fisco. NUNCA fale termos genéricos e NUNCA use a palavra 'tese' ou 'teses'."
        )
    else:
        thesis_instruction = f"Você deve focar especificamente na seguinte oportunidade fiscal validada pelo Fisco: {req.thesis_focus}. NUNCA use a palavra 'tese' ou 'teses'."

    # 5. Prompts do Sistema
    if req.thesis_focus == "Parceria Mentofranquia":
        system_prompt = f"""Você é Alexandre Florio, Fundador da Taxmanagers (infraestrutura e inteligência tributária do Brasil).
Sua missão é escrever abordagens B2B hiper-personalizadas no LinkedIn para propor uma parceria de negócios (Mentofranquia) para {req.name} ({req.role} na {req.company}).

Sobre a Taxmanagers e a Parceria:
- Fornecemos toda infra operacional, inteligência de dados, e execução técnica tributária de alto ticket.
- O parceiro prospecta, fecha negócios com CFOs/Diretores. Nós fornecemos os leads qualificados (20.000 contatos).
- Split: 30% do sucesso para ele (Prospector), 50% para a Taxmanagers, 10% para o expert executor e 10% autor da tese.

Use os seguintes dados sobre o lead:
{profile_context}

Instruções de Redação:
- Crie um quebra-gelo natural baseado na trajetória do lead.
- Nunca fale de "venda de curso" ou "comprar franquia". Fale sobre "parceria estratégica de negócios".
- Seja conciso e direto.
- Responda ESTRITAMENTE em formato JSON:
{{
  "short_note": "Conexão de LinkedIn. Máx 280 caracteres. Direto, elogia trajetória/transição e sugere call.",
  "long_email": "Inmail/Email. Máx 500 caracteres. Usa bagagem corporativa dele como CFO para propor parceria lucrativa.",
  "article_pitch": "Pós-aceite. Máx 400 caracteres. Proposta curta de 15 minutos para apresentar o painel de leads."
}}"""
    else:
        system_prompt = f"""Você é um Consultor Tributário Sênior (Sócio de Boutique Fiscal renomada).
Sua missão é escrever abordagens B2B hiper-personalizadas de prospecção fria para {req.name} ({req.role} na {req.company}).

Instrução Fiscal Tributária:
{thesis_instruction}

Use os seguintes dados sobre o lead:
{profile_context}

Use os seguintes fatos recentes sobre a empresa:
{company_context}

Instruções de Redação:
- Contenha quebra-gelo baseado na carreira do lead (transição de cargo, tempo de casa, etc.).
- NUNCA use termos genéricos como 'otimização fiscal automática', nem modelos prontos robóticos.
- Responda ESTRITAMENTE em formato JSON:
{{
  "short_note": "Conexão LinkedIn. Máx 280 caracteres. Elogia trajetória, cita momento da empresa e propõe papo fiscal.",
  "long_email": "Inmail/Email. Máx 500 caracteres. Usa fato de mercado ou dor fiscal para criar argumento de reunião.",
  "article_pitch": "Pós-aceite. Máx 400 caracteres. Proposta amigável para envio de artigo/newsletter sobre a oportunidade tributária."
}}"""

    # 6. Chamada ao Modelo da Groq
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
        print(f"[VPS API] Erro com Llama 3.3 70B: {e_primary}. Tentando fallback...")
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
            print(f"[VPS API ERR] Falha geral nos modelos: {e_fallback}")
            result_json = {
                "short_note": f"Erro de processamento da IA: {str(e_fallback)}",
                "long_email": "Falha na geração.",
                "article_pitch": "Falha na geração."
            }
            model_used = "Erro"

    result_json["model_used"] = model_used
    return result_json
