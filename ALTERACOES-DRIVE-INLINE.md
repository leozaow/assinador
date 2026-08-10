# ALTERAÇÕES — DRIVE SEM ANEXOS VISÍVEIS

A variante `assinador-gmrio-appscript` foi atualizada para `GM-RIO-1.3.0`.

A versão 1.2.0, que convertia arquivos do Drive para `data:image/...;base64`, foi abandonada após o Gmail exibir `image.png` como anexo em mensagem de teste.

Na 1.3.0:

- a aba `ASSETS` continua recebendo link normal ou ID do arquivo no Drive;
- o arquivo precisa estar em **Qualquer pessoa com o link / Leitor**;
- o Apps Script valida tipo, tamanho e compartilhamento;
- o HTML final usa URL HTTPS remota `googleusercontent.com`;
- não há Blob/base64 no HTML final;
- a cópia prioriza `ClipboardItem` com HTML puro para preservar o `src` remoto;
- GitHub Pages permanece como fallback quando uma chave da aba `ASSETS` estiver vazia.

Consulte `assinador-gmrio-appscript/DRIVE-SEM-ANEXOS.md`.
