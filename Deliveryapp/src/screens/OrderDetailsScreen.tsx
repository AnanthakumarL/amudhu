import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';

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

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered': return ['#22C55E', '#16A34A'];
    case 'pending':
    case 'confirmed':
    case 'preparing': return ['#F97316', '#EA580C'];
    case 'on_the_way':
    case 'out for delivery': return ['#6366F1', '#4F46E5'];
    case 'cancelled': return ['#EF4444', '#DC2626'];
    default: return ['#64748B', '#475569'];
  }
};

type OrderDetailsScreenProps = {
  delivery: any;
  onBack: () => void;
};

export function OrderDetailsScreen({ delivery, onBack }: OrderDetailsScreenProps) {
  const [currentStatus, setCurrentStatus] = useState(delivery.status?.toLowerCase() || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusColors = getStatusColor(currentStatus);
  const dateString = delivery.delivery_date 
    ? new Date(delivery.delivery_date).toLocaleString()
    : new Date(delivery.createdAt || Date.now()).toLocaleString();

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`${API_BASE_URL}/api/deliveries/${delivery._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentStatus(newStatus);
      } else {
        console.error('Failed to update status:', json.message);
      }
    } catch (err: any) {
      console.error('Network block or timeout in updating status:', err.message);
    } finally {
      setIsUpdating(false); // To ensure we also clear the updating spinner
    } 
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'android' ? 20 : 10,
          paddingBottom: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <Pressable
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F8FAFC',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>
            Order Summary
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
            ID: {delivery.order_id}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 120 }}>
          
          {/* Status Banner */}
          <LinearGradient
            colors={statusColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 24,
              borderRadius: 24,
              marginBottom: 20,
              shadowColor: statusColors[0],
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Current Status
                </Text>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4, textTransform: 'capitalize' }}>
                  {currentStatus || 'Pending'}
                </Text>
              </View>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cube" size={24} color="#fff" />
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 16, fontWeight: '500' }}>
              Updated: {dateString}
            </Text>
          </LinearGradient>

          {/* Quick Updater Actions */}
          {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <Pressable
                disabled={isUpdating}
                onPress={() => handleUpdateStatus('out for delivery')}
                style={{ flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', opacity: currentStatus === 'out for delivery' ? 0.5 : 1 }}
              >
                <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: 13 }}>Out for Delivery</Text>
              </Pressable>
              <Pressable
                disabled={isUpdating}
                onPress={() => handleUpdateStatus('delivered')}
                style={{ flex: 1, backgroundColor: '#ECFDF5', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>Mark Delivered</Text>
              </Pressable>
            </View>
          )}

          {/* Delivery Info */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 12 }}>
            Delivery Details
          </Text>
          
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="person" size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Recipient</Text>
                <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '800' }}>{delivery.contact_name}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="call" size={18} color="#F97316" />
              </View>
              <View>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</Text>
                <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '800' }}>{delivery.contact_phone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="location" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Address</Text>
                <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: '600', marginTop: 2, lineHeight: 20 }}>{delivery.address}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 12 }}>
            Order Notes
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 14, color: delivery.notes ? '#334155' : '#94A3B8', fontWeight: '500', lineHeight: 22 }}>
              {delivery.notes || 'No notes provided by the customer or sender.'}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', gap: 12 }}>
        <Pressable style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
          <Text style={{ color: '#475569', fontWeight: '800', fontSize: 15 }}>Contact Support</Text>
        </Pressable>
        <Pressable 
          disabled={currentStatus === 'cancelled'}
          style={({pressed}) => ({ flex: 1, backgroundColor: currentStatus === 'cancelled' ? '#CBD5E1' : '#6366F1', borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.8 : 1 })}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Track Driver</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
