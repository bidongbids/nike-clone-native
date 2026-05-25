// Products.tsx → React Native
// - useSearchParams → route.params (cat, q passed from navigation)
// - <select> sort dropdown → Modal-based picker
// - <input type="range"> price sliders → @react-native-community/slider
// - filter sidebar → Modal bottom sheet
// - CSS grid → FlatList numColumns={2}
// - CSS pulse skeleton → Animated.Value opacity loop
// - Products.css dropped

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Modal, ScrollView,
  Animated,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { SlidersHorizontal, X, Search } from 'lucide-react-native'
import { useProducts } from '../lib/hooks'
import ProductCard from '../components/ProductCard'
import type { Category, SortOption } from '../types'
import type { MainTabParamList } from '../../App'
type ProductsRoute = RouteProp<MainTabParamList, 'Products'>

const CATEGORIES: Category[] = ['all', 'men', 'women', 'lifestyle', 'basketball']
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Featured',          value: 'featured'  },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc'},
  { label: 'Newest',            value: 'new'        },
]
const ALL_SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13]

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 750, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  return <Animated.View style={[sk.card, { opacity: anim }]} />
}
const sk = StyleSheet.create({
  card: { flex: 1, aspectRatio: 1, borderRadius: 8, backgroundColor: '#f3f4f6', margin: 6 },
})

