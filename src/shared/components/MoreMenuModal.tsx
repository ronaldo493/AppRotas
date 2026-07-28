import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type {AuthMenu} from '../../core/auth/AuthMenu';
import {useAppTheme} from '../../core/theme/appTheme';
import {obterNomeIconeMaterial} from '../icons/materialIcon';

const { height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigate: (routeName: string) => void;
  menuItems: AuthMenu[];
}

export default function MoreMenuModal({
  visible,
  onClose,
  onNavigate,
  menuItems,
}: Props) {
  const theme = useAppTheme();

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : height,
      duration: visible ? 280 : 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleNavigate = (item: AuthMenu) => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      onNavigate(item.rota);
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Pressable style={[styles.backdrop, {backgroundColor: theme.colors.backdrop}]} onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalContent,
             {
              backgroundColor: theme.colors.tabBarBackground,
              transform: [
                {
                  translateY: slideAnim,
                },
              ],
            },
          ]}
        >
          <Pressable style={{ width: '100%' }}>
            
            <View style={styles.header}>
              <Text style={[styles.headerTitle,{ color: theme.colors.onSurfaceVariant } ]}>
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
              {menuItems?.map((item) => (
                <TouchableOpacity
                  key={item.rota}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outline,
                      shadowColor: theme.colors.shadow,
                    },
                  ]}
                  onPress={() => handleNavigate(item)}
                >
                  <MaterialIcons
                    name={obterNomeIconeMaterial(item.icone)}
                    size={30}
                    color={theme.colors.iconDefault}
                  />
                  <Text style={[styles.cardText, { color: theme.colors.onSurfaceVariant} ]}>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#707B7C',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#F8F9F9',
    width:'31%',
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7E9',
    shadowColor: '#000',
  },
  cardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2C3E50',
  },
});
