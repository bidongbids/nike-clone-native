// components/Reviews.tsx
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Star, ThumbsUp, Check } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import { useReviews } from '../lib/hooks'
import { submitReview } from '../lib/api'

interface ReviewsProps { productId: number; productName: string }

// Interactive: tap to rate. Non-interactive: display only.
// No hover on mobile — tap state replaces mouse enter/leave.
function StarRow({ rating, interactive = false, onRate }: {
  rating: number
  interactive?: boolean
  onRate?: (n: number) => void
}) {
  return (
    <View style={starStyles.row}>
      {[1,2,3,4,5].map((n) => {
        const filled = rating >= n
        return interactive ? (
          <TouchableOpacity key={n} onPress={() => onRate?.(n)} hitSlop={6}>
            <Star size={24} fill={filled ? '#f59e0b' : 'none'} color={filled ? '#f59e0b' : '#d4d4d4'} />
          </TouchableOpacity>
        ) : (
          <Star key={n} size={14} fill={filled ? '#f59e0b' : 'none'} color={filled ? '#f59e0b' : '#d4d4d4'} />
        )
      })}
    </View>
  )
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, alignItems: 'center' },
})

export default function Reviews({ productId, productName }: ReviewsProps) {
  const navigation = useNavigation<any>()
  const { user } = useStore()
  const { data: reviews, loading, refetch } = useReviews(productId)

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const allReviews = reviews ?? []
  const avg = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0
  const dist = [5,4,3,2,1].map((n) => ({
    n, count: allReviews.filter((r) => r.rating === n).length,
  }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!rating) e.rating = 'Please select a star rating'
    if (!title.trim()) e.title = 'Title is required'
    if (body.trim().length < 20) e.body = 'Review must be at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !user) return
    setSubmitting(true)
    try {
      await submitReview({ product_id: productId, user_id: user.id, rating, title, body })
      setSubmitted(true)
      setShowForm(false)
      setRating(0); setTitle(''); setBody('')
      await refetch()
    } catch (err: any) {
      setErrors({ body: err.message || 'Failed to submit review' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Reviews ({loading ? '…' : allReviews.length})
      </Text>

      {/* Summary */}
      {allReviews.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.avgBlock}>
            <Text style={styles.avgNumber}>{avg.toFixed(1)}</Text>
            <StarRow rating={Math.round(avg)} />
            <Text style={styles.avgCount}>{allReviews.length} reviews</Text>
          </View>
          <View style={styles.distBlock}>
            {dist.map(({ n, count }) => (
              <View key={n} style={styles.distRow}>
                <Text style={styles.distN}>{n}</Text>
                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    width: `${allReviews.length ? (count / allReviews.length) * 100 : 0}%` as any,
                  }]} />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CTA */}
      {!user ? (
        <View style={styles.signInBox}>
          <Text style={styles.signInText}>
            <Text style={styles.signInLink} onPress={() => navigation.navigate('Login')}>
              Sign in
            </Text>
            {' '}to write a review
          </Text>
        </View>
      ) : submitted ? (
        <View style={styles.successBox}>
          <Check size={18} color="#15803d" />
          <Text style={styles.successText}>Your review was submitted — thank you!</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => setShowForm((s) => !s)}
        >
          <Text style={styles.writeBtnText}>{showForm ? 'Cancel' : '✏️  Write a Review'}</Text>
        </TouchableOpacity>
      )}

      {/* Form — replaces <form> tag; submit via TouchableOpacity */}
      {showForm && user && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Review {productName}</Text>

          <View>
            <Text style={styles.formLabel}>YOUR RATING *</Text>
            <StarRow rating={rating} interactive onRate={setRating} />
            {errors.rating && <Text style={styles.formError}>{errors.rating}</Text>}
          </View>

          <View>
            <Text style={styles.formLabel}>REVIEW TITLE *</Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={title}
              onChangeText={setTitle}
              placeholder="Sum up your experience"
              maxLength={80}
              placeholderTextColor="#a3a3a3"
            />
            {errors.title && <Text style={styles.formError}>{errors.title}</Text>}
          </View>

          <View>
            <Text style={styles.formLabel}>YOUR REVIEW *</Text>
            {/* multiline replaces <textarea> */}
            <TextInput
              style={[styles.input, styles.textarea, errors.body ? styles.inputError : null]}
              value={body}
              onChangeText={setBody}
              placeholder="Tell others what you think (min 20 chars)"
              multiline
              numberOfLines={4}
              placeholderTextColor="#a3a3a3"
              textAlignVertical="top"
            />
            <View style={styles.charRow}>
              {errors.body
                ? <Text style={styles.formError}>{errors.body}</Text>
                : <View />
              }
              <Text style={styles.charCount}>{body.length}/500</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitBtnText}>Submit Review</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#d4d4d4" />
        </View>
      ) : (
        <View style={styles.list}>
          {allReviews.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No reviews yet — be the first!</Text>
            </View>
          )}
          {allReviews.map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {r.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName}>{r.userName}</Text>
                      {r.verified && (
                        <View style={styles.verifiedBadge}>
                          <Check size={9} strokeWidth={3} color="#16a34a" />
                          <Text style={styles.verifiedText}>Verified Purchase</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.reviewDate}>{r.date}</Text>
                  </View>
                </View>
                <StarRow rating={r.rating} />
              </View>

              <Text style={styles.reviewTitle}>{r.title}</Text>
              <Text style={styles.reviewBody}>{r.body}</Text>

              <TouchableOpacity style={styles.helpfulBtn}>
                <ThumbsUp size={13} color="#a3a3a3" />
                <Text style={styles.helpfulText}>Helpful</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 48,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    color: '#111',
  },

  // Summary
  summary: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  avgBlock: { alignItems: 'center', gap: 4 },
  avgNumber: { fontSize: 52, fontWeight: '800', color: '#111', lineHeight: 56 },
  avgCount: { fontSize: 13, color: '#737373', marginTop: 4 },
  distBlock: { flex: 1, minWidth: 180, gap: 8 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distN: { fontSize: 13, width: 10, color: '#111' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#f5f5f5', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 4 },
  distCount: { fontSize: 12, color: '#737373', width: 16 },

  // CTA
  signInBox: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  signInText: { fontSize: 14, color: '#525252' },
  signInLink: { fontWeight: '700', color: '#111', textDecorationLine: 'underline' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    marginBottom: 24,
  },
  successText: { fontSize: 14, color: '#15803d', fontWeight: '600' },
  writeBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#d4d4d4',
    borderRadius: 50,
    marginBottom: 24,
  },
  writeBtnText: { fontSize: 14, fontWeight: '600', color: '#111' },

  // Form
  form: {
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 24,
    marginBottom: 32,
    gap: 18,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#525252',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#e5231b' },
  textarea: { height: 100 },
  formError: { fontSize: 12, color: '#e5231b', marginTop: 4 },
  charRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  charCount: { fontSize: 11, color: '#a3a3a3' },
  submitBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Loading
  loadingWrap: { alignItems: 'center', padding: 40 },

  // List
  list: { gap: 0 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#a3a3a3' },
  reviewItem: {
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewUser: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontWeight: '700', fontSize: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontWeight: '700', fontSize: 14, color: '#111' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 50,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  reviewDate: { fontSize: 12, color: '#a3a3a3' },
  reviewTitle: { fontWeight: '700', fontSize: 15, marginBottom: 6, color: '#111' },
  reviewBody: { fontSize: 14, color: '#525252', lineHeight: 24 },
  helpfulBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
  },
  helpfulText: { fontSize: 12, color: '#a3a3a3' },
})