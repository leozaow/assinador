# Gerador de Assinatura Institucional GM-Rio

Aplicação web estática para criação de assinaturas de e-mail pessoais e institucionais da Guarda Municipal do Rio de Janeiro. O sistema permite editar os dados da assinatura, alternar entre modelos de pessoa e setor, selecionar uma marca institucional, configurar redes sociais e copiar o resultado como HTML formatado para o editor de assinaturas do Gmail.

O projeto foi deliberadamente implementado sem framework, processo de build, dependências externas ou backend. Toda a interface, os estilos e a lógica da aplicação estão em um único arquivo `index.html`. Os arquivos PNG ficam separados apenas para facilitar a substituição e a manutenção das identidades visuais.

## Objetivo do projeto

O gerador resolve dois cenários:

1. **Assinatura pessoal:** identifica nominalmente um servidor, seu cargo/função, setor, sigla e telefone.
2. **Assinatura institucional:** identifica uma equipe, serviço ou ponto focal sem vincular a comunicação a um servidor específico.

O resultado exibido na prévia não é uma imagem única. Nomes, cargos, setores, telefones e links permanecem como texto HTML real, selecionável e acessível. Somente as marcas e os ícones sociais são imagens.

## Arquitetura

```text
gerador-assinatura-html/
├── index.html
├── README.md
├── icones/
│   ├── facebook.png
│   ├── globe.png
│   ├── instagram.png
│   ├── linkedin.png
│   ├── x.png
│   └── youtube.png
└── orgaos-entidades/
    ├── gm-rio.png
    └── integridade-transparencia.png
```

### `index.html`

Contém os três componentes da aplicação:

- **HTML:** formulário de configuração, seletores de modelos, prévia e comandos;
- **CSS:** layout responsivo do gerador e aparência dos controles;
- **JavaScript:** gerenciamento do estado, aplicação dos modelos, montagem da assinatura e cópia para a área de transferência.

Não há arquivos JavaScript ou CSS externos. Isso permite publicar o projeto diretamente em qualquer hospedagem estática.

### `icones/`

Contém os PNGs utilizados na barra de redes sociais da assinatura. Os arquivos atuais têm 48 × 48 pixels e são renderizados na assinatura com 24 × 24 pixels.

### `orgaos-entidades/`

Contém as marcas verticais disponíveis como modelos. A aplicação oferece atualmente:

- Guarda Municipal do Rio de Janeiro;
- Integridade e Transparência.

## Funcionalidades

### Assinatura pessoal

Campos padrão:

- nome completo;
- cargo/função;
- sigla do setor;
- nome do setor;
- telefone;
- texto e URL do site.

Valores de demonstração configurados no código:

```text
Nome: Leandro Barbosa de Lima
Cargo/função: Gerente II
Sigla: GM/IG/DRH/CAP/GPP
Setor: Gerência de Pagamento de Pessoal
Telefone: +55 (21) 2976-6187
```

### Assinatura institucional

Campos:

- nome da equipe, serviço ou ponto focal;
- descrição resumida da atividade;
- unidade responsável;
- sigla da unidade;
- telefone;
- texto e URL do site.

Modelos rápidos incluídos:

| Chave interna | Título | Descrição |
| --- | --- | --- |
| `folha` | Folha de Pagamento | Processamento e controle da folha de pagamento |
| `sei` | Ponto Focal SEI!Rio | Orientação e suporte aos usuários do SEI!Rio |
| `esocial` | eSocial | Gestão e transmissão dos eventos do eSocial |

Todos os modelos institucionais usam:

```text
Unidade: Gerência de Pagamento de Pessoal
Sigla: GM/IG/DRH/CAP/GPP
```

Os modelos são apenas preenchimentos iniciais. Depois de selecionar um modelo, todos os campos continuam editáveis.

### Identidade visual

O usuário pode:

- selecionar uma das marcas incluídas no projeto;
- informar a URL HTTPS de outra marca;
- definir o link aberto ao clicar na marca;
- alterar a cor institucional da assinatura.

