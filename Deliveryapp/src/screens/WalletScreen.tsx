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
  StyleSheet,
  Dimensions,
} from 'react-native';

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

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  sublabel: string;
  amount: number;
  date: string;
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', label: 'Delivery Earnings', sublabel: 'Order #DL-00421', amount: 85, date: 'Today, 2:30 PM' },
  { id: '2', type: 'credit', label: 'Delivery Earnings', sublabel: 'Order #DL-00420', amount: 70, date: 'Today, 11:00 AM' },
  { id: '3', type: 'credit', label: 'Tip Received', sublabel: 'Order #DL-00419', amount: 50, date: 'Yesterday, 7:15 PM' },
  { id: '4', type: 'debit', label: 'Withdrawal', sublabel: 'To bank account ••••4291', amount: 500, date: 'Yesterday, 10:00 AM' },
  { id: '5', type: 'credit', label: 'Delivery Earnings', sublabel: 'Order #DL-00418', amount: 95, date: '10 Apr, 5:45 PM' },
  { id: '6', type: 'credit', label: 'Weekly Bonus', sublabel: 'Performance bonus', amount: 200, date: '10 Apr, 12:00 PM' },
  { id: '7', type: 'debit', label: 'Withdrawal', sublabel: 'To bank account ••••4291', amount: 1000, date: '8 Apr, 9:00 AM' },
  { id: '8', type: 'credit', label: 'Delivery Earnings', sublabel: 'Order #DL-00415', amount: 60, date: '7 Apr, 3:20 PM' },
];

export function WalletScreen({ phone }: { phone: string }) {
  const [deliveriesCount, setDeliveriesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch {
        setDeliveriesCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalEarnings = deliveriesCount !== null ? deliveriesCount * 85 : 0;
  const walletBalance = deliveriesCount !== null ? (deliveriesCount * 85) % 1500 + 300 : 0;
  const thisWeekEarnings = deliveriesCount !== null ? Math.min(deliveriesCount, 7) * 85 + 200 : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ paddingBottom: 120 }}>
        {/* Header Gradient */}
        <LinearGradient
          colors={['#1E3A5F', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Wallet</Text>
          <Text style={styles.headerSubtitle}>Earnings & Payments</Text>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                {loading ? (
                  <ActivityIndicator color="#2563EB" style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.balanceAmount}>{formatINR(walletBalance)}</Text>
                )}
              </View>
              <View style={styles.inrBadge}>
                <Text style={styles.inrBadgeText}>₹ INR</Text>
              </View>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceActions}>
              <Pressable style={styles.actionBtn}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="arrow-up" size={18} color="#2563EB" />
                </View>
                <Text style={styles.actionLabel}>Withdraw</Text>
              </Pressable>

              <Pressable style={styles.actionBtn}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="card" size={18} color="#2563EB" />
                </View>
                <Text style={styles.actionLabel}>Add Bank</Text>
              </Pressable>

              <Pressable style={styles.actionBtn}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="document-text" size={18} color="#2563EB" />
                </View>
                <Text style={styles.actionLabel}>Statement</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* Earnings Summary */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Earnings Summary</Text>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="today" size={20} color="#2563EB" />
              <Text style={[styles.summaryAmount, { color: '#2563EB' }]}>
                {loading ? '-' : formatINR(MOCK_TRANSACTIONS.filter(t => t.date.startsWith('Today') && t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
              </Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="calendar" size={20} color="#16A34A" />
              <Text style={[styles.summaryAmount, { color: '#16A34A' }]}>
                {loading ? '-' : formatINR(thisWeekEarnings)}
              </Text>
              <Text style={styles.summaryLabel}>This Week</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="trending-up" size={20} color="#EA580C" />
              <Text style={[styles.summaryAmount, { color: '#EA580C' }]}>
                {loading ? '-' : formatINR(totalEarnings)}
              </Text>
              <Text style={styles.summaryLabel}>All Time</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{deliveriesCount ?? '-'}</Text>
              <Text style={styles.statBoxLabel}>Deliveries</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
              <Text style={styles.statBoxValue}>₹85</Text>
              <Text style={styles.statBoxLabel}>Avg / Delivery</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{deliveriesCount !== null ? deliveriesCount * 50 : '-'}</Text>
              <Text style={styles.statBoxLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={styles.txHeader}>
            <Text style={styles.sectionHeader}>Transactions</Text>
            <Pressable>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.txContainer}>
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <View key={tx.id}>
                <View style={styles.txItem}>
                  <View style={[styles.txIconBox, { backgroundColor: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2' }]}>
                    <Ionicons
                      name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={tx.type === 'credit' ? '#16A34A' : '#DC2626'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txLabel}>{tx.label}</Text>
                    <Text style={styles.txSublabel}>{tx.sublabel}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }]}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </Text>
                </View>
                {i < MOCK_TRANSACTIONS.length - 1 && <View style={styles.txDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* UPI & Bank Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Payment Methods</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentIconBox}>
                <Ionicons name="phone-portrait" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>UPI</Text>
                <Text style={styles.paymentSub}>Connect your UPI ID for instant payouts</Text>
              </View>
              <Pressable style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>Link</Text>
              </Pressable>
            </View>
            <View style={styles.txDivider} />
            <View style={styles.paymentRow}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="business" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Bank Account</Text>
                <Text style={styles.paymentSub}>••••4291 — HDFC Bank</Text>
              </View>
              <View style={styles.linkedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.linkedText}>Linked</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  inrBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inrBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  txContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txSublabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  paymentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  linkBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
});
