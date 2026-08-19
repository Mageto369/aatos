import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RFQScreen } from '../screens/RFQScreen';
import { DealsScreen } from '../screens/DealsScreen';
import { DealDetailScreen } from '../screens/DealDetailScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuthStore } from '../store/authStore';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  DealDetail: { dealId: string };
};

export type MainTabParamList = {
  RFQs: undefined;
  Deals: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="RFQs"
        component={RFQScreen}
        options={{ title: 'RFQs', tabBarLabel: 'RFQs' }}
      />
      <Tab.Screen
        name="Deals"
        component={DealsScreen}
        options={{ title: 'Deals', tabBarLabel: 'Deals' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages', tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="DealDetail"
            component={DealDetailScreen}
            options={{ headerShown: true, title: 'Deal Details' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
