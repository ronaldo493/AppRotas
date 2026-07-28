import {Linking} from 'react-native';

import {environment} from '../../../core/config/environment';
import type {ArquivoAtualizacao} from '../models/AtualizacaoApp';

const obterUrlArquivo = (arquivo?: ArquivoAtualizacao | null): string | null =>
  arquivo?.url ??
  arquivo?.data?.url ??
  arquivo?.data?.attributes?.url ??
  null;

const obterBaseStrapi = (): string =>
  environment.strapiBaseUrl.replace(/\/api\/?$/, '');

export function obterUrlApk(arquivo?: ArquivoAtualizacao | null): string | null {
  const url = obterUrlArquivo(arquivo);

  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  return `${obterBaseStrapi()}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function abrirUrlAtualizacao(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) return false;

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
