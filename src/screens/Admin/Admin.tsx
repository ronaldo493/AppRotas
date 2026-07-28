import { MaterialIcons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '../../components/ThemeStyles';
import AdminStyles from './styles/AdminStyles';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface AdminOption {
  title: string;
  description: string;
  icon?: MaterialIconName;
}

const ADMIN_OPTIONS: AdminOption[] = [
  {
    title: 'Histórico de rotas',
    description: 'Visualize as rotas realizadas pelos colaboradores.',
    // icon: 'route',
  },
//   {
//     title: 'Relatórios',
//     description: 'Acompanhe informações gerais de utilização do sistema.',
//     icon: 'assessment',
//   },
  {
    title: 'Configurações',
    description: 'Gerencie parâmetros e permissões administrativas.',
    // icon: 'settings',
  },
];

export default function Admin(): React.JSX.Element {
  const theme = useAppTheme();

  const handleOptionPress = (option: AdminOption): void => {
    Toast.show({
      type: 'info',
      text1: option.title,
      text2: 'Funcionalidade em desenvolvimento.',
      position: 'top',
      topOffset: 60,
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={AdminStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={AdminStyles.header}>
        <Text style={[AdminStyles.title, { color: theme.colors.onBackground }]}>
          Área administrativa
        </Text>

        <Text style={[AdminStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Recursos destinados ao acompanhamento e gerenciamento do aplicativo.
        </Text>
      </View>

      <View style={AdminStyles.optionsContainer}>
        {ADMIN_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.title}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            onPress={() => handleOptionPress(option)}
            style={[
              AdminStyles.option,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <View
              style={[
                AdminStyles.iconContainer,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <MaterialIcons
                name={option.icon}
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={AdminStyles.optionContent}>
              <Text style={[AdminStyles.optionTitle, { color: theme.colors.onSurface }]}>
                {option.title}
              </Text>

              <Text
                style={[
                  AdminStyles.optionDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {option.description}
              </Text>
            </View>

            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.colors.iconDefault}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[AdminStyles.developmentText, { color: theme.colors.onSurfaceVariant }]}>
        Os recursos administrativos serão disponibilizados gradualmente.
      </Text>
    </ScrollView>
  );
}