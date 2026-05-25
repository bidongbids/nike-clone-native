import {
  View, Text, Image, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import type { RootStackParamList } from '../../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function Cart() {
  const navigation = useNavigation<Nav>()
  const { cart, removeFromCart, updateQty, getCartTotal, addToast } = useStore()

  const total      = getCartTotal()
  const shipping   = total >= 75 ? 0 : 9.99
  const tax        = total * 0.08
  const orderTotal = total + shipping + tax

  if (cart.length === 0) {
    return (
      <View style={s.emptyWrap}>
        <ShoppingBag size={64} strokeWidth={1} color="#d1d5db" />
        <Text style={s.emptyTitle}>Your bag is empty</Text>
        <Text style={s.emptySubtitle}>Add some shoes to get started.</Text>
        <TouchableOpacity
          style={s.shopBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
        >
          <Text style={s.shopBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <View style={s.inner}>
        <Text style={s.pageTitle}>Your Bag</Text>

        {cart.map((item) => {
          const price  = item.product.sale_price ?? item.product.price
          const maxQty = item.product.stock
          return (
            <View key={item.key} style={s.itemRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProductDetail', { id: item.product.id })}
              >
                <View style={s.thumbWrap}>
                  <Image
                    source={{ uri: item.product.image }}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>

              <View style={s.itemDetails}>
                <View style={s.itemTop}>
                  <View style={s.itemLeft}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetail', { id: item.product.id })}
                    >
                      <Text style={s.itemName}>{item.product.name}</Text>
                    </TouchableOpacity>
                    <Text style={s.itemMeta}>{item.product.category}</Text>
                    <Text style={s.itemMeta}>Size: US {item.size}</Text>

                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => updateQty(item.key, item.qty - 1)}
                      >
                        <Minus size={12} color="#111" />
                      </TouchableOpacity>
                      <Text style={s.qtyValue}>{item.qty}</Text>
                      <TouchableOpacity
                        style={[s.qtyBtn, item.qty >= maxQty && s.qtyBtnDisabled]}
                        disabled={item.qty >= maxQty}
                        onPress={() => {
                          if (item.qty >= maxQty) { addToast(`Only ${maxQty} in stock`, 'warning'); return }
                          updateQty(item.key, item.qty + 1)
                        }}
                      >
                        <Plus size={12} color={item.qty >= maxQty ? '#d1d5db' : '#111'} />
                      </TouchableOpacity>
                      {item.qty >= maxQty && (
                        <Text style={s.maxStock}>Max stock</Text>
                      )}
                    </View>
                  </View>

                  <View style={s.itemRight}>
                    <Text style={s.itemPrice}>₱{(price * item.qty).toFixed(2)}</Text>
                    {item.product.sale_price && (
                      <Text style={s.itemPriceOld}>
                        ₱{(item.product.price * item.qty).toFixed(2)}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={s.removeBtn}
                      onPress={() => removeFromCart(item.key)}
                    >
                      <Trash2 size={13} color="#9ca3af" />
                      <Text style={s.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )
        })}

        <View style={s.summary}>
          <Text style={s.summaryTitle}>Order Summary</Text>

          <View style={s.summaryRows}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>
                Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)
              </Text>
              <Text style={s.summaryValue}>₱{total.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Shipping</Text>
              <Text style={[s.summaryValue, shipping === 0 && s.freeShipping]}>
                {shipping === 0 ? 'FREE' : `₱${shipping.toFixed(2)}`}
              </Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tax (8%)</Text>
              <Text style={s.summaryValue}>₱{tax.toFixed(2)}</Text>
            </View>
            <View style={s.summaryTotal}>
              <Text style={s.summaryTotalLabel}>Total</Text>
              <Text style={s.summaryTotalValue}>₱{orderTotal.toFixed(2)}</Text>
            </View>
          </View>

          {shipping > 0 && (
            <View style={s.shippingBanner}>
              <Text style={s.shippingBannerText}>
                🚚 Add <Text style={{ fontWeight: '700' }}>₱{(75 - total).toFixed(2)}</Text> more for free shipping!
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.checkoutBtn}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
          >
            <Text style={s.continueLink}>Continue Shopping</Text>
          </TouchableOpacity>

          <View style={s.paymentWrap}>
            <Text style={s.paymentLabel}>SECURE CHECKOUT</Text>
            <View style={s.paymentBadges}>
              {['💳 Visa', '💳 Mastercard', '📱 GCash', '💵 COD'].map((m) => (
                <View key={m} style={s.paymentBadge}>
                  <Text style={s.paymentBadgeText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 16, paddingBottom: 60 },

  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle:    { fontSize: 24, fontWeight: '800', color: '#111' },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
  shopBtn:       { marginTop: 8, backgroundColor: '#111', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  pageTitle: { fontSize: 36, fontWeight: '800', color: '#111', marginBottom: 24 },

  itemRow:     { flexDirection: 'row', gap: 14, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  thumbWrap:   { width: 100, height: 100, backgroundColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden' },
  thumb:       { width: '100%', height: '100%' },
  itemDetails: { flex: 1 },
  itemTop:     { flexDirection: 'row', justifyContent: 'space-between' },
  itemLeft:    { flex: 1, gap: 2 },
  itemName:    { fontWeight: '700', fontSize: 14, color: '#111', marginBottom: 2 },
  itemMeta:    { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },

  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  qtyBtn:         { width: 28, height: 28, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue:       { fontWeight: '700', minWidth: 20, textAlign: 'center', color: '#111' },
  maxStock:       { fontSize: 11, color: '#ef4444', fontWeight: '600' },

  itemRight:    { alignItems: 'flex-end', gap: 4 },
  itemPrice:    { fontWeight: '700', fontSize: 15, color: '#111' },
  itemPriceOld: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  removeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  removeBtnText:{ fontSize: 12, color: '#9ca3af' },

  summary:      { marginTop: 24, backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5e7eb' },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 16 },
  summaryRows:  { gap: 10, marginBottom: 16 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#4b5563' },
  summaryValue: { fontSize: 14, color: '#111' },
  freeShipping: { color: '#22c55e', fontWeight: '600' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 14 },
  summaryTotalLabel: { fontSize: 17, fontWeight: '700', color: '#111' },
  summaryTotalValue: { fontSize: 17, fontWeight: '700', color: '#111' },

  shippingBanner:     { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, padding: 12, marginBottom: 16 },
  shippingBannerText: { fontSize: 12, color: '#92400e' },

  checkoutBtn:     { backgroundColor: '#111', borderRadius: 50, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  continueLink:    { textAlign: 'center', fontSize: 14, color: '#6b7280', textDecorationLine: 'underline' },

  paymentWrap:      { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center', gap: 8 },
  paymentLabel:     { fontSize: 11, color: '#9ca3af' },
  paymentBadges:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  paymentBadge:     { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  paymentBadgeText: { fontSize: 11, color: '#111' },
})