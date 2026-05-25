import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home as HomeIcon, Search, ShoppingBag, Heart, ClipboardList } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from './src/lib/supabase'
import { useStore } from './src/store/useStore'
import type { Role } from './src/lib/rbac'
import { hasPermission } from './src/lib/rbac'

import Toast     from './src/components/Toast'
import CartModal from './src/components/CartModal'

import Home          from './src/pages/Home'
import Products      from './src/pages/Products'
import ProductDetail from './src/pages/ProductDetail'
import Cart          from './src/pages/Cart'
import Checkout      from './src/pages/Checkout'
import Wishlist      from './src/pages/Wishlist'
import Orders        from './src/pages/Orders'

import Login          from './src/pages/auth/Login'
import Register       from './src/pages/auth/Register'
import ForgotPassword from './src/pages/auth/ForgotPassword'

// ── Admin stubs (replace with real screens when ready) ──
function AdminScreen({ name }: { name: string }) {
  return <View style={s.stub}><Text>{name}</Text></View>
}
const Dashboard      = () => <AdminScreen name="Dashboard" />
const AdminProducts  = () => <AdminScreen name="Admin Products" />
const AdminOrders    = () => <AdminScreen name="Admin Orders" />
const AdminUsers     = () => <AdminScreen name="Admin Users" />
const AdminAnalytics = () => <AdminScreen name="Admin Analytics" />
const AdminRoles     = () => <AdminScreen name="Admin Roles" />

// ── Navigator types ──────────────────────────────────────

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  MainTabs: { screen?: string; params?: object } | undefined
  ProductDetail: { id: number }
  Checkout: undefined
  AdminStack: undefined
}

export type MainTabParamList = {
  Home: undefined
  Products: { cat?: string; q?: string } | undefined
  Cart: undefined
  Wishlist: undefined
  Orders: undefined
}

export type AdminStackParamList = {
  Dashboard: undefined
  AdminProducts: undefined
  AdminOrders: undefined
  AdminUsers: undefined
  AdminAnalytics: undefined
  AdminRoles: undefined
}

// ── Role cache ───────────────────────────────────────────

const ROLE_CACHE_KEY = 'nike-role-cache'

async function getCachedRole(userId: string): Promise<Role | null> {
  try {
    const cached = await AsyncStorage.getItem(ROLE_CACHE_KEY)
    if (!cached) return null
    const { id, role, ts } = JSON.parse(cached) as { id: string; role: Role; ts: number }
    if (id === userId && Date.now() - ts < 3_600_000) return role
    return null
  } catch { return null }
}

async function setCachedRole(userId: string, role: Role) {
  try {
    await AsyncStorage.setItem(
      ROLE_CACHE_KEY,
      JSON.stringify({ id: userId, role, ts: Date.now() })
    )
  } catch { /* ignore */ }
}

// ── Navigators ───────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>()
const Tab       = createBottomTabNavigator<MainTabParamList>()
const AdminNav  = createNativeStackNavigator<AdminStackParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tab.Screen name="Home"     component={Home}
        options={{ tabBarIcon: ({ color }) => <HomeIcon      size={22} color={color} /> }} />
      <Tab.Screen name="Products" component={Products}
        options={{ tabBarIcon: ({ color }) => <Search        size={22} color={color} /> }} />
      <Tab.Screen name="Cart"     component={Cart}
        options={{ tabBarIcon: ({ color }) => <ShoppingBag   size={22} color={color} /> }} />
      <Tab.Screen name="Wishlist" component={Wishlist}
        options={{ tabBarIcon: ({ color }) => <Heart         size={22} color={color} /> }} />
      <Tab.Screen name="Orders"   component={Orders}
        options={{ tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} /> }} />
    </Tab.Navigator>
  )
}

function AdminNavigator() {
  return (
    <AdminNav.Navigator screenOptions={{ headerShown: true }}>
      <AdminNav.Screen name="Dashboard"      component={Dashboard} />
      <AdminNav.Screen name="AdminProducts"  component={AdminProducts} />
      <AdminNav.Screen name="AdminOrders"    component={AdminOrders} />
      <AdminNav.Screen name="AdminUsers"     component={AdminUsers} />
      <AdminNav.Screen name="AdminAnalytics" component={AdminAnalytics} />
      <AdminNav.Screen name="AdminRoles"     component={AdminRoles} />
    </AdminNav.Navigator>
  )
}

// ── Root ─────────────────────────────────────────────────

export default function App() {
  const { setUser, setAuthLoading, role } = useStore()

  useEffect(() => {
    const resolveUserAndRole = async (session: any) => {
      if (!session?.user) {
        setUser(null, 'customer' as Role)
        return
      }

      const cachedRole = await getCachedRole(session.user.id)
      if (cachedRole) {
        setUser(session.user, cachedRole)
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }: { data: { role: string } | null }) => {
            const freshRole = (data?.role as Role) ?? ('customer' as Role)
            if (freshRole !== cachedRole) {
              setCachedRole(session.user.id, freshRole)
              setUser(session.user, freshRole)
            }
          })
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      const resolvedRole = (data?.role as Role) ?? ('customer' as Role)
      await setCachedRole(session.user.id, resolvedRole)
      setUser(session.user, resolvedRole)
    }

    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      resolveUserAndRole(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (event === 'SIGNED_OUT') await AsyncStorage.removeItem(ROLE_CACHE_KEY)
        resolveUserAndRole(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setAuthLoading])

  return (
    <View style={s.root}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login"          component={Login} />
          <RootStack.Screen name="Register"       component={Register} />
          <RootStack.Screen name="ForgotPassword" component={ForgotPassword} />
          <RootStack.Screen name="MainTabs"       component={MainTabs} />
          <RootStack.Screen name="ProductDetail"  component={ProductDetail}
            options={{ headerShown: true, title: '' }} />
          <RootStack.Screen name="Checkout"       component={Checkout}
            options={{ headerShown: true, title: 'Checkout' }} />
          {hasPermission(role, 'admin:access') && (
            <RootStack.Screen name="AdminStack" component={AdminNavigator} />
          )}
        </RootStack.Navigator>
        <CartModal />
        <Toast />
      </NavigationContainer>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  stub: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})