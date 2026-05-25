// components/Toast.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react-native'
import { useStore } from '../store/useStore'
import type { ToastType } from '../types'
import type { ComponentType } from 'react'

const ICONS: Record<ToastType, ComponentType<{ size?: number; color?: string }>> = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
  warning: AlertTriangle,
}

const COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error:   '#f04048',
  info:    '#3b82f6',
  warning: '#f59e0b',
}

const BG_COLORS: Record<ToastType, string> = {
  success: '#14532d',
  error:   '#7f1d1d',
  info:    '#1e3a5f',
  warning: '#78350f',
}

export default function Toast() {
  const { toasts, removeToast } = useStore()

  if (toasts.length === 0) return null

  return (
    // Position at bottom of screen — place this in your root layout (App.tsx)
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        const color = COLORS[t.type]
        return (
          <View key={t.id} style={[styles.toast, { backgroundColor: BG_COLORS[t.type] }]}>
            <Icon size={18} color={color} />
            <Text style={styles.message}>{t.message}</Text>
            <TouchableOpacity onPress={() => removeToast(t.id)} hitSlop={8}>
              <X size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
})