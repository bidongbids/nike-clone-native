// Checkout.tsx → React Native
// - useNavigate → useNavigation
// - Link → TouchableOpacity + navigation.navigate
// - AddressForm: form/input/select → TextInput + Picker (label) + Switch (isDefault)
// - CSS grid 2-col → ScrollView single column; sidebar summary moved to top (above steps)
// - position: sticky sidebar → normal View above stepper
// - Step progress bar: flex row with View circles + dividers
// - Loader spin → ActivityIndicator
// - CSS vars → hardcoded values
// - React.ChangeEvent / e.preventDefault removed — RN event model used instead
// - `spinner` className → ActivityIndicator inline

import { useState, useEffect } from 'react'
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  TextInput, Switch, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { MapPin, Plus, Trash2, Check, ChevronRight } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import { useAddresses } from '../lib/hooks'
import { saveAddress, removeAddress, setDefaultAddress, placeOrder } from '../lib/api'
import type { DeliveryAddress } from '../types'
import type { RootStackParamList } from '../App'

type Nav  = NativeStackNavigationProp<RootStackParamList>
type Step = 'address' | 'payment' | 'confirm'
const STEPS: Step[]                        = ['address', 'payment', 'confirm']
const stepLabels: Record<Step, string>     = { address: 'Delivery', payment: 'Payment', confirm: 'Review' }

