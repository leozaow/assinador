# DOCUMENTO LEGADO — NÃO USAR EM PRODUÇÃO

A estratégia inline/base64 descrita abaixo corresponde à versão 1.2.0 e foi substituída pela 1.3.0 porque o Gmail pode exibir a imagem como anexo (`image.png`). Consulte `DRIVE-SEM-ANEXOS.md`.

---

# Migração dos assets para Google Drive

Esta versão foi adaptada para retirar a dependência das imagens hospedadas no GitHub Pages.

## Fluxo

```text
Google Drive (PNG/JPG)
        ↓
Apps Script / DriveApp
        ↓
Blob
        ↓
data:image/...;base64
        ↓
Prévia e HTML da assinatura
        ↓
Cópia rica para o Gmail
```

O projeto continua podendo ficar versionado no GitHub. O que deixa de depender do GitHub são os arquivos visuais usados na assinatura.

## Configuração

1. Atualize os arquivos `Code.gs`, `JavaScript.html` e `appsscript.json` no projeto Apps Script.
2. Execute `configurarProjeto()` novamente. A função preserva `REGISTROS` e `UNIDADES` e cria/completa a aba `ASSETS`.
3. Na aba `ASSETS`, cole o link do Drive ou o ID de cada PNG.
4. Execute `testarAssetsDrive()` e confira se todas as linhas preenchidas retornam `ok: true`.
5. Crie uma nova versão da implantação do Web App.
6. Abra a URL `/exec`, gere uma assinatura e cole no Gmail.
7. Salve a assinatura no Gmail e envie uma mensagem para uma conta externa para confirmar a persistência das imagens.

## Compartilhamento dos arquivos

Para o Apps Script ler o arquivo, basta que a conta que executa o Web App tenha acesso a ele. Quando a implantação está configurada como **Executar como: Eu**, o arquivo pode permanecer restrito à conta proprietária ou a um local do Drive ao qual essa conta tenha acesso.

Isso é diferente de usar `<img src="URL_DO_DRIVE">`: o destinatário não precisa abrir o arquivo diretamente no Drive, porque o servidor converte a imagem em conteúdo inline antes da cópia.

## Fallback

Enquanto uma linha de `ASSETS` estiver vazia, o sistema continuará usando a URL antiga do GitHub Pages para aquela imagem específica. Isso permite migrar uma imagem por vez e voltar rapidamente em caso de problema.

## Limite

O mecanismo prepara o HTML para uma colagem inline. A conversão definitiva realizada pelo editor de assinaturas do Gmail é comportamento do próprio Gmail e deve ser homologada no domínio antes da distribuição.
