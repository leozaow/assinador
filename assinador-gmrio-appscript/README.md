# Gerador de Assinatura GM-Rio — Google Apps Script

Projeto pronto para ser instalado em uma Planilha Google e publicado como Web App restrito ao domínio Google Workspace `@gm.rio`.

## O que esta versão entrega

- acesso do Web App limitado ao domínio `gm.rio` no deployment;
- segunda validação do domínio no servidor;
- interface indisponível quando o HTML é aberto fora do Apps Script;
- assinatura pessoal e assinatura de setor;
- somente a identidade visual da Guarda Municipal do Rio de Janeiro;
- dados iniciais e presets totalmente fictícios;
- prévia atualizada enquanto o usuário digita;
- bloqueio de seleção, menu de contexto e cópia direta da prévia;
- botão **Copiar e registrar assinatura**;
- modal visível durante o registro;
- gravação do e-mail autenticado, nome/título, setor, telefones, links, versão e hash;
- confirmação posterior do status `COPIADA`;
- até quatro telefones;
- sugestões de unidade lidas da aba `UNIDADES`;
- preenchimento automático entre sigla e nome quando uma sugestão exata é escolhida;
- URLs de site e logo limitadas a domínios terminados em `.rio`;
- links sociais limitados ao domínio da respectiva rede;
- imagens públicas carregadas do GitHub Pages informado.

## Arquivos do Apps Script

| Arquivo entregue | Criar no editor como |
| --- | --- |
| `Code.gs` | Script |
| `Index.html` | HTML |
| `Stylesheet.html` | HTML |
| `JavaScript.html` | HTML |
| `appsscript.json` | Manifesto do projeto |

A pasta `assets-fonte` contém uma cópia local da logo GM-Rio e dos ícones. Ela é apenas backup para hospedagem; não precisa ser enviada ao editor do Apps Script.

## Instalação passo a passo

### 1. Criar a planilha

1. Entre no Google com uma conta principal `@gm.rio`.
2. Crie uma Planilha Google vazia.
3. Dê um nome como `Gerador de Assinaturas GM-Rio`.
4. A planilha não precisa ser compartilhada com os usuários finais.

O arquivo `modelo-planilha-gmrio.xlsx` desta entrega é apenas uma referência visual. A função de configuração cria e formata as mesmas abas automaticamente na Planilha Google.

### 2. Criar o Apps Script vinculado

1. Na planilha, acesse **Extensões → Apps Script**.
2. Substitua o conteúdo de `Code.gs` pelo arquivo entregue.
3. Crie os arquivos HTML `Index`, `Stylesheet` e `JavaScript`.
4. Copie o conteúdo dos respectivos arquivos entregues.
5. Em **Configurações do projeto**, habilite a exibição do arquivo de manifesto.
6. Substitua `appsscript.json` pelo manifesto entregue.
7. Salve o projeto.

Também é possível enviar os arquivos com `clasp`, caso sua equipe já utilize a ferramenta.

### 3. Preparar as abas

1. No seletor de funções do editor, escolha `configurarProjeto`.
2. Clique em **Executar**.
3. Autorize o acesso solicitado usando a conta `@gm.rio`.
4. Volte à planilha e confirme a criação das abas:
   - `REGISTROS`;
   - `UNIDADES`.

A função salva o ID da planilha em `ScriptProperties`. Por isso o Web App consegue gravar sem depender de uma planilha ativa.

### 4. Preencher `UNIDADES`

A aba deve manter exatamente estes cabeçalhos:

| Sigla UA | Nome UA |
| --- | --- |
| GM/EXEMPLO/UA1 | Unidade Administrativa Exemplo |

As três linhas iniciais são fictícias e podem ser removidas. Inclua os setores oficiais a partir da linha 2. O usuário continuará podendo digitar uma unidade que não exista na lista.

### 5. Implantar como Web App

1. No Apps Script, clique em **Implantar → Nova implantação**.
2. Selecione **App da Web**.
3. Configure **Executar como: Eu**.
4. Configure **Quem pode acessar: qualquer pessoa em gm.rio** ou a opção equivalente de acesso ao domínio.
5. Clique em **Implantar**.
6. Distribua somente a URL terminada em `/exec`.