// ─────────────────────────────────────────────
// AddressForm
// ─────────────────────────────────────────────
function AddressForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { user } = useStore()
  const [form, setForm] = useState({
    label: 'Home', fullName: '', phone: '', line1: '', line2: '',
    city: '', province: '', zip: '', country: 'Philippines', isDefault: true,
  })
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)

  // Label cycles: Home → Office → Other → Home
  const LABELS = ['Home', 'Office', 'Other']
  const cycleLabel = () =>
    setForm(f => ({ ...f, label: LABELS[(LABELS.indexOf(f.label) + 1) % LABELS.length] }))

  const set = (k: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name required'
    if (!form.phone.trim())    e.phone    = 'Phone required'
    if (!form.line1.trim())    e.line1    = 'Address required'
    if (!form.city.trim())     e.city     = 'City required'
    if (!form.province.trim()) e.province = 'Province required'
    if (!form.zip.trim())      e.zip      = 'ZIP required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !user) return
    setSaving(true)
    try { await saveAddress(user.id, form); onSave() }
    catch (err: any) { setErrors({ fullName: err.message }) }
    finally { setSaving(false) }
  }

  const fields: { k: keyof typeof form; label: string; ph: string }[] = [
    { k: 'fullName', label: 'Full Name *',       ph: 'Juan dela Cruz'      },
    { k: 'phone',    label: 'Phone *',            ph: '+63 917 000 0000'    },
    { k: 'line1',    label: 'Address Line 1 *',   ph: '123 Rizal Street'    },
    { k: 'line2',    label: 'Address Line 2',      ph: 'Apt, unit (optional)'},
    { k: 'city',     label: 'City *',              ph: 'Cagayan de Oro'      },
    { k: 'province', label: 'Province *',          ph: 'Misamis Oriental'    },
    { k: 'zip',      label: 'ZIP *',               ph: '9000'                },
    { k: 'country',  label: 'Country',             ph: ''                    },
  ]

  return (
    <View style={af.wrap}>
      <Text style={af.title}>New Delivery Address</Text>
      <Text style={af.subtitle}>This will be saved for next time.</Text>

      {/* Label picker (tap to cycle) */}
      <Text style={af.label}>Label</Text>
      <TouchableOpacity style={af.cyclePill} onPress={cycleLabel}>
        <Text style={af.cyclePillText}>{form.label} ▾</Text>
      </TouchableOpacity>

      {fields.map(({ k, label, ph }) => (
        <View key={k} style={af.fieldWrap}>
          <Text style={af.label}>{label}</Text>
          <TextInput
            style={[af.input, errors[k] ? af.inputError : null]}
            value={String(form[k])}
            onChangeText={set(k)}
            placeholder={ph}
            placeholderTextColor="#9ca3af"
          />
          {errors[k] && <Text style={af.errorText}>{errors[k]}</Text>}
        </View>
      ))}

      {/* Default toggle */}
      <View style={af.toggleRow}>
        <Text style={af.toggleLabel}>Set as default address</Text>
        <Switch
          value={form.isDefault}
          onValueChange={v => setForm(f => ({ ...f, isDefault: v }))}
          trackColor={{ true: '#111' }}
        />
      </View>

      <View style={af.btnRow}>
        <TouchableOpacity style={af.btnCancel} onPress={onCancel}>
          <Text style={af.btnCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[af.btnSave, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={af.btnSaveText}>Save Address</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const af = StyleSheet.create({
  wrap:         { backgroundColor: '#f9fafb', borderRadius: 14, padding: 20, marginBottom: 20 },
  title:        { fontWeight: '700', fontSize: 16, marginBottom: 4, color: '#111' },
  subtitle:     { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label:        { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  fieldWrap:    { marginBottom: 12 },
  input:        { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fff' },
  inputError:   { borderColor: '#ef4444' },
  errorText:    { fontSize: 11, color: '#ef4444', marginTop: 3 },
  cyclePill:    { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, backgroundColor: '#fff' },
  cyclePillText:{ fontSize: 14, color: '#111' },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  toggleLabel:  { fontSize: 14, color: '#374151', flex: 1 },
  btnRow:       { flexDirection: 'row', gap: 10 },
  btnCancel:    { flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 12, alignItems: 'center' },
  btnCancelText:{ fontSize: 14, fontWeight: '600', color: '#111' },
  btnSave:      { flex: 1, backgroundColor: '#111', borderRadius: 50, paddingVertical: 12, alignItems: 'center' },
  btnSaveText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
})

// ─────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────
export default function Checkout() {
  const navigation                                  = useNavigation<Nav>()
  const { user, cart, getCartTotal, clearCart, addToast } = useStore()
  const { data: addresses, loading: addrLoading, refetch: refetchAddr } = useAddresses(user?.id)

  const [step, setStep]             = useState<Step>('address')
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [placing, setPlacing]       = useState(false)

  const total      = getCartTotal()
  const shipping   = total >= 75 ? 0 : 9.99
  const tax        = total * 0.08
  const orderTotal = total + shipping + tax

  useEffect(() => {
    if (addresses && !selectedAddr) {
      const def = addresses.find(a => a.isDefault)
      if (def) {
        setSelectedAddr(def.id)
        addToast(`Using saved address: ${def.label}`, 'info')
      } else if (addresses[0]) {
        setSelectedAddr(addresses[0].id)
      } else {
        setShowForm(true)
      }
    }
  }, [addresses, selectedAddr, addToast])

  // ── Guards ──
  if (!user) return (
    <View style={s.centerWrap}>
      <Text style={s.guardTitle}>Please sign in to checkout</Text>
      <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.shopBtnText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  )
  if (cart.length === 0) return (
    <View style={s.centerWrap}>
      <Text style={s.guardTitle}>Your bag is empty</Text>
      <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}>
        <Text style={s.shopBtnText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  )

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { addToast('Please select a delivery address', 'error'); return }
    setPlacing(true)
    try {
      const orderId = await placeOrder({
        userId: user.id, addressId: selectedAddr, cart, paymentMethod: 'cod',
        subtotal: total, shipping, tax, total: orderTotal,
      })
      clearCart()
      addToast(`🎉 Order ${orderId} placed successfully!`, 'success')
      navigation.navigate('MainTabs', { screen: 'Orders' })
    } catch (err: any) {
      addToast(err.message || 'Failed to place order', 'error')
    } finally { setPlacing(false) }
  }

  const selectedAddress = (addresses ?? []).find(a => a.id === selectedAddr)

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <View style={s.inner}>

        {/* ── Mini order summary (always visible at top) ── */}
        <View style={s.summary}>
          <Text style={s.summaryTitle}>Order Summary</Text>
          {cart.slice(0, 3).map(item => (
            <View key={item.key} style={s.summaryItem}>
              <Image source={{ uri: item.product.image }} style={s.summaryThumb} resizeMode="cover" />
              <View style={s.summaryItemInfo}>
                <Text style={s.summaryItemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={s.summaryItemMeta}>×{item.qty} · US {item.size}</Text>
              </View>
              <Text style={s.summaryItemPrice}>
                ₱{((item.product.sale_price ?? item.product.price) * item.qty).toFixed(2)}
              </Text>
            </View>
          ))}
          {cart.length > 3 && <Text style={s.moreItems}>+ {cart.length - 3} more</Text>}
          <View style={s.summaryDivider} />
          {[
            { label: 'Subtotal', value: `₱${total.toFixed(2)}`, highlight: false },
            { label: 'Shipping', value: shipping === 0 ? 'Free' : `₱${shipping.toFixed(2)}`, highlight: shipping === 0 },
            { label: 'Tax (8%)', value: `₱${tax.toFixed(2)}`, highlight: false },
          ].map(row => (
            <View key={row.label} style={s.summaryRow}>
              <Text style={s.summaryRowLabel}>{row.label}</Text>
              <Text style={[s.summaryRowValue, row.highlight && { color: '#22c55e' }]}>{row.value}</Text>
            </View>
          ))}
          <View style={s.summaryTotalRow}>
            <Text style={s.summaryTotalLabel}>Total</Text>
            <Text style={s.summaryTotalValue}>₱{orderTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Step progress ── */}
        <View style={s.stepper}>
          {STEPS.map((st, i) => {
            const done    = STEPS.indexOf(st) < STEPS.indexOf(step)
            const current = st === step
            return (
              <View key={st} style={s.stepperItem}>
                <TouchableOpacity
                  onPress={() => done && setStep(st)}
                  style={s.stepperCol}
                >
                  <View style={[s.stepCircle, current && s.stepCircleCurrent, done && s.stepCircleDone]}>
                    {done
                      ? <Check size={14} color="#fff" strokeWidth={3} />
                      : <Text style={[s.stepNum, (current || done) && { color: '#fff' }]}>{i + 1}</Text>}
                  </View>
                  <Text style={[s.stepLabel, current && { color: '#111' }]}>{stepLabels[st]}</Text>
                </TouchableOpacity>
                {i < STEPS.length - 1 && (
                  <View style={[s.stepLine, done && s.stepLineDone]} />
                )}
              </View>
            )
          })}
        </View>

        {/* ══ STEP 1 — Delivery ══ */}
        {step === 'address' && (
          <View>
            <Text style={s.stepTitle}>Delivery Address</Text>
            {selectedAddress && !showForm && (
              <View style={s.preSelectedBanner}>
                <Check size={14} color="#16a34a" />
                <Text style={s.preSelectedText}>We've pre-selected your default address</Text>
              </View>
            )}

            {showForm && (
              <AddressForm
                onSave={() => { setShowForm(false); refetchAddr() }}
                onCancel={() => setShowForm(false)}
              />
            )}

            {addrLoading ? (
              <View style={s.loaderWrap}>
                <ActivityIndicator size="large" color="#d1d5db" />
              </View>
            ) : (addresses ?? []).map((addr: DeliveryAddress) => (
              <TouchableOpacity
                key={addr.id}
                onPress={() => setSelectedAddr(addr.id)}
                style={[s.addrCard, selectedAddr === addr.id && s.addrCardSelected]}
              >
                <View style={s.addrCardLeft}>
                  {selectedAddr === addr.id
                    ? <Check size={18} strokeWidth={3} color="#111" />
                    : <MapPin size={18} color="#9ca3af" />}
                  <View style={s.addrInfo}>
                    <View style={s.addrLabelRow}>
                      <Text style={s.addrLabel}>{addr.label}</Text>
                      {addr.isDefault && (
                        <View style={s.defaultBadge}>
                          <Text style={s.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.addrText}>
                      {addr.fullName}{'\n'}
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}{'\n'}
                      {addr.city}, {addr.province} {addr.zip}{'\n'}
                      {addr.country} · {addr.phone}
                    </Text>
                  </View>
                </View>
                <View style={s.addrActions}>
                  {!addr.isDefault && (
                    <TouchableOpacity
                      style={s.setDefaultBtn}
                      onPress={async () => { await setDefaultAddress(user.id, addr.id); refetchAddr() }}
                    >
                      <Text style={s.setDefaultBtnText}>Set default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={async () => {
                      await removeAddress(addr.id)
                      if (selectedAddr === addr.id) setSelectedAddr(null)
                      refetchAddr()
                    }}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {!showForm && (
              <TouchableOpacity style={s.addAddrBtn} onPress={() => setShowForm(true)}>
                <Plus size={15} color="#111" />
                <Text style={s.addAddrBtnText}>Add New Address</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.continueBtn, !selectedAddr && s.continueBtnDisabled]}
              disabled={!selectedAddr}
              onPress={() => setStep('payment')}
            >
              <Text style={s.continueBtnText}>Continue to Payment</Text>
              <ChevronRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ══ STEP 2 — Payment ══ */}
        {step === 'payment' && (
          <View>
            <Text style={s.stepTitle}>Payment Method</Text>
            <Text style={s.stepSubtitle}>Choose how you'd like to pay for your order.</Text>

            <View style={s.paymentOption}>
              <View style={s.radioSelected} />
              <Text style={s.paymentEmoji}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.paymentOptionTitle}>Cash on Delivery</Text>
                <Text style={s.paymentOptionSub}>Pay in cash when your order arrives</Text>
              </View>
            </View>

            <View style={s.codBanner}>
              <Text style={s.codBannerText}>
                💵 <Text style={{ fontWeight: '700' }}>Pay in cash when your order is delivered.{'\n'}</Text>
                <Text style={{ fontSize: 13 }}>No extra charges. Please prepare the exact amount or small bills.</Text>
              </Text>
            </View>

            <View style={s.navRow}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('address')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.continueBtn, { flex: 1 }]} onPress={() => setStep('confirm')}>
                <Text style={s.continueBtnText}>Review Order</Text>
                <ChevronRight size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══ STEP 3 — Review ══ */}
        {step === 'confirm' && (
          <View>
            <Text style={s.stepTitle}>Review Your Order</Text>

            {/* Items */}
            <View style={s.reviewCard}>
              <View style={s.reviewCardHeader}>
                <Text style={s.reviewCardHeaderText}>Items ({cart.length})</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}>
                  <Text style={s.reviewEditLink}>Edit bag</Text>
                </TouchableOpacity>
              </View>
              {cart.map(item => (
                <View key={item.key} style={s.reviewItem}>
                  <Image source={{ uri: item.product.image }} style={s.reviewThumb} resizeMode="cover" />
                  <View style={s.reviewItemInfo}>
                    <Text style={s.reviewItemName}>{item.product.name}</Text>
                    <Text style={s.reviewItemMeta}>US {item.size} · Qty {item.qty}</Text>
                  </View>
                  <Text style={s.reviewItemPrice}>
                    ₱{((item.product.sale_price ?? item.product.price) * item.qty).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Address */}
            {selectedAddress && (
              <View style={s.reviewCard}>
                <View style={s.reviewCardHeader}>
                  <Text style={s.reviewCardHeaderText}>Deliver to</Text>
                  <TouchableOpacity onPress={() => setStep('address')}>
                    <Text style={s.reviewEditLink}>Change</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.deliverToText}>
                  {selectedAddress.fullName} · {selectedAddress.phone}{'\n'}
                  {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.zip}
                </Text>
              </View>
            )}

            <View style={s.navRow}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('payment')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.continueBtn, { flex: 1 }, placing && s.continueBtnDisabled]}
                disabled={placing}
                onPress={handlePlaceOrder}
              >
                {placing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.continueBtnText}>Place Order · ₱{orderTotal.toFixed(2)}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 16, paddingBottom: 60 },

  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  guardTitle:  { fontSize: 22, fontWeight: '700', color: '#111' },
  shopBtn:     { backgroundColor: '#111', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnText: { color: '#fff', fontWeight: '700' },

  // Summary
  summary:          { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  summaryTitle:     { fontWeight: '700', fontSize: 16, marginBottom: 14, color: '#111' },
  summaryItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  summaryThumb:     { width: 44, height: 44, borderRadius: 6, backgroundColor: '#f3f4f6' },
  summaryItemInfo:  { flex: 1, minWidth: 0 },
  summaryItemName:  { fontSize: 13, fontWeight: '600', color: '#111' },
  summaryItemMeta:  { fontSize: 11, color: '#6b7280' },
  summaryItemPrice: { fontSize: 13, fontWeight: '700', color: '#111' },
  moreItems:        { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  summaryDivider:   { borderTopWidth: 1, borderTopColor: '#f3f4f6', marginVertical: 12 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryRowLabel:  { fontSize: 14, color: '#4b5563' },
  summaryRowValue:  { fontSize: 14, color: '#111' },
  summaryTotalRow:  { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 4 },
  summaryTotalLabel:{ fontSize: 17, fontWeight: '700', color: '#111' },
  summaryTotalValue:{ fontSize: 17, fontWeight: '700', color: '#111' },

  // Stepper
  stepper:          { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepperItem:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepperCol:       { alignItems: 'center', gap: 4 },
  stepCircle:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepCircleCurrent:{ backgroundColor: '#111' },
  stepCircleDone:   { backgroundColor: '#22c55e' },
  stepNum:          { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  stepLabel:        { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  stepLine:         { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 4, marginBottom: 20 },
  stepLineDone:     { backgroundColor: '#22c55e' },

  // Step content
  stepTitle:    { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  preSelectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  preSelectedText:   { fontSize: 13, color: '#16a34a' },
  loaderWrap:        { alignItems: 'center', padding: 40 },

  // Address card
  addrCard:         { padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addrCardSelected: { borderColor: '#111' },
  addrCardLeft:     { flexDirection: 'row', gap: 12, flex: 1 },
  addrInfo:         { flex: 1 },
  addrLabelRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addrLabel:        { fontSize: 14, fontWeight: '700', color: '#111' },
  defaultBadge:     { backgroundColor: '#111', borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  addrText:         { fontSize: 13, color: '#374151', lineHeight: 20 },
  addrActions:      { gap: 8, alignItems: 'flex-end' },
  setDefaultBtn:    { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  setDefaultBtnText:{ fontSize: 11, color: '#6b7280' },

  addAddrBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, marginTop: 4 },
  addAddrBtnText: { fontSize: 14, fontWeight: '600', color: '#111' },

  // Buttons
  continueBtn:         { backgroundColor: '#111', borderRadius: 50, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  continueBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  continueBtnDisabled: { opacity: 0.5 },
  navRow:              { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn:             { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  backBtnText:         { fontSize: 14, fontWeight: '600', color: '#111' },

  // Payment
  paymentOption:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#111', marginBottom: 14 },
  radioSelected:      { width: 18, height: 18, borderRadius: 9, backgroundColor: '#111', borderWidth: 2, borderColor: '#111' },
  paymentEmoji:       { fontSize: 24 },
  paymentOptionTitle: { fontWeight: '700', fontSize: 15, color: '#111' },
  paymentOptionSub:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
  codBanner:          { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 24 },
  codBannerText:      { fontSize: 14, color: '#15803d', lineHeight: 22 },

  // Review
  reviewCard:         { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', marginBottom: 14 },
  reviewCardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  reviewCardHeaderText:{ fontWeight: '700', fontSize: 14, color: '#111' },
  reviewEditLink:     { fontSize: 13, color: '#6b7280', textDecorationLine: 'underline' },
  reviewItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  reviewThumb:        { width: 52, height: 52, borderRadius: 8, backgroundColor: '#f3f4f6' },
  reviewItemInfo:     { flex: 1 },
  reviewItemName:     { fontWeight: '700', fontSize: 13, color: '#111' },
  reviewItemMeta:     { fontSize: 12, color: '#6b7280' },
  reviewItemPrice:    { fontWeight: '700', fontSize: 14, color: '#111' },
  deliverToText:      { fontSize: 14, color: '#4b5563', lineHeight: 24, padding: 16 },
})