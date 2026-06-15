import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { getThemeStyles } from '../../components/styles/ThemeStyles';
import { useTheme } from '../../src/context/ThemeContext';
import PreventivaStyles from '../styles/PreventivaStyles';

export default Checklist = () => {
    //Modo escuro
    const { isDarkMode } = useTheme(); 
    const themeStyles = getThemeStyles(isDarkMode);

    const [items, setItems] = useState([
    'LIMPEZA DAS MÁQUINAS',
    'LIMPEZA DO BALCÃO DAS MÁQUINAS',
    'PASSAR LIMPA CONTATO NOS COMPONENTES',
    'LIMPEZA DE CABEÇA DE IMPRESSÃO DAS IMPRESSORAS ETH / USB',
    'ORGANIZAÇÃO DO CABEAMENTO',
    'VERIFICAR SE OS LEITORES JÁ SÃO DOS NOVOS E TROCAR',
    'ATIVAR "EXCLUIR ARQUIVOS TEMPORÁRIOS"',
    'LIMPEZA DE DISCO DAS MÁQUINAS',
    'INSTALAR O AGENTE DE RMM PARA INVENTÁRIO DA LOJA',
    'INSTALAR O PROGRAMA DE BLOQUEIO DE PENDRIVE',
    'TESTAR VOIP',
    'PINGAR A LOJA TODA PARA VERIFICAR A CONEXÃO',
    'VERIFICAR O MIKROTIK',
    'ATIVAR O WINDOWS COM A KEY QUE ESTÁ NO HARDWARE',
    'ANOTAR PATRIMÔNIO DA LOJA TODA',
    'COLOCAR PATRIMÔNIO ONDE NÃO TEM',
    'VERIFICAR SE O RELÓGIO ESTÁ DANDO REP BLOQUEADO',
    ])

    const renderItem = ({ item }) => (
        <Text style={[PreventivaStyles.checklistItem, themeStyles.checklistItemTheme]}>{item}</Text>
    )
    return (
        <View style={[PreventivaStyles.checklistContainer, themeStyles.checklistContainerTheme]}>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(index) => index.toString()}
            style={PreventivaStyles.FlatlistContainer}
          />
        </View>
      );
}