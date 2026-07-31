import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './addSectionSheet.styles';

interface AddSectionSheetProps {
  visible: boolean;
  environmentLabel: string;
  onDismiss: () => void;
  onSubmit: (letter: string) => boolean;
}

/**
 * Solicita a identificação da nova posição usando o mesmo painel com teclado
 * empregado nos demais formulários do aplicativo.
 */
export default function AddSectionSheet({
  visible,
  environmentLabel,
  onDismiss,
  onSubmit,
}: AddSectionSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [letter, setLetter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) return;
    setLetter('');
    setError(null);
  }, [visible]);

  const submit = (): void => {
    if (!onSubmit(letter)) {
      setError('Informe uma letra que ainda não esteja sendo utilizada.');
      return;
    }

    onDismiss();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={[styles.backdrop, {backgroundColor: theme.colors.backdrop}]}
          onPress={onDismiss}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 18),
                backgroundColor: theme.colors.surface,
              },
            ]}
            onPress={event => event.stopPropagation()}
          >
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.handle, {backgroundColor: theme.colors.outline}]} />
              <Text style={[styles.title, {color: theme.colors.onSurface}]}>
                Adicionar posição
              </Text>
              <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
                Informe a letra que identifica a nova posição de {environmentLabel}.
              </Text>

              <TextInput
                mode="outlined"
                autoFocus
                value={letter}
                error={Boolean(error)}
                maxLength={1}
                autoCapitalize="characters"
                label="Letra da posição"
                style={styles.input}
                onChangeText={value => {
                  setLetter(value.replace(/[^a-zA-Z]/g, '').toUpperCase());
                  setError(null);
                }}
                onSubmitEditing={submit}
              />

              {error ? (
                <Text style={[styles.error, {color: theme.colors.error}]}>{error}</Text>
              ) : null}

              <View style={styles.actions}>
                <Button textColor={theme.colors.onSurfaceVariant} onPress={onDismiss}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  disabled={!letter}
                  buttonColor={theme.colors.actionBackground}
                  textColor={theme.colors.actionForeground}
                  style={styles.primaryButton}
                  contentStyle={styles.buttonContent}
                  onPress={submit}
                >
                  Adicionar
                </Button>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
