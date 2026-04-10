import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

export function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPickupRoute, setShowPickupRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const PICKUP_LOCATION = { latitude: 11.1085, longitude: 77.3411 };
  const mapRef = useRef<MapView>(null);

  const handleFocusLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  const handleMapToPickup = async () => {
    if (!location) return;
    setShowPickupRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${location.coords.longitude},${location.coords.latitude};${PICKUP_LOCATION.longitude},${PICKUP_LOCATION.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRouteCoords(coords);
      } else {
        setRouteCoords([{ latitude: location.coords.latitude, longitude: location.coords.longitude }, PICKUP_LOCATION]);
      }
    } catch (e) {
      setRouteCoords([{ latitude: location.coords.latitude, longitude: location.coords.longitude }, PICKUP_LOCATION]);
    }
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('GPS Permission Denied');
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
          (newLoc) => {
            setLocation(newLoc);
          }
        );
      } catch (err) {
        setErrorMsg('Fetching Location...');
      }
    })();
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isNavigating && location && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
        pitch: 65,
        heading: location.coords.heading && location.coords.heading > 0 ? location.coords.heading : 0,
        altitude: 100,
        zoom: 19,
      }, { duration: 1000 });
    }
  }, [location, isNavigating]);

  return (
    <View style={styles.container}>
      {/* ── Background Map ── */}
      {!location ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FACC15" />
          <Text style={styles.loadingText}>{errorMsg || 'Locating you...'}</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {showPickupRoute ? (
            <>
              {/* Pickup Location */}
              <Marker coordinate={PICKUP_LOCATION} title="Pickup: Tiruppur Old Bus Stand">
                <View style={styles.redDot} />
              </Marker>

              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#3B82F6"
                  strokeWidth={4}
                />
              )}
            </>
          ) : (
            <>
            </>
          )}
        </MapView>
      )}

      {/* ── Overlay Content ── */}
      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">


        {/* Middle/Bottom Area */}
        <View style={styles.bottomOverlay} pointerEvents="box-none">
          


          {/* Location Focus button */}
          <View style={styles.addStopRow} pointerEvents="box-none">
            <View />
            <Pressable style={styles.circleButtonSmall} onPress={handleFocusLocation}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#3B82F6" />
            </Pressable>
          </View>



          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            <View style={styles.locationSelectorRow}>
              <View style={styles.redDotSmall} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup Location</Text>
                <Text style={styles.locationValue}>Tiruppur Old Bus Stand</Text>
              </View>
              <Pressable style={styles.startBtn} onPress={() => setIsNavigating(true)}>
                <Text style={styles.startBtnText}>Start</Text>
              </Pressable>
            </View>

            {/* Map to Pickup Button */}
            <Pressable style={styles.bookBtn} onPress={handleMapToPickup}>
              <Text style={styles.bookBtnText}>Map to Pickup</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontWeight: '600',
  },
  blueDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#3B82F6', borderWidth: 3, borderColor: '#fff',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }
  },
  redDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#EF4444', borderWidth: 3, borderColor: '#fff',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }
  },
  greenDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#10B981', borderWidth: 3, borderColor: '#fff',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 120, // Increased to avoid overlap with floating bottom navbar
  },

  bottomOverlay: {
    width: '100%',
  },
  addStopRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12
  },

  circleButtonSmall: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },

  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12,
  },
  rideOptionSelected: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#002855', backgroundColor: '#fff',
    marginBottom: 8,
  },
  rideOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent',
  },
  rideIconBoX: {
    width: 60, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rideDetails: { flex: 1, justifyContent: 'center', paddingTop: 4 },
  rideTitleRow: { flexDirection: 'row', alignItems: 'center' },
  rideTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  capacity: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  rideSub: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  rideTime: { fontSize: 12, color: '#64748B', marginTop: 4 },
  bullet: { color: '#CBD5E1', paddingHorizontal: 4 },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 4 },
  priceStrike: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  priceMain: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 2 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9',
    marginTop: 16, paddingVertical: 12,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 8, gap: 8 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  vDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 16 },
  bookBtn: {
    backgroundColor: '#FACC15', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  bookBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  redDotSmall: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginRight: 12
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 2
  },
  locationValue: {
    fontSize: 15, color: '#0F172A', fontWeight: '700'
  },
  startBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  startBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  }
});
