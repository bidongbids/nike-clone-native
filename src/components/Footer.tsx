// Footer.tsx → React Native
// - <footer> → View with dark background
// - <details>/<summary> (accordion) → manual open/close with useState per item
// - modal-overlay divs → Modal + ScrollView
// - onMouseOver/onMouseOut hover → removed (no hover on mobile)
// - SVG swoosh → react-native-svg
// - <a href="mailto:..."> → Linking.openURL()
// - lucide-react → lucide-react-native

import { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Linking,
} from 'react-native'
import { X } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'

type ModalType = 'help' | 'about' | null

const HELP_CONTENT = [
  { q: 'How do I track my order?',
    a: 'Sign in to your account and go to "Orders" in the user menu. You\'ll see the status of every order: Processing, Shipped, Delivered, or Cancelled.' },
  { q: 'What payment methods do you accept?',
    a: 'Currently we only accept Cash on Delivery (COD). Pay in cash when your order arrives — no extra fees, no upfront charges.' },
  { q: 'How long does delivery take?',
    a: 'Orders are typically delivered within 3–7 business days within the Philippines, depending on your location. You\'ll receive updates as the status changes.' },
  { q: 'Can I return or exchange a product?',
    a: 'Yes — you have 30 days from delivery to return unworn shoes in original packaging. Contact us to start a return.' },
  { q: 'How do I cancel an order?',
    a: 'If your order is still in "Processing" status, you can request cancellation by contacting support. Once shipped, cancellation is no longer available — use the return process instead.' },
  { q: 'Do you offer free shipping?',
    a: 'Yes — free shipping on orders over ₱75. Below that, a standard ₱9.99 shipping fee applies.' },
  { q: 'How do I save a delivery address?',
    a: 'During checkout, fill in the address form and check "Set as default address." It will be auto-selected on your next order.' },
  { q: 'Are my reviews public?',
    a: 'Yes. Product reviews are visible to all shoppers. If you have purchased the product, your review will display a "Verified Purchase" badge.' },
  { q: 'Is my data secure?',
    a: 'All authentication is handled by Supabase, an industry-standard secure platform. Passwords are hashed, and your session uses encrypted JWT tokens.' },
]

const ABOUT_CONTENT = {
  intro: 'This site is a Nike-inspired e-commerce platform built as a student capstone project to demonstrate a complete, real-world online store.',
  sections: [
    { title: 'About the Project', body: 'A fully functional storefront with user authentication, real-time inventory tracking, secure checkout, role-based admin controls, and an ACID-compliant Postgres database. Built with React, TypeScript, and Supabase.' },
    { title: 'Features',           body: 'Browse products by category, filter by price and size, manage a personal wishlist, leave verified reviews, save delivery addresses, track orders, and check out securely with Cash on Delivery.' },
    { title: 'Admin Capabilities', body: 'Staff users (super admin, manager, editor, viewer) can manage products with image uploads, view and update order statuses, manage user roles, and analyze sales data through interactive dashboards.' },
    { title: 'Technology Stack',   body: 'Frontend: React + TypeScript + Vite. Backend: Supabase (PostgreSQL + Auth + Storage + Realtime). Mobile-ready via Capacitor. Hosting on Vercel.' },
    { title: 'Disclaimer',         body: 'Nike® is a registered trademark of Nike, Inc. This project is a student demonstration of e-commerce techniques and is not affiliated with, endorsed by, or connected to Nike, Inc. All branding is used for educational purposes only.' },
  ],
}

// Accordion item — replaces <details>/<summary>
function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <View style={acc.item}>
      <TouchableOpacity style={acc.summary} onPress={() => setOpen(o => !o)}>
        <Text style={acc.question}>{q}</Text>
        <Text style={acc.toggle}>{open ? '−' : '+'}</Text>
      </TouchableOpacity>
      {open && <Text style={acc.answer}>{a}</Text>}
    </View>
  )
}

const acc = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 14,
    marginBottom: 4,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  question: { flex: 1, fontWeight: '600', fontSize: 14, color: '#111', paddingRight: 12 },
  toggle: { fontSize: 18, color: '#9ca3af' },
  answer: { fontSize: 13, color: '#4b5563', lineHeight: 22, marginTop: 8, paddingLeft: 4 },
})

export default function Footer() {
  const [modal, setModal] = useState<ModalType>(null)

  return (
    <>
      {/* ── Footer bar ── */}
      <View style={styles.footer}>
        <Svg width={60} height={24} viewBox="0 0 60 24">
          <Path
            d="M6 18L42.5 4C44.5 3.2 46 3.5 46 5.5C46 7.5 43 10.5 40 12L6 18Z"
            fill="#fff"
          />
        </Svg>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => setModal('help')}>
            <Text style={styles.linkText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal('about')}>
            <Text style={styles.linkText}>About Nike</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Nike-inspired Demo · Educational use only
        </Text>
      </View>

      {/* ── Help modal ── */}
      <Modal
        visible={modal === 'help'}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & FAQ</Text>
              <TouchableOpacity onPress={() => setModal(null)} accessibilityLabel="Close">
                <X size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalIntro}>
                Find answers to the most common questions about shopping with us.
              </Text>

              {HELP_CONTENT.map((item, i) => (
                <AccordionItem key={i} q={item.q} a={item.a} />
              ))}

              <View style={styles.contactBox}>
                <Text style={styles.contactText}>
                  <Text style={styles.contactBold}>Still need help? </Text>
                  Contact us at{' '}
                  <Text
                    style={styles.contactLink}
                    onPress={() => Linking.openURL('mailto:support@nikedemo.com')}
                  >
                    support@nikedemo.com
                  </Text>
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── About modal ── */}
      <Modal
        visible={modal === 'about'}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Nike</Text>
              <TouchableOpacity onPress={() => setModal(null)} accessibilityLabel="Close">
                <X size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalIntro}>{ABOUT_CONTENT.intro}</Text>
              {ABOUT_CONTENT.sections.map((s, i) => (
                <View key={i} style={styles.aboutSection}>
                  <Text style={styles.aboutTitle}>{s.title}</Text>
                  <Text style={styles.aboutBody}>{s.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#111',
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginTop: 80,
    gap: 16,
  },
  links: {
    flexDirection: 'row',
    gap: 32,
  },
  linkText: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  copyright: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  modalIntro: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
  },
  contactText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  contactBold: { fontWeight: '700', color: '#111' },
  contactLink: { color: '#111', textDecorationLine: 'underline' },

  // About sections
  aboutSection: { marginBottom: 20 },
  aboutTitle: { fontWeight: '700', fontSize: 16, color: '#111', marginBottom: 6 },
  aboutBody: { fontSize: 14, color: '#4b5563', lineHeight: 24 },
})