import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Constants from 'expo-constants';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../components/ThemeStyles';
import AboutStyles from './styles/AboutStyles';

type DrawerParamList = {
  MainTabs: undefined;
  About: undefined;
};

interface AboutProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'About'>;
}

export default function About({ navigation }: AboutProps): React.JSX.Element {
  const theme = useAppTheme();
  const currentVersion = Constants.expoConfig?.version ?? 'Não informada';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={AboutStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={AboutStyles.header}>
        <Text style={[AboutStyles.title, { color: theme.colors.onBackground }]}>
          Sobre o aplicativo
        </Text>

        <Text style={[AboutStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Apoio às atividades externas dos colaboradores
        </Text>
      </View>

      <View
        style={[
          AboutStyles.contentCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text style={[AboutStyles.text, { color: theme.colors.onSurfaceVariant }]}>
          Este aplicativo foi desenvolvido para auxiliar os colaboradores nas
          atividades realizadas fora da empresa, reunindo recursos de localização,
          rotas e apoio ao trabalho em campo.
        </Text>

        <Text style={[AboutStyles.text, { color: theme.colors.onSurfaceVariant }]}>
          Pelo sistema, é possível localizar filiais por código, nome ou cidade,
          visualizar os endereços no mapa e utilizar a localização atual para
          encontrar unidades próximas.
        </Text>

        <Text style={[AboutStyles.text, { color: theme.colors.onSurfaceVariant }]}>
          As rotas podem ser abertas diretamente no Google Maps ou no Waze. O
          aplicativo também permite consultar o histórico de rotas e cadastrar pontos
          de interesse, como restaurantes e postos de combustível que aceitam Alelo
          ou Ticket Log.
        </Text>

        <Text
          style={[
            AboutStyles.text,
            AboutStyles.lastText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          As funcionalidades disponíveis são definidas de acordo com o perfil e as
          permissões de cada colaborador.
        </Text>
      </View>

      <View
        style={[
          AboutStyles.informationContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <View style={AboutStyles.informationRow}>
          <Text
            style={[
              AboutStyles.informationLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Versão
          </Text>

          <Text
            style={[
              AboutStyles.informationValue,
              { color: theme.colors.onSurface },
            ]}
          >
            {currentVersion}
          </Text>
        </View>

        <View
          style={[
            AboutStyles.divider,
            { backgroundColor: theme.colors.outline },
          ]}
        />

        <View style={AboutStyles.informationRow}>
          <Text
            style={[
              AboutStyles.informationLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Desenvolvido por
          </Text>

          <Text
            style={[
              AboutStyles.informationValue,
              { color: theme.colors.onSurface },
            ]}
          >
            Ronaldo Vieira
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={[
          AboutStyles.buttonBack,
          {
            backgroundColor: theme.colors.actionBackground,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text
          style={[
            AboutStyles.buttonBackText,
            { color: theme.colors.actionForeground },
          ]}
        >
          Voltar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}