Não use acesso público, anônimo ou “qualquer pessoa com Conta Google”. O nível correto é o acesso ao domínio do implantador.

Se a opção do domínio não aparecer, o administrador do Google Workspace precisa liberar a implantação interna de Apps Script.

### 6. Homologar antes da divulgação

Teste obrigatoriamente:

1. uma conta `@gm.rio` diferente da conta implantadora;
2. uma conta externa, que deve ser bloqueada pelo Google;
3. o e-mail exibido no topo do aplicativo;
4. o registro criado na aba `REGISTROS`;
5. a mudança do status de `REGISTRADA` para `COPIADA`;
6. a colagem no Gmail;
7. o carregamento das imagens em um e-mail recebido fora do domínio.

## Fluxo de registro

1. O usuário preenche os dados e vê uma prévia local.
2. A prévia não permite seleção ou cópia normal.
3. Ao clicar em **Copiar e registrar assinatura**, um modal informa que o registro está sendo realizado.
4. O servidor lê o e-mail com `Session.getActiveUser().getEmail()`.
5. O servidor rejeita e-mail vazio ou fora de `gm.rio`.
6. O servidor valida todos os textos, telefones e links.
7. O servidor monta o HTML final e grava a linha com status `REGISTRADA`.
8. Somente depois o navegador recebe e copia o HTML.
9. Com a cópia concluída, o status passa para `COPIADA` e `DATA_COPIA` é preenchida.

Se a cópia automática falhar depois do registro, o modal oferece **Tentar copiar novamente** sem duplicar a linha.

## Telefones

- Telefone principal: prefixo fixo `+55 (21)` e entrada de 8 ou 9 dígitos.
- Telefones adicionais: opcionais e aceitam 5, 8 ou 9 dígitos.
- Todos os telefones são exibidos com o prefixo `+55 (21)`.
- Telefone fixo: `+55 (21) NNNN-NNNN`.
- Celular: `+55 (21) N NNNN-NNNN`.
- Cinco dígitos são tratados como ramal. O sistema acrescenta automaticamente os três primeiros dígitos do telefone principal e exibe `+55 (21) NNN-NNNNN`.
- Cada telefone possui uma descrição opcional de até 60 caracteres, exibida como `número - descrição`.
- Caracteres não numéricos são removidos durante a digitação e novamente no servidor.

## Restrições de URL

| Campo | Regra aplicada |
| --- | --- |
| Site principal | HTTPS e hostname terminado em `.rio` |
| Link da logo | HTTPS e hostname terminado em `.rio` |
| Instagram | `instagram.com` ou subdomínio |
| Facebook | `facebook.com` ou subdomínio |
| YouTube | `youtube.com` ou subdomínio |
| X | `x.com` ou subdomínio |
| LinkedIn | `linkedin.com` ou subdomínio |

A checagem existe tanto no navegador quanto no servidor. O servidor é a autoridade final.

## Imagens utilizadas

- Logo GM-Rio: `https://leozaow.github.io/assinador/orgaos-entidades/gm-rio.png`
- Ícones: `https://leozaow.github.io/assinador/icones/<rede>.png`

Essas imagens precisam permanecer públicas e imutáveis. A melhor prática de produção é copiar os ativos para uma hospedagem institucional controlada e atualizar `APP_CONFIG` e `SOCIAL_CONFIG` em `Code.gs`.

## Observação sobre bloqueio de cópia

O projeto impede o fluxo normal de seleção, Ctrl+C, menu de contexto e arraste dentro da prévia. Isso obriga o usuário comum a utilizar o botão auditado.

Nenhum site consegue impedir de forma absoluta que uma pessoa com conhecimento técnico use as ferramentas de desenvolvedor, faça captura de tela ou reconstrua o HTML recebido. O controle efetivo desta solução é: acesso interno, geração final no servidor e botão auditado.

## Atualizações futuras

Ao alterar o código:

1. incremente `templateVersion` em `Code.gs`;
2. crie uma nova versão do deployment;
3. teste a URL de implantação;
4. mantenha a versão anterior disponível para rollback até concluir a homologação.
