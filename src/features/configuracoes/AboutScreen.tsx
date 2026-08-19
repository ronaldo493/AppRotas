import type {DrawerScreenProps} from '@react-navigation/drawer';
import Constants from 'expo-constants';
import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {DrawerParamList} from '../../application/navigation/navigationTypes';
import {useAppTheme} from '../../core/theme/appTheme';
import AboutStyles from './aboutScreen.styles';

type AboutProps = DrawerScreenProps<DrawerParamList, 'Sobre'>;

export default function AboutScreen({ navigation }: AboutProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentVersion = Constants.expoConfig?.version ?? 'Não informada';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        AboutStyles.container,
        {paddingBottom: Math.max(insets.bottom + 20, 28)},
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={AboutStyles.header}>
        <Text style={[AboutStyles.title, { color: theme.colors.onBackground }]}>
          Sobre o aplicativo
        </Text>

        <Text style={[AboutStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Rotas, suporte e informação para equipes em campo
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
          O Suporte Drogal reúne em um único lugar os recursos necessários para
          planejar deslocamentos, consultar informações e registrar atividades
          operacionais com mais agilidade.
        </Text>

        <Text style={[AboutStyles.text, AboutStyles.spacedText, {color: theme.colors.onSurfaceVariant}]}>
          É possível localizar filiais, montar trajetos e abrir a navegação diretamente no Google Maps ou no Waze.
        </Text>

        <Text style={[AboutStyles.text, AboutStyles.spacedText, {color: theme.colors.onSurfaceVariant}]}>
          As viagens iniciadas pelo aplicativo registram duração, trajeto e
          chegadas durante o uso do navegador, com conclusão automática e
          sincronização offline. Também é possível navegar até restaurantes e
          postos cadastrados como pontos de interesse.
        </Text>

        <Text style={[AboutStyles.text, AboutStyles.spacedText, {color: theme.colors.onSurfaceVariant}]}>
          A consulta de contatos internos e o envio de sugestões completam os recursos disponíveis para os colaboradores.
        </Text>

        <Text style={[AboutStyles.permissionText, {
          color: theme.colors.onSurfaceVariant,
          borderTopColor: theme.colors.outline,
        }]}>
          Os recursos exibidos são definidos pelo cargo, setor e permissões de cada colaborador.
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
