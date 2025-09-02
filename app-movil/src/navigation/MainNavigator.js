import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import InformesListScreen from '../screens/informes/InformesListScreen';
import CreateInformeScreen from '../screens/informes/CreateInformeScreen';
import EditInformeScreen from '../screens/informes/EditInformeScreen';
import ImageUploadScreen from '../screens/informes/ImageUploadScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function InformesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InformesList" 
        component={InformesListScreen} 
        options={{ title: 'Mis Informes' }}
      />
      <Stack.Screen 
        name="CreateInforme" 
        component={CreateInformeScreen} 
        options={{ title: 'Crear Informe' }}
      />
      <Stack.Screen 
        name="EditInforme" 
        component={EditInformeScreen} 
        options={{ title: 'Editar Informe' }}
      />
      <Stack.Screen 
        name="ImageUpload" 
        component={ImageUploadScreen} 
        options={{ title: 'Subir Imágenes' }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Informes') {
            iconName = 'description';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#185dc8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#185dc8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Informes" 
        component={InformesStack} 
        options={{ title: 'Informes', headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
