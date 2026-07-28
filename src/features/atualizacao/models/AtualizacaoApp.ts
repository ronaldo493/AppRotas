export interface ArquivoAtualizacao {
  url?: string | null;
  data?: {
    url?: string | null;
    attributes?: {
      url?: string | null;
    };
  } | null;
}

export interface AtualizacaoApp {
  versao: string;
  appUrl?: string | null;
  appApk?: ArquivoAtualizacao | null;
}
