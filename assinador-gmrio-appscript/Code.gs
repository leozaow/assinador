const APP_CONFIG = Object.freeze({
  allowedDomain: 'gm.rio',
  spreadsheetProperty: 'SPREADSHEET_ID',
  recordsSheet: 'REGISTROS',
  unitsSheet: 'UNIDADES',
  assetsSheet: 'ASSETS',
  templateVersion: 'GM-RIO-1.3.0',
  assetMaxBytes: 1048576,
  assetBaseUrl: 'https://leozaow.github.io/assinador/',
  logoUrl: 'https://leozaow.github.io/assinador/orgaos-entidades/gm-rio.png',
  defaultLogoLink: 'https://guardamunicipal.prefeitura.rio/',
  defaultSiteUrl: 'https://guardamunicipal.prefeitura.rio/',
  defaultSiteText: 'guardamunicipal.prefeitura.rio',
  defaultColor: '#00558c'
});

const ASSET_HEADERS = Object.freeze(['CHAVE', 'ARQUIVO_DRIVE', 'DESCRICAO']);

const ASSET_DEFAULTS = Object.freeze([
  ['logo_gm', '', 'Logo principal da Guarda Municipal'],
  ['icon_site', '', 'Ícone do site'],
  ['icon_instagram', '', 'Ícone do Instagram'],
  ['icon_facebook', '', 'Ícone do Facebook'],
  ['icon_youtube', '', 'Ícone do YouTube'],
  ['icon_x', '', 'Ícone do X'],
  ['icon_linkedin', '', 'Ícone do LinkedIn']
]);

const RECORD_HEADERS = Object.freeze([
  'ID_REGISTRO',
  'DATA_REGISTRO',
  'DATA_COPIA',
  'STATUS',
  'EMAIL_LOGADO',
  'TIPO_ASSINATURA',
  'NOME_OU_TITULO',
  'CARGO_OU_DESCRICAO',
  'SIGLA_UA',
  'NOME_UA',
  'TELEFONE_PRINCIPAL',
  'TELEFONE_2',
  'TELEFONE_3',
  'TELEFONE_4',
  'TEXTO_SITE',
  'LINK_SITE',
  'LINK_LOGO',
  'REDES_ATIVAS',
  'LINKS_REDES',
  'COR',
  'MOSTRAR_UNIDADE',
  'VERSAO_MODELO',
  'HASH_HTML_SHA256',
  'ID_REQUISICAO'
]);

const SOCIAL_CONFIG = Object.freeze({
  site: {
    label: 'Site',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/globe.png',
    defaultUrl: APP_CONFIG.defaultSiteUrl,
    hostRule: 'rio'
  },
  instagram: {
    label: 'Instagram',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/instagram.png',
    defaultUrl: 'https://www.instagram.com/gmrio.oficial/',
    hostRule: 'instagram.com'
  },
  facebook: {
    label: 'Facebook',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/facebook.png',
    defaultUrl: 'https://www.facebook.com/gmrio.oficial',
    hostRule: 'facebook.com'
  },
  youtube: {
    label: 'YouTube',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/youtube.png',
    defaultUrl: 'https://www.youtube.com/@ASCGMRIO',
    hostRule: 'youtube.com'
  },
  x: {
    label: 'X',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/x.png',
    defaultUrl: 'https://x.com/GMRio',
    hostRule: 'x.com'
  },
  linkedin: {
    label: 'LinkedIn',
    iconUrl: APP_CONFIG.assetBaseUrl + 'icones/linkedin.png',
    defaultUrl: 'https://www.linkedin.com/company/guarda-municipal-do-rio-de-janeiro',
    hostRule: 'linkedin.com'
  }
});

/**
 * Ponto de entrada do Web App. O deployment também deve ser configurado como
 * "Qualquer pessoa em gm.rio". A verificação abaixo é uma segunda barreira.
 */
