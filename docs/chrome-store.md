# Preparação para Chrome Web Store

Este documento centraliza as informações necessárias para aprovar a extensão do **ToDeAcordo** na Chrome Web Store.

## Nome e Descrição
- **Nome:** ToDeAcordo: Reuniões sem Mal-Entendido
- **Resumo Curto (132 caracteres):** Capture decisões do Google Meet e gere um entendimento validável. Não é ata, é fechamento de acordo.
- **Descrição Longa:**
O ToDeAcordo transforma o seu Google Meet em uma máquina de fechamento. 
Não gravamos áudio. Nós lemos as legendas em tempo real, extraímos as obrigações e prazos, e criamos uma "Consensus Closing Page". 
Você envia o link para o seu cliente, ele revisa item a item, aponta ressalvas ou assina uma rubrica de confirmação com Hash Criptográfico.
Evite o "acho que combinamos outra coisa". Use o ToDeAcordo.

## Screenshots Necessários
1. Painel lateral aberto no Google Meet capturando legendas.
2. O momento em que a IA gera as "Decisões e Obrigações".
3. A tela do Dashboard mostrando as reuniões salvas.
4. O link de validação do cliente com a opção "Tô de Acordo".
5. O PDF corporativo gerado com a rubrica e Hash SHA-256.

## Permissões e Justificativas
O manifesto exige as seguintes permissões:
- `activeTab` / `scripting`: Necessário para injetar o script de captura apenas no Google Meet quando o usuário ativa a extensão.
- `storage`: Necessário para guardar os rascunhos das reuniões localmente antes do sync.
- `host_permissions`: `https://meet.google.com/*` — Justificativa: a extensão só funciona e opera dentro de salas do Google Meet para ler a DOM de legendas (`div[class*="a-s-fa-Ra"]`).

## Política de Privacidade (Resumo)
- **O ToDeAcordo não grava áudio nem vídeo.**
- Apenas o texto processado pelas legendas (captions) é utilizado.
- Os dados são enviados ao backend *apenas* no momento de clicar em "Gerar Entendimento".
- Nenhum dado de áudio ou vídeo sai do computador do usuário.

## Categoria
- Produtividade / Fluxo de Trabalho e Planejamento.
