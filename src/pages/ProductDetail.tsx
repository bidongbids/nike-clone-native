// ProductDetail.tsx → React Native
// - useParams → useRoute
// - useNavigate → useNavigation
// - CSS grid 2-col layout → ScrollView single column (standard mobile pattern)
// - Sticky image → normal Image at top
// - CSS grid sizes → FlatList numColumns={5}
// - Related products → FlatList numColumns={2}
// - Loader spin → ActivityIndicator
// - Link breadcrumb → TouchableOpacity navigation
// - position: absolute badge/overlay → absolute View inside relative View
// - All CSS vars → hardcoded values

import { useState, useEffect } from 'react'
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Heart, ChevronRight, Truck, RotateCcw, AlertTriangle } from 'lucide-react-native'
import { useProduct, useProducts, useProductSizes } from '../lib/hooks'
import { useStore } from '../store/useStore'
import ProductCard from '../components/ProductCard'
import Reviews from '../components/Reviews'
import type { RootStackParamList } from '../App'

type Nav   = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'ProductDetail'>

export default function ProductDetail() {
  const route      = useRoute<Route>()
  const navigation = useNavigation<Nav>()
  const { id }     = route.params

  const { data: product,    loading }  = useProduct(id)
  const { data: allProducts }          = useProducts()
  const { data: sizeStocks }           = useProductSizes(product?.id)
  const { addToCart, toggleWishlist, isWishlisted, addToast } = useStore()

  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [qty, setQty]                   = useState(1)
  const [sizeError, setSizeError]       = useState(false)

  useEffect(() => { setSelectedSize(null); setQty(1) }, [id])

  // ── Loading ──
  if (loading) return (
    <View style={styles.centerWrap}>
      <ActivityIndicator size="large" color="#d4d4d4" />
    </View>
  )

  // ── Not found ──
  if (!product) return (
    <View style={styles.centerWrap}>
      <Text style={styles.notFoundTitle}>Product not found</Text>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
      >
        <Text style={styles.backBtnText}>Back to Products</Text>
      </TouchableOpacity>
    </View>
  )

  const wishlisted   = isWishlisted(product.id)
  const price        = product.sale_price ?? product.price
  const isOutOfStock = product.stock === 0
  const isLowStock   = product.stock > 0 && product.stock < 10
  const related      = (allProducts ?? [])
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4)

  const selectedSizeStock = selectedSize
    ? (sizeStocks ?? []).find(x => x.size === selectedSize)?.stock ?? 0
    : 0
  const maxQtyForSize = selectedSize ? selectedSizeStock : product.stock

  const handleAdd = () => {
    if (!selectedSize) { setSizeError(true); addToast('Please select a size', 'error'); return }
    setSizeError(false); addToCart(product, selectedSize, qty)
  }
  const handleBuy = () => {
    if (!selectedSize) { setSizeError(true); addToast('Please select a size', 'error'); return }
    setSizeError(false); addToCart(product, selectedSize, qty)
    navigation.navigate('MainTabs', { screen: 'Cart' })
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>

      {/* ── Breadcrumb ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumb}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
          <Text style={styles.breadcrumbLink}>Home</Text>
        </TouchableOpacity>
        <ChevronRight size={12} color="#9ca3af" />
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}>
          <Text style={styles.breadcrumbLink}>Shoes</Text>
        </TouchableOpacity>
        <ChevronRight size={12} color="#9ca3af" />
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Products', params: { cat: product.category } })}>
          <Text style={[styles.breadcrumbLink, { textTransform: 'capitalize' }]}>{product.category}</Text>
        </TouchableOpacity>
        <ChevronRight size={12} color="#9ca3af" />
        <Text style={styles.breadcrumbCurrent}>{product.name}</Text>
      </ScrollView>

      {/* ── Product image ── */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
        {product.badge && (
          <View style={[styles.badgeWrap, product.badge === 'sale' ? styles.badgeSale : styles.badgeNew]}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockPill}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.productName}>{product.name}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, product.sale_price ? styles.priceSale : null]}>
            ₱{price}
          </Text>
          {product.sale_price && (
            <>
              <Text style={styles.priceOld}>₱{product.price}</Text>
              <View style={styles.savePill}>
                <Text style={styles.savePillText}>
                  Save ₱{(product.price - product.sale_price).toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Low stock warning */}
        {isLowStock && (
          <View style={styles.lowStockBox}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.lowStockText}>
              Only <Text style={{ fontWeight: '700' }}>{product.stock} left</Text> — order soon!
            </Text>
          </View>
        )}

        {/* Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Color</Text>
          <View style={styles.colorsRow}>
            {product.colors.map((c: string, i: number) => (
              <View key={i} style={[styles.colorDot, { backgroundColor: c }]} />
            ))}
          </View>
        </View>

        {/* Sizes */}
        <View style={styles.section}>
          <View style={styles.sizeLabelRow}>
            <Text style={styles.sectionLabel}>
              Select Size (US)
              {sizeError && <Text style={styles.sizeErrorHint}>  ← required</Text>}
            </Text>
            <TouchableOpacity>
              <Text style={styles.sizeGuideLink}>Size Guide</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={product.sizes}
            keyExtractor={s => String(s)}
            numColumns={5}
            scrollEnabled={false}
            columnWrapperStyle={styles.sizeRow}
            renderItem={({ item: s }) => {
              const sizeInfo  = (sizeStocks ?? []).find(x => x.size === s)
              const sizeStock = sizeInfo?.stock ?? 0
              const sizeOut   = sizeStock === 0
              const sizeLow   = sizeStock > 0 && sizeStock < 5
              const disabled  = isOutOfStock || sizeOut
              const selected  = selectedSize === s
              return (
                <TouchableOpacity
                  key={s}
                  disabled={disabled}
                  onPress={() => { if (!disabled) { setSelectedSize(s); setSizeError(false) } }}
                  style={[
                    styles.sizeBtn,
                    selected  && styles.sizeBtnSelected,
                    disabled  && styles.sizeBtnDisabled,
                    sizeError && !selected && styles.sizeBtnError,
                  ]}
                >
                  <Text style={[
                    styles.sizeBtnText,
                    selected && styles.sizeBtnTextSelected,
                    disabled && styles.sizeBtnTextDisabled,
                  ]}>
                    {s}
                  </Text>
                  {sizeLow && !sizeOut && !selected && (
                    <View style={styles.sizeLowBadge}>
                      <Text style={styles.sizeLowBadgeText}>{sizeStock}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            }}
          />
        </View>

        {/* Quantity */}
        <View style={styles.qtyRow}>
          <Text style={styles.sectionLabel}>Qty:</Text>
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, qty >= maxQtyForSize && styles.qtyBtnDisabled]}
              disabled={qty >= maxQtyForSize}
              onPress={() => setQty(q => Math.min(maxQtyForSize, q + 1))}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.qtyHint}>
            {selectedSize
              ? `${maxQtyForSize} avail. in US ${selectedSize}`
              : `${product.stock} total — select a size`}
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={[styles.btnPrimary, isOutOfStock && styles.btnDisabled]}
            onPress={handleAdd}
            disabled={isOutOfStock}
          >
            <Text style={styles.btnPrimaryText}>
              {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
            </Text>
          </TouchableOpacity>

          {!isOutOfStock && (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBuy}>
              <Text style={styles.btnSecondaryText}>Buy It Now</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btnWishlist, wishlisted && styles.btnWishlistActive]}
            onPress={() => toggleWishlist(product)}
          >
            <Heart size={18} color={wishlisted ? '#ef4444' : '#111'} fill={wishlisted ? '#ef4444' : 'none'} />
            <Text style={[styles.btnWishlistText, wishlisted && styles.btnWishlistTextActive]}>
              {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Perks */}
        <View style={styles.perks}>
          <View style={styles.perkRow}>
            <Truck size={18} color="#111" />
            <Text style={styles.perkText}>Free shipping on orders over ₱75</Text>
          </View>
          <View style={styles.perkRow}>
            <RotateCcw size={18} color="#111" />
            <Text style={styles.perkText}>Free 30-day returns</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descBox}>
          <Text style={styles.descTitle}>About this product</Text>
          <Text style={styles.descBody}>{product.description}</Text>
        </View>
      </View>

      {/* ── Reviews ── */}
      <View style={styles.reviewsWrap}>
        <Reviews productId={product.id} productName={product.name} />
      </View>

      {/* ── Related ── */}
      {related.length > 0 && (
        <View style={styles.related}>
          <Text style={styles.relatedTitle}>You Might Also Like</Text>
          <FlatList
            data={related}
            keyExtractor={p => String(p.id)}
            numColumns={2}
            columnWrapperStyle={styles.relatedRow}
            renderItem={({ item }) => <ProductCard product={item} />}
            scrollEnabled={false}
          />
        </View>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#fff' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  notFoundTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  backBtn:       { backgroundColor: '#111', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText:   { color: '#fff', fontWeight: '700' },

  // Breadcrumb
  breadcrumb:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  breadcrumbLink:   { fontSize: 13, color: '#9ca3af' },
  breadcrumbCurrent:{ fontSize: 13, color: '#111', fontWeight: '600' },

  // Image
  imageWrap:    { position: 'relative', backgroundColor: '#f3f4f6', aspectRatio: 1 },
  productImage: { width: '100%', height: '100%' },
  badgeWrap:    { position: 'absolute', top: 16, left: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  badgeNew:     { backgroundColor: '#111' },
  badgeSale:    { backgroundColor: '#ef4444' },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  outOfStockOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  outOfStockPill:    { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 50 },
  outOfStockText:    { fontWeight: '700', fontSize: 16, color: '#111' },

  // Info
  info:        { padding: 20, gap: 0 },
  category:    { fontSize: 13, color: '#9ca3af', textTransform: 'capitalize', marginBottom: 4 },
  productName: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 16, lineHeight: 32 },

  // Price
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  price:       { fontSize: 28, fontWeight: '700', color: '#111' },
  priceSale:   { color: '#ef4444' },
  priceOld:    { fontSize: 18, color: '#9ca3af', textDecorationLine: 'line-through' },
  savePill:    { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  savePillText:{ fontSize: 12, fontWeight: '700', color: '#ef4444' },

  // Low stock
  lowStockBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, padding: 12, marginBottom: 16 },
  lowStockText: { fontSize: 13, color: '#92400e', flex: 1 },

  // Sections
  section:       { marginBottom: 20 },
  sectionLabel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#111', marginBottom: 10 },
  colorsRow:     { flexDirection: 'row', gap: 8 },
  colorDot:      { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb' },

  // Sizes
  sizeLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sizeErrorHint: { fontSize: 11, color: '#ef4444', fontWeight: '400' },
  sizeGuideLink: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'underline' },
  sizeRow:       { gap: 8, marginBottom: 8 },
  sizeBtn:       { flex: 1, paddingVertical: 12, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 6, alignItems: 'center', position: 'relative' },
  sizeBtnSelected: { backgroundColor: '#111', borderColor: '#111' },
  sizeBtnDisabled: { backgroundColor: '#f9fafb', borderColor: '#f3f4f6' },
  sizeBtnError:    { borderColor: '#ef4444' },
  sizeBtnText:         { fontSize: 13, color: '#111' },
  sizeBtnTextSelected: { color: '#fff', fontWeight: '700' },
  sizeBtnTextDisabled: { color: '#d1d5db' },
  sizeLowBadge:     { position: 'absolute', top: -4, right: -4, backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  sizeLowBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  // Qty
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  qtyControl:     { flexDirection: 'row', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, overflow: 'hidden' },
  qtyBtn:         { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnDisabled: { opacity: 0.3 },
  qtyBtnText:     { fontSize: 16, fontWeight: '700', color: '#111' },
  qtyValue:       { paddingHorizontal: 14, paddingVertical: 8, fontWeight: '700', minWidth: 36, textAlign: 'center', color: '#111' },
  qtyHint:        { fontSize: 12, color: '#9ca3af', flex: 1 },

  // CTAs
  ctas:              { gap: 12, marginBottom: 24 },
  btnPrimary:        { backgroundColor: '#111', borderRadius: 50, paddingVertical: 18, alignItems: 'center' },
  btnPrimaryText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:       { opacity: 0.5 },
  btnSecondary:      { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 18, alignItems: 'center' },
  btnSecondaryText:  { fontSize: 16, fontWeight: '700', color: '#111' },
  btnWishlist:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 50 },
  btnWishlistActive: { borderColor: '#fecaca' },
  btnWishlistText:   { fontSize: 14, fontWeight: '600', color: '#111' },
  btnWishlistTextActive: { color: '#ef4444' },

  // Perks
  perks:   { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 20, gap: 12, marginBottom: 24 },
  perkRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  perkText:{ fontSize: 14, color: '#4b5563' },

  // Description
  descBox:  { backgroundColor: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 8 },
  descTitle:{ fontWeight: '700', fontSize: 15, marginBottom: 8, color: '#111' },
  descBody: { fontSize: 14, color: '#4b5563', lineHeight: 24 },

  // Reviews
  reviewsWrap: { paddingHorizontal: 16, paddingBottom: 40 },

  // Related
  related:      { paddingHorizontal: 16, paddingBottom: 60 },
  relatedTitle: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 16 },
  relatedRow:   { gap: 12, marginBottom: 12 },
})