function doGet() {
  exigirUsuarioGmRio_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Gerador de Assinatura GM-Rio');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Execute uma vez no editor, a partir de uma planilha à qual o script esteja
 * vinculado. Cria e formata REGISTROS e UNIDADES e salva o ID da planilha.
 */
function configurarProjeto() {
  const email = Session.getEffectiveUser().getEmail().trim().toLowerCase();
  if (!pertenceAoDominio_(email, APP_CONFIG.allowedDomain)) {
    throw new Error('A configuração deve ser executada por uma conta @gm.rio.');
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Abra a planilha, acesse Extensões > Apps Script e execute esta função novamente.');
  }

  PropertiesService.getScriptProperties()
    .setProperty(APP_CONFIG.spreadsheetProperty, spreadsheet.getId());

  garantirEstrutura_(spreadsheet);
  spreadsheet.setSpreadsheetTimeZone('America/Sao_Paulo');
  spreadsheet.toast('Estrutura configurada. Agora implante o projeto como Web App.', 'GM-Rio', 8);

  return {
    spreadsheetId: spreadsheet.getId(),
    sheets: [APP_CONFIG.recordsSheet, APP_CONFIG.unitsSheet, APP_CONFIG.assetsSheet]
  };
}

/** Retorna dados iniciais somente para usuário autenticado do domínio. */
function getBootstrapData() {
  const email = exigirUsuarioGmRio_();
  const spreadsheet = obterPlanilha_();
  garantirEstrutura_(spreadsheet);

  const assets = carregarAssets_(spreadsheet);

  return {
    email: email,
    units: lerUnidades_(spreadsheet),
    config: {
      templateVersion: APP_CONFIG.templateVersion,
      logoUrl: assets.logo_gm,
      defaultLogoLink: APP_CONFIG.defaultLogoLink,
      defaultSiteUrl: APP_CONFIG.defaultSiteUrl,
      defaultSiteText: APP_CONFIG.defaultSiteText,
      defaultColor: APP_CONFIG.defaultColor,
      socials: Object.keys(SOCIAL_CONFIG).map(function (key) {
        return {
          key: key,
          label: SOCIAL_CONFIG[key].label,
          iconUrl: assets['icon_' + key] || SOCIAL_CONFIG[key].iconUrl,
          defaultUrl: SOCIAL_CONFIG[key].defaultUrl
        };
      })
    }
  };
}

/**
 * Valida, gera e registra antes de devolver o conteúdo para cópia.
 * O cliente nunca informa o e-mail auditado; ele vem exclusivamente da sessão.
 */
function registrarAssinatura(payload) {
  const email = exigirUsuarioGmRio_();
  const dados = validarPayload_(payload);
  const spreadsheet = obterPlanilha_();
  const assinatura = montarAssinatura_(dados, spreadsheet);
  const hash = calcularSha256_(assinatura.html);
  const sheet = obterOuCriarRegistros_(spreadsheet);
  const lock = LockService.getScriptLock();

  lock.waitLock(15000);
  try {
    const existente = localizarPorRequisicao_(sheet, dados.requestId);
    if (existente) {
      if (existente.hash !== hash || existente.email !== email) {
        throw new Error('Identificador de requisição já utilizado com outros dados.');
      }
      return criarRespostaRegistro_(existente.id, existente.dataRegistro, assinatura);
    }

    const idRegistro = Utilities.getUuid();
    const agora = new Date();
    const redesAtivas = dados.socials.filter(function (social) {
      return social.enabled;
    });

    const row = [
      idRegistro,
      agora,
      '',
      'REGISTRADA',
      email,
      dados.mode,
      paraTextoPlanilha_(dados.title),
      paraTextoPlanilha_(dados.secondLine),
      paraTextoPlanilha_(dados.acronym),
      paraTextoPlanilha_(dados.unit),
      paraTextoPlanilha_(dados.phones[0].display),
      paraTextoPlanilha_(dados.phones[1] ? dados.phones[1].display : ''),
      paraTextoPlanilha_(dados.phones[2] ? dados.phones[2].display : ''),
      paraTextoPlanilha_(dados.phones[3] ? dados.phones[3].display : ''),
      paraTextoPlanilha_(dados.siteText),
      dados.siteUrl,
      dados.logoLink,
      redesAtivas.map(function (social) { return social.key; }).join(', '),
      paraTextoPlanilha_(redesAtivas.map(function (social) {
        return social.key + ': ' + social.url;
      }).join(' | ')),
      dados.color,
      dados.showUnit ? 'SIM' : 'NÃO',
      APP_CONFIG.templateVersion,
      hash,
      dados.requestId
    ];

    const nextRow = sheet.getLastRow() + 1;
    const target = sheet.getRange(nextRow, 1, 1, RECORD_HEADERS.length);
    target.setNumberFormat('@');
    target.setValues([row]);
    sheet.getRange(nextRow, 2).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheet.getRange(nextRow, 3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    SpreadsheetApp.flush();

    return criarRespostaRegistro_(idRegistro, agora, assinatura);
  } finally {
    lock.releaseLock();
  }
}

/** Marca a cópia como concluída depois que o navegador confirma o clipboard. */
function confirmarCopia(idRegistro) {
  const email = exigirUsuarioGmRio_();
  const id = validarTexto_(idRegistro, 'Identificador do registro', 1, 80);
  const sheet = obterOuCriarRegistros_(obterPlanilha_());
  const finder = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext();

  if (!finder) {
    throw new Error('Registro não encontrado.');
  }

  const row = finder.getRow();
  const storedEmail = String(sheet.getRange(row, 5).getDisplayValue()).trim().toLowerCase();
  if (storedEmail !== email) {
    throw new Error('O registro pertence a outro usuário.');
  }

  sheet.getRange(row, 3).setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sheet.getRange(row, 4).setValue('COPIADA');
  return { ok: true };
}

function criarRespostaRegistro_(idRegistro, dataRegistro, assinatura) {
  return {
    id: idRegistro,
    registeredAt: Utilities.formatDate(
      dataRegistro instanceof Date ? dataRegistro : new Date(dataRegistro),
      'America/Sao_Paulo',
      'dd/MM/yyyy HH:mm:ss'
    ),
    html: assinatura.html,
    text: assinatura.text
  };
}

function exigirUsuarioGmRio_() {
  const email = Session.getActiveUser().getEmail().trim().toLowerCase();
  if (!pertenceAoDominio_(email, APP_CONFIG.allowedDomain)) {
    throw new Error('Acesso permitido somente para contas @gm.rio autenticadas.');
  }
  return email;
}

function pertenceAoDominio_(email, domain) {
  if (!email || email.indexOf('@') < 1) return false;
  return email.split('@').pop() === domain;
}

function obterPlanilha_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.spreadsheetProperty);
  if (!id) {
    throw new Error('Projeto ainda não configurado. Execute configurarProjeto() no editor do Apps Script.');
  }
  return SpreadsheetApp.openById(id);
}

