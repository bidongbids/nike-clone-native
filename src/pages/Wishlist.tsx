// Wishlist.tsx → React Native
// - Link → TouchableOpacity + navigation.navigate
// - Loader spin → ActivityIndicator
// - CSS grid 4-col → FlatList numColumns={2}
// - CSS vars → hardcoded values
// - div/p/h1/h3 → View/Text

import { useEffect } from 'react'
import {
  View, Text, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Heart } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import { useProducts } from '../lib/hooks'
import { fetchWishlist } from '../lib/api'
import ProductCard from '../components/ProductCard'
import type { RootStackParamList } from '../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function Wishlist() {
  const navigation                        = useNavigation<Nav>()
  const { user, wishlistIds, setWishlistIds } = useStore()
  const { data: allProducts, loading }    = useProducts()

  useEffect(() => {
    if (user && !user.id.startsWith('demo-')) {
      fetchWishlist(user.id).then(setWishlistIds).catch(console.error)
    }
  }, [user, setWishlistIds])

  const wishlistProducts = (allProducts ?? []).filter(p => wishlistIds.includes(p.id))
  const count            = wishlistProducts.length

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Wishlist</Text>
        <Text style={s.subtitle}>
          {loading ? '…' : count} {count === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color="#d1d5db" />
        </View>

      /* ── Empty ── */
      ) : count === 0 ? (
        <View style={s.emptyWrap}>
          <Heart size={64} strokeWidth={1} color="#d1d5db" />
          <Text style={s.emptyTitle}>Your wishlist is empty</Text>
          <Text style={s.emptySubtitle}>Save items you love for later.</Text>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
          >
            <Text style={s.primaryBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>

      /* ── Grid ── */
      ) : (
        <FlatList
          data={wishlistProducts}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  header:    { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  pageTitle: { fontSize: 36, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#6b7280' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle:   { fontSize: 22, fontWeight: '700', color: '#111' },
  emptySubtitle:{ fontSize: 14, color: '#6b7280' },

  primaryBtn:     { marginTop: 8, backgroundColor: '#111', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  grid: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },
  row:  { gap: 16, marginBottom: 16 },
})