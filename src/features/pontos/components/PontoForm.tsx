import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  Text,
  View,
  type KeyboardEvent,
} from 'react-native';
import type { LatLng } from 'react-native-maps';
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Surface,
  TextInput,
} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {CategoriaPonto} from '../models/Ponto';
import AddPointStyles from '../screens/pontosScreen.styles';

export type {CategoriaPonto} from '../models/Ponto';

interface PontoFormProps {
  selectedPoint: LatLng | null;
  description: string;
  saving: boolean;
  categoryDialogVisible: boolean;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onCurrentLocation: () => void;
  onRequestSave: () => void;
  onCloseCategory: () => void;
  onSaveCategory: (categoria: CategoriaPonto) => Promise<void>;
}

const PANEL_BOTTOM_MARGIN = 12;

export default function PontoForm({
  selectedPoint,
  description,
  saving,
  categoryDialogVisible,
  onDescriptionChange,
  onClose,
  onCurrentLocation,
  onRequestSave,
  onCloseCategory,
  onSaveCategory,
}: PontoFormProps): React.JSX.Element {
  const theme = useAppTheme();
  const panelBottom = useRef(new Animated.Value(PANEL_BOTTOM_MARGIN)).current;

  useEffect(() => {
    const movePanel = (bottom: number, duration: number): void => {
      panelBottom.stopAnimation();

      Animated.timing(panelBottom, {
        toValue: bottom,
        duration,
        useNativeDriver: false,
      }).start();
    };

    const handleKeyboardShow = (event: KeyboardEvent): void => {
      const screenHeight = Dimensions.get('screen').height;

      const keyboardHeight = Math.max(
        event.endCoordinates.height,
        screenHeight - event.endCoordinates.screenY,
      );

      movePanel(
        keyboardHeight + PANEL_BOTTOM_MARGIN,
        event.duration > 0 ? event.duration : 220,
      );
    };

    const handleKeyboardHide = (event: KeyboardEvent): void => {
      movePanel(
        PANEL_BOTTOM_MARGIN,
        event.duration > 0 ? event.duration : 180,
      );
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideListener = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [panelBottom]);

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[AddPointStyles.keyboardContainer, { bottom: panelBottom }]}
      >
        <Surface
          elevation={4}
          style={[
            AddPointStyles.bottomPanel,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <View style={AddPointStyles.panelHeader}>
            <View style={AddPointStyles.panelTitleContainer}>
              <Text style={[AddPointStyles.panelTitle, { color: theme.colors.onSurface }]}>
                Novo ponto
              </Text>

              <Text
                numberOfLines={2}
                style={[
                  AddPointStyles.panelStatus,
                  {
                    color: selectedPoint
                      ? theme.colors.success
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {selectedPoint
                  ? 'Local selecionado — segure e arraste o marcador para ajustar'
                  : 'Toque no mapa para selecionar'}
              </Text>
            </View>

            <IconButton
              icon="close"
              size={21}
              iconColor={theme.colors.iconDefault}
              disabled={saving}
              onPress={onClose}
            />
          </View>

          <TextInput
            mode="outlined"
            label="Descrição"
            placeholder="Ex.: Restaurante Avenida"
            value={description}
            onChangeText={onDescriptionChange}
            maxLength={150}
            disabled={saving}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={onRequestSave}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
            style={[AddPointStyles.input, { backgroundColor: theme.colors.surface }]}
          />

          <View style={AddPointStyles.actions}>
            <Button
              mode="contained"
              icon="crosshairs-gps"
              buttonColor={theme.colors.secondaryActionBackground}
              textColor={theme.colors.secondaryActionForeground}
              disabled={saving}
              style={AddPointStyles.secondaryButton}
              contentStyle={AddPointStyles.buttonContent}
              onPress={onCurrentLocation}
            >
              Local atual
            </Button>

            <Button
              mode="contained"
              icon="arrow-right"
              buttonColor={theme.colors.actionBackground}
              textColor={theme.colors.actionForeground}
              disabled={saving}
              style={AddPointStyles.primaryButton}
              contentStyle={AddPointStyles.buttonContent}
              onPress={onRequestSave}
            >
              Continuar
            </Button>
          </View>
        </Surface>
      </Animated.View>

      <Portal>
        <Dialog
          visible={categoryDialogVisible}
          onDismiss={onCloseCategory}
          style={[AddPointStyles.dialog, { backgroundColor: theme.colors.surface }]}
        >
          <Dialog.Title
            style={[AddPointStyles.dialogTitle, { color: theme.colors.onSurface }]}
          >
            Tipo do ponto
          </Dialog.Title>

          <Dialog.Content>
            <Text
              style={[
                AddPointStyles.dialogText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Selecione a categoria do local.
            </Text>

            <Button
              mode="outlined"
              icon="food"
              textColor={theme.colors.primary}
              disabled={saving}
              style={[
                AddPointStyles.categoryButton,
                { borderColor: theme.colors.primary },
              ]}
              contentStyle={AddPointStyles.categoryButtonContent}
              onPress={() => void onSaveCategory('Restaurante')}
            >
              Restaurante
            </Button>

            <Button
              mode="outlined"
              icon="gas-station"
              textColor={theme.colors.success}
              disabled={saving}
              style={[
                AddPointStyles.categoryButton,
                { borderColor: theme.colors.success },
              ]}
              contentStyle={AddPointStyles.categoryButtonContent}
              onPress={() => void onSaveCategory('Posto de Combustível')}
            >
              Posto de combustível
            </Button>
          </Dialog.Content>

          <Dialog.Actions>
            <Button textColor={theme.colors.iconDefault} onPress={onCloseCategory}>
              Cancelar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
