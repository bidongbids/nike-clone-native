// Navbar.tsx → React Native (Header component)
// Notes:
// - Web fixed navbar → SafeAreaView + Animated scroll shadow
// - React Router Link/useNavigate → useNavigation (React Navigation)
// - useLocation route-change effect → useFocusEffect
// - window.scrollY scroll listener → Animated.ScrollView scroll event passed from parent
//   ASSUMPTION: scrolled shadow is driven by an `isScrolled` prop passed from the screen
// - SVG swoosh → react-native-svg Path
// - Mobile hamburger drawer → Modal-based slide-in menu
// - Search bar → inline conditional render below header row
// - lucide-react → lucide-react-native (same API)
// - hasPermission / rbac import kept as-is (pure logic, no DOM deps)

import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { useStore } from '../store/useStore'
import { hasPermission } from '../lib/rbac'

// ASSUMPTION: adjust RootStackParamList to match your actual navigator types
type RootStackParamList = {
  Home: undefined
  Products: { cat?: string; q?: string }
  Wishlist: undefined
  Cart: undefined
  Orders: undefined
  Login: undefined
  Admin: undefined
}

interface NavLinkItem {
  label: string
  screen: keyof RootStackParamList
  params?: object
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Men',        screen: 'Products', params: { cat: 'men' } },
  { label: 'Women',      screen: 'Products', params: { cat: 'women' } },
  { label: 'Lifestyle',  screen: 'Products', params: { cat: 'lifestyle' } },
  { label: 'Basketball', screen: 'Products', params: { cat: 'basketball' } },
]

interface NavbarProps {
  isScrolled?: boolean  // pass true from screen's scroll handler to show shadow
}

export default function Navbar({ isScrolled = false }: NavbarProps) {
  const { user, role, logout, getCartCount, wishlistIds } = useStore()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQ, setSearchQ]         = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const cartCount = getCartCount()

  // Close menus on navigation (mimics useLocation effect)
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      setMenuOpen(false)
      setProfileOpen(false)
    })
    return unsubscribe
  }, [navigation])

  const handleSearch = () => {
    if (searchQ.trim()) {
      navigation.navigate('Products', { q: searchQ.trim() })
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, isScrolled && styles.safeAreaScrolled]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Main header row ── */}
      <View style={styles.inner}>

        {/* Logo */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Nike Home"
          style={styles.logoBtn}
        >
          <Svg width={60} height={24} viewBox="0 0 60 24">
            <Path
              d="M6 18L42.5 4C44.5 3.2 46 3.5 46 5.5C46 7.5 43 10.5 40 12L6 18Z"
              fill="#000"
            />
          </Svg>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action buttons */}
        <View style={styles.actions}>

          {/* Search */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setSearchOpen(s => !s)}
            accessibilityLabel="Search"
          >
            <Search size={20} color="#000" />
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Wishlist')}
            accessibilityLabel="Wishlist"
          >
            <Heart size={20} color="#000" />
            {wishlistIds.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlistIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Cart')}
            accessibilityLabel="Cart"
          >
            <ShoppingBag size={20} color="#000" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile / Sign In */}
          {user ? (
            <View>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setProfileOpen(s => !s)}
                accessibilityLabel="Profile menu"
              >
                <User size={20} color="#000" />
                <ChevronDown size={14} color="#000" />
              </TouchableOpacity>

              {/* Profile dropdown — rendered as Modal to escape stacking context */}
              <Modal
                transparent
                visible={profileOpen}
                animationType="fade"
                onRequestClose={() => setProfileOpen(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setProfileOpen(false)}
                >
                  <View style={styles.dropdown}>
                    <Text style={styles.dropdownName}>
                      {user.email?.split('@')[0]}
                    </Text>

                    {[
                      { label: 'My Orders', screen: 'Orders' as const },
                      { label: 'Wishlist',  screen: 'Wishlist' as const },
                    ].map(item => (
                      <TouchableOpacity
                        key={item.screen}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setProfileOpen(false)
                          navigation.navigate(item.screen)
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}

                    {hasPermission(role, 'admin:access') && (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setProfileOpen(false)
                          navigation.navigate('Admin')
                        }}
                      >
                        <Text style={[styles.dropdownItemText, styles.adminText]}>
                          Admin Panel
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProfileOpen(false)
                        logout()
                      }}
                    >
                      <Text style={[styles.dropdownItemText, styles.logoutText]}>
                        Sign Out
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}

          {/* Hamburger */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setMenuOpen(s => !s)}
            accessibilityLabel="Toggle menu"
          >
            {menuOpen ? <X size={22} color="#000" /> : <Menu size={22} color="#000" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      {searchOpen && (
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            autoFocus
            value={searchQ}
            onChangeText={setSearchQ}
            placeholder="Search for shoes, apparel..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={() => setSearchOpen(false)} accessibilityLabel="Close search">
            <X size={18} color="#000" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Mobile nav drawer ── */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.drawerMenu}>
            <FlatList
              data={NAV_LINKS}
              keyExtractor={item => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.drawerLink}
                  onPress={() => {
                    setMenuOpen(false)
                    navigation.navigate(item.screen, item.params as any)
                  }}
                >
                  <Text style={styles.drawerLinkText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const NAV_H = Platform.OS === 'ios' ? 60 : 56

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  safeAreaScrolled: {
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  inner: {
    height: NAV_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  logoBtn: {
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  actionBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#000',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  signInBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signInText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  // Dropdown (profile)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: NAV_H + (StatusBar.currentHeight ?? 0) + 8,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownName: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    fontWeight: '700',
    fontSize: 13,
    color: '#6b7280',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000',
  },
  adminText: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  logoutText: {
    color: '#ef4444',
  },

  // Mobile drawer
  drawerMenu: {
    position: 'absolute',
    top: NAV_H + (StatusBar.currentHeight ?? 0),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  drawerLink: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  drawerLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
})