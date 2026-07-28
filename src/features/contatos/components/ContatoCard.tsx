import {MaterialIcons} from '@expo/vector-icons';
import React, {memo} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {Contato} from '../models/Contato';
import {enviarEmailParaContato, ligarParaContato} from '../services/contatoService';
import styles from './contatoCard.styles';

interface ContatoCardProps {
  contato: Contato;
}

const exibirErroAcao = (acao: string): void => {
  Toast.show({
    type: 'info',
    text1: `Não foi possível ${acao}`,
    text2: 'Verifique se existe um aplicativo compatível no dispositivo.',
  });
};

function ContatoCard({contato}: ContatoCardProps): React.JSX.Element {
  const theme = useAppTheme();

  const handlePhone = async (): Promise<void> => {
    const telefone = contato.ddr?.trim() || contato.ramal?.trim();

    if (!telefone || !(await ligarParaContato(telefone))) exibirErroAcao('realizar a ligação');
  };

  const handleEmail = async (): Promise<void> => {
    if (!contato.email || !(await enviarEmailParaContato(contato.email))) exibirErroAcao('abrir o e-mail');
  };

  return (
    <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline}]}>
      <View style={[styles.avatar, {backgroundColor: theme.colors.primarySoft}]}>
        <MaterialIcons name="person" size={22} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, {color: theme.colors.onSurface}]}>{contato.colaboradores}</Text>
        <Text style={[styles.department, {color: theme.colors.onSurfaceVariant}]}>{contato.departamento}</Text>

        <View style={styles.details}>
          {contato.ramal ? <Text style={[styles.detail, {color: theme.colors.onSurface}]}>Ramal: {contato.ramal}</Text> : null}
          {contato.ddr ? <Text style={[styles.detail, {color: theme.colors.onSurface}]}>DDR: {contato.ddr}</Text> : null}
          {contato.email ? <Text numberOfLines={1} style={[styles.detail, {color: theme.colors.onSurface}]}>{contato.email}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        {(contato.ddr || contato.ramal) ? (
          <TouchableOpacity 
            accessibilityRole="button" 
            accessibilityLabel={`Ligar para ${contato.colaboradores}`} 
            style={[styles.action, {backgroundColor: theme.colors.buttonBackground}]} 
            onPress={() => void handlePhone()}
          >
            <MaterialIcons name="phone" size={20} color={theme.colors.success} />
          </TouchableOpacity>
        ) : null}

        {contato.email ? (
          <TouchableOpacity 
            accessibilityRole="button" 
            accessibilityLabel={`Enviar e-mail para ${contato.colaboradores}`} 
            style={[styles.action, {backgroundColor: theme.colors.buttonBackground}]} 
            onPress={() => void handleEmail()}
          >
            <MaterialIcons name="email" size={20} color={theme.colors.info} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default memo(ContatoCard);
