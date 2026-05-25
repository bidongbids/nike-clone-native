// Login.tsx → React Native
// - <form> → View + TouchableOpacity submit
// - <input type="email/password"> → TextInput with keyboardType / secureTextEntry
// - useNavigate → useNavigation
// - Link → navigation.navigate()
// - Auth.css → StyleSheet.create({})
// - SVG swoosh → react-native-svg
// - Split-screen auth-visual layout dropped (not practical on mobile)
// - spinner → ActivityIndicator

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Eye, EyeOff } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../lib/supabase'
import type { Role } from '../../lib/rbac'
import { useStore } from '../../store/useStore'
import type { RootStackParamList } from '../../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { setUser, addToast } = useStore()
  const navigation = useNavigation<Nav>()

  const handleSubmit = async () => {
    if (!email || !password) { setError('Email and password are required'); return }
    setError('')
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = (profile?.role as Role) ?? 'customer'
      setUser(data.user, userRole)
      addToast('Welcome back!', 'success')

      const isStaff = ['super_admin', 'manager', 'editor', 'viewer'].includes(userRole)
      navigation.replace(isStaff ? 'AdminStack' : 'MainTabs')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.logoWrap}>
          <Svg width={56} height={22} viewBox="0 0 60 24">
            <Path
              d="M6 18L42.5 4C44.5 3.2 46 3.5 46 5.5C46 7.5 43 10.5 40 12L6 18Z"
              fill="#111"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your Nike account</Text>

        {/* Error */}
        {!!error && (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        )}

        {/* Email */}
        <View style={styles.group}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#a3a3a3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View style={styles.group}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#a3a3a3"
              secureTextEntry={!showPw}
              autoComplete="current-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPw(s => !s)}
              accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw
                ? <EyeOff size={18} color="#9ca3af" />
                : <Eye    size={18} color="#9ca3af" />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Switch to Register */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.switchLink}>Join Us</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoWrap: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 6 },
  sub:   { fontSize: 15, color: '#6b7280', marginBottom: 28 },

  // Error alert
  alert: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  alertText: { fontSize: 14, color: '#dc2626' },

  // Form
  group: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: { fontSize: 12, color: '#6b7280' },
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#111',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchText: { fontSize: 14, color: '#6b7280' },
  switchLink: { fontSize: 14, fontWeight: '700', color: '#111' },
})