// Orders.tsx → React Native
// - Link → TouchableOpacity + navigation.navigate
// - Loader spin → ActivityIndicator
// - CSS vars → hardcoded values
// - div/p/img/span → View/Text/Image
// - status badge background uses hex + '22' opacity trick → preserved as-is (works in RN)

import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Package } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import { useOrders } from '../lib/hooks'
import type { RootStackParamList } from '../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

const STATUS_COLORS: Record<string, string> = {
  Delivered: '#22c55e', Shipped: '#3b82f6', Processing: '#f59e0b', Cancelled: '#f04048',
}

export default function Orders() {
  const navigation                  = useNavigation<Nav>()
  const { user }                    = useStore()
  const { data: orders, loading }   = useOrders(user?.id)

  if (!user) return (
    <View style={s.centerWrap}>
      <Text style={s.guardTitle}>Please sign in</Text>
      <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.primaryBtnText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <View style={s.inner}>
        <Text style={s.pageTitle}>My Orders</Text>

        {/* ── Loading ── */}
        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color="#d1d5db" />
          </View>

        /* ── Empty ── */
        ) : !orders || orders.length === 0 ? (
          <View style={s.emptyWrap}>
            <Package size={64} strokeWidth={1} color="#d1d5db" />
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySubtitle}>Your order history will appear here.</Text>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
            >
              <Text style={s.primaryBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>

        /* ── Order list ── */
        ) : orders.map((order: any) => {
          const statusColor = STATUS_COLORS[order.status] ?? '#6b7280'
          const meta = [
            { label: 'Order', value: order.id },
            { label: 'Date',  value: order.date },
            { label: 'Total', value: `₱${order.amount.toFixed(2)}` },
            { label: 'Items', value: `${order.items} item${order.items !== 1 ? 's' : ''}` },
          ]
          return (
            <View key={order.id} style={s.card}>

              {/* Header */}
              <View style={s.cardHeader}>
                <View style={s.metaGrid}>
                  {meta.map(({ label, value }) => (
                    <View key={label} style={s.metaItem}>
                      <Text style={s.metaLabel}>{label}</Text>
                      <Text style={s.metaValue}>{value}</Text>
                    </View>
                  ))}
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
                  <Text style={[s.statusText, { color: statusColor }]}>{order.status}</Text>
                </View>
              </View>

              {/* Items preview */}
              <View style={s.cardBody}>
                {/* Thumbnails */}
                <View style={s.thumbRow}>
                  {(order.orderItems ?? []).slice(0, 3).map((item: any, i: number) => (
                    <View key={i} style={s.thumbWrap}>
                      {item.products?.image && (
                        <Image
                          source={{ uri: item.products.image }}
                          style={s.thumb}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  ))}
                </View>

                {/* Item names */}
                <View style={s.itemNames}>
                  {(order.orderItems ?? []).slice(0, 2).map((item: any, i: number) => (
                    <Text key={i} style={s.itemNameText}>
                      {item.products?.name} · US {item.size} × {item.qty}
                    </Text>
                  ))}
                  {(order.orderItems ?? []).length > 2 && (
                    <Text style={s.moreText}>+{order.orderItems.length - 2} more</Text>
                  )}
                  {order.address && (
                    <Text style={s.addressText}>📍 {order.address}</Text>
                  )}
                </View>

                {/* Buy again */}
                <TouchableOpacity
                  style={s.buyAgainBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
                >
                  <Text style={s.buyAgainBtnText}>Buy Again</Text>
                </TouchableOpacity>
              </View>

            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 16, paddingBottom: 60 },

  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  guardTitle:  { fontSize: 26, fontWeight: '800', color: '#111' },

  pageTitle: { fontSize: 36, fontWeight: '800', color: '#111', marginBottom: 28 },

  loaderWrap: { alignItems: 'center', padding: 80 },

  emptyWrap:    { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle:   { fontSize: 22, fontWeight: '700', color: '#111' },
  emptySubtitle:{ fontSize: 14, color: '#6b7280' },

  primaryBtn:     { backgroundColor: '#111', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Order card
  card:       { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 20 },

  cardHeader: { padding: 16, backgroundColor: '#f9fafb', gap: 12 },
  metaGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
  metaItem:   { minWidth: 70 },
  metaLabel:  { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 2 },
  metaValue:  { fontSize: 14, fontWeight: '700', color: '#111' },
  statusBadge:{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 50 },
  statusText: { fontWeight: '700', fontSize: 13 },

  cardBody:   { padding: 16, gap: 12 },
  thumbRow:   { flexDirection: 'row', gap: 8 },
  thumbWrap:  { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  thumb:      { width: '100%', height: '100%' },

  itemNames:    { gap: 4 },
  itemNameText: { fontSize: 13, color: '#4b5563' },
  moreText:     { fontSize: 12, color: '#9ca3af' },
  addressText:  { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  buyAgainBtn:     { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 8, paddingHorizontal: 18 },
  buyAgainBtnText: { fontSize: 13, fontWeight: '600', color: '#111' },
})