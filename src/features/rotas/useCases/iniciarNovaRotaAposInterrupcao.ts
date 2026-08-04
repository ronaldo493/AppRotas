export type InterromperRotaAtual = () => Promise<boolean>;
export type IniciarNovaRota = () => Promise<boolean>;

/**
 * Garante que uma nova navegação nunca seja iniciada enquanto a execução
 * anterior continuar ativa. A interrupção local vem primeiro porque ela é a
 * fonte de verdade mesmo quando o Strapi estiver temporariamente indisponível.
 */
export async function iniciarNovaRotaAposInterrupcao(
  interromperRotaAtual: InterromperRotaAtual,
  iniciarNovaRota: IniciarNovaRota,
): Promise<boolean> {
  const interrompida = await interromperRotaAtual();

  if (!interrompida) return false;

  await iniciarNovaRota();
  return true;
}
