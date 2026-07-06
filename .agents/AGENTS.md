# Regras do Projeto ToDeAcordo

## REGRA PADRÃO TODEACORDO
Qualquer bug fix aprovado está autorizado para commit e deploy direto na Vercel se a build passar, desde que a alteração não mexa em:
* Chaves de API ou variáveis de ambiente
* Banco de dados (Supabase/esquemas)
* Fluxos de pagamento (PIX/Stripe)
* Configurações de domínio
* Autenticação e acessos

Não há necessidade de pedir autorização a cada deploy que cumpra esses critérios.
