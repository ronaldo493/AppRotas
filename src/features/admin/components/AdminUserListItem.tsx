import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';
import styles from '../styles/adminPasswordManagement.styles';

/** Exibe somente a identificação necessária para selecionar o colaborador. */
export default function AdminUserListItem({
  usuario,
  disabled,
  onPress,
}: {
  usuario: UsuarioAdministravel;
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Redefinir senha de ${usuario.username}`}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.userRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.userIdentity}>
        <Text style={[styles.userName, {color: theme.colors.onSurface}]}>
          {usuario.username}
        </Text>
        <Text style={[styles.userMeta, {color: theme.colors.onSurfaceVariant}]}>
          {usuario.setor} · {usuario.cargo}
        </Text>
        {(usuario.bloqueado || usuario.deveAlterarSenha) && (
          <Text
            style={[
              styles.userState,
              {color: usuario.bloqueado ? theme.colors.warning : theme.colors.primary},
            ]}
          >
            {usuario.bloqueado ? 'Usuário bloqueado' : 'Troca de senha pendente'}
          </Text>
        )}
      </View>
      <Text style={[styles.userAction, {color: theme.colors.primary}]}>Redefinir</Text>
    </TouchableOpacity>
  );
}
