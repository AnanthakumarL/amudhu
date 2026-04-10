import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

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

const menuItems = [
  { icon: 'location', label: 'Saved addresses', badge: '3' },
  { icon: 'card', label: 'Payment methods', badge: '2' },
  { icon: 'gift', label: 'Promo codes', badge: null },
  { icon: 'heart', label: 'Favorites', badge: '7' },
  { icon: 'notifications', label: 'Notifications', badge: null },
  { icon: 'help-circle', label: 'Help & support', badge: null },
  { icon: 'settings', label: 'Settings', badge: null },
];

export function ProfileScreen({ onLogout, phone }: { onLogout: () => void; phone: string }) {
  const [deliveriesCount, setDeliveriesCount] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', profilePicBase64: '' });
  const [editedProfile, setEditedProfile] = useState({ name: '', email: '', profilePicBase64: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/deliveries`);
        const json = await res.json();
        if (json.success && json.data) {
          setDeliveriesCount(json.data.length);
        } else {
          setDeliveriesCount(0);
        }
      } catch (err) {
        setDeliveriesCount(0);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile/${phone}`);
        const json = await res.json();
        if (json.success && json.data) {
          const profileData = {
            name: json.data.name || '',
            email: json.data.email || '',
            profilePicBase64: json.data.profilePicBase64 || ''
          };
          setUserProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (err) {
        console.log('Failed to fetch profile', err);
      }
    };

    fetchStats();
    fetchProfile();
  }, [phone]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setEditedProfile({
        ...editedProfile,
        profilePicBase64: `data:image/jpeg;base64,${result.assets[0].base64}`
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: editedProfile.name,
          email: editedProfile.email,
          profilePicBase64: editedProfile.profilePicBase64
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUserProfile(editedProfile);
        setIsModalVisible(false);
      }
    } catch (err) {
      console.log('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    { label: 'Orders', value: deliveriesCount !== null ? deliveriesCount.toString() : '-' },
    { label: 'Earnings', value: deliveriesCount !== null ? `$${deliveriesCount * 12}` : '-' },
    { label: 'Points', value: deliveriesCount !== null ? (deliveriesCount * 50).toString() : '-' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={{ paddingBottom: 120 }}>
        {/* Header gradient */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 40, paddingBottom: 70, paddingHorizontal: 20, position: 'relative' }}
        >
          <Text style={{ fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
            My Profile
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.5)',
                overflow: 'hidden'
              }}
            >
              {userProfile.profilePicBase64 ? (
                <Image
                  source={{ uri: userProfile.profilePicBase64 }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Ionicons name="person" size={32} color="#fff" />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>
                {userProfile.name || `Partner +91 ${phone}`}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' }}>
                {userProfile.email || 'Delivery Partner'}
              </Text>
              <View style={styles.badge}>
                <Ionicons name="star" size={11} color="#FDE68A" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FDE68A' }}>Gold Member</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setEditedProfile(userProfile);
                setIsModalVisible(true);
              }}
              style={styles.editBtn}
            >
              <Ionicons name="pencil" size={15} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Stats card (overlap) */}
        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <View style={styles.statsCard}>
            {stats.map((stat, i) => (
              <View
                key={stat.label}
                style={[styles.statItem, { borderRightWidth: i < stats.length - 1 ? 1 : 0 }]}
              >
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, i) => (
              <View key={item.label}>
                <View style={styles.menuItem}>
                  <View style={styles.menuIconBox}>
                    <Ionicons name={item.icon as any} size={18} color="#6366F1" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
                {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Logout Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Pressable onPress={onLogout} style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out" size={18} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.imagePickerSection}>
                <Pressable onPress={handlePickImage} style={styles.imagePickerBtn}>
                  <View style={styles.modalAvatarBox}>
                    {editedProfile.profilePicBase64 ? (
                      <Image
                        source={{ uri: editedProfile.profilePicBase64 }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Ionicons name="person" size={40} color="#CBD5E1" />
                    )}
                    <View style={styles.cameraIconBadge}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  </View>
                </Pressable>
                <Text style={styles.imagePickerHint}>Tap to change photo</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(t) => setEditedProfile({ ...editedProfile, name: t })}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.email}
                  onChangeText={(t) => setEditedProfile({ ...editedProfile, email: t })}
                  placeholder="example@mail.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.inputGroup, { opacity: 0.6 }]}>
                <Text style={styles.inputLabel}>Phone Number (Verifed)</Text>
                <View style={[styles.input, { backgroundColor: '#F8FAFC', justifyContent: 'center' }]}>
                  <Text style={{ color: '#64748B', fontWeight: '600' }}>+91 {phone}</Text>
                </View>
              </View>

              <Pressable
                disabled={isSaving}
                onPress={handleSave}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed || isSaving ? 0.9 : 1 }]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightColor: '#F1F5F9',
    paddingVertical: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  menuContainer: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  menuIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },
  menuBadge: { backgroundColor: '#EEF2FF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
  menuBadgeText: { fontSize: 11, fontWeight: '800', color: '#6366F1' },
  menuDivider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: 18 },
  logoutBtn: { backgroundColor: '#FEF2F2', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoutIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFE4E4', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  imagePickerSection: { alignItems: 'center', marginBottom: 24 },
  imagePickerBtn: { position: 'relative' },
  modalAvatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  imagePickerHint: { fontSize: 12, color: '#64748B', marginTop: 8, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', marginLeft: 4 },
  input: {
    height: 56,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