function garantirEstrutura_(spreadsheet) {
  obterOuCriarRegistros_(spreadsheet);
  obterOuCriarUnidades_(spreadsheet);
  obterOuCriarAssets_(spreadsheet);
}

function obterOuCriarRegistros_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(APP_CONFIG.recordsSheet);
  if (!sheet) sheet = spreadsheet.insertSheet(APP_CONFIG.recordsSheet);

  const currentHeaders = sheet.getRange(1, 1, 1, RECORD_HEADERS.length).getDisplayValues()[0];
  const needsHeaders = RECORD_HEADERS.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsHeaders) {
    if (sheet.getLastRow() > 0 && currentHeaders.some(String)) {
      throw new Error('A aba REGISTROS possui cabeçalhos incompatíveis. Use o modelo entregue ou uma planilha vazia.');
    }
    sheet.getRange(1, 1, 1, RECORD_HEADERS.length).setValues([RECORD_HEADERS]);
  }

  const header = sheet.getRange(1, 1, 1, RECORD_HEADERS.length);
  header
    .setBackground('#00558c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 285);
  sheet.setColumnWidths(2, 3, 145);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidths(6, 5, 180);
  sheet.setColumnWidths(11, 4, 135);
  sheet.setColumnWidths(15, 5, 220);
  sheet.setColumnWidths(20, 5, 150);
  return sheet;
}

