// components/Guards.tsx
import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ShieldOff, Lock } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { useStore } from '../store/useStore'
import { hasPermission, hasAnyPermission } from '../lib/rbac'
import type { Permission } from '../lib/rbac'

// ── RequireAuth ───────────────────────────────────────────────────────────────
// <Navigate> doesn't exist in RN — use useEffect + navigation.replace instead
interface RequireAuthProps {
  children: React.ReactNode
  redirectTo?: string
}
export function RequireAuth({ children, redirectTo = 'Login' }: RequireAuthProps) {
  const navigation = useNavigation<any>()
  const { user, authLoading } = useStore()

  useEffect(() => {
    if (!authLoading && !user) navigation.replace(redirectTo)
  }, [authLoading, user])

  if (authLoading) return <AuthLoadingScreen />
  if (!user) return null   // briefly shown before useEffect fires
  return <>{children}</>
}

// ── RequirePermission ─────────────────────────────────────────────────────────
interface RequirePermissionProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}
export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { role } = useStore()
  if (!hasPermission(role, permission)) {
    return fallback !== undefined ? <>{fallback}</> : <AccessDenied permission={permission} />
  }
  return <>{children}</>
}

// ── RequireAnyPermission ──────────────────────────────────────────────────────
interface RequireAnyPermissionProps {
  permissions: Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}
export function RequireAnyPermission({ permissions, children, fallback }: RequireAnyPermissionProps) {
  const { role } = useStore()
  if (!hasAnyPermission(role, permissions)) {
    return fallback !== undefined ? <>{fallback}</> : <AccessDenied />
  }
  return <>{children}</>
}

// ── RequireAdmin ──────────────────────────────────────────────────────────────
interface RequireAdminProps { children: React.ReactNode }
export function RequireAdmin({ children }: RequireAdminProps) {
  const navigation = useNavigation<any>()
  const { user, role, authLoading } = useStore()

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigation.replace('Login'); return }
    if (!hasPermission(role, 'admin:access')) { navigation.replace('AccessDenied') }
  }, [authLoading, user, role])

  if (authLoading) return <AuthLoadingScreen />
  if (!user || !hasPermission(role, 'admin:access')) return null
  return <>{children}</>
}

// ── Can ───────────────────────────────────────────────────────────────────────
interface CanProps {
  do: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}
export function Can({ do: permission, children, fallback = null }: CanProps) {
  const { role } = useStore()
  return hasPermission(role, permission) ? <>{children}</> : <>{fallback}</>
}

// ── Cannot ────────────────────────────────────────────────────────────────────
interface CannotProps {
  do: Permission
  children: React.ReactNode
}
export function Cannot({ do: permission, children }: CannotProps) {
  const { role } = useStore()
  return !hasPermission(role, permission) ? <>{children}</> : null
}

// ── AccessDenied ──────────────────────────────────────────────────────────────
interface AccessDeniedProps {
  permission?: Permission
  fullPage?: boolean
}
export function AccessDenied({ permission, fullPage = false }: AccessDeniedProps) {
  const navigation = useNavigation<any>()
  return (
    <View style={[styles.accessDenied, fullPage && styles.accessDeniedFull]}>
      <View style={styles.shieldWrap}>
        <ShieldOff size={40} color="#e5231b" />
      </View>
      <Text style={styles.accessTitle}>Access Denied</Text>
      <Text style={styles.accessBody}>
        You don't have permission to view this
        {permission ? (
          <Text> (requires <Text style={styles.permCode}>{permission}</Text>)</Text>
        ) : ''}
        . Contact your administrator to request access.
      </Text>
      {fullPage && (
        <TouchableOpacity
          style={styles.goStoreBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.goStoreBtnText}>Go to Store</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── ReadOnlyBadge ─────────────────────────────────────────────────────────────
export function ReadOnlyBadge() {
  return (
    <View style={styles.readOnlyBadge}>
      <Lock size={10} color="#92400e" />
      <Text style={styles.readOnlyText}>Read Only</Text>
    </View>
  )
}

// ── AuthLoadingScreen ─────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      {/* Nike swoosh — inline SVG via react-native-svg */}
      <Svg viewBox="0 0 60 24" width={60} height={24} style={{ marginBottom: 20 }}>
        <Path
          d="M6 18L42.5 4C44.5 3.2 46 3.5 46 5.5C46 7.5 43 10.5 40 12L6 18Z"
          fill="#111"
        />
      </Svg>
      <ActivityIndicator size="large" color="#111" />
    </View>
  )
}

const styles = StyleSheet.create({
  // AccessDenied
  accessDenied: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedFull: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  shieldWrap: {
    backgroundColor: '#fef2f2',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  accessTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111',
    textAlign: 'center',
  },
  accessBody: {
    fontSize: 14,
    color: '#737373',
    maxWidth: 300,
    lineHeight: 22,
    textAlign: 'center',
  },
  permCode: {
    backgroundColor: '#f5f5f5',
    fontFamily: 'monospace',  // note: Expo uses system monospace font
    fontSize: 13,
    color: '#111',
  },
  goStoreBtn: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#d4d4d4',
    borderRadius: 50,
  },
  goStoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },

  // ReadOnlyBadge
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  readOnlyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // AuthLoadingScreen
  loadingScreen: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
})