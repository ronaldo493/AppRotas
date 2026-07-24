import React from 'react';
import { Text, View } from 'react-native';

import useAuth from '../../hooks/useAuth';
import ProfileStyles from './styles/ProfileStyles';
import { useAppTheme } from '../../components/ThemeStyles';

interface ProfileItem {
  key: string;
  label: string;
  value: string;
}

export default function Profile(): React.JSX.Element {
  const { user } = useAuth();
  const theme = useAppTheme();

  const profileItems: ProfileItem[] = [
    // {
    //   key: 'email',
    //   label: 'E-mail',
    //   value: user?.email || 'Não disponível',
    // },
    {
      key: 'username',
      label: 'Usuário',
      value: user?.username || 'Não disponível',
    },
    {
      key: 'setor',
      label: 'Setor',
      value: user?.setor || 'Não disponível',
    },
  ];

  return (
    <View
      style={[ProfileStyles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[ ProfileStyles.title, { color: theme.colors.onBackground }]}>
        Perfil do usuário
      </Text>

      <Text style={[ ProfileStyles.description, { color: theme.colors.onSurfaceVariant }]}>
        Confira abaixo as informações do seu cadastro.
      </Text>

      <View style={ProfileStyles.content}>
        {profileItems.map(item => (
          <View
            key={item.key}
            style={[
              ProfileStyles.infoBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Text style={[ ProfileStyles.label, { color: theme.colors.onSurfaceVariant }]}>
              {item.label}
            </Text>

            <Text
              selectable
              style={[ProfileStyles.value, { color: theme.colors.onSurface }]}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}