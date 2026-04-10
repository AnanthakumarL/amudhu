import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type LoginScreenProps = {
  onContinue: (phone: string) => void;
};

export function LoginScreen({ onContinue }: LoginScreenProps) {
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (phone.length >= 10) {
      onContinue(phone);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#EEF2FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="fast-food" size={40} color="#6366F1" />
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#0F172A', textAlign: 'center' }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 15, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
              Enter your phone number to login or create a new account
            </Text>
          </View>

          {/* Input Region */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Phone Number
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#E2E8F0',
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                backgroundColor: '#F8FAFC',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginRight: 12 }}>
                +91
              </Text>
              <View style={{ width: 2, height: 24, backgroundColor: '#E2E8F0', marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, fontSize: 18, fontWeight: '600', color: '#0F172A' }}
                placeholder="Enter 10 digit number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                autoFocus
              />
            </View>
          </View>

          <Pressable
            disabled={phone.length < 10}
            onPress={handleContinue}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={phone.length >= 10 ? ['#6366F1', '#4F46E5'] : ['#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: phone.length >= 10 ? '#6366F1' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: phone.length >= 10 ? 8 : 0,
              }}
            >
              <Text style={{ color: phone.length >= 10 ? '#fff' : '#94A3B8', fontSize: 16, fontWeight: '800' }}>
                Continue
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
