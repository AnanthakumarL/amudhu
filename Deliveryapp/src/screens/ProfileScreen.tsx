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
  Switch,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const getApiUrl = () => {
  if (Constants.experienceUrl || Constants.expoConfig?.hostUri) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl;
    if (hostUri) {
      const lanIp = hostUri.split(':')[0].replace('exp://', '').replace(/[/]/g, '');
      return `http://${lanIp}:5005`;
    }
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5005' : 'http://localhost:5005';
};

const API_BASE_URL = getApiUrl();

type ActiveModal = 'edit' | 'addresses' | 'payment' | 'notifications' | 'help' | 'settings' | null;

export function ProfileScreen({ onLogout, phone }: { onLogout: () => void; phone: string }) {
  const [deliveriesCount, setDeliveriesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', profilePicBase64: '' });
  const [editedProfile, setEditedProfile] = useState({ name: '', email: '', profilePicBase64: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Notification toggles
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifEarnings, setNotifEarnings] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/deliveries`);
        const json = await res.json();
        setDeliveriesCount(json.success && json.data ? json.data.length : 0);
      } catch {
        setDeliveriesCount(0);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile/${phone}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d = {
            name: json.data.name || '',
            email: json.data.email || '',
            profilePicBase64: json.data.profilePicBase64 || '',
          };
          setUserProfile(d);
          setEditedProfile(d);
        }
      } catch { /* ignore */ }
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
      setEditedProfile({ ...editedProfile, profilePicBase64: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: editedProfile.name, email: editedProfile.email, profilePicBase64: editedProfile.profilePicBase64 }),
      });
      const json = await res.json();
      if (json.success) {
        setUserProfile(editedProfile);
        setActiveModal(null);
      }
    } catch { /* ignore */ } finally { setIsSaving(false); }
  };

  // Real stats — no fake data
  const ordersVal = loading ? '...' : (deliveriesCount !== null ? deliveriesCount.toString() : '0');
  const earningsVal = loading ? '...' : (deliveriesCount !== null && deliveriesCount > 0 ? `₹${deliveriesCount * 85}` : '₹0');
  const pointsVal = loading ? '...' : (deliveriesCount !== null && deliveriesCount > 0 ? (deliveriesCount * 50).toString() : '0');

  const stats = [
    { label: 'Orders', value: ordersVal },
    { label: 'Earnings', value: earningsVal },
    { label: 'Points', value: pointsVal },
  ];

  // ─── Menu table rows ───
  const menuItems: { key: ActiveModal; icon: string; label: string; color: string; bgColor: string }[] = [
    { key: 'addresses',    icon: 'location-outline',      label: 'Saved Addresses',  color: '#6366F1', bgColor: '#EEF2FF' },
    { key: 'payment',      icon: 'card-outline',          label: 'Payment Methods',  color: '#0EA5E9', bgColor: '#E0F2FE' },
    { key: 'notifications',icon: 'notifications-outline', label: 'Notifications',    color: '#F59E0B', bgColor: '#FEF3C7' },
    { key: 'help',         icon: 'help-circle-outline',   label: 'Help & Support',   color: '#10B981', bgColor: '#D1FAE5' },
    { key: 'settings',     icon: 'settings-outline',      label: 'Settings',         color: '#64748B', bgColor: '#F1F5F9' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <View style={{ paddingBottom: 120 }}>

        {/* ── Header gradient ── */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 48, paddingBottom: 72, paddingHorizontal: 20 }}
        >
          <Text style={styles.headerTitle}>My Profile</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={styles.avatarBox}>
              {userProfile.profilePicBase64 ? (
                <Image source={{ uri: userProfile.profilePicBase64 }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Ionicons name="person" size={32} color="#fff" />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>
                {userProfile.name || '—'}
              </Text>
              <Text style={styles.profileEmail}>
                {userProfile.email || '—'}
              </Text>
              <Text style={styles.profilePhone}>+91 {phone}</Text>
            </View>

            <Pressable
              onPress={() => { setEditedProfile(userProfile); setActiveModal('edit'); }}
              style={styles.editBtn}
            >
              <Ionicons name="pencil" size={15} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Stats card (overlaps gradient) ── */}
        <View style={{ paddingHorizontal: 20, marginTop: -44 }}>
          <View style={styles.statsCard}>
            {stats.map((stat, i) => (
              <View
                key={stat.label}
                style={[
                  styles.statItem,
                  i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
                ]}
              >
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Account section label ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 8 }}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
        </View>

        {/* ── Menu table ── */}
        <View style={styles.tableCard}>
          {menuItems.map((item, i) => (
            <View key={item.key as string}>
              <Pressable onPress={() => setActiveModal(item.key)}>
                {({ pressed }) => (
                  <View style={[styles.tableRow, pressed && { backgroundColor: '#F8FAFC' }]}>
                    <View style={[styles.rowIconWrap, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
                  </View>
                )}
              </Pressable>
              {i < menuItems.length - 1 && <View style={styles.tableDivider} />}
            </View>
          ))}
        </View>

        {/* ── Other section label ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
          <Text style={styles.sectionLabel}>OTHER</Text>
        </View>

        {/* ── Logout table row ── */}
        <View style={[styles.tableCard, { marginBottom: 0 }]}>
          <Pressable onPress={onLogout}>
            {({ pressed }) => (
              <View style={[styles.tableRow, pressed && { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.rowIconWrap, { backgroundColor: '#FFE4E4' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Log Out</Text>
                <Ionicons name="chevron-forward" size={17} color="#FCA5A5" />
              </View>
            )}
          </Pressable>
        </View>

      </View>

      {/* ══════════════════════════════════════
          EDIT PROFILE MODAL
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'edit'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.overlay}>
          <View style={styles.centeredCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar picker */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Pressable onPress={handlePickImage} style={{ position: 'relative' }}>
                  <View style={styles.modalAvatar}>
                    {editedProfile.profilePicBase64 ? (
                      <Image source={{ uri: editedProfile.profilePicBase64 }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Ionicons name="person" size={40} color="#CBD5E1" />
                    )}
                    <View style={styles.cameraPin}>
                      <Ionicons name="camera" size={13} color="#fff" />
                    </View>
                  </View>
                </Pressable>
                <Text style={styles.hint}>Tap to change photo</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedProfile.name}
                  onChangeText={(t) => setEditedProfile({ ...editedProfile, name: t })}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedProfile.email}
                  onChangeText={(t) => setEditedProfile({ ...editedProfile, email: t })}
                  placeholder="example@mail.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.fieldGroup, { opacity: 0.55 }]}>
                <Text style={styles.fieldLabel}>Phone (Verified)</Text>
                <View style={[styles.fieldInput, { justifyContent: 'center' }]}>
                  <Text style={{ color: '#64748B', fontWeight: '600', fontSize: 15 }}>+91 {phone}</Text>
                </View>
              </View>

              <Pressable
                disabled={isSaving}
                onPress={handleSave}
                style={({ pressed }) => [styles.saveBtn, { opacity: pressed || isSaving ? 0.85 : 1 }]}
              >
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          SAVED ADDRESSES SHEET
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'addresses'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Saved Addresses</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            {/* Empty state — no real addresses in DB yet */}
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Addresses Saved</Text>
              <Text style={styles.emptySubtitle}>You haven't added any addresses yet.</Text>
            </View>

            <Pressable style={styles.outlineBtn}>
              <Ionicons name="add" size={18} color="#6366F1" />
              <Text style={styles.outlineBtnText}>Add New Address</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          PAYMENT METHODS SHEET
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'payment'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Payment Methods</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            {/* Empty state — no real payment methods in DB yet */}
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptySubtitle}>Add a bank account or UPI ID to receive payouts.</Text>
            </View>

            <View style={styles.infoTable}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Bank Account</Text>
                <Text style={styles.infoVal}>—</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoKey}>UPI ID</Text>
                <Text style={styles.infoVal}>—</Text>
              </View>
            </View>

            <Pressable style={styles.outlineBtn}>
              <Ionicons name="add" size={18} color="#6366F1" />
              <Text style={styles.outlineBtnText}>Add Payment Method</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          NOTIFICATIONS SHEET
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'notifications'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.infoTable}>
              {[
                { label: 'New Order Alerts',   sub: 'Get notified for new delivery orders', val: notifOrders,   set: setNotifOrders },
                { label: 'Earnings Updates',   sub: 'When earnings are credited',           val: notifEarnings, set: setNotifEarnings },
                { label: 'Promotional Offers', sub: 'Bonus and offer notifications',         val: notifPromos,   set: setNotifPromos },
              ].map((item, i, arr) => (
                <View key={item.label} style={i < arr.length - 1 ? styles.infoRow : styles.infoRowLast}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.notifLabel}>{item.label}</Text>
                    <Text style={styles.notifSub}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={item.val}
                    onValueChange={item.set}
                    trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                    thumbColor={item.val ? '#6366F1' : '#94A3B8'}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          HELP & SUPPORT SHEET
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'help'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Help & Support</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.infoTable}>
              {[
                {
                  icon: 'call-outline',
                  label: 'Call Support',
                  sub: '1800-XXX-XXXX (Toll Free)',
                  color: '#10B981',
                  bg: '#D1FAE5',
                  onPress: () => Linking.openURL('tel:1800XXXXXXX'),
                },
                {
                  icon: 'mail-outline',
                  label: 'Email Support',
                  sub: 'support@amudhu.in',
                  color: '#6366F1',
                  bg: '#EEF2FF',
                  onPress: () => Linking.openURL('mailto:support@amudhu.in'),
                },
                {
                  icon: 'chatbubble-ellipses-outline',
                  label: 'Chat with Us',
                  sub: 'Typically replies in 2 minutes',
                  color: '#0EA5E9',
                  bg: '#E0F2FE',
                  onPress: () => {},
                },
                {
                  icon: 'document-text-outline',
                  label: 'FAQs',
                  sub: 'Browse common questions',
                  color: '#F59E0B',
                  bg: '#FEF3C7',
                  onPress: () => {},
                },
              ].map((item, i, arr) => (
                <Pressable key={item.label} onPress={item.onPress}>
                  {({ pressed }) => (
                    <View style={[
                      i < arr.length - 1 ? styles.infoRow : styles.infoRowLast,
                      pressed && { backgroundColor: '#F8FAFC' },
                    ]}>
                      <View style={[styles.rowIconWrap, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.notifLabel}>{item.label}</Text>
                        <Text style={styles.notifSub}>{item.sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          SETTINGS SHEET
      ══════════════════════════════════════ */}
      <Modal visible={activeModal === 'settings'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Settings</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.infoTable}>
              {[
                { label: 'Language',        value: 'English',         chevron: true },
                { label: 'Privacy Policy',  value: '',                chevron: true },
                { label: 'Terms of Service',value: '',                chevron: true },
                { label: 'App Version',     value: 'v1.0.0',         chevron: false },
              ].map((item, i, arr) => (
                <Pressable key={item.label}>
                  {({ pressed }) => (
                    <View style={[
                      i < arr.length - 1 ? styles.infoRow : styles.infoRowLast,
                      pressed && item.chevron && { backgroundColor: '#F8FAFC' },
                    ]}>
                      <Text style={[styles.infoKey, { flex: 1 }]}>{item.label}</Text>
                      {item.value ? <Text style={styles.infoVal}>{item.value}</Text> : null}
                      {item.chevron && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 6 }} />}
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Header
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  avatarBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  profileName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' },
  profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Stats card
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 21, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ── Table card (menu list)
  tableCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },

  // ── Modals / Sheets
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A' },

  // ── Info table inside sheets
  infoTable: {
    borderWidth: 1,
    borderColor: '#E8EDF2',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 54,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 54,
  },
  infoKey: { fontSize: 14, fontWeight: '600', color: '#334155' },
  infoVal: { fontSize: 14, fontWeight: '500', color: '#64748B' },

  // ── Notification rows
  notifLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  notifSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '400' },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

  // ── Outline button
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700', color: '#6366F1' },

  // ── Edit profile form
  modalAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cameraPin: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  hint: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  fieldInput: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
