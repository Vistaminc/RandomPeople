import React from 'react'
import { AlertTriangle, HelpCircle, Trash2, CheckCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = '确认',
  cancelText = '取消'
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />
      case 'info':
        return <HelpCircle className="w-6 h-6 text-blue-400" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />
    }
  }

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[8500] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 对话框内容 */}
      <div className="
        relative w-full max-w-md p-6 bg-gray-800 rounded-xl border border-gray-700 
        shadow-2xl animate-in zoom-in-95 duration-200
      ">
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          {/* 内容 */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        {/* 按钮组 */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="
              px-4 py-2 text-sm font-medium text-gray-300 
              bg-gray-700 hover:bg-gray-600 
              rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-500
            "
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-lg 
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
              ${getConfirmButtonStyle()}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// 简化的使用Hook
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'danger' | 'warning' | 'info' | 'success'
    confirmText: string
    cancelText: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: '确认',
    cancelText: '取消',
    onConfirm: () => {}
  })

  const showConfirm = React.useCallback((options: {
    title: string
    message: string
    type?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
  }) => {
    setDialogState({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'warning',
      confirmText: options.confirmText || '确认',
      cancelText: options.cancelText || '取消',
      onConfirm: options.onConfirm
    })
  }, [])

  const hideConfirm = React.useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={hideConfirm}
      onConfirm={dialogState.onConfirm}
      title={dialogState.title}
      message={dialogState.message}
      type={dialogState.type}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
    />
  ), [dialogState, hideConfirm])

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog: ConfirmDialogComponent
  }
} 