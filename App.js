// App.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from './contexts/UserContext';

import HomeScreen from './screens/HomeScreen';
import MoodInputScreen from './screens/MoodInputScreen';
import MealSuggestionScreen from './screens/MealSuggestionScreen';
import HistoryScreen from './screens/HistoryScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import MyPageScreen from './screens/MyPageScreen';
import ExerciseInputScreen from './screens/ExerciseInputScreen';

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }}/>
      <MainStack.Screen name="MoodInputScreen" component={MoodInputScreen}  options={{ headerShown: false }}/>
      <MainStack.Screen name="MealSuggestionScreen" component={MealSuggestionScreen}  options={{ headerShown: false }} />
      <MainStack.Screen name="RecipeDetailScreen" component={RecipeDetailScreen}  options={{ headerShown: false }} />
    </MainStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,   
        tabBarShowLabel: true,   
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack}  options={{ tabBarLabel: 'ホーム' }}/>
      <Tab.Screen name="HistoryScreen" component={HistoryScreen} options={{ tabBarLabel: '履歴' }} />
      <Tab.Screen name="ExerciseInput" component={ExerciseInputScreen}  options={{ tabBarLabel: '運動入力' }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ tabBarLabel: 'マイページ' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="RegisterScreen">
          <RootStack.Screen name="RegisterScreen" component={RegisterScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="RecipeDetailScreen" component={RecipeDetailScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}
