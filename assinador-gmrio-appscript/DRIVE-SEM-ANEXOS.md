# Drive sem anexos visíveis — teste GM-Rio 1.3.0

## Objetivo

Evitar que a assinatura enviada pelo Gmail exiba `image.png` como anexo, mantendo logo e ícones administrados no Google Drive.

## Mudança técnica

**1.2.0 (descartado para produção):**

`Drive -> Blob -> data:image/base64 -> clipboard -> Gmail -> parte MIME inline`

Esse fluxo pode gerar anexo visual.

**1.3.0 (teste atual):**

`Drive público -> URL HTTPS googleusercontent -> HTML -> clipboard -> Gmail`

O e-mail passa a referenciar uma imagem externa, em vez de transportar o PNG embutido.

## Como preparar um asset

1. Envie o PNG para uma pasta institucional do Drive.
2. Abra **Compartilhar**.
3. Em **Acesso geral**, selecione **Qualquer pessoa com o link**.
4. Mantenha a permissão **Leitor**.
5. Copie o link normal do Drive.
6. Cole na coluna `ARQUIVO_DRIVE` da aba `ASSETS`.

Use essa pasta somente para conteúdo que já é público por natureza (logos e ícones). Não coloque documentos internos nela.

## Teste mínimo

Comece apenas com `logo_gm`. Execute `testarAssetsDrive()` no editor. Depois copie a assinatura, salve-a no Gmail e mande para uma conta externa.

O resultado esperado é:

- imagem visível na assinatura;
- nenhum `image.png` exibido como anexo;
- HTML referenciando uma URL HTTPS remota;
- funcionamento fora do domínio `gm.rio`.

Se a imagem não aparecer, verifique primeiro se o administrador do Workspace permite compartilhamento público no Drive.

## Observação de arquitetura

Esta é uma solução de homologação. O Gmail documenta que imagens do Drive usadas em assinatura precisam estar públicas, mas não documenta `lh3.googleusercontent.com/d/...` como uma API de hospedagem com garantia contratual de estabilidade. Se a GM-Rio disponibilizar posteriormente um host institucional, basta trocar a função que gera as URLs; o restante do editor permanece igual.
