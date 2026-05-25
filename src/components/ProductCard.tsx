// components/ProductCard.tsx
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Heart } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import type { Product } from '../types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigation = useNavigation<any>()
  const { toggleWishlist, isWishlisted, addToCart } = useStore()
  const wishlisted = isWishlisted(product.id)
  const price = product.sale_price ?? product.price

  return (
    <View style={styles.card}>
      {/* Image area */}
      <View style={styles.imageWrap}>
        <Pressable onPress={() => navigation.navigate('ProductDetail', { id: product.id })}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        </Pressable>

        {/* Badge */}
        {product.badge && (
          <View style={[styles.badge, product.badge === 'sale' ? styles.badgeSale : styles.badgeNew]}>
            <Text style={styles.badgeText}>{product.badge.toUpperCase()}</Text>
          </View>
        )}

        {/* Wishlist button */}
        <TouchableOpacity
          style={[styles.wishBtn, wishlisted && styles.wishBtnActive]}
          onPress={() => toggleWishlist(product)}
          hitSlop={8}
        >
          <Heart size={16} color={wishlisted ? '#e5231b' : '#111'} fill={wishlisted ? '#e5231b' : 'none'} />
        </TouchableOpacity>

        {/* Quick Add */}
        {product.stock > 0 && (
          <TouchableOpacity
            style={styles.quickAdd}
            onPress={() => addToCart(product, product.sizes[0])}
          >
            <Text style={styles.quickAddText}>Quick Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <Pressable
        style={styles.info}
        onPress={() => navigation.navigate('ProductDetail', { id: product.id })}
      >
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, product.sale_price ? styles.salePrice : null]}>
            ₱{price}
          </Text>
          {product.sale_price && (
            <Text style={styles.originalPrice}>₱{product.price}</Text>
          )}
        </View>

        {/* Color dots */}
        <View style={styles.colorsRow}>
          {product.colors.slice(0, 4).map((c, i) => (
            <View key={i} style={[styles.colorDot, { backgroundColor: c }]} />
          ))}
          {product.colors.length > 4 && (
            <Text style={styles.colorMore}>+{product.colors.length - 4}</Text>
          )}
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,                  // ← fills exactly half the row width
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  imageWrap: {
    aspectRatio: 1,           // ← square, sized relative to flex width
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeNew:  { backgroundColor: '#111' },
  badgeSale: { backgroundColor: '#e5231b' },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wishBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishBtnActive: {
    backgroundColor: '#fff0f0',
  },
  quickAdd: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#111',
    borderRadius: 50,
    paddingVertical: 7,
    alignItems: 'center',
  },
  quickAddText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  info: {
    padding: 10,
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  category: {
    fontSize: 11,
    color: '#737373',
    textTransform: 'capitalize',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  salePrice: {
    color: '#e5231b',
  },
  originalPrice: {
    fontSize: 11,
    color: '#a3a3a3',
    textDecorationLine: 'line-through',
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  colorMore: {
    fontSize: 10,
    color: '#737373',
  },
})
