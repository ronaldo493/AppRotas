import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import Login from '../../screens/Auth/Login';

const Stack = createStackNavigator();

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