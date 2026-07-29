import {MaterialIcons} from '@expo/vector-icons';
import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type {MenuItem} from '../../../core/menu/Menu';
import {useAppTheme} from '../../../core/theme/appTheme';
import {
  obterNomeIconeMaterial,
} from '../../../shared/icons/materialIcon';
import styles from './moreMenuModal.styles';

const screenHeight = Dimensions.get('window').height;

interface MoreMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (routeName: string) => void;
  menuItems: MenuItem[];
}

/**
 * Exibe os módulos que não cabem na barra inferior e só solicita a navegação
 * depois que a animação de fechamento é concluída.
 */
export default function MoreMenuModal({
  visible,
  onClose,
  onNavigate,
  menuItems,
}: MoreMenuModalProps): React.JSX.Element {
  const theme = useAppTheme();
  const slideAnimation =
    useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: visible ? 0 : screenHeight,
      duration: visible ? 280 : 220,
      useNativeDriver: true,
    }).start();
  }, [slideAnimation, visible]);

  const handleClose = useCallback((): void => {
    Animated.timing(slideAnimation, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(onClose);
  }, [onClose, slideAnimation]);

  const handleNavigate = useCallback((
    item: MenuItem,
  ): void => {
    Animated.timing(slideAnimation, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      onNavigate(item.rota);
    });
  }, [onClose, onNavigate, slideAnimation]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          {backgroundColor: theme.colors.backdrop},
        ]}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor:theme.colors.tabBarBackground,
              transform: [{
                translateY: slideAnimation,
              }],
            },
          ]}
        >
          <Pressable>
            <View style={styles.header}>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                MAIS MÓDULOS
              </Text>

              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={theme.colors.iconActive}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.rota}
                  style={[
                    styles.card,
                    {
                      backgroundColor:theme.colors.surfaceVariant,
                      borderColor: theme.colors.outline,
                    },
                  ]}
                  onPress={() => handleNavigate(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.titulo}`}
                >
                  <MaterialIcons
                    name={obterNomeIconeMaterial(item.icone)}
                    size={30}
                    color={theme.colors.iconDefault}
                  />
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.titulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
