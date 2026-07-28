import {MaterialIcons} from '@expo/vector-icons';

export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

export function obterNomeIconeMaterial(nome: string | null | undefined, fallback: MaterialIconName = 'circle'): MaterialIconName {
  if (
    nome &&
    Object.prototype.hasOwnProperty.call(
      MaterialIcons.glyphMap,
      nome,
    )
  ) {
    return nome as MaterialIconName;
  }

  return fallback;
}
