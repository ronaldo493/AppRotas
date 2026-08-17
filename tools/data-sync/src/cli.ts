import path from 'node:path';
import {getRemoteConfig, paths} from './config';
import {readJsonArray, writeJson, writeReport} from './files';
import {buildPlan} from './planner';
import {
  CONTACT_FIELDS, POINT_FIELDS, STORE_FIELDS, sanitizeRecord, validateContact,
  validatePoint, validateStore, validateUser,
} from './schemas';
import {
  createRecord, createUser, deleteRecord, listAll, listUsers, updateRecord,
} from './strapiClient';
import type {ChangePlan, JsonObject, SyncReport} from './types';

const args = process.argv.slice(2);
const command = args[0];
const apply = args.includes('--apply');
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const keys = {
  store: (record: JsonObject) => String(record.codigofilial ?? ''),
  point: (record: JsonObject) => {
    const coordinate = (value: unknown) => Number(value).toFixed(6);
    return [record.categoria, coordinate(record.latitude), coordinate(record.longitude), record.descricao]
      .map(value => String(value ?? '').trim().toLocaleLowerCase('pt-BR'))
      .join('|');
  },
  contact: (record: JsonObject) => [record.departamento, record.colaboradores]
    .map(value => String(value ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR'))
    .join('|'),
};

const STORE_COMPARISON_FIELDS = [
  'gerente', 'supervisor', 'telefone', 'horariofuncionamento',
] as const;

const printPlan = (resource: string, plan: ChangePlan[]): void => {
  const count = (action: ChangePlan['action']) => plan.filter(item => item.action === action).length;
  const createLabel = resource === 'filiais-origem'
    ? 'Ignoradas por não existirem no Strapi'
    : 'Criar';
  console.log(`\n${resource}`);
  console.log(`${createLabel}: ${count('create')}`);
  console.log(`Atualizar: ${count('update')}`);
  console.log(`Sem alteração: ${count('skip')}`);
  console.log(`Inválidos: ${count('invalid')}`);
  console.log(`Ausentes na origem: ${count('missing')}`);
  for (const item of plan.filter(entry => entry.action === 'invalid').slice(0, 20)) {
    console.log(`- ${item.key}: ${item.errors?.join('; ')}`);
  }
};

const executePlan = async (
  resource: string,
  endpoint: string,
  plan: ChangePlan[],
  sourceFile?: string,
  allowApply = true,
  allowedWriteActions: Array<'create' | 'update' | 'missing'> = ['create', 'update'],
  resolutions: string[] = [],
): Promise<void> => {
  const startedAt = new Date().toISOString();
  const failures: SyncReport['failures'] = [];
  const writable = plan.filter(item => allowedWriteActions.includes(
    item.action as 'create' | 'update' | 'missing',
  ));
  const {maxChanges} = getRemoteConfig();

  if (apply && !allowApply) {
    throw new Error(`${resource} é uma comparação somente leitura.`);
  }
  if (apply && plan.some(item => item.action === 'invalid')) {
    throw new Error('Existem registros inválidos. Corrija o arquivo antes de aplicar.');
  }
  if (apply && writable.length > maxChanges) {
    throw new Error(`A operação possui ${writable.length} alterações e excede DATA_SYNC_MAX_CHANGES=${maxChanges}.`);
  }

  if (apply) {
    const upserts = writable.filter(item => item.action !== 'missing');
    const deletions = writable.filter(item => item.action === 'missing');

    for (const item of upserts) {
      try {
        if (item.action === 'create') await createRecord(endpoint, item.data!);
        else await updateRecord(endpoint, item.documentId!, item.data!);
      } catch (error) {
        failures.push({key: item.key, message: error instanceof Error ? error.message : String(error)});
      }
    }

    // Nunca remove registros quando alguma criação ou atualização falhou.
    if (failures.length === 0) {
      for (const item of deletions) {
        try {
          await deleteRecord(endpoint, item.documentId!);
        } catch (error) {
          failures.push({
            key: item.key,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  const report: SyncReport = {
    resource,
    mode: apply ? 'apply' : 'check',
    startedAt,
    finishedAt: new Date().toISOString(),
    summary: {
      create: plan.filter(item => item.action === 'create').length,
      update: plan.filter(item => item.action === 'update').length,
      skip: plan.filter(item => item.action === 'skip').length,
      invalid: plan.filter(item => item.action === 'invalid').length,
      missing: plan.filter(item => item.action === 'missing').length,
      failed: failures.length,
    },
    changes: plan,
    failures,
    sourceFile,
    resolutions,
  };
  console.log(`Relatório: ${writeReport(report)}`);
  if (!apply && writable.length) {
    console.log(
      allowApply
        ? 'Simulação concluída. Use --apply somente após revisar o relatório.'
        : 'Comparação concluída. Nenhuma alteração foi enviada ao Strapi.',
    );
  }
  if (failures.length) process.exitCode = 1;
};

const syncCollection = async (kind: 'filiais' | 'pontos'): Promise<void> => {
  const isStore = kind === 'filiais';
  const defaultInput = isStore ? 'fixtures/filiais_atualizado.json' : 'fixtures/pontos.json';
  const endpoint = isStore ? 'informacoeslojas' : 'pontos-interesses';
  const input = readJsonArray(option('--input') ?? defaultInput);
  const current = await listAll(endpoint);
  const plan = buildPlan({
    incoming: input,
    current,
    keyOf: isStore ? keys.store : keys.point,
    validate: isStore ? validateStore : validatePoint,
    sanitize: record => sanitizeRecord(record, isStore ? STORE_FIELDS : POINT_FIELDS),
  });
  printPlan(kind, plan);
  await executePlan(kind, endpoint, plan);
};

const validateInput = (kind: 'filiais' | 'pontos' | 'usuarios'): void => {
  const defaults = {
    filiais: 'fixtures/filiais_atualizado.json',
    pontos: 'fixtures/pontos.json',
    usuarios: 'tools/data-sync/input/usuarios.json',
  } as const;
  const input = readJsonArray(option('--input') ?? defaults[kind]);
  const validate = kind === 'filiais'
    ? validateStore
    : kind === 'pontos'
      ? validatePoint
      : validateUser;
  const keyOf = kind === 'filiais'
    ? keys.store
    : kind === 'pontos'
      ? keys.point
      : (record: JsonObject) => String(record.email ?? '');
  const seen = new Set<string>();
  const invalid = input.flatMap(record => {
    const key = keyOf(record);
    const errors = validate(record);
    if (!key) errors.push('chave não informada');
    if (seen.has(key)) errors.push('chave duplicada no arquivo');
    seen.add(key);
    return errors.length ? [{key: key || '(sem chave)', errors}] : [];
  });

  console.log(`${kind}: ${input.length} registro(s), ${invalid.length} inválido(s).`);
  for (const item of invalid.slice(0, 50)) {
    console.log(`- ${item.key}: ${item.errors.join('; ')}`);
  }
  if (invalid.length) process.exitCode = 1;
};

const syncUsers = async (): Promise<void> => {
  const inputPath = option('--input');
  if (!inputPath) throw new Error('Informe --input com o JSON de usuários.');
  const password = process.env.DATA_SYNC_DEFAULT_PASSWORD;
  const roleId = Number(process.env.DATA_SYNC_USER_ROLE_ID);
  if (!password || !Number.isInteger(roleId)) {
    throw new Error('Configure DATA_SYNC_DEFAULT_PASSWORD e DATA_SYNC_USER_ROLE_ID.');
  }

  const input = readJsonArray(inputPath);
  const current = await listUsers();
  const emails = new Set(current.map(user => String(user.email ?? '').toLowerCase()));
  const plan: ChangePlan[] = input.map(user => {
    const key = String(user.email ?? '').toLowerCase();
    const errors = validateUser(user);
    if (errors.length) return {key: key || '(sem email)', action: 'invalid', errors};
    if (emails.has(key)) return {key, action: 'skip'};
    return {
      key,
      action: 'create',
      data: {
        username: user.username,
        email: user.email,
        setor: user.setor,
        cargo: user.cargo ?? null,
        password,
        role: roleId,
        confirmed: true,
        blocked: false,
        deveAlterarSenha: true,
        forcarLoginUnico: false,
      },
    };
  });
  printPlan('usuarios', plan);
  if (plan.some(item => item.action === 'invalid')) throw new Error('Existem usuários inválidos.');

  if (apply) {
    for (const item of plan.filter(entry => entry.action === 'create')) {
      await createUser(item.data!);
    }
  }
  console.log(apply ? 'Usuários processados.' : 'Simulação concluída. Use --apply após revisar.');
};

const exportCollection = async (kind: 'filiais' | 'pontos'): Promise<void> => {
  const endpoint = kind === 'filiais' ? 'informacoeslojas' : 'pontos-interesses';
  const records = await listAll(endpoint);
  const output = option('--output') ?? path.join(paths.output, `${kind}-export.json`);
  console.log(`Exportados ${records.length} registros para ${writeJson(output, records)}.`);
};

const removeSensitiveUserFields = (user: JsonObject): JsonObject => {
  const {
    password: _password,
    resetPasswordToken: _resetPasswordToken,
    confirmationToken: _confirmationToken,
    ...safeUser
  } = user;
  return safeUser;
};

/**
 * Gera um snapshot coerente dos dados administrativos usados pelo aplicativo.
 * Todos os dados são lidos antes da escrita para evitar backups parciais.
 */
const createCompleteBackup = async (): Promise<void> => {
  const startedAt = new Date().toISOString();
  console.log('Coletando filiais, pontos, usuários, setores e menus...');

  const [stores, points, users, sectors, menus] = await Promise.all([
    listAll('informacoeslojas'),
    listAll('pontos-interesses'),
    listUsers(),
    listAll('setors?populate=menus'),
    listAll('menus?populate=setors'),
  ]);

  const safeUsers = users.map(removeSensitiveUserFields);
  const finishedAt = new Date().toISOString();
  const folderName = finishedAt.replace(/[:.]/g, '-');
  const backupDirectory = path.join(paths.output, 'backups', folderName);
  const files = {
    filiais: writeJson(path.join(backupDirectory, 'filiais.json'), stores),
    pontos: writeJson(path.join(backupDirectory, 'pontos.json'), points),
    usuarios: writeJson(path.join(backupDirectory, 'usuarios.json'), safeUsers),
    setores: writeJson(path.join(backupDirectory, 'setores.json'), sectors),
    menus: writeJson(path.join(backupDirectory, 'menus.json'), menus),
  };
  const manifest = {
    schemaVersion: 1,
    startedAt,
    finishedAt,
    source: getRemoteConfig().apiUrl,
    counts: {
      filiais: stores.length,
      pontos: points.length,
      usuarios: safeUsers.length,
      setores: sectors.length,
      menus: menus.length,
    },
    files: Object.fromEntries(
      Object.entries(files).map(([name, file]) => [name, path.basename(file)]),
    ),
    notes: [
      'Somente registros publicados das collections com Draft & Publish.',
      'Campos privados de autenticação não são armazenados.',
      'Relações de setores, menus e roles de usuários foram incluídas.',
    ],
  };
  writeJson(path.join(backupDirectory, 'manifesto.json'), manifest);

  console.log(`Backup concluído: ${backupDirectory}`);
  console.log(`Filiais: ${stores.length} | Pontos: ${points.length} | Usuários: ${safeUsers.length} | Setores: ${sectors.length} | Menus: ${menus.length}`);
};

/**
 * Compara os arquivos corporativos da unidade compartilhada com o Strapi.
 * Este comando é deliberadamente somente leitura.
 */
const compareCorporateFiles = async (): Promise<void> => {
  if (apply) {
    throw new Error('origem:comparar é somente leitura e não aceita --apply.');
  }

  const sourceDirectory = process.env.DATA_SYNC_SOURCE_DIR?.trim()
    || 'G:\\Arquivos Ti\\Atualização Teste Conexões';
  const storesFile = path.join(sourceDirectory, 'Informacoes_Filiais.json');
  const contactsFile = path.join(sourceDirectory, 'Informacoes_Contatos.json');
  const sourceStores = readJsonArray(storesFile);
  const sourceContacts = readJsonArray(contactsFile);
  const [currentStores, currentContacts] = await Promise.all([
    listAll('informacoeslojas'),
    listAll('contatos'),
  ]);

  const storePlan = buildPlan({
    incoming: sourceStores,
    current: currentStores,
    keyOf: keys.store,
    validate: record => {
      const code = Number(record.codigofilial);
      return Number.isInteger(code) && code > 0 ? [] : ['codigofilial inválido'];
    },
    sanitize: record => sanitizeRecord(record, STORE_COMPARISON_FIELDS),
    includeMissing: true,
  });
  const contactPlan = buildPlan({
    incoming: sourceContacts,
    current: currentContacts,
    keyOf: keys.contact,
    validate: validateContact,
    sanitize: record => sanitizeRecord(record, CONTACT_FIELDS),
    includeMissing: true,
  });

  printPlan('filiais-origem', storePlan);
  await executePlan('filiais-origem', 'informacoeslojas', storePlan, storesFile, false);
  printPlan('contatos-origem', contactPlan);
  await executePlan('contatos-origem', 'contatos', contactPlan, contactsFile, false);
};

const getCorporateStoresFile = (): string => {
  const sourceDirectory = process.env.DATA_SYNC_SOURCE_DIR?.trim()
    || 'G:\\Arquivos Ti\\Atualização Teste Conexões';
  return path.join(sourceDirectory, 'Informacoes_Filiais.json');
};

const getCorporateContactsFile = (): string => {
  const sourceDirectory = process.env.DATA_SYNC_SOURCE_DIR?.trim()
    || 'G:\\Arquivos Ti\\Atualização Teste Conexões';
  return path.join(sourceDirectory, 'Informacoes_Contatos.json');
};

/** Ignora campos vazios da origem para nunca apagar um dado válido do Strapi. */
const sanitizeCorporateStoreChanges = (record: JsonObject): JsonObject =>
  Object.fromEntries(
    STORE_COMPARISON_FIELDS
      .filter(field => {
        const value = record[field];
        return value !== null
          && value !== undefined
          && (typeof value !== 'string' || value.trim() !== '');
      })
      .map(field => [field, record[field]]),
  );

const buildCorporateStorePlan = async (): Promise<{
  sourceFile: string;
  plan: ChangePlan[];
}> => {
  const sourceFile = getCorporateStoresFile();
  const [incoming, current] = await Promise.all([
    Promise.resolve(readJsonArray(sourceFile)),
    listAll('informacoeslojas'),
  ]);
  const plan = buildPlan({
    incoming,
    current,
    keyOf: keys.store,
    validate: record => {
      const code = Number(record.codigofilial);
      return Number.isInteger(code) && code > 0 ? [] : ['codigofilial inválido'];
    },
    sanitize: sanitizeCorporateStoreChanges,
    includeMissing: true,
  });
  return {sourceFile, plan};
};

/** Compara somente os quatro campos operacionais sem realizar escritas. */
const compareCorporateStores = async (): Promise<void> => {
  if (apply) {
    throw new Error('filiais:comparar-origem não aceita --apply.');
  }
  const {sourceFile, plan} = await buildCorporateStorePlan();
  printPlan('filiais-origem', plan);
  await executePlan(
    'filiais-origem',
    'informacoeslojas',
    plan,
    sourceFile,
    false,
    ['update'],
  );
};

/** Atualiza exclusivamente filiais existentes e somente os campos autorizados. */
const updateCorporateStores = async (): Promise<void> => {
  if (!apply) {
    throw new Error(
      'Este comando altera o Strapi. Execute novamente acrescentando --apply após revisar a comparação.',
    );
  }
  const {sourceFile, plan} = await buildCorporateStorePlan();
  printPlan('filiais-origem', plan);
  await executePlan(
    'filiais-origem',
    'informacoeslojas',
    plan,
    sourceFile,
    true,
    ['update'],
  );
};

const contactCompleteness = (record: JsonObject): number =>
  CONTACT_FIELDS.filter(field => {
    const value = record[field];
    return value !== null
      && value !== undefined
      && (typeof value !== 'string' || value.trim() !== '');
  }).length;

/**
 * Resolve duplicidades somente quando existe uma escolha objetiva: ramal
 * numérico e, em caso de empate, registro com mais campos preenchidos.
 */
const resolveCorporateContactDuplicates = (
  records: JsonObject[],
): {records: JsonObject[]; resolutions: string[]} => {
  const groups = new Map<string, JsonObject[]>();
  for (const record of records) {
    const key = keys.contact(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const resolved: JsonObject[] = [];
  const resolutions: string[] = [];
  for (const [key, group] of groups) {
    if (group.length === 1) {
      resolved.push(group[0]);
      continue;
    }

    const numericExtension = group.filter(record => /\d/.test(String(record.ramal ?? '')));
    const candidates = numericExtension.length > 0 ? numericExtension : group;
    const maxScore = Math.max(...candidates.map(contactCompleteness));
    const mostComplete = candidates.filter(record => contactCompleteness(record) === maxScore);
    const distinct = new Set(
      mostComplete.map(record => JSON.stringify(sanitizeRecord(record, CONTACT_FIELDS))),
    );

    if (mostComplete.length === 1 || distinct.size === 1) {
      resolved.push(mostComplete[0]);
      resolutions.push(
        `${key}: mantido ramal ${String(mostComplete[0].ramal ?? '') || '(vazio)'} e registro mais completo entre ${group.length} ocorrências.`,
      );
      continue;
    }

    // Mantém os candidatos empatados para que o planner marque todos como inválidos.
    resolved.push(...mostComplete);
  }
  return {records: resolved, resolutions};
};

const buildCorporateContactPlan = async (): Promise<{
  sourceFile: string;
  plan: ChangePlan[];
  current: JsonObject[];
  resolutions: string[];
}> => {
  const sourceFile = getCorporateContactsFile();
  const [incoming, current] = await Promise.all([
    Promise.resolve(readJsonArray(sourceFile)),
    listAll('contatos'),
  ]);
  const resolved = resolveCorporateContactDuplicates(incoming);
  const plan = buildPlan({
    incoming: resolved.records,
    current,
    keyOf: keys.contact,
    validate: validateContact,
    sanitize: record => sanitizeRecord(record, CONTACT_FIELDS),
    includeMissing: true,
  });
  return {sourceFile, plan, current, resolutions: resolved.resolutions};
};

/** Compara todos os campos dos contatos sem realizar escritas. */
const compareCorporateContacts = async (): Promise<void> => {
  if (apply) throw new Error('contatos:comparar-origem não aceita --apply.');
  const {sourceFile, plan, resolutions} = await buildCorporateContactPlan();
  printPlan('contatos-origem', plan);
  await executePlan(
    'contatos-origem',
    'contatos',
    plan,
    sourceFile,
    false,
    ['create'],
    resolutions,
  );
};

/** Insere somente contatos ausentes; existentes nunca são alterados ou apagados. */
const insertMissingCorporateContacts = async (): Promise<void> => {
  if (!apply) {
    throw new Error(
      'Este comando insere contatos no Strapi. Execute novamente acrescentando --apply após revisar a comparação.',
    );
  }
  const {sourceFile, plan, resolutions} = await buildCorporateContactPlan();
  printPlan('contatos-origem', plan);
  await executePlan(
    'contatos-origem',
    'contatos',
    plan,
    sourceFile,
    true,
    ['create'],
    resolutions,
  );
};

/** Sincroniza a origem como fonte de verdade após criar um backup preventivo. */
const synchronizeCorporateContacts = async (): Promise<void> => {
  if (!apply) {
    throw new Error(
      'Este comando cria, atualiza e exclui contatos. Execute novamente acrescentando --apply após revisar a comparação.',
    );
  }
  if (process.env.DATA_SYNC_CONTACT_EMAIL_TEXT_CONFIRMED !== 'true') {
    throw new Error(
      'Confirme primeiro que o campo email já é Text em produção e configure DATA_SYNC_CONTACT_EMAIL_TEXT_CONFIRMED=true.',
    );
  }

  const {sourceFile, plan, current, resolutions} = await buildCorporateContactPlan();
  printPlan('contatos-origem', plan);
  if (plan.some(item => item.action === 'invalid')) {
    throw new Error('A origem ainda possui contatos duplicados sem desempate seguro.');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = writeJson(
    path.join(paths.output, 'backups', `pre-sync-contatos-${stamp}.json`),
    current,
  );
  console.log(`Backup preventivo: ${backupFile}`);

  await executePlan(
    'contatos-origem',
    'contatos',
    plan,
    sourceFile,
    true,
    ['create', 'update', 'missing'],
    resolutions,
  );
};

const main = async (): Promise<void> => {
  switch (command) {
    case 'backup:completo': return createCompleteBackup();
    case 'origem:comparar': return compareCorporateFiles();
    case 'filiais:comparar-origem': return compareCorporateStores();
    case 'filiais:atualizar-origem': return updateCorporateStores();
    case 'contatos:comparar-origem': return compareCorporateContacts();
    case 'contatos:inserir-ausentes-origem': return insertMissingCorporateContacts();
    case 'contatos:sincronizar-origem': return synchronizeCorporateContacts();
    case 'filiais:exportar': return exportCollection('filiais');
    case 'filiais:validar': return validateInput('filiais');
    case 'filiais:comparar': return syncCollection('filiais');
    case 'pontos:exportar': return exportCollection('pontos');
    case 'pontos:validar': return validateInput('pontos');
    case 'pontos:comparar': return syncCollection('pontos');
    case 'usuarios:validar': return validateInput('usuarios');
    case 'usuarios:comparar': return syncUsers();
    default:
      console.log('Comandos: backup:completo, origem:comparar, filiais:comparar-origem, filiais:atualizar-origem, contatos:comparar-origem, contatos:inserir-ausentes-origem, contatos:sincronizar-origem, filiais:exportar, filiais:validar, filiais:comparar, pontos:exportar, pontos:validar, pontos:comparar, usuarios:validar, usuarios:comparar');
      console.log('Use --input arquivo.json e acrescente --apply somente para gravar.');
  }
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
