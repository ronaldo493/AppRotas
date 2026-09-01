import {MaterialIcons} from '@expo/vector-icons';
import React, {useSyncExternalStore} from 'react';
import {TouchableOpacity} from 'react-native';

import {useAppTheme} from '../../../../core/theme/appTheme';
import {
  observarDisponibilidadeCapturaVoz,
  obterDisponibilidadeCapturaVoz,
  solicitarCapturaVozAssistente,
} from '../../services/assistenteVoiceGateway';

/**
 * Adaptador visual opcional da tela de rotas. Remover este arquivo e seu uso
 * não altera o domínio de rotas nem o restante da assistente.
 */
export default function RouteAssistantMic(): React.JSX.Element | null {
  const theme = useAppTheme();
  const habilitado = useSyncExternalStore(
    observarDisponibilidadeCapturaVoz,
    obterDisponibilidadeCapturaVoz,
    obterDisponibilidadeCapturaVoz,
  );

  if (!habilitado) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Montar rota por voz"
      accessibilityHint="Diga as filiais na ordem desejada"
      onPress={solicitarCapturaVozAssistente}
      style={{
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
      }}
    >
      <MaterialIcons
        name="mic-none"
        size={22}
        color={theme.colors.primary}
      />
    </TouchableOpacity>
  );
}
