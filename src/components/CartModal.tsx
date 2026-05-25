import { useEffect, useRef } from 'react'
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Animated, Modal, Pressable,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { X, ShoppingBag, ArrowRight, Check } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function CartModal() {
  const navigation = useNavigation<Nav>()
  const { cartModalProduct, setCartModal, getCartCount, getCartTotal } = useStore()

  const slideAnim = useRef(new Animated.Value(360)).current

  useEffect(() => {
    if (cartModalProduct) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      slideAnim.setValue(360)
    }
  }, [cartModalProduct])

  if (!cartModalProduct) return null

  const p     = cartModalProduct
  const price = p.sale_price ?? p.price

  return (
    <Modal transparent animationType="none" visible={!!cartModalProduct} onRequestClose={() => setCartModal(null)}>
      <Pressable style={styles.backdrop} onPress={() => setCartModal(null)}>
        <Animated.View
          style={[styles.card, { transform: [{ translateX: slideAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.checkCircle}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </View>
            <Text style={styles.headerText}>Added to your bag!</Text>
            <TouchableOpacity onPress={() => setCartModal(null)}>
              <X size={16} color="#86efac" />
            </TouchableOpacity>
          </View>

          {/* Product */}
          <View style={styles.productRow}>
            <Image source={{ uri: p.image }} style={styles.productImage} resizeMode="cover" />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.productCategory}>{p.category}</Text>
              <Text style={[styles.productPrice, { color: p.sale_price ? '#e5231b' : '#111' }]}>
                ₱{price}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {getCartCount()} item{getCartCount() !== 1 ? 's' : ''} in bag
            </Text>
            <Text style={styles.summaryText}>
              Subtotal: <Text style={styles.summaryBold}>₱{getCartTotal().toFixed(2)}</Text>
            </Text>
          </View>

          {/* CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.keepBtn} onPress={() => setCartModal(null)}>
              <Text style={styles.keepBtnText}>Keep Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewBagBtn}
              onPress={() => {
                setCartModal(null)
                navigation.navigate('MainTabs', { screen: 'Cart' })
              }}
            >
              <ShoppingBag size={14} color="#fff" />
              <Text style={styles.viewBagText}>View Bag</Text>
              <ArrowRight size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  card: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  checkCircle: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText:   { flex: 1, fontWeight: '700', fontSize: 14, color: '#15803d' },
  productRow:   { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'center' },
  productImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f5f5f5' },
  productInfo:  { flex: 1 },
  productName:  { fontWeight: '700', fontSize: 14, marginBottom: 2, color: '#111' },
  productCategory: { fontSize: 12, color: '#737373', marginBottom: 4, textTransform: 'capitalize' },
  productPrice: { fontWeight: '700', fontSize: 15 },
  summary:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  summaryText:  { fontSize: 12, color: '#737373' },
  summaryBold:  { fontWeight: '700', color: '#111' },
  ctaRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  keepBtn:      { flex: 1, paddingVertical: 11, borderWidth: 1.5, borderColor: '#d4d4d4', borderRadius: 50, alignItems: 'center' },
  keepBtnText:  { fontSize: 13, fontWeight: '600', color: '#111' },
  viewBagBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, backgroundColor: '#111', borderRadius: 50 },
  viewBagText:  { fontSize: 13, fontWeight: '600', color: '#fff' },
})