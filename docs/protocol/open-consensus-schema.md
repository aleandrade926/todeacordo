# Open Consensus Schema (ToDeAcordo Protocol)

## 1. Visão Geral
O ToDeAcordo evolui de uma simples ferramenta de atas para um **Protocolo de Consenso Aberto** (Open Consensus Schema). A premissa central é padronizar a forma como acordos, entendimentos e obrigações são estruturados e registrados, independente do canal onde ocorreram (reuniões presenciais, videochamadas, trocas de mensagens no Slack/WhatsApp, ou e-mails). Ao tratar um "Entendimento" não como texto livre, mas como uma estrutura de dados bem definida, tipada e validável (JSON), tornamos os acordos processáveis por máquinas, nativamente auditáveis, e perfeitamente integráveis em qualquer ecossistema de software.

## 2. A Estrutura de um "Entendimento" (Consensus Object)
Um "Entendimento" no protocolo deve ser autossuficiente e universal. Ele encapsula o "Quem" (participantes e papéis), o "O quê" (combinados e critérios), o "Quando" (prazos e contexto temporal), e a "Segurança" (hashes, assinaturas).

### Principais Componentes do Schema
- **Metadata**: Informações sobre a origem do acordo, data de criação, versão do schema utilizado e identificadores únicos.
- **Participants**: Array contendo todos os envolvidos, seus níveis de permissão/papéis (observador, decisor, executor) e status criptográfico de aceite.
- **Agreements (Combinados)**: A lista de ações, obrigações ou declarações consensuais. Cada item tem seu próprio escopo delimitado, responsável explícito, prazo e métricas de aceite.
- **Reservations (Ressalvas)**: Condições externas, bloqueadores potenciais ou exceções sob as quais o acordo é modificado, adiado ou invalidado.
- **Cryptography & Signatures**: Garantia técnica da integridade do documento. Hashes criptográficos da estrutura para garantir imutabilidade (ex: ancoragem em redes blockchain ou logs de transparência).

## 3. Exemplo de JSON (Consensus Object Model)

Abaixo, a representação estruturada de um acordo feito via Open Consensus Schema:

```json
{
  "$schema": "https://todeacordo.com/schemas/v1/consensus.schema.json",
  "id": "cns_8f72h39b2",
  "version": "1.0",
  "metadata": {
    "source": "google_meet",
    "source_id": "mtg_xyz_123",
    "timestamp": "2026-07-03T15:00:00Z",
    "context": "Reunião de Alinhamento de Sprint - Q3",
    "locale": "pt-BR"
  },
  "participants": [
    {
      "id": "usr_991",
      "name": "Alice Silva",
      "role": "decider",
      "status": "accepted",
      "signature_hash": "a1b2c3d4f5e6..."
    },
    {
      "id": "usr_992",
      "name": "Bob Souza",
      "role": "executor",
      "status": "pending",
      "signature_hash": null
    }
  ],
  "agreements": [
    {
      "id": "agr_001",
      "type": "obligation",
      "description": "Desenvolver a API de integração bancária.",
      "assignees": ["usr_992"],
      "deadline": "2026-07-10T23:59:59Z",
      "acceptance_criteria": "Endpoints GET e POST implantados em ambiente de staging e passando em 100% dos testes de integração automatizados.",
      "status": "active"
    }
  ],
  "reservations": [
    {
      "id": "res_001",
      "agreement_ref": "agr_001",
      "condition": "Atraso no fornecimento de chaves de API e credenciais pela equipe externa do Banco.",
      "mitigation": "O prazo de entrega (deadline) será estendido automaticamente e proporcionalmente ao tempo de bloqueio, sem penalidade para o executor."
    }
  ],
  "cryptography": {
    "hash_algorithm": "SHA-256",
    "document_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchain_anchor": {
      "network": "ethereum",
      "contract": "0xABC123...",
      "tx_id": "0x123abcdef456..."
    }
  }
}
```

## 4. Portas Abertas (Ecossistema e Integrações)
Ao adotar o Open Consensus Schema, o ToDeAcordo transcende seu papel como aplicativo nativo e se torna uma camada de infraestrutura de acordos:
- **APIs REST / GraphQL e Webhooks**: Sistemas de terceiros (ERPs, CRMs, HRMs) podem injetar "Entendimentos" ou buscar o status de combinados de forma programática.
- **Zapier / Make / n8n**: Criação de gatilhos automáticos baseados em eventos do protocolo de consenso. *Exemplo: "Quando um Agreement do tipo 'obligation' for marcado como 'accepted', criar automaticamente um card no Trello para o Assignee com o respectivo prazo e critério de aceite".*
- **Govtech & Legaltech**: Integração nativa com sistemas de justiça, câmaras de arbitragem ou cartórios digitais. O JSON estruturado, atrelado às assinaturas criptográficas, permite a execução de contratos inteligentes (smart contracts) e acelera a validação de validade jurídica em mediações e disputas de pequenos valores.
- **Integração Corporativa de CI/CD de Tarefas**: O protocolo pode se integrar bidirecionalmente com o GitHub (criando issues a partir de `agreements` e fechando-as via commits), Jira, ou Slack. As `reservations` são instantaneamente mapeadas como "blockers" na pipeline ágil da empresa.
