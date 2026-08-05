import {MaterialIcons} from '@expo/vector-icons';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';

interface Props {
  title?: string;
  scope?: string;
  onBack: () => void;
}

/** Cabeçalho compacto e consistente para os módulos internos da administração. */
export default function AdminModuleHeader({title, scope, onBack}: Props): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Voltar para administração"
        hitSlop={8}
        onPress={onBack}
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={22} color={theme.colors.iconDefault} />
      </TouchableOpacity>
      {title ? (
        <View style={styles.textContent}>
          <Text style={[styles.title, {color: theme.colors.onBackground}]}>{title}</Text>
          {scope ? <Text style={[styles.scope, {color: theme.colors.onSurfaceVariant}]}>{scope}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 4},
  backButton: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  textContent: {flex: 1, paddingRight: 8},
  title: {fontSize: 20, lineHeight: 26, fontWeight: '700'},
  scope: {marginTop: 1, fontSize: 12, lineHeight: 17},
});
