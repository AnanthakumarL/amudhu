import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  ActivityIndicator,
  TextInput,
  View,
} from 'react-native';

const getApiUrl = () => {
  if (Constants.experienceUrl || Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl;
    if (hostUri) {
      let lanIp = hostUri.split(':')[0].replace('exp://', '').replace(/[/]/g, '');
      return `http://${lanIp}:5005`;
    }
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5005' : 'http://localhost:5005';
};

const API_BASE_URL = getApiUrl();

type OtpScreenProps = {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
};

export function OtpScreen({ phone, onBack, onSuccess }: OtpScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);

  // Auto-focus on first input
  useEffect(() => {
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const sendInitialOtp = async () => {
      await sendOtp();
    };

    sendInitialOtp();
    // We only resend automatically when the phone changes.
  }, [phone]);

  const sendOtp = async () => {
    try {
      setIsSendingOtp(true);
      setError(false);
      setStatusMessage('');

      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel: 'sms' }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to send verification code');
      }

      setStatusMessage('Verification code sent to your SMS inbox.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(true);
      setStatusMessage(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    setError(false);
    if (statusMessage) {
      setStatusMessage('');
    }
    
    // Handle pasting 4 digits at once
    if (text.length > 1) {
      const chars = text.slice(0, 4).split('');
      const newOtp = [...otp];
      chars.forEach((c, i) => {
         if (index + i < 4) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      // focus the last filled input
      const lastFilled = Math.min(index + chars.length - 1, 3);
      inputs.current[lastFilled]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto advance
    if (text !== '' && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      return;
    }

    try {
      setIsVerifying(true);
      setError(false);
      setStatusMessage('');

      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Invalid verification code');
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setError(true);
      setStatusMessage(message);
      setOtp(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const isFull = otp.every(digit => digit !== '');
  const canVerify = isFull && !isVerifying && !isSendingOtp;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, padding: 24 }}>
          {/* Header */}
          <Pressable
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F8FAFC',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: Platform.OS === 'ios' ? 20 : 40,
              marginBottom: 32,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>

          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#0F172A', marginBottom: 8 }}>
              Verify Phone
            </Text>
            <Text style={{ fontSize: 16, color: '#64748B', lineHeight: 24, fontWeight: '500' }}>
              Enter the 4-digit code sent to
            </Text>
            <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '800' }}>
              +91 {phone.slice(0,5)} {phone.slice(5)}
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={el => { inputs.current[index] = el; }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: error ? '#FEF2F2' : digit ? '#EEF2FF' : '#F8FAFC',
                  borderWidth: 2,
                  borderColor: error ? '#EF4444' : digit ? '#6366F1' : '#E2E8F0',
                  fontSize: 32,
                  fontWeight: '800',
                  color: error ? '#EF4444' : '#6366F1',
                  textAlign: 'center',
                }}
                keyboardType="number-pad"
                maxLength={4} // Allow paste
                value={digit}
                onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          {statusMessage ? (
            <Text
              style={{
                color: error ? '#EF4444' : '#16A34A',
                textAlign: 'center',
                fontWeight: '600',
                marginBottom: 24,
              }}
            >
              {statusMessage}
            </Text>
          ) : null}

          <Pressable
            disabled={!canVerify}
            onPress={handleVerify}
            style={({ pressed }) => ({
              marginTop: error ? 0 : 24,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={canVerify ? ['#6366F1', '#4F46E5'] : ['#E2E8F0', '#CBD5E1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: canVerify ? '#6366F1' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: canVerify ? 8 : 0,
              }}
            >
              {isVerifying || isSendingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: canVerify ? '#fff' : '#94A3B8', fontSize: 16, fontWeight: '800' }}>
                  Verify & Login
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#64748B', fontWeight: '500', fontSize: 14 }}>
              Didn't receive code?{' '}
            </Text>
            <Pressable
              disabled={isSendingOtp}
              onPress={async () => {
                setOtp(['', '', '', '']);
                inputs.current[0]?.focus();
                await sendOtp();
              }}
            >
              <Text style={{ color: isSendingOtp ? '#94A3B8' : '#6366F1', fontWeight: '800', fontSize: 14 }}>
                {isSendingOtp ? 'Sending...' : 'Resend'}
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
