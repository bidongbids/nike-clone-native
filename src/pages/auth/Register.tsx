// Register.tsx → React Native
// - <form> → View + TouchableOpacity submit
// - setField onChange helper → direct onChangeText per field
// - PasswordStrength bars → View-based strength meter
// - position: absolute eye/check icons → absolute inside View wrapper
// - <a href="#"> privacy links → Text onPress (no-op placeholders)
// - Auth.css dropped → StyleSheet.create({})
// - Split-screen visual removed
// - spinner → ActivityIndicator

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../store/useStore'
import type { RootStackParamList } from '../../App'

type Nav = NativeStackNavigationProp<RootStackParamList>

interface FormState { name: string; email: string; password: string; confirm: string }
interface FieldErrors { name?: string; email?: string; password?: string; confirm?: string }

// ── Password strength meter ──────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters',     ok: password.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Contains number',           ok: /\d/.test(password) },
    { label: 'Contains special character',ok: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const barColor = ['#f04048', '#f04048', '#f59e0b', '#22c55e', '#22c55e'][score]
  const label    = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]

  if (!password) return null
  return (
    <View style={pw.wrap}>
      {/* Bars */}
      <View style={pw.bars}>
        {[1,2,3,4].map(i => (
          <View
            key={i}
            style={[pw.bar, { backgroundColor: i <= score ? barColor : '#e5e7eb' }]}
          />
        ))}
        <Text style={[pw.scoreLabel, { color: barColor }]}>{label}</Text>
      </View>
      {/* Checklist */}
      {checks.map(c => (
        <View key={c.label} style={pw.checkRow}>
          {c.ok
            ? <CheckCircle2 size={12} color="#22c55e" />
            : <XCircle      size={12} color="#d1d5db" />
          }
          <Text style={[pw.checkText, { color: c.ok ? '#22c55e' : '#9ca3af' }]}>
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

const pw = StyleSheet.create({
  wrap:       { marginTop: 8 },
  bars:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  bar:        { flex: 1, height: 4, borderRadius: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  checkRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  checkText:  { fontSize: 11 },
})

// ── Register screen ──────────────────────────────────────────────────────────

export default function Register() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]           = useState<FieldErrors>({})
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [serverError, setServerError] = useState('')

  const { addToast } = useStore()
  const navigation   = useNavigation<Nav>()

  const setField = (k: keyof FormState) => (val: string) =>
    setForm(f => ({ ...f, [k]: val }))

  const validate = (): boolean => {
    const e: FieldErrors = {}
    if (!form.name.trim())  e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password)              e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.confirm)                 e.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      })
      if (err) throw err
      addToast('Account created! Check your email to verify.', 'success')
      navigation.navigate('Login')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm

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

        <Text style={styles.title}>Join Nike</Text>
        <Text style={styles.sub}>Create your account today</Text>

        {/* Server error */}
        {!!serverError && (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{serverError}</Text>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.group}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={form.name}
            onChangeText={setField('name')}
            placeholder="Juan dela Cruz"
            placeholderTextColor="#a3a3a3"
            autoComplete="name"
          />
          {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
        </View>

        {/* Email */}
        <View style={styles.group}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={form.email}
            onChangeText={setField('email')}
            placeholder="you@example.com"
            placeholderTextColor="#a3a3a3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.group}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
              value={form.password}
              onChangeText={setField('password')}
              placeholder="Min. 8 characters"
              placeholderTextColor="#a3a3a3"
              secureTextEntry={!showPw}
              autoComplete="new-password"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(s => !s)}>
              {showPw ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          <PasswordStrength password={form.password} />
        </View>

        {/* Confirm Password */}
        <View style={styles.group}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.confirm ? styles.inputError : null]}
              value={form.confirm}
              onChangeText={setField('confirm')}
              placeholder="Repeat your password"
              placeholderTextColor="#a3a3a3"
              secureTextEntry={!showConfirm}
              autoComplete="new-password"
            />
            {/* Eye toggle sits left of the match indicator */}
            <TouchableOpacity style={[styles.eyeBtn, { right: 40 }]} onPress={() => setShowConfirm(s => !s)}>
              {showConfirm ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </TouchableOpacity>
            {/* Match indicator */}
            {form.confirm.length > 0 && (
              <View style={styles.matchIcon}>
                {passwordsMatch
                  ? <CheckCircle2 size={18} color="#22c55e" />
                  : <XCircle      size={18} color="#ef4444" />
                }
              </View>
            )}
          </View>
          {errors.confirm && <Text style={styles.fieldError}>{errors.confirm}</Text>}
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By creating an account you agree to Nike's{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Terms of Use</Text>.
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Create Account</Text>
          }
        </TouchableOpacity>

        {/* Switch to Login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already a member? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  logoWrap: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 6 },
  sub:   { fontSize: 15, color: '#6b7280', marginBottom: 28 },

  alert:     { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 14, marginBottom: 20 },
  alertText: { fontSize: 14, color: '#dc2626' },

  group:      { marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#111', backgroundColor: '#fff',
  },
  inputError:    { borderColor: '#ef4444' },
  fieldError:    { fontSize: 12, color: '#ef4444', marginTop: 4 },
  passwordWrap:  { position: 'relative' },
  passwordInput: { paddingRight: 80 },  // room for both icons
  eyeBtn:        { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  matchIcon:     { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

  legal:     { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 24 },
  legalLink: { textDecorationLine: 'underline', color: '#6b7280' },

  submitBtn:         { backgroundColor: '#111', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText:        { color: '#fff', fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchText: { fontSize: 14, color: '#6b7280' },
  switchLink: { fontSize: 14, fontWeight: '700', color: '#111' },
})