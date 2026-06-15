import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import About from '../../screens/Settings/About';
import Settings from '../../screens/Settings/Settings';
import Suporte from '../../screens/Settings/Suporte';

const Stack = createStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsMenu"
        component={Settings}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Suporte"
        component={Suporte}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="About"
        component={About}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}