const obterPartesVersao = (version: string): number[] =>
  version
    .trim()
    .replace(/^v/i, '')
    .split(/[+-]/, 1)[0]
    .split('.')
    .map(part => Number.parseInt(part, 10))
    .map(part => Number.isFinite(part) ? part : 0);

export function versaoMaisRecenteDisponivel(
  availableVersion: string,
  currentVersion: string,
): boolean {
  const availableParts = obterPartesVersao(availableVersion);
  const currentParts = obterPartesVersao(currentVersion);
  const totalParts = Math.max(availableParts.length, currentParts.length);

  for (let index = 0; index < totalParts; index += 1) {
    const availablePart = availableParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (availablePart > currentPart) return true;
    if (availablePart < currentPart) return false;
  }

  return false;
}
