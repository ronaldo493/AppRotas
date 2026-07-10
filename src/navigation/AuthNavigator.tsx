import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../../screens/Auth/Login';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}