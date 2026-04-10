import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';

const steps = [
  { icon: 'checkmark-circle', label: 'Order placed', time: '12:00 PM', done: true },
  { icon: 'restaurant', label: 'Preparing', time: '12:05 PM', done: true },
  { icon: 'bicycle', label: 'Picked up', time: '12:18 PM', done: true },
  { icon: 'navigate', label: 'On the way', time: 'Now', done: true, active: true },
  { icon: 'home', label: 'Delivered', time: '~12:30 PM', done: false },
];

export function TrackScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={{ paddingBottom: 120, paddingTop: 50 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A' }}>
            Track Order
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' }}>
            Real-time delivery updates
          </Text>
        </View>

        {/* Map placeholder */}
        <View style={{ paddingHorizontal: 20 }}>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF']}
            style={{
              borderRadius: 28,
              height: 200,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Grid lines */}
            {[0, 1, 2, 3].map((i) => (
              <View
                key={`h${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${25 * (i + 1)}%`,
                  height: 1,
                  backgroundColor: '#C7D2FE',
                }}
              />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={`v${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${20 * (i + 1)}%`,
                  width: 1,
                  backgroundColor: '#C7D2FE',
                }}
              />
            ))}
            {/* Route line */}
            <View
              style={{
                position: 'absolute',
                left: 60,
                top: 80,
                width: 200,
                height: 3,
                backgroundColor: '#6366F1',
                borderRadius: 2,
                transform: [{ rotate: '-12deg' }],
              }}
            />
            {/* Driver dot */}
            <View
              style={{
                position: 'absolute',
                left: 160,
                top: 70,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: 3,
                borderColor: '#fff',
              }}
            >
              <Ionicons name="bicycle" size={16} color="#fff" />
            </View>

            {/* Destination pin */}
            <View
              style={{
                position: 'absolute',
                right: 50,
                top: 50,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#F97316',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              >
                <Ionicons name="home" size={14} color="#fff" />
              </View>
            </View>

            {/* ETA badge */}
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                alignSelf: 'center',
                backgroundColor: '#6366F1',
                borderRadius: 999,
                paddingHorizontal: 20,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Ionicons name="time" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                Arriving in ~12 min
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Driver card */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: '#EEF2FF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#6366F1',
              }}
            >
              <Text style={{ fontSize: 24 }}>🧑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                Alex Rivera
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="star" size={12} color="#EAB308" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                  4.92 · 820 deliveries
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="call" size={16} color="#6366F1" />
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chatbubble" size={16} color="#6366F1" />
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 16 }}>
            Delivery Timeline
          </Text>

          {steps.map((step, i) => (
            <View key={step.label} style={{ flexDirection: 'row', gap: 14, marginBottom: 4 }}>
              <View style={{ alignItems: 'center', width: 36 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: step.active
                      ? '#6366F1'
                      : step.done
                      ? '#EEF2FF'
                      : '#F8FAFC',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: step.active ? 0 : 1.5,
                    borderColor: step.done ? '#C7D2FE' : '#E2E8F0',
                  }}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={16}
                    color={step.active ? '#fff' : step.done ? '#6366F1' : '#CBD5E1'}
                  />
                </View>
                {i < steps.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      backgroundColor: step.done && !step.active ? '#C7D2FE' : '#E2E8F0',
                      marginVertical: 4,
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1, paddingTop: 4, paddingBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: step.active ? '800' : step.done ? '600' : '500',
                    color: step.active ? '#0F172A' : step.done ? '#334155' : '#94A3B8',
                  }}
                >
                  {step.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: step.active ? '#6366F1' : '#94A3B8',
                    fontWeight: step.active ? '700' : '400',
                    marginTop: 2,
                  }}
                >
                  {step.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