function obterOuCriarUnidades_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(APP_CONFIG.unitsSheet);
  if (!sheet) sheet = spreadsheet.insertSheet(APP_CONFIG.unitsSheet);

  const headers = sheet.getRange(1, 1, 1, 2).getDisplayValues()[0];
  if (headers[0] !== 'Sigla UA' || headers[1] !== 'Nome UA') {
    if (sheet.getLastRow() > 0 && headers.some(String)) {
      throw new Error('A aba UNIDADES deve possuir os cabeçalhos "Sigla UA" e "Nome UA".');
    }
    sheet.getRange(1, 1, 1, 2).setValues([['Sigla UA', 'Nome UA']]);
  }

  if (sheet.getLastRow() === 1) {
    sheet.getRange(2, 1, 3, 2).setValues([
      ['GM/EXEMPLO/UA1', 'Unidade Administrativa Exemplo'],
      ['GM/EXEMPLO/UA2', 'Coordenadoria Fictícia'],
      ['GM/EXEMPLO/UA3', 'Gerência Demonstrativa']
    ]);
  }

  sheet.getRange('A1:B1')
    .setBackground('#00558c')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 360);
  return sheet;
}

function obterOuCriarAssets_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(APP_CONFIG.assetsSheet);
  if (!sheet) sheet = spreadsheet.insertSheet(APP_CONFIG.assetsSheet);

  const headers = sheet.getRange(1, 1, 1, ASSET_HEADERS.length).getDisplayValues()[0];
  const validHeaders = ASSET_HEADERS.every(function (header, index) {
    return headers[index] === header;
  });

  if (!validHeaders) {
    if (sheet.getLastRow() > 0 && headers.some(String)) {
      throw new Error('A aba ASSETS possui cabeçalhos incompatíveis. Use CHAVE, ARQUIVO_DRIVE e DESCRICAO.');
    }
    sheet.getRange(1, 1, 1, ASSET_HEADERS.length).setValues([ASSET_HEADERS]);
  }

  if (sheet.getLastRow() === 1) {
    sheet.getRange(2, 1, ASSET_DEFAULTS.length, ASSET_HEADERS.length).setValues(ASSET_DEFAULTS);
  } else {
    const existingKeys = new Set(
      sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
        .getDisplayValues()
        .flat()
        .map(function (value) { return String(value).trim(); })
        .filter(Boolean)
    );
    const missing = ASSET_DEFAULTS.filter(function (row) { return !existingKeys.has(row[0]); });
    if (missing.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, ASSET_HEADERS.length).setValues(missing);
    }
  }

  sheet.getRange('A1:C1')
    .setBackground('#00558c')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 430);
  sheet.setColumnWidth(3, 300);
  return sheet;
}

function carregarAssets_(spreadsheet) {
  const sheet = obterOuCriarAssets_(spreadsheet);
  const values = sheet.getLastRow() < 2
    ? []
    : sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();

  const configured = {};
  values.forEach(function (row) {
    const key = String(row[0] || '').trim();
    if (key) configured[key] = String(row[1] || '').trim();
  });

  const fallbacks = obterFallbacksAssets_();
  const result = {};
  Object.keys(fallbacks).forEach(function (key) {
    result[key] = configured[key]
      ? carregarImagemDriveComoUrlPublica_(configured[key], key)
      : fallbacks[key];
  });
  return result;
}

