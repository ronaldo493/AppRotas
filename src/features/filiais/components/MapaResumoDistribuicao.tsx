import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {Surface} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {
  FiltroDistribuicaoFiliais,
  ResumoDistribuicaoFiliais,
} from '../useCases/analisarDistribuicaoFiliais';
import styles from './mapaResumoDistribuicao.styles';

interface MapaResumoDistribuicaoProps {
  resumo: ResumoDistribuicaoFiliais;
  filtro: FiltroDistribuicaoFiliais | null;
  onOpen: () => void;
  onClear: () => void;
}

/** Exibe somente as informações essenciais sem encobrir o uso principal do mapa. */
export default function MapaResumoDistribuicao({
  resumo,
  filtro,
  onOpen,
  onClear,
}: MapaResumoDistribuicaoProps): React.JSX.Element {
  const theme = useAppTheme();
  const destaque = resumo.cidadeDestaque;

  return (
    <Surface
      elevation={2}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel="Abrir distribuição das filiais"
        style={styles.content}
        onPress={onOpen}
      >
        <Text style={[styles.primaryText, {color: theme.colors.onSurface}]}>
          {filtro
            ? filtro.rotulo
            : `${resumo.totalFiliais} filiais em ${resumo.totalCidades} cidades`}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.secondaryText,
            {color: theme.colors.onSurfaceVariant},
          ]}
        >
          {filtro
            ? `${filtro.quantidade} ${filtro.quantidade === 1 ? 'filial selecionada' : 'filiais selecionadas'}`
            : destaque
              ? `Maior concentração: ${destaque.rotulo} · ${destaque.quantidade}`
              : 'Consulte a distribuição do cadastro atual'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={filtro ? 'Limpar filtro do mapa' : 'Ver distribuição'}
        style={styles.action}
        onPress={filtro ? onClear : onOpen}
      >
        <Text style={[styles.actionText, {color: theme.colors.primary}]}>
          {filtro ? 'Limpar' : 'Distribuição'}
        </Text>
      </TouchableOpacity>
    </Surface>
  );
}
