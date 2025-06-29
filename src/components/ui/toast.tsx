import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-400 bg-green-900/20 text-green-100'
      case 'error':
        return 'border-red-400 bg-red-900/20 text-red-100'
      case 'warning':
        return 'border-yellow-400 bg-yellow-900/20 text-yellow-100'
      case 'info':
        return 'border-blue-400 bg-blue-900/20 text-blue-100'
    }
  }

  return (
    <div className={`
      fixed bottom-4 right-4 z-50 w-80 p-3 rounded-lg border backdrop-blur-sm shadow-lg
      animate-in slide-in-from-bottom-full duration-300
      ${getStyles()}
    `}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-700/50 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast管理器
interface ToastManagerProps {
  toasts: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>
  removeToast: (id: string) => void
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${-index * 5}px)`,
            zIndex: 50 - index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
} 