function obterFallbacksAssets_() {
  const result = { logo_gm: APP_CONFIG.logoUrl };
  Object.keys(SOCIAL_CONFIG).forEach(function (key) {
    result['icon_' + key] = SOCIAL_CONFIG[key].iconUrl;
  });
  return result;
}

/**
 * Converte um link/ID do Drive em uma URL HTTPS remota da infraestrutura
 * Google. Diferentemente da versão 1.2, a imagem NÃO é transformada em
 * data URI/base64. Isso mantém o <img src> como recurso externo e evita que
 * o navegador/Gmail precise transportar o PNG como parte MIME da mensagem.
 *
 * IMPORTANTE: o próprio suporte do Gmail exige que imagens do Drive usadas
 * em assinaturas estejam públicas. Portanto o arquivo precisa estar como
 * "Qualquer pessoa com o link" (visualizador) ou equivalente.
 */
function carregarImagemDriveComoUrlPublica_(value, assetKey) {
  const fileId = extrairIdDrive_(value);
  if (!fileId) {
    throw new Error('ASSETS: o valor de ' + assetKey + ' não contém um ID ou link válido do Google Drive.');
  }

  let file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (error) {
    throw new Error('ASSETS: não foi possível acessar ' + assetKey + ' no Drive. Verifique o ID e a permissão do arquivo.');
  }

  const mimeType = String(file.getMimeType() || '').toLowerCase();
  if (!/^image\/(png|jpeg|gif|webp)$/.test(mimeType)) {
    throw new Error('ASSETS: ' + assetKey + ' deve ser PNG, JPEG, GIF ou WebP. Tipo atual: ' + mimeType + '.');
  }

  const size = Number(file.getSize() || 0);
  if (size <= 0 || size > APP_CONFIG.assetMaxBytes) {
    throw new Error('ASSETS: ' + assetKey + ' deve ter até 1 MB. Tamanho atual: ' + size + ' bytes.');
  }

  const access = file.getSharingAccess();
  const isPublic = access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK;
  if (!isPublic) {
    throw new Error(
      'ASSETS: ' + assetKey + ' não está público. No Drive, altere o acesso geral para "Qualquer pessoa com o link" como Leitor. ' +
      'Isso é necessário para que destinatários externos consigam carregar a imagem da assinatura.'
    );
  }

  if (file.getSecurityUpdateEnabled() && file.getResourceKey()) {
    throw new Error(
      'ASSETS: ' + assetKey + ' exige uma chave de recurso do Drive. Para este asset público de assinatura, desative a atualização de segurança do link ' +
      'ou use um arquivo novo criado especificamente para a assinatura.'
    );
  }

  // Endpoint de entrega de imagem da infraestrutura googleusercontent.
  // Mantemos a origem remota no HTML; width/height continuam controlados
  // pela própria assinatura. O sufixo limita apenas a resolução de entrega.
  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(fileId) + '=w1000';
}

function extrairIdDrive_(value) {
  const raw = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;

  const patterns = [
    /\/file\/d\/([A-Za-z0-9_-]{20,})/i,
    /[?&]id=([A-Za-z0-9_-]{20,})/i,
    /\/d\/([A-Za-z0-9_-]{20,})/i
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = raw.match(patterns[i]);
    if (match) return match[1];
  }
  return '';
}

/**
 * Diagnóstico opcional. Execute no editor para validar os arquivos informados
 * na aba ASSETS antes de publicar uma nova versão do Web App.
 */