Quando o campo de URL externa está vazio, a aplicação usa a imagem selecionada em `orgaos-entidades/`. Quando uma URL é informada, ela tem prioridade sobre o modelo local.

### Redes sociais

As redes são definidas no array JavaScript `socialData`. Cada entrada contém:

```javascript
[identificador, rotulo, caminhoDoIcone, urlPadrao]
```

As opções atuais são site, Instagram, Facebook, YouTube, X e LinkedIn. Todas começam habilitadas, mas podem ser ocultadas individualmente. Para cada rede existem dois campos independentes:

- **Link de destino:** endereço aberto quando o destinatário clica no ícone;
- **Link da imagem do ícone:** endereço do PNG exibido na assinatura.

O link da imagem começa com o caminho local correspondente em `icones/`, mas pode ser substituído por uma URL HTTPS pública. A miniatura do formulário e a prévia da assinatura são atualizadas em tempo real. Ao copiar a assinatura, caminhos locais relativos são convertidos para URLs absolutas da publicação; URLs externas são preservadas.

### Pré-visualização

A função `render()` lê o estado atual do formulário e reconstrói a assinatura dentro de `#signature`. A atualização ocorre sempre que um campo é alterado, uma marca é selecionada, um modelo institucional é aplicado ou uma opção de visibilidade muda.

A assinatura é construída com:

- tabelas HTML para estabilidade em clientes de e-mail;
- estilos inline;
- fonte segura `Arial, Helvetica, sans-serif`;
- links `tel:` para telefone;
- links HTTPS para site, marcas e redes;
- dimensões explícitas para os ícones.

### Cópia para o Gmail

O botão **Copiar assinatura para o Gmail** clona o conteúdo da prévia e converte todos os caminhos relativos de imagens e links em URLs absolutas com base no endereço onde o gerador está publicado.

Em navegadores modernos, a aplicação grava simultaneamente:

- `text/html`, preservando layout, imagens e links;
- `text/plain`, usado como alternativa por sistemas sem suporte a HTML.

Caso a API moderna de área de transferência não esteja disponível, o código utiliza seleção do DOM e `document.execCommand('copy')` como fallback.

## Estado e elementos relevantes

O estado é mantido diretamente no navegador, sem persistência e sem envio de dados para servidores.

Variáveis principais:

- `mode`: `personal` ou `sector`;
- `logoModel`: `gm` ou `integrity`;
- `presets`: configurações dos modelos institucionais;
- `socialData`: cadastro dos ícones, rótulos e URLs das redes.

IDs importantes do DOM:

| ID | Responsabilidade |
| --- | --- |
| `tabPersonal` | ativa a assinatura pessoal |
| `tabSector` | ativa a assinatura institucional |
| `personalFields` | campos exclusivos da pessoa |
| `sectorFields` | campos exclusivos da equipe ou serviço |
| `logoUrl` | URL externa opcional da marca |
| `color` | cor aplicada à assinatura |
| `socials` | contêiner gerado a partir de `socialData` |
| `signature` | HTML final exibido e copiado |
| `copy` | comando de cópia para o Gmail |

## Manutenção

### Alterar valores padrão

Os valores da assinatura pessoal estão nos atributos `value` dos campos HTML. Os modelos institucionais estão no objeto `presets`, localizado no bloco `<script>`.

Ao alterar um modelo institucional, preserve também os valores definidos no evento dos botões de modelo:

```javascript
sectorUnit.value = 'Gerência de Pagamento de Pessoal';
sectorAcronym.value = 'GM/IG/DRH/CAP/GPP';
```

### Adicionar uma rede social

1. Adicione o PNG em `icones/`.
2. Inclua uma nova entrada em `socialData`.

Exemplo estrutural:

```javascript
['nova-rede', 'Nova Rede', 'icones/nova-rede.png', 'https://exemplo.gov.br']
```

