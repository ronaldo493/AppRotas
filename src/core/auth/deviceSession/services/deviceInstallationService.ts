import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALLATION_STORAGE_KEY = 'appInstallationId';
let installationPromise: Promise<string> | null = null;

const createInstallationId = (): string =>
  [
    'install',
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 12),
    Math.random().toString(36).slice(2, 12),
  ].join('-');

/**
 * Retorna uma identidade aleatória da instalação. Ela não contém IMEI,
 * telefone, conta Google ou qualquer outro identificador pessoal do aparelho.
 */
export function getOrCreateInstallationId(): Promise<string> {
  if (installationPromise) return installationPromise;

  installationPromise = (async () => {
    const stored = await AsyncStorage.getItem(INSTALLATION_STORAGE_KEY);

    if (stored && stored.length >= 16) return stored;

    const created = createInstallationId();
    await AsyncStorage.setItem(INSTALLATION_STORAGE_KEY, created);
    return created;
  })().catch(error => {
    installationPromise = null;
    throw error;
  });

  return installationPromise;
}