function testarAssetsDrive() {
  exigirUsuarioGmRio_();
  const spreadsheet = obterPlanilha_();
  const sheet = obterOuCriarAssets_(spreadsheet);
  const values = sheet.getLastRow() < 2
    ? []
    : sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();

  return values.filter(function (row) {
    return String(row[1] || '').trim();
  }).map(function (row) {
    const key = String(row[0] || '').trim();
    const id = extrairIdDrive_(row[1]);
    if (!id) return { key: key, ok: false, error: 'ID/link inválido' };
    try {
      const file = DriveApp.getFileById(id);
      const publicUrl = carregarImagemDriveComoUrlPublica_(id, key);
      return {
        key: key,
        ok: true,
        name: file.getName(),
        mimeType: file.getMimeType(),
        size: file.getSize(),
        id: id,
        sharingAccess: String(file.getSharingAccess()),
        sharingPermission: String(file.getSharingPermission()),
        securityUpdateEnabled: file.getSecurityUpdateEnabled(),
        publicUrl: publicUrl
      };
    } catch (error) {
      return { key: key, ok: false, error: String(error.message || error) };
    }
  });
}

function lerUnidades_(spreadsheet) {
  const sheet = obterOuCriarUnidades_(spreadsheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues()
    .map(function (row) {
      return {
        acronym: String(row[0]).trim(),
        name: String(row[1]).trim()
      };
    })
    .filter(function (unit) {
      return unit.acronym && unit.name;
    })
    .slice(0, 2000);
}

function localizarPorRequisicao_(sheet, requestId) {
  if (sheet.getLastRow() < 2) return null;
  const requestColumn = RECORD_HEADERS.indexOf('ID_REQUISICAO') + 1;
  const finder = sheet.getRange(2, requestColumn, sheet.getLastRow() - 1, 1)
    .createTextFinder(requestId)
    .matchEntireCell(true)
    .findNext();
  if (!finder) return null;

  const row = finder.getRow();
  return {
    id: sheet.getRange(row, 1).getDisplayValue(),
    dataRegistro: sheet.getRange(row, 2).getValue(),
    email: String(sheet.getRange(row, 5).getDisplayValue()).trim().toLowerCase(),
    hash: sheet.getRange(row, 23).getDisplayValue()
  };
}

function validarPayload_(payload) {
  if (!payload || Object.prototype.toString.call(payload) !== '[object Object]') {
    throw new Error('Dados da assinatura ausentes.');
  }

  const mode = payload.mode === 'sector' ? 'sector' : payload.mode === 'personal' ? 'personal' : '';
  if (!mode) throw new Error('Tipo de assinatura inválido.');

  const phones = validarTelefones_(payload.phones);
  const siteUrl = validarUrlRio_(payload.siteUrl, 'Link do site');
  const logoLink = validarUrlRio_(payload.logoLink, 'Link da logo');
  const socials = validarRedes_(payload.socials);

  return {
    mode: mode,
    title: validarTexto_(payload.title, mode === 'personal' ? 'Nome completo' : 'Nome da equipe', 2, 100),
    secondLine: validarTexto_(payload.secondLine, mode === 'personal' ? 'Cargo ou função' : 'Descrição', 2, 160),
    acronym: validarTexto_(payload.acronym, 'Sigla do setor', 1, 80),
    unit: validarTexto_(payload.unit, 'Nome do setor', 1, 160),
    phones: phones,
    siteText: validarTexto_(payload.siteText, 'Texto do site', 2, 80),
    siteUrl: siteUrl,
    logoLink: logoLink,
    color: validarCor_(payload.color),
    showUnit: payload.showUnit !== false,
    socials: socials,
    requestId: validarRequestId_(payload.requestId)
  };
}

function validarTexto_(value, label, min, max) {
  const text = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (text.length < min) throw new Error(label + ' deve ter pelo menos ' + min + ' caracteres.');
  if (text.length > max) throw new Error(label + ' deve ter no máximo ' + max + ' caracteres.');
  return text;
}

function validarRequestId_(value) {
  const id = String(value == null ? '' : value).trim();
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(id)) {
    throw new Error('Identificador de requisição inválido.');
  }
  return id;
}

function validarCor_(value) {
  const color = String(value || '').trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) throw new Error('Cor institucional inválida.');
  return color;
}