O formulário e a assinatura são gerados automaticamente a partir do array. Não é necessário criar manualmente novos controles HTML. Para cada entrada, o sistema cria o controle de visibilidade, a miniatura, o link de destino e o link da imagem.

### Adicionar uma marca institucional

Para incluir uma terceira marca:

1. armazene o PNG em `orgaos-entidades/`;
2. inclua um novo botão no contêiner `.entity`;
3. amplie os valores aceitos por `logoModel`;
4. atualize a seleção de `resolvedLogo` dentro de `render()`;
5. aplique a classe `on` somente ao botão selecionado.

A proporção da marca pode variar, pois o CSS usa `object-fit: contain` nos seletores e `height: auto` na assinatura. Para manter consistência visual, recomenda-se PNG vertical, fundo transparente e largura suficiente para renderização nítida.

### Alterar o layout da assinatura

O HTML copiado é definido dentro do template literal atribuído a:

```javascript
signature.innerHTML = `...`;
```

Alterações visuais feitas apenas no CSS da classe `.signature` afetam a prévia do gerador, mas não necessariamente o conteúdo colado no Gmail. Qualquer estilo que precise acompanhar a assinatura deve estar inline dentro desse template.

## Restrições importantes

- Não converter a assinatura inteira em imagem; isso elimina texto selecionável e prejudica acessibilidade.
- Não substituir tabelas por layouts baseados exclusivamente em Flexbox ou Grid dentro do HTML copiado; clientes de e-mail podem remover ou interpretar esses recursos de forma diferente.
- Não mover ou renomear as pastas de imagens sem atualizar os caminhos em `index.html`.
- Não excluir imagens já usadas por assinaturas distribuídas. O Gmail continuará referenciando a URL original.
- Não usar URLs temporárias, autenticadas ou com data de expiração.
- As imagens devem estar publicamente acessíveis por HTTPS para aparecerem aos destinatários.
- O sistema não armazena dados, não possui autenticação e não realiza chamadas de API.

## Publicação estática

O projeto pode ser publicado diretamente no GitHub Pages. O arquivo `index.html` e as pastas `icones` e `orgaos-entidades` devem ficar na raiz da fonte de publicação.

Configuração esperada no GitHub Pages:

```text
Source: Deploy from a branch
Branch: main
Folder: /(root)
```

Como todos os caminhos são relativos, o projeto funciona tanto em um domínio próprio quanto em uma URL de projeto no formato `usuario.github.io/repositorio/`.

## Critérios para validar alterações

Após uma modificação, verificar:

- alternância entre assinatura pessoal e institucional;
- aplicação dos três modelos rápidos;
- preenchimento da sigla `GM/IG/DRH/CAP/GPP` nos modelos;
- seleção das duas marcas locais;
- prioridade da URL externa de marca;
- atualização em tempo real da prévia;
- exibição e ocultação das redes;
- edição independente do link de destino e do link da imagem de cada ícone;
- atualização da miniatura ao trocar o link da imagem;
- links de telefone, site e redes;
- conversão das imagens para URLs absolutas na cópia;
- colagem no editor de assinaturas do Gmail;
- funcionamento em tela estreita.

## Contexto para manutenção assistida por IA

Ao solicitar alterações a uma IA ou a outro desenvolvedor, informe que este é um gerador de assinaturas de e-mail **100% estático e sem dependências**, cujo código-fonte está concentrado em `index.html`. A interface do gerador pode usar CSS responsivo moderno, mas o HTML montado pela função `render()` deve continuar baseado em tabelas e estilos inline por causa da compatibilidade com Gmail e outros clientes de e-mail.

Qualquer alteração deve preservar:

1. a estrutura das pastas de imagens;
2. os dois modos de assinatura;
3. a edição em tempo real;
4. a transformação de caminhos relativos em URLs absolutas;
5. a cópia simultânea nos formatos HTML e texto;
6. o funcionamento sem build, servidor ou dependências externas.
