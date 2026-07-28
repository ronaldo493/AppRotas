import React from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Text,
  View,
} from 'react-native';

import {useAppTheme} from '../../core/theme/appTheme';
import styles from './preventiva.styles';

const ITEMS = [
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
] as const;

export default function Checklist(): React.JSX.Element {
  const theme = useAppTheme();

  const renderItem = ({
    item,
  }: ListRenderItemInfo<string>): React.JSX.Element => (
    <Text
      style={[
        styles.checklistItem,
        {
          color: theme.colors.onSurface,
          backgroundColor:
            theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {item}
    </Text>
  );

  return (
    <View style={styles.checklistContainer}>
      <FlatList
        data={[...ITEMS]}
        renderItem={renderItem}
        keyExtractor={item => item}
        contentContainerStyle={
          styles.checklistContent
        }
      />
    </View>
  );
}