function validarTelefones_(values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > 4) {
    throw new Error('Informe de um a quatro telefones.');
  }

  const firstValue = values[0] && typeof values[0] === 'object' ? values[0].digits : values[0];
  const primaryDigits = String(firstValue == null ? '' : firstValue).replace(/\D/g, '');
  if ([8, 9].indexOf(primaryDigits.length) === -1) {
    throw new Error('O telefone principal deve ter 8 ou 9 dígitos, sem DDI e DDD.');
  }

  const result = [];
  values.slice(0, 4).forEach(function (value, index) {
    const rawDigits = value && typeof value === 'object' ? value.digits : value;
    const rawDescription = value && typeof value === 'object' ? value.description : '';
    const digits = String(rawDigits == null ? '' : rawDigits).replace(/\D/g, '');
    const description = validarDescricaoTelefone_(rawDescription, index + 1);
    if (!digits) {
      if (index === 0) throw new Error('Informe o telefone principal.');
      if (description) throw new Error('Informe o telefone ' + (index + 1) + ' ou apague sua descrição.');
      return;
    }

    if (index === 0 && [8, 9].indexOf(digits.length) === -1) {
      throw new Error('O telefone principal deve ter 8 ou 9 dígitos, sem DDI e DDD.');
    }
    if (index > 0 && [5, 8, 9].indexOf(digits.length) === -1) {
      throw new Error('Telefones adicionais devem ter 5, 8 ou 9 dígitos.');
    }

    const isExtension = index > 0 && digits.length === 5;
    const completeDigits = isExtension ? primaryDigits.slice(0, 3) + digits : digits;
    const numberDisplay = '+55 (21) ' + formatarNumero_(completeDigits, isExtension);
    result.push({
      digits: digits,
      completeDigits: completeDigits,
      numberDisplay: numberDisplay,
      description: description,
      display: numberDisplay + (description ? ' - ' + description : ''),
      tel: '+5521' + completeDigits
    });
  });

  return result;
}

function validarDescricaoTelefone_(value, position) {
  const description = String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim();
  if (description.length > 60) {
    throw new Error('A descrição do telefone ' + position + ' deve ter no máximo 60 caracteres.');
  }
  return description;
}

function formatarNumero_(digits, isExtension) {
  if (isExtension && digits.length === 8) return digits.slice(0, 3) + '-' + digits.slice(3);
  if (digits.length === 8) return digits.slice(0, 4) + '-' + digits.slice(4);
  if (digits.length === 9) return digits.slice(0, 1) + ' ' + digits.slice(1, 5) + '-' + digits.slice(5);
  return digits;
}

