// 抽奖相关类型
export interface LotteryData {
  names: string[]
  weights: number[]
}

export interface LotteryResult {
  winner: string
  timestamp: Date
  mode: 'equal' | 'weighted'
  allowRepeat: boolean
}

export interface LotterySettings {
  mode: 'equal' | 'weighted'
  count: number
  allowRepeat: boolean
  animationEnabled: boolean
  soundEnabled: boolean
}

// 文件相关类型
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: Date
  data?: LotteryData
}

export interface ParsedData {
  names: string[]
  weights: number[]
  source: string
}

// 主题相关类型
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: string
  backgroundColor: string
  cardColor: string
}

// 动画相关类型
export interface AnimationConfig {
  duration: number
  enabled: boolean
  type: 'fade' | 'slide' | 'bounce' | 'scale'
}

// 组件Props类型
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export interface CardProps {
  className?: string
  children: React.ReactNode
  title?: string
  description?: string
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

// API相关类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 错误处理类型
export interface ErrorInfo {
  message: string
  code?: string
  details?: any
}

// 历史记录类型
export interface HistoryRecord {
  id: string
  timestamp: Date
  fileName: string
  winners: string[]
  settings: LotterySettings
}

// 统计信息类型
export interface Statistics {
  totalDraws: number
  totalParticipants: number
  mostFrequentWinner: string
  lastDrawTime: Date
} 