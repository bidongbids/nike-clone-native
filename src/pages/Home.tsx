// Home.tsx — fixed:
// - StyleSheet.absoluteFillObject → StyleSheet.absoluteFill
// - All Products navigations → navigate('MainTabs', { screen: 'Products', params })
// - Removed unused SCREEN_W + Dimensions import

import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ArrowRight, ChevronRight } from 'lucide-react-native'
import { useProducts } from '../lib/hooks'
import { useRealtimeProducts } from '../lib/realtime'
import ProductCard from '../components/ProductCard'
import type { RootStackParamList } from '../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CATEGORIES = [
  { label: 'Men',        emoji: '👔', cat: 'men',        bg: '#f3f3f3', fg: '#111' },
  { label: 'Women',      emoji: '👗', cat: 'women',      bg: '#fce7f3', fg: '#111' },
  { label: 'Basketball', emoji: '🏀', cat: 'basketball', bg: '#111',    fg: '#fff' },
  { label: 'Lifestyle',  emoji: '✨', cat: 'lifestyle',  bg: '#e5ff00', fg: '#111' },
  { label: 'Sale',       emoji: '🔥', cat: 'sale',       bg: '#f04048', fg: '#fff' },
]

export default function Home() {
  const { data: products, loading, refetch } = useProducts()
  useRealtimeProducts(refetch)

  const navigation = useNavigation<Nav>()

  const allProducts = products ?? []
  const featured = allProducts.filter(p => p.badge === 'new').slice(0, 4)
  const trending  = allProducts.slice(4, 8)
  const fallback  = allProducts.slice(0, 4)

  const goProducts = (cat?: string) =>
    navigation.navigate('MainTabs', { screen: 'Products', params: cat ? { cat } : undefined })

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=85' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>New Arrival</Text>
          <Text style={styles.heroTitle}>JUST DO{'\n'}IT.</Text>
          <Text style={styles.heroSub}>
            The latest Air Max innovation is here. Built for the streets, designed for your life.
          </Text>
          <View style={styles.heroCtas}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => goProducts()}>
              <Text style={styles.btnPrimaryText}>Shop Now</Text>
              <ArrowRight size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => goProducts('new')}>
              <Text style={styles.btnSecondaryText}>New Arrivals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Category strip ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catStrip}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.label}
            style={[styles.catChip, { backgroundColor: c.bg }]}
            onPress={() => goProducts(c.cat)}
          >
            <Text style={[styles.catChipText, { color: c.fg }]}>{c.emoji}  {c.label}</Text>
            <ChevronRight size={14} color={c.fg} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Featured ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => goProducts('new')}>
            <Text style={styles.seeAllText}>Shop New</Text>
            <ArrowRight size={14} color="#111" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#d4d4d4" />
          </View>
        ) : (
          <FlatList
            data={featured.length ? featured : fallback}
            keyExtractor={p => String(p.id)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => <ProductCard product={item} />}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* ── Mid banner ── */}
      <View style={styles.midBanner}>
        <Text style={styles.midBannerTitle}>STEP UP{'\n'}YOUR GAME.</Text>
        <Text style={styles.midBannerSub}>
          New men's & women's collections, built for every move.
        </Text>
        <TouchableOpacity style={styles.btnAccent} onPress={() => goProducts('men')}>
          <Text style={styles.btnAccentText}>Shop Men</Text>
          <ArrowRight size={16} color="#111" />
        </TouchableOpacity>
      </View>

      {/* ── Trending ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => goProducts()}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight size={14} color="#111" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={trending.length ? trending : allProducts.slice(4, 8)}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <ProductCard product={item} />}
          scrollEnabled={false}
        />
      </View>

      {/* ── Promo blocks ── */}
      <View style={styles.promoBlocks}>
        <View style={[styles.promoBlock, styles.promoDark]}>
          <Text style={styles.promoDarkTitle}>MEMBER{'\n'}EXCLUSIVE</Text>
          <Text style={styles.promoDarkSub}>
            Sign in to unlock member pricing and early access.
          </Text>
          <TouchableOpacity style={styles.btnAccent} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnAccentText}>Join Now</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.promoBlock, styles.promoLight]}>
          <Text style={styles.promoLightTitle}>SALE{'\n'}UP TO 40%</Text>
          <Text style={styles.promoLightSub}>Don't miss out. Limited time offers.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => goProducts('sale')}>
            <Text style={styles.btnPrimaryText}>Shop Sale</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Hero
  hero:        { height: 480, position: 'relative' },
  heroImage:   { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 28, paddingBottom: 36,
  },
  heroEyebrow: { fontSize: 12, fontWeight: '700', color: '#e5ff00', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  heroTitle:   { fontSize: 64, fontWeight: '900', color: '#fff', lineHeight: 60, marginBottom: 12 },
  heroSub:     { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 24, maxWidth: 300 },
  heroCtas:    { flexDirection: 'row', gap: 12 },

  // Buttons
  btnPrimary:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50 },
  btnPrimaryText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnSecondary:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  btnSecondaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnAccent:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e5ff00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 50, alignSelf: 'flex-start' },
  btnAccentText:    { color: '#111', fontSize: 14, fontWeight: '700' },

  // Category strip
  catStrip:    { paddingHorizontal: 16, paddingVertical: 20, gap: 8 },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50 },
  catChipText: { fontSize: 14, fontWeight: '600' },

  // Section
  section:       { paddingHorizontal: 16, paddingVertical: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:  { fontSize: 22, fontWeight: '800', color: '#111' },
  seeAllBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText:    { fontSize: 14, fontWeight: '600', color: '#111' },
  loaderWrap:    { alignItems: 'center', padding: 40 },
  gridRow:       { gap: 12, marginBottom: 12 },

  // Mid banner
  midBanner:      { backgroundColor: '#111', padding: 32, marginVertical: 8 },
  midBannerTitle: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 54, marginBottom: 16 },
  midBannerSub:   { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 22 },

  // Promo blocks
  promoBlocks:     { paddingHorizontal: 16, paddingVertical: 24, gap: 16 },
  promoBlock:      { borderRadius: 16, padding: 28 },
  promoDark:       { backgroundColor: '#111' },
  promoDarkTitle:  { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 48, marginBottom: 12 },
  promoDarkSub:    { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 22 },
  promoLight:      { backgroundColor: '#f3f3f3' },
  promoLightTitle: { fontSize: 48, fontWeight: '900', color: '#111', lineHeight: 48, marginBottom: 12 },
  promoLightSub:   { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 22 },
})