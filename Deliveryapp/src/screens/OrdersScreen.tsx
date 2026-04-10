import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View, Pressable } from 'react-native';
import { OrderDetailsScreen } from './OrderDetailsScreen';

const getApiUrl = () => {
  // If running via Expo Go on physical device over LAN, this extracts the laptop's exact local IP (e.g. 192.168.1.5)
  if (Constants.experienceUrl || Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl;
    if (hostUri) {
      // Clean up the URL to grab just the IP address
      let lanIp = hostUri.split(':')[0];
      lanIp = lanIp.replace('exp://', '').replace(/[/]/g, '');
      console.log('Mobile App detected Laptop LAN IP:', lanIp);
      return `http://${lanIp}:5005`;
    }
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5005' : 'http://localhost:5005';
};

const API_BASE_URL = getApiUrl();

// Map DB status to nice UI colors
const getStatusProps = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return { label: 'Delivered', color: '#22C55E', bg: '#F0FDF4', icon: 'checkmark-circle' };
    case 'pending':
    case 'confirmed':
    case 'preparing':
      return { label: 'Preparing', color: '#F97316', bg: '#FFF7ED', icon: 'restaurant' };
    case 'on_the_way':
    case 'out for delivery':
      return { label: 'On the way', color: '#6366F1', bg: '#EEF2FF', icon: 'bicycle' };
    case 'cancelled':
      return { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' };
    default:
      return { label: status || 'Pending', color: '#64748B', bg: '#F8FAFC', icon: 'time' };
  }
};

export function OrdersScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      console.log('📱 Mobile App: Fetching deliveries from ->', `${API_BASE_URL}/api/deliveries`);
      
      // Auto-fail if backend doesn't respond in 6 seconds (avoids infinite loading)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_BASE_URL}/api/deliveries`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const json = await res.json();
      console.log('📱 Mobile App: Received JSON from backend:', json);

      if (json.success) {
        if (!json.data || json.data.length === 0) {
          console.warn('📱 Mobile App WARNING: Backend returned success, but data array is empty!');
        }
        setDeliveries(json.data || []);
      } else {
        console.error('📱 Mobile App Error: Backend returned success: false', json.message);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('📱 Mobile App: Connection timed out. Could not reach backend at:', API_BASE_URL);
      } else {
        console.error('📱 Mobile App: Network Request Failed ->', error.message || error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  if (selectedDelivery) {
    return (
      <OrderDetailsScreen 
        delivery={selectedDelivery} 
        onBack={() => {
          setSelectedDelivery(null);
          fetchDeliveries(); // Refresh list to get latest statuses
        }} 
      />
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={{ paddingBottom: 120, paddingTop: 50 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A' }}>My Deliveries</Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' }}>
            Track and manage your {deliveries.length} deliveries
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : (
          <>

            {/* Order History Header */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                All Deliveries
              </Text>
            </View>

            {/* List */}
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {deliveries.length === 0 && !isLoading && (
                <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>
                  No deliveries found.
                </Text>
              )}

              {deliveries.map((delivery) => {
                const statusProps = getStatusProps(delivery.status);
                const dateString = delivery.delivery_date 
                  ? new Date(delivery.delivery_date).toLocaleDateString()
                  : new Date(delivery.createdAt || Date.now()).toLocaleDateString();

                return (
                  <View
                    key={delivery._id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 20,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <LinearGradient
                        colors={['#F8FAFC', '#F1F5F9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                        }}
                      >
                        <Ionicons name={statusProps.icon as any} size={24} color={statusProps.color} />
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                          For {delivery.contact_name}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                          {delivery.address}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6366F1', marginTop: 4, fontWeight: '600' }}>
                          UID: {delivery.order_id}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {dateString}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                          ID: {delivery.order_id?.slice(-6).toUpperCase()}
                        </Text>
                        <View
                          style={{
                            backgroundColor: statusProps.bg,
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: statusProps.color }}>
                            {statusProps.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {statusProps.label !== 'Cancelled' && (
                      <View
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                          flexDirection: 'row',
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: '#F8FAFC',
                            borderRadius: 12,
                            padding: 10,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons name="call" size={14} color="#64748B" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                            Contact
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setSelectedDelivery(delivery)}
                          style={{
                            flex: 1,
                            backgroundColor: '#EEF2FF',
                            borderRadius: 12,
                            padding: 10,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons name="eye" size={16} color="#6366F1" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>
                            View Order
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
