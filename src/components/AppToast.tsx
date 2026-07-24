import React from 'react';
import Toast, { BaseToast, type ToastConfig} from 'react-native-toast-message';
import { useAppTheme } from './ThemeStyles';

export default function AppToast(): React.JSX.Element {
  const theme = useAppTheme();

  const baseStyle = {
    minHeight: 64,
    height: 'auto' as const,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderLeftWidth: 5,
    shadowColor: theme.colors.shadow,
  };

  const contentStyle = {
    paddingHorizontal: 14,
    paddingVertical: 10,
  };

  const text1Style = {
    color: theme.colors.onSurface,
    fontSize: 15,
    fontWeight: '700' as const,
  };

  const text2Style = {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  };

  const config: ToastConfig = {
    success: props => (
      <BaseToast
        {...props}
        style={[ baseStyle, { borderLeftColor: theme.colors.success }]}
        contentContainerStyle={contentStyle}
        text1Style={text1Style}
        text2Style={text2Style}
        text2NumberOfLines={3}
      />
    ),

    error: props => (
      <BaseToast
        {...props}
        style={[ baseStyle, { borderLeftColor: theme.colors.error }]}
        contentContainerStyle={contentStyle}
        text1Style={text1Style}
        text2Style={text2Style}
        text2NumberOfLines={3}
      />
    ),

    info: props => (
      <BaseToast
        {...props}
        style={[baseStyle, { borderLeftColor: theme.colors.info }]}
        contentContainerStyle={contentStyle}
        text1Style={text1Style}
        text2Style={text2Style}
        text2NumberOfLines={3}
      />
    ),
  };

  return (
    <Toast
      config={config}
      position="top"
      topOffset={50}
      visibilityTime={4000}
    />
  );
}