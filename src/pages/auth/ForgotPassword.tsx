// ForgotPassword.tsx → React Native
// - window.location.origin → hardcoded deep link scheme (ASSUMPTION: update
//   'nikeapp://reset-password' to match your actual Expo deep link scheme)
// - <form> → View + TouchableOpacity submit
// - Sent state → inline conditional View (replaces ternary JSX blocks)
// - Auth.css dropped → StyleSheet.create({})
// - Split-screen visual not present in this screen — nothing to remove

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CheckCircle } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../lib/supabase'
import type { RootStackParamList } from '../../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

// ASSUMPTION: replace with your Expo deep link / universal link for password reset
const RESET_REDIRECT = 'nikeapp://reset-password'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const navigation = useNavigation<Nav>()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_REDIRECT,
      })
      if (err) throw err
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>

        {/* Logo */}
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          accessibilityLabel="Nike Home"
          style={styles.logoWrap}
        >
          <Svg width={56} height={22} viewBox="0 0 60 24">
            <Path
              d="M6 18L42.5 4C44.5 3.2 46 3.5 46 5.5C46 7.5 43 10.5 40 12L6 18Z"
              fill="#111"
            />
          </Svg>
        </TouchableOpacity>

        {sent ? (
          /* ── Success state ── */
          <View style={styles.successWrap}>
            <CheckCircle size={56} color="#16a34a" />
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successSub}>
              We've sent a password reset link to{' '}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Form state ── */
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>

            {!!error && (
              <View style={styles.alert}>
                <Text style={styles.alertText}>{error}</Text>
              </View>
            )}

            <View style={styles.group}>
              <Text style={styles.label}>Email Address</Text>
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

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Send Reset Link</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchWrap}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.switchLink}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  card: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoWrap: { marginBottom: 40 },

  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 6 },
  sub:   { fontSize: 15, color: '#6b7280', marginBottom: 28 },

  alert:     { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 14, marginBottom: 20 },
  alertText: { fontSize: 14, color: '#dc2626' },

  group: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#111', backgroundColor: '#fff',
  },

  submitBtn:         { backgroundColor: '#111', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText:        { color: '#fff', fontSize: 16, fontWeight: '700' },

  switchWrap: { alignItems: 'center' },
  switchLink: { fontSize: 14, color: '#6b7280' },

  // Success
  successWrap:  { alignItems: 'center', paddingVertical: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#111', marginTop: 20, marginBottom: 10 },
  successSub:   { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  successEmail: { fontWeight: '700', color: '#111' },
  backBtn:      { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 },
  backBtnText:  { fontSize: 14, fontWeight: '600', color: '#111' },
})