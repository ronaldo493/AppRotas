import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppProviders from './src/application/providers/AppProviders';

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders />
    </GestureHandlerRootView>
  );
}
