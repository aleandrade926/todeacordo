# Consensus Linter (Linter de Reunião)

## 1. O Que É o Consensus Linter?
Assim como ferramentas como ESLint, Prettier ou SonarQube analisam o código-fonte de software em busca de bugs, anti-patterns e má formatação, o **Consensus Linter** analisa a linguagem natural e a estrutura dos acordos (Entendimentos) antes que eles sejam selados. O objetivo central é evitar falhas de comunicação, mitigar obrigações ambíguas e impedir a criação de compromissos sem dono, garantindo que todo combinado gerado numa reunião seja factível, claro, mensurável e auditável.

## 2. Como Funciona?
O motor do Consensus Linter processa a transcrição da reunião, o texto inserido manualmente, ou a própria estrutura JSON do *Open Consensus Schema*. Ele utiliza regras de Processamento de Linguagem Natural (NLP) associadas a uma árvore lógica estrita. Ao analisar os dados, ele gera *Warnings* (Avisos) e *Errors* (Erros impeditivos) se o acordo ferir as boas práticas de construção de consenso. 

Num fluxo ideal, um acordo com *Errors* não pode ser assinado até ser corrigido (semelhante ao bloqueio de um `git push` num repositório com linter configurado).

## 3. Catálogo de Regras (Ruleset Principal)

Abaixo estão listadas as regras essenciais (Core Rules) do Linter:

### 3.1. `no-orphan-obligation` (Obrigação Órfã)
- **Descrição**: O linter detecta que uma ação foi combinada, mas não há um responsável (`assignee`) explícito atribuído a ela.
- **Severidade**: `Error`
- **Exemplo Incorreto**: "Vamos precisar atualizar os servidores de banco de dados na madrugada."
- **Exemplo Correto**: "A equipe de Infraestrutura (responsável: Alice) irá atualizar os servidores de banco de dados na madrugada."

### 3.2. `require-deadline` (Obrigação Sem Prazo)
- **Descrição**: O acordo estabelece a entrega de um artefato ou a conclusão de uma tarefa, mas falha em especificar uma data limite ou um critério de prazo tangível.
- **Severidade**: `Error`
- **Exemplo Incorreto**: "O Bob vai criar a nova documentação da API."
- **Exemplo Correto**: "O Bob vai criar a nova documentação da API até o final do dia de sexta-feira (07/07/2026)."

### 3.3. `no-open-scope` (Escopo Aberto ou Ambíguo)
- **Descrição**: O combinado utiliza adjetivos e termos relativos não mensuráveis (como "rápido", "bonito", "melhor", "mais performático", "robusto"). O linter exige a definição de um Critério de Aceitação quantitativo ou binário.
- **Severidade**: `Warning`
- **Exemplo Incorreto**: "Fazer o site carregar mais rápido para melhorar a conversão."
- **Exemplo Correto**: "Otimizar o site para que o tempo de carregamento no Google Lighthouse seja sistematicamente inferior a 2 segundos."

### 3.4. `detect-conflicting-agreements` (Acordos Conflitantes)
- **Descrição**: O linter analisa a relação espacial e temporal de múltiplos acordos e detecta se o *Combinado B* exige algo que contradiz ou inviabiliza fisicamente o *Combinado A*.
- **Severidade**: `Warning`
- **Exemplo Disparador**: "Alice entregará o relátório financeiro complexo amanhã de manhã" CONFLITA COM "Alice estará alocada full-time no evento presencial de Vendas durante toda a manhã."

### 3.5. `require-consensus-quorum` (Quórum Mínimo de Consenso)
- **Descrição**: Para que um tipo específico de decisão (ex: financeira ou de arquitetura) seja selado, as partes-chave identificadas pelo sistema como cruciais (deciders) devem expressamente concordar.
- **Severidade**: `Error`
- **Detalhe**: Se a decisão altera o orçamento do departamento, e o Diretor Financeiro (presente no array de participantes) ainda está com status `pending`, o linter trava a transição de estado para "Finalized".

### 3.6. `no-implicit-assumptions` (Premissas Implícitas)
- **Descrição**: Verifica se a execução de uma tarefa possui dependências óbvias de fatores externos que não estão documentadas no campo `reservations` (Ressalvas).
- **Severidade**: `Info` / `Warning`
- **Mensagem do Linter (Prompt)**: *"Notamos que você se comprometeu a entregar a 'Integração com o Fornecedor X'. Isso depende do ambiente de staging deles estar ativo? Sugerimos adicionar uma ressalva para proteger o prazo caso a API externa sofra downtime."*

## 4. Implementação Prática e Modos de Execução
O Consensus Linter pode ser executado em diferentes momentos do ciclo de vida de um acordo:
1. **Real-time Mode**: Atua como um assistente (bot) ouvindo a reunião, enviando *prompts* no chat (ex: *"Vocês acabaram de combinar X, mas quem é o responsável?"*) para fechar as lacunas de imediato.
2. **Draft/Review Mode**: Roda no *post-mortem* da reunião, sublinhando o documento de rascunho de vermelho/amarelo, semelhante a um corretor ortográfico, antes da emissão oficial.
3. **Strict CI Mode (Contract Integration)**: Um *Entendimento* injetado via API ou criado na plataforma só adquire validade legal ou status "Approved" se passar 100% no set de regras ativas configuradas pela governança da organização.
