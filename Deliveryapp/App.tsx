/**
 * IMPORTANT: This is the UPDATED VERSION of the App entry point.
 * DO NOT REVERT to the restaurant-list UI or add NativeWind 'className' styles here.
 * This app uses modular screens from src/screens/ and standard React Native styling.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TrackScreen } from './src/screens/TrackScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'orders', label: 'Orders', icon: 'receipt' },
  { key: 'browse', label: 'Browse', icon: 'search' },
  { key: 'profile', label: 'Profile', icon: 'person' },
] as const;

type BottomTabKey = (typeof bottomTabs)[number]['key'];

export default function App() {
  const [authStep, setAuthStep] = useState<'login' | 'otp' | 'home'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [activeTab, setActiveTab] = useState<BottomTabKey>('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'profile':
        return (
          <ProfileScreen 
            phone={authPhone} 
            onLogout={() => {
              setAuthStep('login');
              setAuthPhone('');
            }} 
          />
        );
      case 'browse':
        return <TrackScreen />; // Using TrackScreen for 'browse' as per updated design
      default:
        return <HomeScreen />;
    }
  };

  if (authStep === 'login') {
    return (
      <LoginScreen
        onContinue={(phone) => {
          setAuthPhone(phone);
          setAuthStep('otp');
        }}
      />
    );
  }

  if (authStep === 'otp') {
    return (
      <OtpScreen
        phone={authPhone}
        onBack={() => setAuthStep('login')}
        onSuccess={() => setAuthStep('home')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar style="dark" />
      
      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Floating Bottom Navigation Bar */}
      <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
        <View style={{ 
          backgroundColor: '#0F172A', 
          borderRadius: 30, 
          flexDirection: 'row', 
          padding: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {bottomTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  borderRadius: 22,
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? '#0F172A' : '#94A3B8'}
                />
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  marginTop: 4,
                  color: isActive ? '#0F172A' : '#94A3B8',
                }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