// ── Main screen ──────────────────────────────────────────────────────────────
export default function Products() {
  const route = useRoute<ProductsRoute>()
  const catParam = route.params?.cat ?? ''
  const urlQuery = route.params?.q  ?? ''

  const { data: products, loading } = useProducts()

  const [searchQuery, setSearchQuery]   = useState(urlQuery)
  const [selectedCat, setSelectedCat]   = useState<Category>(() =>
    CATEGORIES.includes(catParam as Category) && !['new','sale'].includes(catParam)
      ? (catParam as Category) : 'all'
  )
  const [sort, setSort]                 = useState<SortOption>('featured')
  const [priceRange, setPriceRange]     = useState<[number, number]>([0, 20000])
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [inStockOnly, setInStockOnly]   = useState(false)
  const [filterOpen, setFilterOpen]     = useState(false)
  const [sortOpen, setSortOpen]         = useState(false)

  // Sync when navigating here with new params
  useEffect(() => { setSearchQuery(urlQuery) }, [urlQuery])
  useEffect(() => {
    if (CATEGORIES.includes(catParam as Category) && !['new','sale'].includes(catParam)) {
      setSelectedCat(catParam as Category)
    } else if (!catParam) {
      setSelectedCat('all')
    }
  }, [catParam])

  const filtered = useMemo(() => {
    let items = [...(products ?? [])]
    if (catParam === 'new')        items = items.filter(p => p.badge === 'new')
    else if (catParam === 'sale')  items = items.filter(p => p.badge === 'sale')
    else if (selectedCat !== 'all') items = items.filter(p => p.category === selectedCat)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q))
    }
    items = items.filter(p => {
      const price = p.sale_price ?? p.price
      return price >= priceRange[0] && price <= priceRange[1]
    })
    if (selectedSizes.length) items = items.filter(p => selectedSizes.some(s => p.sizes.includes(s)))
    if (inStockOnly) items = items.filter(p => p.stock > 0)
    if (sort === 'price_asc')  items.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
    if (sort === 'price_desc') items.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price))
    if (sort === 'new') items.sort(a => a.badge === 'new' ? -1 : 1)
    return items
  }, [products, searchQuery, selectedCat, catParam, sort, priceRange, selectedSizes, inStockOnly])

  const activeFilterCount = [
    selectedCat !== 'all' ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 20000 ? 1 : 0,
    selectedSizes.length > 0 ? 1 : 0,
    inStockOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const clearAll = () => {
    setSelectedCat('all'); setPriceRange([0, 20000])
    setSelectedSizes([]); setInStockOnly(false); setSearchQuery('')
  }
  const toggleSize = (s: number) =>
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const pageTitle = catParam === 'sale' ? 'Sale'
    : catParam === 'new' ? 'New Arrivals'
    : selectedCat !== 'all' ? selectedCat.charAt(0).toUpperCase() + selectedCat.slice(1)
    : 'All Shoes'

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Featured'

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
          <Text style={styles.countText}>
            {loading ? '…' : filtered.length} Products
          </Text>
        </View>

        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products…"
              placeholderTextColor="#9ca3af"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter button */}
          <TouchableOpacity
            style={[styles.controlBtn, activeFilterCount > 0 && styles.controlBtnActive]}
            onPress={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={16} color={activeFilterCount > 0 ? '#fff' : '#111'} />
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sort button */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => setSortOpen(true)}>
            <Text style={styles.controlBtnText} numberOfLines={1}>{currentSortLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Active filter chips */}
        {(activeFilterCount > 0 || searchQuery) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {!!searchQuery && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>"{searchQuery}"</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}><X size={12} color="#111" /></TouchableOpacity>
              </View>
            )}
            {selectedCat !== 'all' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{selectedCat}</Text>
                <TouchableOpacity onPress={() => setSelectedCat('all')}><X size={12} color="#111" /></TouchableOpacity>
              </View>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 20000) && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>₱{priceRange[0]}–₱{priceRange[1]}</Text>
                <TouchableOpacity onPress={() => setPriceRange([0, 20000])}><X size={12} color="#111" /></TouchableOpacity>
              </View>
            )}
            {selectedSizes.map(s => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>US {s}</Text>
                <TouchableOpacity onPress={() => toggleSize(s)}><X size={12} color="#111" /></TouchableOpacity>
              </View>
            ))}
            {inStockOnly && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>In Stock</Text>
                <TouchableOpacity onPress={() => setInStockOnly(false)}><X size={12} color="#111" /></TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── Product grid ── */}
      {loading ? (
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.grid}
        />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAll}>
            <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.grid}
        />
      )}

      {/* ── Sort modal ── */}
      <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={() => setSortOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSortOpen(false)}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Sort By</Text>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.sortOption, sort === o.value && styles.sortOptionActive]}
                onPress={() => { setSort(o.value); setSortOpen(false) }}
              >
                <Text style={[styles.sortOptionText, sort === o.value && styles.sortOptionTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Filter modal ── */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={[styles.bottomSheet, styles.filterSheet]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}>
                <X size={20} color="#111" />
              </TouchableOpacity>
            </View>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear all filters</Text>
              </TouchableOpacity>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category */}
              {!catParam && (
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Category</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.filterChip, selectedCat === c && styles.filterChipActive]}
                        onPress={() => setSelectedCat(c)}
                      >
                        <Text style={[styles.filterChipText, selectedCat === c && styles.filterChipTextActive]}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Price range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>
                  Price Range{' '}
                  <Text style={styles.filterLabelSub}>₱{priceRange[0]} – ₱{priceRange[1]}</Text>
                </Text>
                <Text style={styles.sliderSublabel}>Min</Text>
                <Slider
                  minimumValue={0} maximumValue={20000} step={500}
                  value={priceRange[0]}
                  onValueChange={v => { if (v < priceRange[1]) setPriceRange([v, priceRange[1]]) }}
                  minimumTrackTintColor="#111" maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#111"
                />
                <Text style={styles.sliderSublabel}>Max</Text>
                <Slider
                  minimumValue={0} maximumValue={20000} step={500}
                  value={priceRange[1]}
                  onValueChange={v => { if (v > priceRange[0]) setPriceRange([priceRange[0], v]) }}
                  minimumTrackTintColor="#111" maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#111"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderEdge}>₱0</Text>
                  <Text style={styles.sliderEdge}>₱20,000</Text>
                </View>
              </View>

              {/* Sizes */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Size (US)</Text>
                <View style={styles.sizeGrid}>
                  {ALL_SIZES.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sizeBtn, selectedSizes.includes(s) && styles.sizeBtnActive]}
                      onPress={() => toggleSize(s)}
                    >
                      <Text style={[styles.sizeBtnText, selectedSizes.includes(s) && styles.sizeBtnTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* In stock */}
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={styles.stockToggle}
                  onPress={() => setInStockOnly(s => !s)}
                >
                  <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                    {inStockOnly && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.stockLabel}>In Stock Only</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={styles.applyBtnText}>
                Show {filtered.length} Products
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Header
  header:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  titleRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  countText: { fontSize: 13, color: '#9ca3af' },

  // Search row
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  controlBtn: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  controlBtnActive:  { backgroundColor: '#111', borderColor: '#111' },
  controlBtnText:    { fontSize: 13, fontWeight: '600', color: '#111', maxWidth: 90 },
  badge:     { backgroundColor: '#fff', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#111' },

  // Active chips
  chipsScroll: { marginTop: 4 },
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50, marginRight: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#111' },
  clearBtn:     { paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#111', textDecorationLine: 'underline' },

  // Grid
  grid:    { paddingHorizontal: 12, paddingVertical: 16 },
  gridRow: { gap: 12, marginBottom: 12 },

  // Empty
  emptyState:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji:       { fontSize: 48, marginBottom: 12 },
  emptyTitle:       { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  emptySub:         { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  clearFiltersBtn:  { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 10, paddingHorizontal: 20 },
  clearFiltersBtnText: { fontSize: 14, fontWeight: '600', color: '#111' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  bottomSheet:  { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  filterSheet:  { maxHeight: '90%' },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: '#111' },

  // Sort options
  sortOption:         { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f3f4f6' },
  sortOptionActive:   { },
  sortOptionText:     { fontSize: 15, color: '#111' },
  sortOptionTextActive: { fontWeight: '700' },

  // Filter groups
  filterGroup:    { marginBottom: 24 },
  filterLabel:    { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterLabelSub: { fontWeight: '400', color: '#6b7280', textTransform: 'none', letterSpacing: 0 },
  filterChip:     { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 50, marginRight: 8, marginBottom: 8 },
  filterChipActive:     { backgroundColor: '#111', borderColor: '#111' },
  filterChipText:       { fontSize: 13, color: '#111' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },

  // Sliders
  sliderSublabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 8 },
  sliderLabels:   { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEdge:     { fontSize: 11, color: '#9ca3af' },

  // Sizes
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBtn:  { width: 52, paddingVertical: 10, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, alignItems: 'center' },
  sizeBtnActive:    { backgroundColor: '#111', borderColor: '#111' },
  sizeBtnText:      { fontSize: 13, color: '#111' },
  sizeBtnTextActive:{ color: '#fff', fontWeight: '700' },

  // Stock toggle
  stockToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox:    { width: 22, height: 22, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#111', borderColor: '#111' },
  checkmark:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  stockLabel:  { fontSize: 15, color: '#111' },

  // Apply button
  applyBtn:     { backgroundColor: '#111', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})