function validarUrlRio_(value, label) {
  const url = String(value || '').trim();
  if (!url || url.length > 300 || /[\u0000-\u0020\u007f]/.test(url)) {
    throw new Error(label + ' contém caracteres inválidos ou excede 300 caracteres.');
  }
  const match = url.match(/^https:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  if (!match) throw new Error(label + ' deve começar com https://.');
  const hostname = match[1].toLowerCase().replace(/:443$/, '');
  if (!(hostname === 'rio' || hostname.endsWith('.rio'))) {
    throw new Error(label + ' deve usar um domínio terminado em .rio.');
  }
  return url;
}

function validarRedes_(value) {
  if (!Array.isArray(value)) throw new Error('Configuração de redes sociais inválida.');
  const byKey = {};
  value.forEach(function (item) {
    if (item && SOCIAL_CONFIG[item.key]) byKey[item.key] = item;
  });

  return Object.keys(SOCIAL_CONFIG).map(function (key) {
    const definition = SOCIAL_CONFIG[key];
    const item = byKey[key] || {};
    const enabled = item.enabled !== false;
    const rawUrl = String(item.url || definition.defaultUrl).trim();
    const url = enabled
      ? validarUrlSocial_(rawUrl, definition.hostRule, definition.label)
      : definition.defaultUrl;
    return {
      key: key,
      label: definition.label,
      iconUrl: definition.iconUrl,
      url: url,
      enabled: enabled
    };
  });
}

function validarUrlSocial_(url, hostRule, label) {
  if (hostRule === 'rio') return validarUrlRio_(url, 'Link de ' + label);
  if (!url || url.length > 300 || /[\u0000-\u0020\u007f]/.test(url)) {
    throw new Error('O link de ' + label + ' contém caracteres inválidos ou excede 300 caracteres.');
  }
  const match = url.match(/^https:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
  if (!match) throw new Error('O link de ' + label + ' deve começar com https://.');
  const hostname = match[1].toLowerCase().replace(/:443$/, '');
  if (!(hostname === hostRule || hostname.endsWith('.' + hostRule))) {
    throw new Error('O link de ' + label + ' deve pertencer a ' + hostRule + '.');
  }
  return url;
}

function montarAssinatura_(dados, spreadsheet) {
  const assets = carregarAssets_(spreadsheet || obterPlanilha_());
  const color = escaparHtml_(dados.color);
  const phonesHtml = dados.phones.map(function (phone) {
    return '<div style="font-size:12px;line-height:18px">' +
      '<a href="tel:' + escaparAtributo_(phone.tel) + '" style="color:' + color + ';text-decoration:none">' +
      escaparHtml_(phone.numberDisplay) + '</a>' +
      (phone.description ? ' - ' + escaparHtml_(phone.description) : '') + '</div>';
  }).join('');

  const socialsHtml = dados.socials.filter(function (social) {
    return social.enabled;
  }).map(function (social) {
    return '<td style="padding:0 4px">' +
      '<a href="' + escaparAtributo_(social.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + escaparAtributo_(assets['icon_' + social.key] || social.iconUrl) + '" width="24" height="24" alt="' +
      escaparAtributo_(social.label) + '" style="display:block;border:0"></a></td>';
  }).join('');

  const html = '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:' + color + '">' +
    '<tr><td style="width:116px;padding:0 18px 0 0;vertical-align:middle;text-align:center">' +
    '<a href="' + escaparAtributo_(dados.logoLink) + '" target="_blank" rel="noopener noreferrer">' +
    '<img src="' + escaparAtributo_(assets.logo_gm) + '" width="105" alt="Guarda Municipal do Rio de Janeiro" style="display:block;width:105px;height:auto;border:0"></a></td>' +
    '<td style="width:390px;vertical-align:middle">' +
    '<div style="font-size:20px;line-height:23px;font-weight:700;color:' + color + '">' + escaparHtml_(dados.title) + '</div>' +
    '<div style="font-size:12px;line-height:17px">' + escaparHtml_(dados.secondLine) + '</div>' +
    '<div style="font-size:12px;line-height:17px">' + escaparHtml_(dados.acronym) + '</div>' +
    '<div style="height:1px;background:' + color + ';margin:6px 0 5px">&nbsp;</div>' +
    (dados.showUnit ? '<div style="font-size:12px;line-height:18px">' + escaparHtml_(dados.unit) + '</div>' : '') +
    phonesHtml +
    '<div style="height:1px;background:' + color + ';margin:5px 0 6px">&nbsp;</div>' +
    '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td style="padding-right:8px"><a href="' + escaparAtributo_(dados.siteUrl) + '" target="_blank" rel="noopener noreferrer" style="font:bold 15px Arial;color:' + color + ';text-decoration:none">' + escaparHtml_(dados.siteText) + '</a></td>' +
    socialsHtml + '</tr></table></td></tr></table>';

  const textLines = [dados.title, dados.secondLine, dados.acronym];
  if (dados.showUnit) textLines.push(dados.unit);
  dados.phones.forEach(function (phone) { textLines.push(phone.display); });
  textLines.push(dados.siteText);

  return { html: html, text: textLines.join('\n') };
}

function escaparHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escaparAtributo_(value) {
  return escaparHtml_(value).replace(/`/g, '&#96;');
}

function paraTextoPlanilha_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function calcularSha256_(value) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  ).map(function (byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}
