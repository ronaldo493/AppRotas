export interface DeviceSession {
  codigoSessao: string;
  situacaoSessao: 'ativa';
  iniciadaEm: string;
  loginUnicoPorUsuarioAtivo: boolean;
}

export interface DeviceSessionStartResponse extends DeviceSession {
  substituiuOutraSessao: boolean;
}
