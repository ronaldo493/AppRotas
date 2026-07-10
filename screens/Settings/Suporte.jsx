import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useAppTheme } from '../../components/styles/ThemeStyles';
import SuporteStyles from '../styles/SuporteStyles';

export default function Suporte ({navigation}){
    //Modo escuro
    const themeStyles = useAppTheme();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={SuporteStyles.scrollContainer}>
      <View style={[SuporteStyles.container,themeStyles.screenBackground]}>
        <Text style={[SuporteStyles.title, themeStyles.text]}>SUPORTE</Text>
        <Text style={[SuporteStyles.tipTextObs, themeStyles.textImp]}>
          OBS: Para o perfeito funcionamento do aplicativo é preciso estar ativado a localização do celular.
              Por padrão o waze não consegue gerar várias rotas ao mesmo tempo. Caso precise gerar várias rotas, use o Google Maps.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          1° Trace rotas para várias filiais ao mesmo tempo usando o Maps.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          2° Use a aba de chamados para consultar rapidamente quais tarefas estão atribuídas ou pendentes.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          3° Na opção 'Mapa Lojas', você verá as lojas conforme a sua localização. Poderá filtrar as lojas por cidade e traçar rotas para chegar até elas usando Google Maps.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          4° Na tela "Restaurantes & Postos", você pode visualizar locais que aceitam o cartão Alelo Refeição em restaurantes e o Ticket Car em postos de combustível. Ao adicionar um ponto, você pode selecionar se o local é um restaurante ou posto e incluir uma descrição sobre o local.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          5° A tela "Patrimônios" permite registrar anotações sobre patrimônio, incluindo tipos como Preventiva, Montagem, Inclusão, Reforma e Troca. Insira o código da filial e escolha a opção desejada para seguir com o registro. Além disso, você pode visualizar o checklist na tel inicial da Preventiva.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text]}>
          6° Ative o modo escuro nas configurações para facilitar a visualização em ambientes com pouca luz.
        </Text>

        <Text style={[SuporteStyles.tipText, themeStyles.text, { fontStyle: 'italic', marginTop: 20 }]}>
          🚧 Algumas funcionalidades estão em desenvolvimento. Fique atento a atualizações!
        </Text>
    
        <TouchableOpacity onPress={() => navigation.goBack()} style={themeStyles.buttonBack}>
            <Text style={themeStyles.text}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>  
  );
};
