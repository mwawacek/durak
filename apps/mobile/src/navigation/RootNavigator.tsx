import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameScreen } from '../screens/GameScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Lobby: undefined;
  Game: { roomId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => (
  <NavigationContainer
    theme={{
      dark: true,
      colors: {
        primary: colors.accent,
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '700' },
        heavy: { fontFamily: 'System', fontWeight: '800' },
      },
    }}
  >
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Durak' }} />
      <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Lobby' }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Spiel' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
