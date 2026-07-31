import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import styles from './selectField.styles';

interface SelectFieldProps {
  label: string;
  value?: string | null;
  placeholder: string;
  error?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Campo de seleção com aparência alinhada aos inputs do sistema e sem depender
 * dos seletores nativos do Android.
 */
export default function SelectField({
  label,
  value,
  placeholder,
  error = false,
  disabled = false,
  onPress,
}: SelectFieldProps): React.JSX.Element {
  const theme = useAppTheme();
  const borderColor = error ? theme.colors.error : theme.colors.outline;

  return (
    <View>
      <Text style={[styles.label, {color: error ? theme.colors.error : theme.colors.onSurfaceVariant}]}>
        {label}
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{disabled}}
        disabled={disabled}
        activeOpacity={0.72}
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        onPress={onPress}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            {color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant},
          ]}
        >
          {value || placeholder}
        </Text>

        <Text style={[styles.action, {color: theme.colors.primary}]}>
          {value ? 'Alterar' : 'Selecionar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
