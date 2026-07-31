import React from 'react';
import {Text, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import PREVENTIVA_CHECKLIST from '../data/preventivaChecklist';
import styles from './preventivaChecklist.styles';

/**
 * Exibe o roteiro operacional da visita sem misturá-lo ao estado do relatório.
 */
export default function PreventivaChecklist(): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
      ]}
    >
      {PREVENTIVA_CHECKLIST.map((item, index) => (
        <View
          key={item}
          style={[
            styles.item,
            {
              borderBottomColor: theme.colors.outline,
              borderBottomWidth:
                index === PREVENTIVA_CHECKLIST.length - 1 ? 0 : 1,
            },
          ]}
        >
          <Text style={[styles.number, {color: theme.colors.onSurfaceVariant}]}>
            {String(index + 1).padStart(2, '0')}
          </Text>
          <Text style={[styles.text, {color: theme.colors.onSurface}]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
