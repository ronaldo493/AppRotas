import type { DrawerNavigationProp } from '@react-navigation/drawer';
import Constants from 'expo-constants';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AboutStyles from './styles/AboutStyles';
import { useAppTheme } from '../../components/ThemeStyles';

type DrawerParamList = {
  MainTabs: undefined;
  About: undefined;
};

interface AboutProps {
  navigation: DrawerNavigationProp<DrawerParamList, 'About'>;
}

export default function About({navigation}: AboutProps): React.JSX.Element {
  const theme = useAppTheme();

  const currentVersion: string = Constants.expoConfig?.version ?? 'Não informada';

  return (
    <View style={[AboutStyles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[AboutStyles.title, { color: theme.colors.onBackground }]}>
        SOBRE O APLICATIVO
      </Text>

      <Text style={[AboutStyles.text, { color: theme.colors.onSurfaceVariant }]}>
        Este aplicativo foi desenvolvido para facilitar o trabalho dos
        colaboradores que realizam atividades externas, ajudando na localização
        de filiais, visualização de chamados, adição de pontos de restaurantes e
        postos de combustíveis que aceitam ALELO e TICKET LOG, além da
        possibilidade de colher patrimônios pelo celular. Com ele, você pode
        traçar rotas para as filiais mais próximas utilizando o Google Maps ou
        Waze. Além disso, o aplicativo permite a consulta de chamados, tanto os
        atribuídos quanto os não atribuídos, proporcionando uma visão clara das
        tarefas a serem realizadas.
      </Text>

      <View style={[AboutStyles.informationContainer, { borderTopColor: theme.colors.outline },]}>
        <Text style={[AboutStyles.versionText, { color: theme.colors.onSurfaceVariant }]}>
          Versão do aplicativo: {currentVersion}
        </Text>

        <Text style={[AboutStyles.developerText, { color: theme.colors.onSurfaceVariant }]}>
          Desenvolvido por: Ronaldo
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={[
          AboutStyles.buttonBack,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text style={[AboutStyles.buttonBackText, { color: theme.colors.onSurfaceVariant }]}>
          ← Voltar
        </Text>
      </TouchableOpacity>
    </View>
  );
}