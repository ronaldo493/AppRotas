export interface AppUsageDailyMetric {
  dataReferencia: string;
  primeiraAtividadeEm: string;
  ultimaAtividadeEm: string;
  aberturas: number;
  tempoPrimeiroPlanoSegundos: number;
  versaoAplicativo: string | null;
  plataforma: 'android' | 'ios' | 'web' | 'desconhecida';
}
