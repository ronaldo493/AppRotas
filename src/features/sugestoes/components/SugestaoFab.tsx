import { MaterialIcons } from '@expo/vector-icons';
import React, { memo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import useSugestao from '../hooks/useSugestao';
import usePosicaoSugestao from '../hooks/usePosicaoSugestao';
import type {SugestaoTipo} from '../models/Sugestao';
import styles from './sugestaoFab.styles';

const SUGESTAO_POSITION_KEY =
  '@drogal:sugestao-fab-position';

interface OpcaoSugestao {
  tipo: SugestaoTipo;
  titulo: string;
  icone: keyof typeof MaterialIcons.glyphMap;
}

interface OpcaoButtonProps extends OpcaoSugestao {
  selecionado: boolean;
  disabled: boolean;
  onPress: () => void;
}

interface SugestaoFabProps {
  /**
   * Permite reutilizar somente o formulário. O assistente global usa essa
   * opção para evitar dois botões flutuantes concorrendo na tela.
   */
  showButton?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

const opcoes: OpcaoSugestao[] = [
  {
    tipo: 'SUGESTAO',
    titulo: 'Sugestão',
    icone: 'lightbulb-outline',
  },
  {
    tipo: 'MELHORIA',
    titulo: 'Melhoria',
    icone: 'trending-up',
  },
  {
    tipo: 'PROBLEMA',
    titulo: 'Problema',
    icone: 'report-problem',
  },
];

const OpcaoButton = memo(function OpcaoButton({
  titulo,
  icone,
  selecionado,
  disabled,
  onPress,
}: OpcaoButtonProps): React.JSX.Element {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.optionButton,
        {
          backgroundColor: selecionado
            ? colors.primarySoft
            : colors.surfaceVariant,
          borderColor: selecionado
            ? colors.primary
            : 'transparent',
        },
      ]}
    >
      <MaterialIcons
        name={icone}
        size={17}
        color={selecionado ? colors.primary : colors.iconDefault }
      />

      <Text
        numberOfLines={1}
        style={[ styles.optionText, { color: selecionado ? colors.primary : colors.onSurface }]}
      >
        {titulo}
      </Text>
    </TouchableOpacity>
  );
});

export default function SugestaoFab({
  showButton = true,
  visible: controlledVisible,
  onVisibleChange,
}: SugestaoFabProps): React.JSX.Element {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { loading, enviarSugestao } = useSugestao();

  const {panHandlers, transform} =
    usePosicaoSugestao(SUGESTAO_POSITION_KEY);

  const [internalVisible, setInternalVisible] = useState(false);
  const [tipo, setTipo] = useState<SugestaoTipo>('SUGESTAO');
  const [mensagem, setMensagem] = useState('');

  const visible = controlledVisible ?? internalVisible;
  const mensagemValida = mensagem.trim().length >= 5;

  const envioDesabilitado = loading || !mensagemValida;

  /**
   * Mantém o componente compatível com uso autônomo e com abertura controlada
   * por outro fluxo, como o assistente global.
   */
  const setVisible = (nextVisible: boolean): void => {
    if (controlledVisible === undefined) {
      setInternalVisible(nextVisible);
    }

    onVisibleChange?.(nextVisible);
  };

  const handleClose = (): void => {
    if (loading)   return;

    Keyboard.dismiss();
    setVisible(false);
  };

  const mostrarResultado = ( enviado: boolean): void => {
    setTimeout(() => {
      Toast.show({
        type: enviado ? 'success' : 'error',
        text1: enviado
          ? 'Sugestão enviada'
          : 'Erro ao enviar',
        text2: enviado
          ? 'Obrigado por ajudar a melhorar o aplicativo.'
          : 'Não foi possível enviar sua sugestão.',
      });
    }, 250);
  };

  const handleEnviar = async (): Promise<void> => {
    Keyboard.dismiss();

    const enviado = await enviarSugestao( tipo, mensagem);

    mostrarResultado(enviado);

    if (!enviado)  return;

    setMensagem('');
    setTipo('SUGESTAO');
    setVisible(false);
  };

  const sendColor = envioDesabilitado ? colors.onSurfaceVariant : colors.buttonForeground;

  return (
    <>
      {showButton ? (
        <Animated.View
          {...panHandlers}
          style={[ styles.fabContainer, { bottom: 94 + insets.bottom, transform }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Enviar sugestão"
            onPress={() => setVisible(true)}
            style={[
              styles.fab,
              {
                backgroundColor: colors.buttonBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <MaterialIcons
              name="feedback"
              size={23}
              color={colors.buttonForeground}
            />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          enabled
          style={styles.modalContainer}
          behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
        >
          <Pressable
            style={styles.backdrop}
            onPress={handleClose}
          />

          <View style={[ styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              bounces={false}
              contentContainerStyle={[ styles.modalScrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
            >
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={[ styles.title, { color: colors.onSurface }]}>
                    Ajude a melhorar
                  </Text>

                  <Text style={[ styles.description, { color: colors.onSurfaceVariant} ]}>
                    Envie uma sugestão, melhoria ou problema.
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={loading}
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <MaterialIcons
                    name="close"
                    size={22}
                    color={colors.iconDefault}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                {opcoes.map(opcao => (
                  <OpcaoButton
                    key={opcao.tipo}
                    {...opcao}
                    disabled={loading}
                    selecionado={tipo === opcao.tipo}
                    onPress={() => setTipo(opcao.tipo)}
                  />
                ))}
              </View>

              <TextInput
                value={mensagem}
                editable={!loading}
                multiline
                maxLength={500}
                placeholder="Descreva sua ideia ou o que aconteceu..."
                placeholderTextColor={colors.onSurfaceVariant}
                onChangeText={setMensagem}
                style={[
                  styles.input,
                  {
                    color: colors.onSurface,
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outline,
                  },
                ]}
              />

              <Text style={[styles.characterCount, { color: colors.onSurfaceVariant }]}>
                {mensagem.length}/500
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={envioDesabilitado}
                onPress={() => { void handleEnviar()}}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      envioDesabilitado
                        ? colors.surfaceVariant
                        : colors.buttonBackground,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.buttonForeground} />
                ) : (
                  <>
                    <MaterialIcons
                      name="send"
                      size={18}
                      color={sendColor}
                    />

                    <Text style={[ styles.sendButtonText, { color: sendColor }]}>
                      Enviar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
