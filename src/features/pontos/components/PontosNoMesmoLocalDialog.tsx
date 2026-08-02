import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {PontoInteresse} from '../models/Ponto';
import styles from './pontosNoMesmoLocalDialog.styles';

interface PontosNoMesmoLocalDialogProps<T extends PontoInteresse> {
  visible: boolean;
  pontos: readonly T[];
  onDismiss: () => void;
  onSelect: (ponto: T) => void;
}

/**
 * Permite escolher um registro quando restaurante e posto compartilham a
 * mesma coordenada, sem deslocar artificialmente os pontos no mapa.
 */
export default function PontosNoMesmoLocalDialog<
  T extends PontoInteresse,
>({
  visible,
  pontos,
  onDismiss,
  onSelect,
}: PontosNoMesmoLocalDialogProps<T>): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{backgroundColor: theme.colors.surface}}
      >
        <Dialog.Title>Escolha o ponto</Dialog.Title>

        <Dialog.Content>
          <Text
            style={[
              styles.description,
              {color: theme.colors.onSurfaceVariant},
            ]}
          >
            Há mais de um ponto cadastrado neste local.
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {pontos.map((ponto, index) => {
              const key =
                ponto.documentId ??
                String(ponto.id ?? `${ponto.descricao}-${index}`);

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${ponto.descricao}, ${ponto.categoria}`}
                  style={[
                    styles.item,
                    {
                      backgroundColor:
                        theme.colors.surfaceVariant,
                      borderColor: theme.colors.outline,
                    },
                  ]}
                  onPress={() => onSelect(ponto)}
                >
                  <View style={styles.itemContent}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.itemTitle,
                        {color: theme.colors.onSurface},
                      ]}
                    >
                      {ponto.descricao}
                    </Text>

                    <Text
                      style={[
                        styles.itemCategory,
                        {color: theme.colors.onSurfaceVariant},
                      ]}
                    >
                      {ponto.categoria}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
