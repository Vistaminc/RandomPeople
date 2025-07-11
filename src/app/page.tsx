'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import { Upload, Settings, Shuffle, X, FileText, Users, ChevronRight, ChevronUp, ChevronDown, Edit, Save, RotateCcw, Trash2, Bug, Trash, Shield, Moon, Sun, Smartphone, Monitor, MonitorSpeaker, Download, FileUp, AlertTriangle, Dice6, Lock, FileDown, History, Clock, ArrowUpDown, GraduationCap, Globe } from 'lucide-react'
import { listen } from '@tauri-apps/api/event'
import { ToastManager } from '@/components/ui/toast'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/hooks/useToast'
import { testTauriConnection } from '@/lib/tauri'
import { getAllSettings } from '@/lib/officialStore'
import { encryptPassword, verifyPassword, isPasswordEncrypted } from '@/lib/crypto'


// 优化的Button组件
const Button = memo(({ children, onClick, variant = 'default', size = 'default', disabled = false, loading = false, className = '' }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50'
  
  const variants = useMemo(() => ({
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700',
    ghost: 'text-gray-300 hover:bg-gray-700',
  }), [])
  
  const sizes = useMemo(() => ({
    default: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 py-3 text-base',
    icon: 'h-10 w-10',
  }), [])
  
  const finalClassName = useMemo(() => 
    `${baseClasses} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`,
    [baseClasses, variants, variant, sizes, size, className]
  )
  
  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </div>
      )
    }
    return children
  }, [loading, children])
  
  return (
    <button
      className={finalClassName}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {content}
    </button>
  )
})

// 优化的Card组件
const Card = memo(({ children, className = '' }: any) => (
  <div className={`rounded-md border border-gray-700 bg-gray-800/50 backdrop-blur-sm text-white shadow-lg ${className}`}>
    {children}
  </div>
))

// 优化的选项卡组件
const Tabs = memo(({ children, value, onValueChange, className = '' }: any) => {
  const tabsList = useMemo(() => 
    children.find((child: any) => child.type === TabsList),
    [children]
  )
  
  const activeContent = useMemo(() => 
    children.find((child: any) => child.props.value === value),
    [children, value]
  )
  
  return (
    <div className={`w-full ${className}`}>
      {tabsList && (
        <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg mb-4">
          {tabsList.props.children.map((trigger: any) => (
                <button
                  key={trigger.props.value}
                  onClick={() => onValueChange(trigger.props.value)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    value === trigger.props.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'
                  }`}
                >
                  {trigger.props.children}
                </button>
              ))}
            </div>
      )}
      {activeContent && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeContent.props.children}
        </div>
      )}
    </div>
  )
})

const TabsList = memo(({ children }: any) => <div>{children}</div>)
const TabsTrigger = memo(({ children, value }: any) => <div data-value={value}>{children}</div>)
const TabsContent = memo(({ children, value }: any) => <div data-value={value}>{children}</div>)

// 优化的Dialog组件
const Dialog = memo(({ open, onOpenChange, children }: any) => {
  const handleBackdropClick = useCallback(() => onOpenChange(false), [onOpenChange])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleBackdropClick} 
      />
      <div className="relative z-[8100] w-full max-w-4xl mx-4 max-h-[90vh]">
        {children}
      </div>
    </div>
  )
})

// 抽奖引擎类（无变化，但添加memo包装使用）
class LotteryEngine {
  private names: string[] = []
  private weights: number[] = []
  private excludedIndices: Set<number> = new Set()

  loadData(names: string[], weights?: number[]) {
    this.names = [...names]
    this.weights = weights ? [...weights] : new Array(names.length).fill(1)
    this.excludedIndices.clear()
  }

  drawOne(useWeight = true, allowRepeat = false): string | null {
    const availableIndices = this.names
      .map((_, index) => index)
      .filter(index => allowRepeat || !this.excludedIndices.has(index))

    if (availableIndices.length === 0) return null

    let selectedIndex: number

    if (useWeight) {
      const availableWeights = availableIndices.map(i => this.weights[i])
      const totalWeight = availableWeights.reduce((sum, weight) => sum + weight, 0)
      
      if (totalWeight === 0) {
        selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
      } else {
        let random = Math.random() * totalWeight
        let i = 0
        
        while (random > availableWeights[i] && i < availableWeights.length - 1) {
          random -= availableWeights[i]
          i++
        }
        
        selectedIndex = availableIndices[i]
      }
    } else {
      selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    }

    if (!allowRepeat) {
      this.excludedIndices.add(selectedIndex)
    }

    return this.names[selectedIndex]
  }

  // 新增：多人抽奖方法
  drawMultiple(count: number, useWeight = true, allowRepeat = false): string[] {
    const results: string[] = []
    
    for (let i = 0; i < count; i++) {
      const result = this.drawOne(useWeight, allowRepeat)
      if (result === null) break // 没有更多可抽取的人员
      results.push(result)
    }
    
    return results
  }

  getRemainingCount(): number {
    return this.names.length - this.excludedIndices.size
  }

  getTotalCount(): number {
    return this.names.length
  }

  resetExclusions() {
    this.excludedIndices.clear()
  }
}

// 文件解析函数（保持不变）
const parseFile = (file: File): Promise<{ names: string[], weights: number[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      const extension = file.name.split('.').pop()?.toLowerCase()

      try {
        let names: string[] = []
        let weights: number[] = []

        if (extension === 'csv') {
          const lines = content.trim().split('\n')
          lines.forEach(line => {
            const parts = line.split(',').map(part => part.trim())
            if (parts[0]) {
              names.push(parts[0])
              const weight = parts[1] ? parseFloat(parts[1]) : 1
              weights.push(isNaN(weight) ? 1 : Math.max(0, weight))
            }
          })
        } else if (extension === 'txt') {
          const lines = content.trim().split('\n')
          lines.forEach(line => {
            const parts = line.trim().split(/[\s,\t]+/)
            if (parts[0]) {
              names.push(parts[0])
              const weight = parts[1] ? parseFloat(parts[1]) : 1
              weights.push(isNaN(weight) ? 1 : Math.max(0, weight))
            }
          })
        } else if (extension === 'json') {
          const data = JSON.parse(content)
          if (Array.isArray(data)) {
            names = data.map(item => String(item))
            weights = new Array(names.length).fill(1)
          } else if (data.names && Array.isArray(data.names)) {
            names = data.names.map((item: any) => String(item))
            weights = data.weights && Array.isArray(data.weights) 
              ? data.weights.map((w: any) => Math.max(0, parseFloat(w) || 1))
              : new Array(names.length).fill(1)
          }
        }

        if (names.length === 0) {
          throw new Error('文件中没有找到有效的名称数据')
        }

        resolve({ names, weights })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

// 文件信息组件（拆分出来的组件）
const FileInfoDisplay = memo(({ currentFile, names, engineRef, allowRepeat, refreshTrigger }: any) => {
  const [remainingCount, setRemainingCount] = useState(0)
  
  // 实时更新剩余人数
  useEffect(() => {
    if (engineRef.current && names.length > 0) {
      const remaining = engineRef.current.getRemainingCount()
      setRemainingCount(remaining)
    }
  }, [engineRef, names, allowRepeat, refreshTrigger])
  
  if (!currentFile) return null
  
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-md border border-gray-700">
        <FileText className="w-4 h-4 mr-2 text-blue-400" />
        <span className="text-gray-300">当前文件: {currentFile}</span>
        <span className="ml-4 text-blue-400">
          <Users className="w-4 h-4 inline mr-1" />
          {names.length} 人
        </span>
        {!allowRepeat && remainingCount < names.length && (
          <span className="ml-4 text-yellow-400">
            剩余: {remainingCount} 人
          </span>
        )}
        {allowRepeat && (
          <span className="ml-4 text-green-400">
            可重复抽取
          </span>
        )}
      </div>
    </div>
  )
})

// 抽奖结果显示组件（拆分出来的组件）
const LotteryResultDisplay = memo(({ 
  isDrawing, 
  rollingName, 
  winners, 
  settings, 
  resetLottery, 
  startLottery, 
  allowRepeat, 
  drawCount, 
  engineRef, 
  names 
}: any) => {
  const isDisabled = useMemo(() => 
    !allowRepeat && drawCount > engineRef.current.getRemainingCount(),
    [allowRepeat, drawCount, engineRef]
  )
  
  const resetButtonProps = useMemo(() => ({
    onClick: resetLottery,
    variant: "outline" as const
  }), [resetLottery])
  
  const startButtonProps = useMemo(() => ({
    onClick: startLottery,
    disabled: isDisabled,
    className: "bg-green-600 hover:bg-green-700"
  }), [startLottery, isDisabled])
  
  if (isDrawing) {
    return (
      <div className="rounded-md border border-gray-700 bg-gray-800/50 backdrop-blur-sm text-white shadow-lg p-8 text-center mb-6">
        <div className="space-y-4">
          <div className="text-xl text-gray-400">
            正在抽取中...
          </div>
          <div className="text-4xl font-bold filter blur-sm animate-pulse text-blue-400">
            {rollingName || '...'}
          </div>
        </div>
      </div>
    )
  }
  
  if (winners.length > 0) {
    return (
      <div className="rounded-md border border-gray-700 bg-gray-800/50 backdrop-blur-sm text-white shadow-lg p-8 text-center mb-6">
        <div className="space-y-4">
          <div className="text-xl text-gray-400">
            {winners.length === 1 ? '恭喜中奖' : `恭喜 ${winners.length} 位中奖者`}
          </div>
          {winners.length === 1 ? (
            <div className={`font-bold mb-6 text-green-400 ${
              settings.educationLayout ? 'text-8xl' : 'text-5xl'
            }`}>
              {winners[0]}
            </div>
          ) : (
            <div className={`${
              settings.educationLayout 
                ? 'flex flex-wrap justify-center gap-8' 
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            } mb-6`}>
              {winners.map((winner: string, index: number) => (
                settings.educationLayout ? (
                  // 智教布局：只显示名字，无边框，横向排列
                  <div key={index} className="text-center">
                    <div className="text-6xl font-bold text-green-400">
                      {winner}
                    </div>
                  </div>
                ) : (
                  // 普通布局：带边框的卡片
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-green-400/30">
                    <div className="text-sm text-gray-400 mb-1">第 {index + 1} 名</div>
                    <div className="text-2xl font-bold text-green-400">{winner}</div>
                  </div>
                )
              ))}
            </div>
          )}
          <div className="flex justify-center gap-4">
            <Button {...resetButtonProps}>
              重置抽奖
            </Button>
            <Button {...startButtonProps}>
              再次抽奖
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-md border border-gray-700 bg-gray-800/50 backdrop-blur-sm text-white shadow-lg p-8 text-center mb-6">
      <div className="text-3xl text-gray-500 py-8">
        {names.length > 0 ? '点击开始抽奖' : '请先选择小组或上传名单文件'}
      </div>
    </div>
  )
})

// 抽奖人数配置组件（拆分出来的组件）
const DrawCountConfig = memo(({ 
  drawCount, 
  setDrawCount, 
  allowRepeat, 
  names 
}: any) => {
  const maxValue = useMemo(() => allowRepeat ? 999 : names.length, [allowRepeat, names.length])
  
  const handleDecrease = useCallback(() => {
    setDrawCount((prev: number) => Math.max(1, prev - 1))
  }, [setDrawCount])
  
  const handleIncrease = useCallback(() => {
    setDrawCount((prev: number) => Math.min(prev + 1, maxValue))
  }, [setDrawCount, maxValue])
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setDrawCount(Math.min(Math.max(1, value), maxValue))
  }, [setDrawCount, maxValue])
  
  const quickButtons = useMemo(() => 
    [1, 3, 5, 10].filter(num => allowRepeat || num <= names.length),
    [allowRepeat, names.length]
  )
  
  const statusText = useMemo(() => 
    allowRepeat 
      ? `共${names.length}人，可重复` 
      : `共${names.length}人，余${names.length}人`,
    [allowRepeat, names.length]
  )
  
  return (
    <div className="bg-gray-800/50 light:bg-white rounded-xl border border-gray-600/50 light:border-blue-500 backdrop-blur-sm p-4 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-blue-400 light:text-blue-600">
          <Users className="w-4 h-4" />
          <span className="text-white font-medium text-sm light:text-gray-800">抽奖人数</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 减少按钮 */}
          <Button
            onClick={handleDecrease}
            variant="outline"
            size="icon"
            className="text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:border-blue-400 w-8 h-8 rounded-lg transition-all duration-200 light:text-blue-600 light:border-blue-500 light:hover:bg-blue-50 light:hover:border-blue-600"
            disabled={drawCount <= 1}
          >
            <span className="text-sm font-bold">-</span>
          </Button>
          
          {/* 人数显示和输入 */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max={maxValue}
              value={drawCount}
              onChange={handleInputChange}
              className="w-14 px-2 py-1 bg-gray-700/80 border border-gray-500 rounded-lg text-white text-center font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] light:bg-white light:border-gray-400 light:text-gray-800 light:focus:ring-blue-500 light:focus:border-blue-600"
            />
            <span className="text-gray-400 text-sm light:text-gray-600">人</span>
          </div>
          
          {/* 增加按钮 */}
          <Button
            onClick={handleIncrease}
            variant="outline"
            size="icon"
            className="text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:border-blue-400 w-8 h-8 rounded-lg transition-all duration-200 light:text-blue-600 light:border-blue-500 light:hover:bg-blue-50 light:hover:border-blue-600"
            disabled={!allowRepeat && drawCount >= names.length}
          >
            <span className="text-sm font-bold">+</span>
          </Button>
        </div>
        
        {/* 快捷按钮 */}
        {names.length > 0 && (
          <div className="flex items-center gap-1">
            {quickButtons.map(num => (
              <Button
                key={num}
                onClick={() => setDrawCount(num)}
                variant={drawCount === num ? "default" : "outline"}
                size="sm"
                className={drawCount === num 
                  ? "bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs h-7 min-w-[2rem] light:bg-blue-600 light:hover:bg-blue-700" 
                  : "text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:border-blue-400 px-2 py-1 text-xs h-7 min-w-[2rem] transition-all duration-200 light:text-blue-600 light:border-blue-500 light:hover:bg-blue-50 light:hover:border-blue-600"
                }
              >
                {num}
              </Button>
            ))}
            {!allowRepeat && names.length > 10 && (
              <Button
                onClick={() => setDrawCount(Math.floor(names.length / 2))}
                variant={drawCount === Math.floor(names.length / 2) ? "default" : "outline"}
                size="sm"
                className={drawCount === Math.floor(names.length / 2)
                  ? "bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs h-7 min-w-[2.5rem] light:bg-blue-600 light:hover:bg-blue-700"
                  : "text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:border-blue-400 px-2 py-1 text-xs h-7 min-w-[2.5rem] transition-all duration-200 light:text-blue-600 light:border-blue-500 light:hover:bg-blue-50 light:hover:border-blue-600"
                }
              >
                半数
              </Button>
            )}
          </div>
        )}
        
        {/* 状态提示 */}
        {names.length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-700/30 px-2 py-1 rounded-md light:text-gray-600 light:bg-gray-100">
            {statusText}
          </div>
        )}
      </div>
    </div>
  )
  })

// 控制按钮区域组件（拆分出来的组件）
const ControlButtonsArea = memo(({ 
  selectedGroupId, 
  groups, 
  selectGroup, 
  isDrawing, 
  startLottery, 
  names, 
  canStop, 
  stopLottery, 
  settings, 
  drawnResults, 
  exportResults, 
  setShowHistoryDialog, 
  setShowSettings,
  showPasswordDialog // 新增密码验证对话框函数
}: any) => {
  const groupOptions = useMemo(() => 
    groups.map((group: any) => (
      <option key={group.id} value={group.id}>
        {group.name} ({group.names.length}人)
      </option>
    )),
    [groups]
  )
  
  const handleGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    selectGroup(e.target.value)
  }, [selectGroup])
  
  const startButtonProps = useMemo(() => ({
    onClick: startLottery,
    disabled: names.length === 0,
    size: "lg" as const,
    className: settings.educationLayout 
      ? "bg-blue-600 hover:bg-blue-700 px-8 py-4 text-xl font-bold" 
      : "bg-blue-600 hover:bg-blue-700 px-6"
  }), [startLottery, names.length, settings.educationLayout])
  
  const stopButtonProps = useMemo(() => ({
    onClick: canStop ? stopLottery : undefined,
    disabled: !canStop,
    size: "lg" as const,
    className: canStop 
      ? (settings.educationLayout 
          ? "bg-red-600 hover:bg-red-700 px-8 py-4 text-xl font-bold"
          : "bg-red-600 hover:bg-red-700 px-6")
      : "bg-gray-600 cursor-not-allowed px-6"
  }), [canStop, stopLottery, settings.educationLayout])

  // 🔧 处理设置按钮点击，添加密码保护验证
  const handleSettingsClick = useCallback(() => {
    // 检查是否启用了密码保护
    if (settings.passwordProtection && settings.password) {
      // 显示密码验证对话框
      showPasswordDialog({
        title: '密码验证',
        message: '请输入设置密码以进入设置界面：',
        onConfirm: (inputPassword: string) => {
          if (verifyPassword(inputPassword, settings.password)) {
            setShowSettings(true)
          } else {
            // 密码错误，显示错误提示
            alert('密码错误，请重新输入')
          }
        },
        onCancel: () => {
          // 用户取消，不做任何操作
        }
      })
    } else {
      // 未启用密码保护或未设置密码，直接打开设置
      setShowSettings(true)
    }
  }, [settings.passwordProtection, settings.password, showPasswordDialog, setShowSettings])
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
      {/* 小组选择 */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-400" />
        <select
          value={selectedGroupId}
          onChange={handleGroupChange}
          className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[200px] light:bg-white light:border-blue-500 light:text-gray-800 light:focus:ring-blue-500 light:focus:border-blue-600"
        >
          <option value="">选择抽奖小组...</option>
          {groupOptions}
        </select>
      </div>

      {/* 开始抽奖/停止按钮 */}
      {!isDrawing ? (
        <Button {...startButtonProps}>
          <Shuffle className={settings.educationLayout ? "w-6 h-6 mr-3" : "w-5 h-5 mr-2"} />
          开始抽奖
        </Button>
      ) : (
        <Button {...stopButtonProps}>
          {canStop ? (
            <>
              <X className={settings.educationLayout ? "w-6 h-6 mr-3" : "w-5 h-5 mr-2"} />
              立即停止
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              抽奖中...
            </>
          )}
        </Button>
      )}
      
      {/* 导出按钮 */}
      <Button
        onClick={exportResults}
        disabled={drawnResults.length === 0}
        variant="outline"
        className="text-green-400 border-green-400 hover:bg-green-400/10 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 h-12"
        title="导出抽奖结果"
      >
        <FileDown className="w-6 h-6 mr-2" />
        导出
      </Button>
      
      {/* 历史任务按钮 */}
      <Button
        onClick={() => setShowHistoryDialog(true)}
        variant="outline"
        className="text-purple-400 border-purple-400 hover:text-purple-300 hover:border-purple-300 px-4 py-2 h-12 !text-purple-400 !border-purple-400 !hover:text-purple-300 !hover:border-purple-300"
        title="历史任务"
      >
        <History className="w-6 h-6 mr-2" />
        历史
      </Button>

      {/* 设置按钮 */}
      <Button
        onClick={handleSettingsClick}
        variant="outline"
        className="text-gray-400 border-gray-400 hover:text-white hover:border-white px-4 py-2 h-12"
        title="设置"
      >
        <Settings className="w-6 h-6 mr-2" />
        设置
      </Button>
    </div>
  )
})

export default function Home() {
  // 文件上传状态
  const [currentFile, setCurrentFile] = useState<string>('')
  const [names, setNames] = useState<string[]>([])
  const [weights, setWeights] = useState<number[]>([])

  // 抽奖状态
  const [isDrawing, setIsDrawing] = useState(false)
  const [canStop, setCanStop] = useState(false)
  const [winners, setWinners] = useState<string[]>([])
  const [rollingName, setRollingName] = useState<string>('')
  const [drawnResults, setDrawnResults] = useState<string[]>([])

  // 🔧 剩余人数刷新触发器
  const [remainingCountTrigger, setRemainingCountTrigger] = useState(0)

  // 设置状态
  const [settings, setSettings] = useState({
    drawCount: 1,
    resetAfterDraw: false,
    animationSpeed: 5,
    animationDuration: 1200,
    useAnimation: true,
    manualStopMode: false,
    soundEnabled: false,
    theme: 'dark',
    fontSize: 'medium',
    debugMode: false,
    autoSave: true,
    passwordProtection: false,
    password: '',
    autoCleanLogs: true,
    logCleanDays: 7,
    educationLayout: false,
    cleanEducationLayout: false,
    horizontalEducationLayout: false,
    storageMethod: 'tauriStore' as 'localStorage' | 'tauriStore', // 桌面应用默认使用Tauri Store
  })
  
  // 存储实例


  const [winner, setWinner] = useState<string>('')
  const [drawCount, setDrawCount] = useState(() => {
    // 从localStorage加载抽奖人数
    try {
      const saved = localStorage.getItem('lottery-draw-count')
      return saved ? Math.max(1, parseInt(saved)) : 1
    } catch {
      return 1
    }
  }) // 抽奖人数
  const [showSettings, setShowSettings] = useState(false)
  const [drawMode, setDrawMode] = useState<'equal' | 'weighted'>('equal')
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [historyTasks, setHistoryTasks] = useState<any[]>([])
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<string>('')
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null) // 存储选中任务的详细数据
  const [editingHistoryTask, setEditingHistoryTask] = useState<string>('')
  const [editingResults, setEditingResults] = useState<string>('')
  const [activeTab, setActiveTab] = useState('groups')
  
  // 历史任务搜索状态
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('')
  const [showPasswordDialogState, setShowPasswordDialogState] = useState(false)
  const [passwordDialogConfig, setPasswordDialogConfig] = useState<{
    title: string
    message: string
    onConfirm: (password: string) => void
    onCancel?: () => void
  } | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  
  // 小组管理状态
  const [groups, setGroups] = useState<Array<{
    id: string
    name: string
    filePath: string
    url: string
    names: string[]
    weights: number[]
  }>>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [newGroupName, setNewGroupName] = useState<string>('')
  const [newGroupPath, setNewGroupPath] = useState<string>('')
  const [newGroupUrl, setNewGroupUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // 编辑相关状态
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<string>('')
  const [editingGroupName, setEditingGroupName] = useState('')
  const [editingGroupPath, setEditingGroupPath] = useState('')
  const [editingGroupUrl, setEditingGroupUrl] = useState('')
  const [editingFile, setEditingFile] = useState<File | null>(null)
  
  // 通知和确认对话框
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast()

  const { showConfirm, ConfirmDialog } = useConfirmDialog()
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const engineRef = useRef(new LotteryEngine())
  // 使用ref来管理停止状态，确保在异步循环中能读取到最新值
  const isAnimationStoppedRef = useRef(false)

  // 优化: 使用useMemo缓存复杂计算
  const filteredHistoryTasks = useMemo(() => {
    if (!historySearchTerm.trim()) return historyTasks
    return historyTasks.filter(task => 
      task.name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      task.group_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      task.results.some((result: string) => result.toLowerCase().includes(historySearchTerm.toLowerCase()))
    )
  }, [historyTasks, historySearchTerm])

  // 保存抽奖人数到localStorage
  useEffect(() => {
    localStorage.setItem('lottery-draw-count', drawCount.toString())
  }, [drawCount])

  // 当禁止重复时，限制抽奖人数不超过总人数
  useEffect(() => {
    if (!allowRepeat && names.length > 0 && drawCount > names.length) {
      setDrawCount(names.length)
    }
  }, [allowRepeat, names.length, drawCount])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { names: parsedNames, weights: parsedWeights } = await parseFile(file)
      setNames(parsedNames)
      setWeights(parsedWeights)
      setCurrentFile(file.name)
      engineRef.current.loadData(parsedNames, parsedWeights)
      setWinner('')
    } catch (error) {
      showError(`文件解析失败: ${error}`)
    }
  }, [showError])

  const [isAnimationStopped, setIsAnimationStopped] = useState(false)

  const startLottery = useCallback(async () => {
    if (names.length === 0) {
      showWarning('请先选择小组或上传名单文件')
      return
    }

    if (drawCount < 1) {
      showWarning('抽奖人数必须大于0')
      return
    }

    if (drawCount > names.length && !allowRepeat) {
      showWarning('抽奖人数不能大于总人数（不允许重复时）')
      return
    }

    // 在开始新抽奖时重置上次结果
    setWinner('')
    setWinners([])
    
    setIsDrawing(true)
    setCanStop(false)
    setIsAnimationStopped(false)
    isAnimationStoppedRef.current = false // 重置ref状态

    // 简洁的滚动动画
    const animationDuration = settings.animationDuration
    const frameRate = 60
    const frames = animationDuration / frameRate

    if (settings.useAnimation) {
      // 延迟一点时间再允许停止，避免误触
      setTimeout(() => setCanStop(true), 500)
      
      if (settings.manualStopMode) {
        // 手动停止模式：无限循环直到用户停止
        let animationFrame = 0
        while (!isAnimationStoppedRef.current) { // 使用ref来检查停止状态
          const randomName = names[Math.floor(Math.random() * names.length)]
          setRollingName(randomName)
          await new Promise(resolve => setTimeout(resolve, frameRate))
          animationFrame++
          
          // 防止无限循环导致性能问题，设置最大帧数
          if (animationFrame > 10000) break
        }
      } else {
        // 定时停止模式：按设定时间自动停止
      for (let i = 0; i < frames; i++) {
          // 检查是否被手动停止
          if (isAnimationStoppedRef.current) { // 使用ref来检查停止状态
            break
          }
          
        const randomName = names[Math.floor(Math.random() * names.length)]
        setRollingName(randomName)
        await new Promise(resolve => setTimeout(resolve, frameRate))
        }
      }
    }

    setCanStop(false)

    // 最终抽取
    if (drawCount === 1) {
      // 单人抽奖
      const result = engineRef.current.drawOne(drawMode === 'weighted', allowRepeat)
      if (result) {
        setWinner(result)
        setWinners([result])
        
        // 添加到抽奖结果历史
        setDrawnResults(prev => [...prev, result])
        
        // 🔧 抽奖后自动重置（在设置结果后立即执行）
        if (settings.resetAfterDraw) {
          setTimeout(() => {
            engineRef.current.resetExclusions()
            setWinner('') // 清空获奖者
            setWinners([]) // 清空获奖者列表
            setDrawnResults([]) // 清空抽奖结果历史
            setRemainingCountTrigger(prev => prev + 1) // 触发剩余人数更新
            console.log('✅ 单人抽奖后自动重置完成（排除列表和抽奖结果已重置）')
          }, 100) // 延迟100ms确保状态更新完成
        } else {
          // 即使不自动重置，也要更新剩余人数显示
          setTimeout(() => {
            setRemainingCountTrigger(prev => prev + 1)
          }, 100)
        }
        
        // 保存到 Tauri 后端已通过新的历史记录系统处理
      } else {
        showWarning('没有可抽取的候选者了')
      }
    } else {
      // 多人抽奖
      const results = engineRef.current.drawMultiple(drawCount, drawMode === 'weighted', allowRepeat)
      if (results.length > 0) {
        setWinners(results)
        if (results.length === 1) {
          setWinner(results[0])
        }
        
        // 添加到抽奖结果历史
        setDrawnResults(prev => [...prev, ...results])
        
        // 🔧 抽奖后自动重置（在设置结果后立即执行）
        if (settings.resetAfterDraw) {
          setTimeout(() => {
            engineRef.current.resetExclusions()
            setWinner('') // 清空获奖者
            setWinners([]) // 清空获奖者列表
            setDrawnResults([]) // 清空抽奖结果历史
            setRemainingCountTrigger(prev => prev + 1) // 触发剩余人数更新
            console.log('✅ 多人抽奖后自动重置完成（排除列表和抽奖结果已重置）')
          }, 100) // 延迟100ms确保状态更新完成
        } else {
          // 即使不自动重置，也要更新剩余人数显示
          setTimeout(() => {
            setRemainingCountTrigger(prev => prev + 1)
          }, 100)
        }
        
        // 保存到 Tauri 后端已通过新的历史记录系统处理
      } else {
        showWarning('没有可抽取的候选者了')
      }
    }

    setIsDrawing(false)
    setCanStop(false)
    setIsAnimationStopped(false)
    isAnimationStoppedRef.current = false // 重置ref状态
    setRollingName('')
  }, [names, drawCount, drawMode, allowRepeat, settings, showWarning, groups, selectedGroupId])

  const stopLottery = useCallback(() => {
    setIsAnimationStopped(true)
    isAnimationStoppedRef.current = true // 同时更新ref状态
  }, [])

  const resetLottery = useCallback(() => {
    engineRef.current.resetExclusions()
    setWinner('')
    setWinners([])
    setDrawnResults([]) // 清空抽奖结果历史
    setRemainingCountTrigger(prev => prev + 1) // 触发剩余人数更新
    console.log('🔄 手动重置抽奖完成')
  }, [])

  // 重置导出对话框状态
  const resetExportDialog = useCallback(() => {
    setShowExportDialog(false)
    setEnableEditProtection(false)
    setEditProtectionPassword('')
  }, [])

  // 导出配置状态
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState('')
  const [exportFormat, setExportFormat] = useState('.csv')
  const [enableEditProtection, setEnableEditProtection] = useState(false)
  const [editProtectionPassword, setEditProtectionPassword] = useState('')
  
  // 导出名单功能
  const exportResults = useCallback(() => {
    if (drawnResults.length === 0) {
      showWarning('当前没有抽奖结果可导出')
      return
    }

    // 生成默认文件名
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    setExportFileName(`抽奖结果_${timestamp}`)
    setShowExportDialog(true)
  }, [drawnResults, showWarning])

  // 执行导出
  const performExport = useCallback(async () => {
    if (!exportFileName.trim()) {
      showError('文件名不能为空')
      return
    }

    // 验证编辑保护设置
    if (enableEditProtection && !editProtectionPassword.trim()) {
      showError('启用编辑保护时必须设置密码')
      return
    }

    let content = ''
    let filename = exportFileName.trim()
    let mimeType = ''

    const currentTime = new Date().toLocaleString('zh-CN')

    // 确保文件名有正确的扩展名
    if (!filename.endsWith(exportFormat)) {
      filename += exportFormat
    }

    if (exportFormat === '.csv') {
      // CSV格式
      content = '序号,抽奖结果\n'
      drawnResults.forEach((result, index) => {
        content += `${index + 1},"${result}"\n`
      })
      mimeType = 'text/csv'
    } else if (exportFormat === '.txt') {
      // 文本格式
      content = `抽奖结果\n`
      content += `任务名称: ${exportFileName}\n`
      content += `导出时间: ${currentTime}\n`
      content += `总人数: ${drawnResults.length}\n\n`
      content += `抽奖结果列表:\n`
      drawnResults.forEach((result, index) => {
        content += `${index + 1}. ${result}\n`
      })
      mimeType = 'text/plain'
    } else if (exportFormat === '.json') {
      // JSON格式
      const exportData = {
        task_name: exportFileName,
        export_time: new Date().toISOString(),
        total_count: drawnResults.length,
        results: drawnResults
      }
      content = JSON.stringify(exportData, null, 2)
      mimeType = 'application/json'
    }

    // 创建下载链接
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // 保存到历史任务
    const newTask = {
      id: Date.now().toString(),
      name: exportFileName,
      timestamp: new Date().toISOString(),
      results: drawnResults,
      file_path: filename,
      total_count: drawnResults.length,
      group_name: groups.find(g => g.id === selectedGroupId)?.name || '未知小组',
      edit_protected: enableEditProtection, // 使用用户设置
      edit_password: enableEditProtection ? editProtectionPassword : '' // 只有启用保护时才保存密码
    }
    
    const updatedHistory = [newTask, ...historyTasks.slice(0, 99)] // 保留最近100个任务
    setHistoryTasks(updatedHistory)
    
        // 保存历史任务 - 使用新的Tauri命令
    try {
      // 🔧 使用新的Tauri命令直接保存历史记录到年月文件夹
      const { saveHistoryToTauri, isTauriEnvironment } = await import('@/lib/tauri');
      
      console.log('📋 导出时保存历史记录...');
      
      try {
        // 🔧 强制尝试使用Tauri命令保存到分年月文件夹
        await saveHistoryToTauri(newTask)
        console.log('✅ 历史任务已通过Tauri命令保存到分年月文件夹结构')
      } catch (tauriError) {
        console.warn('⚠️ Tauri命令保存失败，使用备用方案:', tauriError)
        // 备用方案：使用localStorage分年月存储
        await saveHistoryTaskToLocalStorage(newTask)
        console.log('✅ 历史任务已保存到localStorage分年月结构')
      }
    } catch (error) {
      console.error('保存历史任务失败:', error)
      showError('保存历史记录失败，请重试')
    }

    setShowExportDialog(false)
    setEnableEditProtection(false)
    setEditProtectionPassword('')
    showSuccess(`已成功导出 ${drawnResults.length} 个抽奖结果并保存到历史`)
  }, [drawnResults, exportFileName, exportFormat, showError, showSuccess, enableEditProtection, editProtectionPassword, historyTasks, selectedGroupId, groups, settings.storageMethod])

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // 小组管理函数
  const addGroup = useCallback(async () => {
    if (!newGroupName.trim()) {
      showError('请输入小组名称')
      return
    }
    
    if (!selectedFile && !newGroupUrl.trim()) {
      showError('请选择文件或输入URL')
      return
    }
    
    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      filePath: selectedFile?.name || '',
      url: newGroupUrl,
      names: [],
      weights: []
    }
    
    // 先添加小组到列表
    setGroups(prev => [...prev, newGroup])
    
    // 如果有选择的文件，解析文件内容
    if (selectedFile) {
      await loadGroupFromFile(newGroup.id, selectedFile)
    }
    
    // 如果有URL，加载URL内容
    if (newGroupUrl.trim()) {
      await loadGroupFromUrl(newGroup.id, newGroupUrl.trim())
    }
    
    // 清空表单
    setNewGroupName('')
    setNewGroupPath('')
    setNewGroupUrl('')
    setSelectedFile(null)
    
    showSuccess(`小组 "${newGroupName.trim()}" 添加成功`)
  }, [newGroupName, selectedFile, newGroupUrl, showError, showSuccess])

  const selectGroup = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group) {
      setNames(group.names)
      setWeights(group.weights)
      setCurrentFile(group.name)
      setSelectedGroupId(groupId)
      engineRef.current.loadData(group.names, group.weights)
      // 不再清空获奖者信息，保持显示上次抽奖结果
      
      // 🔧 保存最后选择的小组ID到localStorage
      saveLastSelectedGroup(groupId)
    }
  }, [groups])

  // 🔧 保存最后选择的小组
  const saveLastSelectedGroup = useCallback(async (groupId: string) => {
    try {
      const { getStorageWayConfig, saveAllSettings } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      if (storageMethod === 'tauriStore') {
        // 使用Tauri Store保存
        await saveAllSettings({
          'last-selected-group': groupId,
          'last-selected-group-updated': new Date().toISOString()
        })
        console.log('✅ 最后选择的小组已保存到Tauri Store:', groupId)
      } else {
        // 使用localStorage保存
        localStorage.setItem('last-selected-group', groupId)
        console.log('✅ 最后选择的小组已保存到localStorage:', groupId)
      }
    } catch (error) {
      console.error('保存最后选择小组失败:', error)
    }
  }, [])

  // 🔧 加载最后选择的小组
  const loadLastSelectedGroup = useCallback(async () => {
    try {
      const { getStorageWayConfig, getSetting } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      let lastGroupId = ''
      
      if (storageMethod === 'tauriStore') {
        // 从Tauri Store加载
        const tauriGroupId = await getSetting('last-selected-group', '')
        lastGroupId = tauriGroupId || ''
        console.log('📖 从Tauri Store加载最后选择的小组:', lastGroupId)
      } else {
        // 从localStorage加载
        const storedGroupId = localStorage.getItem('last-selected-group')
        lastGroupId = storedGroupId || ''
        console.log('📖 从localStorage加载最后选择的小组:', lastGroupId)
      }
      
      if (lastGroupId && groups.length > 0) {
        const group = groups.find(g => g.id === lastGroupId)
        if (group) {
          console.log('🔄 自动加载最后选择的小组:', group.name)
          selectGroup(lastGroupId)
          return true
        } else {
          console.log('⚠️ 最后选择的小组不存在，可能已被删除')
        }
      }
      
      return false
    } catch (error) {
      console.error('加载最后选择小组失败:', error)
      return false
    }
  }, [groups, selectGroup])

  const deleteGroup = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    showConfirm({
      title: '确认删除',
      message: `确定要删除小组 "${group?.name}" 吗？此操作不可撤销。`,
      type: 'danger',
      confirmText: '删除',
      onConfirm: () => {
        setGroups(prev => prev.filter(g => g.id !== groupId))
        if (selectedGroupId === groupId) {
          setSelectedGroupId('')
          setNames([])
          setWeights([])
          setCurrentFile('')
        }
        if (selectedGroupForEdit === groupId) {
          setSelectedGroupForEdit('')
          clearEditForm()
        }
        showSuccess('小组删除成功')
      }
    })
  }, [selectedGroupId, selectedGroupForEdit, groups, showConfirm, showSuccess])

  // 小组编辑功能
  const selectGroupForEdit = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (group) {
      setSelectedGroupForEdit(groupId)
      setEditingGroupName(group.name)
      setEditingGroupPath(group.filePath)
      setEditingGroupUrl(group.url)
      setEditingFile(null)
    }
  }, [groups])

  const clearEditForm = useCallback(() => {
    setSelectedGroupForEdit('')
    setEditingGroupName('')
    setEditingGroupPath('')
    setEditingGroupUrl('')
    setEditingFile(null)
  }, [])

  const updateGroup = useCallback(async () => {
    if (!selectedGroupForEdit || !editingGroupName.trim()) {
      alert('请输入小组名称')
      return
    }

    // 检查名称是否重复（排除当前编辑的小组）
    const nameExists = groups.some(g => 
      g.id !== selectedGroupForEdit && g.name === editingGroupName.trim()
    )
    if (nameExists) {
      alert('小组名称已存在')
      return
    }

    // 更新小组信息
    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroupForEdit) {
        return {
          ...g,
          name: editingGroupName.trim(),
          filePath: editingFile?.name || editingGroupPath,
          url: editingGroupUrl
        }
      }
      return g
    }))

    // 如果有新文件，处理文件内容
    if (editingFile) {
      try {
        const { names: parsedNames, weights: parsedWeights } = await parseFile(editingFile)
        setGroups(prev => prev.map(g => 
          g.id === selectedGroupForEdit 
            ? { ...g, names: parsedNames, weights: parsedWeights, filePath: editingFile.name }
            : g
        ))
      } catch (error) {
        alert(`文件解析失败: ${error}`)
        return
      }
    }

    // 如果有新URL，处理URL内容
    if (editingGroupUrl.trim() && editingGroupUrl !== groups.find(g => g.id === selectedGroupForEdit)?.url) {
      try {
        const response = await fetch(editingGroupUrl.trim())
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const content = await response.text()
        const extension = editingGroupUrl.split('.').pop()?.toLowerCase()
        
        const mockFile = new File([content], `remote.${extension}`, { type: 'text/plain' })
        const { names: parsedNames, weights: parsedWeights } = await parseFile(mockFile)
        
        setGroups(prev => prev.map(g => 
          g.id === selectedGroupForEdit 
            ? { ...g, names: parsedNames, weights: parsedWeights, url: editingGroupUrl }
            : g
        ))
      } catch (error) {
        alert(`URL加载失败: ${error}`)
        return
      }
    }

          showSuccess('小组更新成功')
      clearEditForm()
    }, [selectedGroupForEdit, editingGroupName, editingGroupPath, editingGroupUrl, editingFile, groups, clearEditForm, showSuccess, showError])

  // 小组排序功能
  const moveGroupUp = useCallback((index: number) => {
    if (index > 0) {
      setGroups(prev => {
        const newGroups = [...prev]
        const temp = newGroups[index]
        newGroups[index] = newGroups[index - 1]
        newGroups[index - 1] = temp
        return newGroups
      })
    }
  }, [])

  const moveGroupDown = useCallback((index: number) => {
    setGroups(prev => {
      if (index < prev.length - 1) {
        const newGroups = [...prev]
        const temp = newGroups[index]
        newGroups[index] = newGroups[index + 1]
        newGroups[index + 1] = temp
        return newGroups
      }
      return prev
    })
  }, [])

  const sortGroupsByName = useCallback(() => {
    showConfirm({
      title: '确认排序',
      message: '确定要按名称对小组进行排序吗？这将会重新排列您的小组列表。',
      type: 'info',
      onConfirm: () => {
        setGroups(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)))
        showSuccess('小组排序完成')
      }
    })
  }, [showConfirm, showSuccess])

  const clearGroupSelectionHistory = useCallback(() => {
    showConfirm({
      title: '确认清除历史',
      message: '确定要清除小组选择历史记录吗？这将重置小组的选择顺序。',
      type: 'warning',
      onConfirm: () => {
        setSelectedGroupId('')
        setNames([])
        setWeights([])
        setCurrentFile('')
        showSuccess('小组选择历史记录已清除')
      }
    })
  }, [showConfirm, showSuccess])

  const loadGroupFromFile = useCallback(async (groupId: string, file: File) => {
    try {
      const { names: parsedNames, weights: parsedWeights } = await parseFile(file)
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, names: parsedNames, weights: parsedWeights, filePath: file.name }
          : g
      ))
    } catch (error) {
      alert(`文件解析失败: ${error}`)
    }
  }, [])

  const loadGroupFromUrl = useCallback(async (groupId: string, url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const content = await response.text()
      const extension = url.split('.').pop()?.toLowerCase()
      
      const mockFile = new File([content], `remote.${extension}`, { type: 'text/plain' })
      const { names: parsedNames, weights: parsedWeights } = await parseFile(mockFile)
      
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, names: parsedNames, weights: parsedWeights, url }
          : g
      ))
    } catch (error) {
      alert(`URL加载失败: ${error}`)
    }
  }, [])

  // 根据storeway.json配置加载小组数据
  const loadGroupsFromStorage = useCallback(async () => {
    try {
      // 🔧 直接从storeway.json读取存储方案
      const { getStorageWayConfig, getSetting } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      if (storageMethod === 'tauriStore') {
        // 从Tauri Store加载
        const savedGroups = await getSetting('lottery-groups', [])
        if (savedGroups && Array.isArray(savedGroups)) {
          setGroups(savedGroups)
          console.log('✅ 从Tauri Store加载小组数据:', savedGroups.length, '个小组')
        }
      } else {
        // 从localStorage加载
      const savedGroups = localStorage.getItem('lottery-groups')
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups)
        setGroups(parsedGroups)
          console.log('✅ 从localStorage加载小组数据:', parsedGroups.length, '个小组')
        }
      }
    } catch (error) {
      console.error('加载小组数据失败:', error)
    }
  }, [])

  // 根据storeway.json配置保存小组数据
  const saveGroupsToStorage = useCallback(async (groupsToSave: typeof groups) => {
    try {
      // 🔧 直接从storeway.json读取存储方案
      const { getStorageWayConfig, saveAllSettings } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      if (storageMethod === 'tauriStore') {
        // 使用Tauri Store保存
        await saveAllSettings({
          'lottery-groups': groupsToSave,
          'lottery-groups-updated': new Date().toISOString()
        })
        console.log('✅ 小组数据已保存到Tauri Store')
      } else {
        // 使用localStorage保存
      localStorage.setItem('lottery-groups', JSON.stringify(groupsToSave))
        console.log('✅ 小组数据已保存到localStorage')
      }
    } catch (error) {
      console.error('保存小组数据失败:', error)
    }
  }, [])

  // 根据storeway.json强制读取存储方案加载设置数据
  const loadSettingsFromStorage = useCallback(async () => {
    try {
      // 🔧 强制从storeway.json读取存储方案，确保使用正确的存储方式
      const { getStorageWayConfig, getSetting } = await import('@/lib/officialStore');
      const currentStorageMethod = await getStorageWayConfig();
      
      if (currentStorageMethod === 'tauriStore') {
        // 从Tauri Store加载
        const savedSettings = await getSetting('lottery-settings')
        if (savedSettings && typeof savedSettings === 'object') {
          setSettings(prev => ({ ...prev, ...savedSettings, storageMethod: currentStorageMethod }))
          console.log('✅ 从Tauri Store加载设置数据')
        } else {
          // 确保storageMethod被正确设置
          setSettings(prev => ({ ...prev, storageMethod: currentStorageMethod }))
        }
        
        const savedDrawMode = await getSetting('lottery-draw-mode')
        if (savedDrawMode) {
          setDrawMode(savedDrawMode as 'equal' | 'weighted')
        }
        
        const savedAllowRepeat = await getSetting('lottery-allow-repeat')
        if (typeof savedAllowRepeat === 'boolean') {
          setAllowRepeat(savedAllowRepeat)
        }
      } else {
        // 从localStorage加载
        const savedSettings = localStorage.getItem('lottery-settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsedSettings, storageMethod: currentStorageMethod }))
          console.log('✅ 从localStorage加载设置数据')
        } else {
          // 确保storageMethod被正确设置
          setSettings(prev => ({ ...prev, storageMethod: currentStorageMethod }))
        }
        
        const savedDrawMode = localStorage.getItem('lottery-draw-mode')
        if (savedDrawMode) {
          setDrawMode(savedDrawMode as 'equal' | 'weighted')
        }
        
        const savedAllowRepeat = localStorage.getItem('lottery-allow-repeat')
        if (savedAllowRepeat) {
          setAllowRepeat(JSON.parse(savedAllowRepeat))
        }
      }
    } catch (error) {
      console.error('加载设置数据失败:', error)
    }
  }, [])

  // 根据storeway.json强制读取存储方案保存设置数据
  const saveSettingsToStorage = useCallback(async () => {
    try {
      // 🔧 强制从storeway.json读取存储方案，确保使用正确的存储方式
      const { getStorageWayConfig, saveAllSettings } = await import('@/lib/officialStore');
      const currentStorageMethod = await getStorageWayConfig();
      
      if (currentStorageMethod === 'tauriStore') {
        // 使用Tauri Store保存
        await saveAllSettings({
          'lottery-settings': { ...settings, storageMethod: currentStorageMethod },
          'lottery-draw-mode': drawMode,
          'lottery-allow-repeat': allowRepeat,
          'lottery-settings-updated': new Date().toISOString()
        })
        console.log('✅ 设置数据已保存到Tauri Store')
      } else {
        // 使用localStorage保存
        localStorage.setItem('lottery-settings', JSON.stringify({ ...settings, storageMethod: currentStorageMethod }))
        localStorage.setItem('lottery-draw-mode', drawMode)
        localStorage.setItem('lottery-allow-repeat', JSON.stringify(allowRepeat))
        console.log('✅ 设置数据已保存到localStorage')
      }
    } catch (error) {
      console.error('保存设置数据失败:', error)
    }
  }, [settings, drawMode, allowRepeat])

    // 根据storeway.json配置加载历史任务
  const loadHistoryTasks = useCallback(async () => {
    try {
      console.log('🔄 开始加载历史任务...');
      
      // 🔧 首先尝试从localStorage加载（作为备用方案）
      const localStorageTasks = await loadHistoryTasksFromLocalStorage();
      console.log('📖 从localStorage扫描到:', localStorageTasks.length, '个任务');
      
      try {
        // 🔧 然后尝试从storeway.json读取存储方案
      const { getStorageWayConfig, getHistoryData } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
        console.log('📋 检测到存储方案:', storageMethod);
      
      if (storageMethod === 'tauriStore') {
        // 从Tauri Store纯文件夹结构加载（无索引文件）
        const savedTasks = await getHistoryData()
          if (savedTasks && Array.isArray(savedTasks) && savedTasks.length > 0) {
          setHistoryTasks(savedTasks)
          console.log('✅ 从Tauri Store纯文件夹结构加载历史任务:', savedTasks.length, '个任务')
            return;
          } else {
            console.log('⚠️ Tauri Store中没有历史任务，使用localStorage数据');
        }
      } else {
          console.log('📂 使用localStorage存储方案');
        }
      } catch (storageError) {
        console.warn('⚠️ 存储方案检测失败，使用localStorage备用方案:', storageError);
      }
      
      // 🔧 无论如何都设置localStorage的数据（确保有数据显示）
      setHistoryTasks(localStorageTasks);
      console.log('✅ 最终加载历史任务:', localStorageTasks.length, '个任务');
      
    } catch (error) {
      console.error('❌ 加载历史任务失败:', error);
      // 最后的备用方案：设置空数组
      setHistoryTasks([]);
    }
  }, [])

  // 根据storeway.json配置保存历史任务
  const saveHistoryTasks = useCallback(async (tasksToSave: typeof historyTasks) => {
    try {
      // 🔧 直接从storeway.json读取存储方案
      const { getStorageWayConfig, saveHistoryData } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      if (storageMethod === 'tauriStore') {
        // 使用Tauri Store纯文件夹存储方案批量保存（无索引文件）
        await saveHistoryData(tasksToSave)
        console.log('✅ 历史任务已批量保存到Tauri Store纯文件夹结构')
      } else {
        // 使用localStorage分年月存储
        await saveHistoryTasksToLocalStorage(tasksToSave)
        console.log('✅ 历史任务已保存到localStorage分年月结构')
      }
    } catch (error) {
      console.error('保存历史任务失败:', error)
    }
  }, [])

  // === localStorage分年月存储管理 ===
  
  // 解析年月信息
  const parseYearMonth = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1 // JS月份从0开始，转为1-12
    };
  };

  // localStorage分年月存储：保存单个历史任务
  const saveHistoryTaskToLocalStorage = async (task: any) => {
    try {
      console.log('💾 开始保存历史任务到localStorage分年月结构...');
      console.log('📋 任务数据:', task);
      
      const { year, month } = parseYearMonth(task.timestamp);
      const monthStr = month.toString().padStart(2, '0');
      const storageKey = `lottery-history-${year}-${monthStr}`;
      
      console.log(`📅 解析时间: ${year}年${month}月，存储键: ${storageKey}`);
      
      // 强制保存到年月存储键
      try {
        // 获取当月现有任务
        const existingTasksStr = localStorage.getItem(storageKey);
        const existingTasks = existingTasksStr ? JSON.parse(existingTasksStr) : [];
        console.log(`📖 当月现有任务数: ${existingTasks.length}`);
        
        // 检查是否已存在，如果存在则更新，否则添加
        const existingIndex = existingTasks.findIndex((t: any) => t.id === task.id);
        if (existingIndex >= 0) {
          existingTasks[existingIndex] = task;
          console.log(`📝 更新localStorage历史记录: ${storageKey}`);
        } else {
          existingTasks.unshift(task); // 新记录添加到开头
          console.log(`📝 添加localStorage历史记录: ${storageKey}`);
        }
        
        // 强制保存回localStorage
        const dataToSave = JSON.stringify(existingTasks);
        localStorage.setItem(storageKey, dataToSave);
        
        // 验证保存是否成功
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          console.log(`✅ 已保存到${storageKey}，当月任务数: ${existingTasks.length}`);
        } else {
          throw new Error('localStorage保存失败：数据未找到');
        }
      } catch (saveError) {
        console.error('❌ localStorage年月存储失败:', saveError);
        throw saveError;
      }
      
      // 强制更新全局索引
      try {
        await updateLocalStorageHistoryIndex();
        console.log('✅ localStorage全局索引已更新');
      } catch (indexError) {
        console.error('❌ localStorage索引更新失败:', indexError);
        throw indexError;
      }
      
      console.log('🎉 localStorage历史任务保存完成!');
    } catch (error) {
      console.error('❌ 保存localStorage历史任务失败:', error);
      throw error;
    }
  };

  // localStorage分年月存储：批量保存历史任务
  const saveHistoryTasksToLocalStorage = async (tasks: any[]) => {
    try {
      console.log('💾 开始批量保存历史任务到localStorage分年月结构...');
      
      for (const task of tasks) {
        await saveHistoryTaskToLocalStorage(task);
      }
      
      console.log('✅ 批量保存localStorage历史任务完成:', tasks.length, '个任务');
    } catch (error) {
      console.error('❌ 批量保存localStorage历史任务失败:', error);
    }
  };

  // 更新localStorage历史记录索引
  const updateLocalStorageHistoryIndex = async () => {
    try {
      console.log('🔄 开始更新localStorage历史记录索引...');
      const allTasks: any[] = [];
      const foundKeys: string[] = [];
      
      // 遍历所有localStorage键，查找历史记录
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lottery-history-') && key !== 'lottery-history-tasks') {
          foundKeys.push(key);
          try {
            const tasksStr = localStorage.getItem(key);
            if (tasksStr) {
              const tasks = JSON.parse(tasksStr);
              if (Array.isArray(tasks)) {
                allTasks.push(...tasks);
                console.log(`📖 从${key}加载了${tasks.length}个任务`);
              }
            }
          } catch (parseError) {
            console.error(`❌ 解析${key}失败:`, parseError);
          }
        }
      }
      
      console.log(`📋 找到${foundKeys.length}个年月存储键:`, foundKeys);
      console.log(`📊 总共收集到${allTasks.length}个任务`);
      
      // 按时间戳排序，最新的在前
      allTasks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 强制更新主索引
      const indexData = JSON.stringify(allTasks);
      localStorage.setItem('lottery-history-tasks', indexData);
      
      // 验证索引保存是否成功
      const savedIndex = localStorage.getItem('lottery-history-tasks');
      if (savedIndex) {
        const parsedIndex = JSON.parse(savedIndex);
        console.log('✅ localStorage历史记录索引已更新:', parsedIndex.length, '个任务');
      } else {
        throw new Error('索引保存失败：数据未找到');
      }
    } catch (error) {
      console.error('❌ 更新localStorage历史记录索引失败:', error);
      throw error;
    }
  };

  // localStorage分年月存储：加载所有历史任务
  const loadHistoryTasksFromLocalStorage = async () => {
    try {
      console.log('📖 从localStorage分年月结构加载历史任务...');
      
      // 🔧 强制重建索引：先扫描所有分年月的key收集数据
      const allTasks: any[] = [];
      const foundKeys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lottery-history-') && key !== 'lottery-history-tasks') {
          foundKeys.push(key);
          try {
          const tasks = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(tasks)) {
          allTasks.push(...tasks);
              console.log(`📖 从${key}加载了${tasks.length}个任务`);
            }
          } catch (parseError) {
            console.error(`❌ 解析${key}失败:`, parseError);
          }
        }
      }
      
      console.log(`📋 扫描到${foundKeys.length}个年月存储键:`, foundKeys);
      console.log(`📊 总共收集到${allTasks.length}个任务`);
      
      // 按时间戳排序，最新的在前
      allTasks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 🔧 强制更新索引，确保下次能从索引快速加载
      if (allTasks.length > 0) {
        try {
          const indexData = JSON.stringify(allTasks);
          localStorage.setItem('lottery-history-tasks', indexData);
          console.log('✅ 历史记录索引已强制重建:', allTasks.length, '个任务');
        } catch (indexError) {
          console.error('❌ 重建索引失败:', indexError);
        }
      }
      
      console.log('✅ 从localStorage分年月结构加载历史任务:', allTasks.length, '个');
      return allTasks;
    } catch (error) {
      console.error('❌ 从localStorage加载历史任务失败:', error);
      return [];
    }
  };

  // localStorage分年月存储：删除历史任务
  const deleteHistoryTaskFromLocalStorage = async (taskId: string) => {
    try {
      console.log('🗑️ 从localStorage分年月结构删除历史任务:', taskId);
      
      // 遍历所有年月存储，查找并删除任务
      let found = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lottery-history-') && key !== 'lottery-history-tasks') {
          const tasks = JSON.parse(localStorage.getItem(key) || '[]');
          const filteredTasks = tasks.filter((t: any) => t.id !== taskId);
          
          if (tasks.length !== filteredTasks.length) {
            localStorage.setItem(key, JSON.stringify(filteredTasks));
            found = true;
            console.log(`✅ 从${key}删除任务成功`);
          }
        }
      }
      
      if (found) {
        // 更新索引
        await updateLocalStorageHistoryIndex();
      }
      
      return found;
    } catch (error) {
      console.error('❌ 从localStorage删除历史任务失败:', error);
      return false;
    }
  };

  // 根据storeway.json配置加载历史记录详细数据
  const loadHistoryTaskDetail = useCallback(async (taskId: string) => {
    try {
      // 🔧 直接从storeway.json读取存储方案
      const { getStorageWayConfig, getHistoryTask } = await import('@/lib/officialStore')
      const storageMethod = await getStorageWayConfig()
      
      if (storageMethod === 'tauriStore') {
        // 从纯文件夹结构加载详细数据（无索引文件）
        const taskDetail = await getHistoryTask(taskId)
        if (taskDetail) {
          setSelectedTaskDetail(taskDetail)
          console.log('✅ 历史记录详细数据已从文件夹加载:', taskId)
        } else {
          // 如果文件夹中没有找到，使用内存中的数据
          const indexTask = historyTasks.find(t => t.id === taskId)
          setSelectedTaskDetail(indexTask)
          console.log('⚠️ 使用内存数据作为详细数据:', taskId)
        }
      } else {
        // localStorage模式，直接使用现有数据
        const task = historyTasks.find(t => t.id === taskId)
        setSelectedTaskDetail(task)
        console.log('✅ 从localStorage内存数据加载:', taskId)
      }
    } catch (error) {
      console.error('加载历史记录详细数据失败:', error)
      // 回退到内存数据
      const indexTask = historyTasks.find(t => t.id === taskId)
      setSelectedTaskDetail(indexTask)
    }
  }, [historyTasks])

  // 显示密码对话框
  const showPasswordDialogFunc = useCallback((config: {
    title: string
    message: string
    onConfirm: (password: string) => void
    onCancel?: () => void
  }) => {
    setPasswordDialogConfig(config)
    setPasswordInput('')
    setShowPasswordDialogState(true)
  }, [])

  // 页面初始加载时读取数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 应用启动 - 开始初始化数据...');
        
        // 🔧 窗口状态管理：恢复窗口大小和位置（仅在 Tauri 环境下）
        try {
          const { restoreStateCurrent, StateFlags } = await import('@tauri-apps/plugin-window-state')
          await restoreStateCurrent(StateFlags.ALL)
          console.log('✅ 窗口状态已恢复')
        } catch (windowError) {
          // Tauri 环境不可用时静默跳过
          console.log('💡 窗口状态功能在非 Tauri 环境下跳过')
        }
        
        // 🔧 第一步：直接从storeway.json读取存储方式，不使用storageManager
        const { getStorageWayConfig } = await import('@/lib/officialStore');
        const currentStorageMethod = await getStorageWayConfig();
        
        console.log('✅ 存储管理器初始化完成，当前方式:', currentStorageMethod);
        
        // 第二步：根据存储方式加载数据
        if (currentStorageMethod === 'tauriStore') {
          try {
            console.log('📂 使用Tauri Store加载数据...');
            const { getSetting, initializeDirectoryStructure, verifyAndRepairData } = await import('@/lib/officialStore');
            
            // 初始化目录结构
            await initializeDirectoryStructure();
            console.log('✅ 目录结构初始化完成');
            
            // 验证和修复数据完整性
            await verifyAndRepairData();
            console.log('✅ 数据完整性验证完成');
            
            // 加载设置数据，确保storageMethod使用storeway.json中的值
            const tauriSettings = await getSetting('lottery-settings');
            if (tauriSettings && typeof tauriSettings === 'object') {
              setSettings(prev => ({ 
                ...prev, 
                ...tauriSettings, 
                storageMethod: currentStorageMethod // 强制使用storeway.json中的存储方式
              }));
              console.log('✅ 从Tauri Store加载设置数据，存储方式:', currentStorageMethod);
            } else {
              // 如果没有设置数据，至少更新storageMethod
              setSettings(prev => ({ ...prev, storageMethod: currentStorageMethod }));
              console.log('✅ 设置存储方式为:', currentStorageMethod);
            }
            
            // 加载其他数据
            const tauriDrawMode = await getSetting('lottery-draw-mode');
            if (tauriDrawMode) {
              setDrawMode(tauriDrawMode as 'equal' | 'weighted');
            }
            
            const tauriAllowRepeat = await getSetting('lottery-allow-repeat');
            if (typeof tauriAllowRepeat === 'boolean') {
              setAllowRepeat(tauriAllowRepeat);
            }
            
            const tauriGroups = await getSetting('lottery-groups', []);
            if (tauriGroups && Array.isArray(tauriGroups)) {
              setGroups(tauriGroups);
              console.log('✅ 从Tauri Store加载小组数据:', tauriGroups.length, '个小组');
            }
          } catch (error) {
            console.warn('Tauri Store加载失败，回退到localStorage:', error);
            await loadFromLocalStorage();
          }
        } else {
          console.log('🌐 使用localStorage加载数据...');
          await loadFromLocalStorage();
          // 确保localStorage方式下也更新storageMethod
          setSettings(prev => ({ ...prev, storageMethod: currentStorageMethod }));
        }
        
        // 🔧 加载历史任务 - 在localStorage模式下强制重建索引
        console.log('📚 开始加载历史任务...');
        await loadHistoryTasks();
        
        console.log('🎉 数据初始化完成!');
        
        // 🔧 设置窗口状态自动保存（仅在 Tauri 环境下）
        try {
          const { saveWindowState, StateFlags } = await import('@tauri-apps/plugin-window-state')
          
          // 窗口大小变化时保存状态
          const saveWindowStateHandler = async () => {
            try {
              await saveWindowState(StateFlags.ALL)
              console.log('✅ 窗口状态已保存')
            } catch (saveError) {
              console.warn('⚠️ 窗口状态保存失败:', saveError)
            }
          }
          
          // 添加事件监听器
          window.addEventListener('resize', saveWindowStateHandler)
          window.addEventListener('beforeunload', saveWindowStateHandler)
          
          // 定期保存窗口状态（每30秒）
          const saveInterval = setInterval(saveWindowStateHandler, 30000)
          
          // 清理函数
          return () => {
            window.removeEventListener('resize', saveWindowStateHandler)
            window.removeEventListener('beforeunload', saveWindowStateHandler)
            clearInterval(saveInterval)
          }
        } catch (windowStateError) {
          // Tauri 环境不可用时静默跳过
          console.log('💡 窗口状态自动保存功能在非 Tauri 环境下跳过')
        }
        
      } catch (error) {
        console.error('❌ 初始化数据失败:', error);
        // 出错时回退到localStorage
        await loadFromLocalStorage();
      }
    }
    
    const loadFromLocalStorage = async () => {
      try {
        console.log('🔧 从localStorage加载数据...');
        
        // 从localStorage加载设置
        const savedSettings = localStorage.getItem('lottery-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          console.log('✅ 从localStorage加载设置数据');
        } else {
          console.log('📝 localStorage设置数据不存在，将使用默认设置');
        }
        
        const savedDrawMode = localStorage.getItem('lottery-draw-mode');
        if (savedDrawMode) {
          setDrawMode(savedDrawMode as 'equal' | 'weighted');
        }
        
        const savedAllowRepeat = localStorage.getItem('lottery-allow-repeat');
        if (savedAllowRepeat) {
          setAllowRepeat(JSON.parse(savedAllowRepeat));
        }
        
        // 从localStorage加载小组
        const savedGroups = localStorage.getItem('lottery-groups');
        if (savedGroups) {
          const parsedGroups = JSON.parse(savedGroups);
          setGroups(parsedGroups);
          console.log('✅ 从localStorage加载小组数据:', parsedGroups.length, '个小组');
        }
        
        // 🔧 验证localStorage分年月历史数据并显示详细信息
        let foundHistoryKeys = 0;
        const historyKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('lottery-history-') && key !== 'lottery-history-tasks') {
            foundHistoryKeys++;
            historyKeys.push(key);
          }
        }
        console.log(`✅ localStorage验证完成，找到${foundHistoryKeys}个历史存储键:`, historyKeys);
        
        // 🔧 检查索引文件状态
        const indexData = localStorage.getItem('lottery-history-tasks');
        if (indexData) {
          try {
            const indexTasks = JSON.parse(indexData);
            console.log(`📋 历史记录索引存在，包含${indexTasks.length}条记录`);
          } catch (error) {
            console.error('❌ 历史记录索引解析失败:', error);
          }
        } else {
          console.log('⚠️ 历史记录索引不存在，需要重建');
        }
        
        // 🔧 强制加载localStorage历史记录
        console.log('🔄 在localStorage模式下强制加载历史记录...');
        try {
          const localTasks = await loadHistoryTasksFromLocalStorage();
          setHistoryTasks(localTasks);
          console.log('✅ localStorage模式历史记录加载完成:', localTasks.length, '个任务');
        } catch (historyError) {
          console.error('❌ localStorage历史记录加载失败:', historyError);
          setHistoryTasks([]);
        }
        
      } catch (error) {
        console.error('❌ 从localStorage加载数据失败:', error);
      }
    }
    
    initializeData();
  }, [])

  // 监听主题变化，应用到HTML根元素
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }, [settings.theme])

  // 小组数据变化时保存
  useEffect(() => {
    if (groups.length > 0) {
      saveGroupsToStorage(groups)
    }
  }, [groups, saveGroupsToStorage])

  // 🔧 小组数据加载完成后，自动加载最后选择的小组
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      // 延迟执行，确保组件完全初始化
      const timer = setTimeout(async () => {
        const loaded = await loadLastSelectedGroup()
        if (loaded) {
          console.log('✅ 已自动加载最后选择的小组')
        } else {
          console.log('📝 没有最后选择的小组记录')
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [groups, selectedGroupId, loadLastSelectedGroup])

  // 设置数据变化时保存
  useEffect(() => {
    // 延迟保存，避免初始化时的多次保存
    const timeoutId = setTimeout(() => {
      saveSettingsToStorage()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [settings, drawMode, allowRepeat, saveSettingsToStorage])

  // 存储方案切换处理
  const handleStorageMethodChange = useCallback(async (newMethod: 'localStorage' | 'tauriStore') => {
    try {
      console.log('🔄 开始切换存储方案到:', newMethod);
      
      // 🔧 第一步：直接保存到storeway.json
      const { saveStorageWayConfig } = await import('@/lib/officialStore');
      await saveStorageWayConfig(newMethod);
      console.log('✅ 存储方案已保存到storeway.json:', newMethod);
      
      // 🔧 第二步：更新本地状态（立即生效）
      setSettings(prev => ({ ...prev, storageMethod: newMethod }));
      
      const methodNames = {
        localStorage: 'localStorage浏览器存储',
        tauriStore: 'Tauri Store文件存储'
      };
      
      // 🔧 第三步：数据迁移到新存储方案
      if (newMethod === 'tauriStore') {
        console.log('📂 迁移数据到Tauri Store纯文件夹架构...');
        const { saveAllSettings, saveHistoryData } = await import('@/lib/officialStore');
        
        // 保存设置和小组数据到settings.json
        await saveAllSettings({
          'lottery-settings': { ...settings, storageMethod: newMethod },
          'lottery-draw-mode': drawMode,
          'lottery-allow-repeat': allowRepeat,
          'lottery-groups': groups,
          'lottery-settings-updated': new Date().toISOString()
        });
        
        // 历史任务迁移到纯文件夹结构（无索引文件）
        if (historyTasks.length > 0) {
          await saveHistoryData(historyTasks);
          console.log('✅ 历史记录已迁移到纯文件夹结构');
        }
        
        console.log('✅ 数据已完全迁移到Tauri Store纯文件夹架构');
      } else {
        console.log('📂 迁移数据到localStorage分年月架构...');
        
        // 保存设置到localStorage
        localStorage.setItem('lottery-settings', JSON.stringify({ ...settings, storageMethod: newMethod }));
        localStorage.setItem('lottery-draw-mode', drawMode);
        localStorage.setItem('lottery-allow-repeat', JSON.stringify(allowRepeat));
        localStorage.setItem('lottery-groups', JSON.stringify(groups));
        
        // 历史任务迁移到localStorage分年月结构
        if (historyTasks.length > 0) {
          await saveHistoryTasksToLocalStorage(historyTasks);
          console.log('✅ 历史记录已迁移到localStorage分年月架构');
        }
        
        console.log('✅ 数据已完全迁移到localStorage分年月架构');
      }
      
      showSuccess(`已切换到${methodNames[newMethod]}，数据已自动迁移`);
      console.log('🎉 存储方案切换完成!');
    } catch (error) {
      console.error('❌ 切换存储方案失败:', error);
      showError('切换存储方案失败');
    }
  }, [settings, drawMode, allowRepeat, groups, historyTasks, showError, showSuccess])

  // 简化的自动保存机制
  useEffect(() => {
    if (groups.length > 0) {
      const timeoutId = setTimeout(() => {
        saveGroupsToStorage(groups)
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [groups, saveGroupsToStorage])



  // 处理左侧空白区域点击
  const handleLeftSideClick = useCallback(() => {
    if (names.length === 0) return
    
    if (isDrawing) {
      // 如果正在抽奖，点击左侧停止抽奖
      if (canStop) {
        stopLottery()
      }
    } else {
      // 如果没有在抽奖，点击左侧开始抽奖
      const isDisabled = !allowRepeat && drawCount > engineRef.current.getRemainingCount()
      if (!isDisabled) {
        startLottery()
      }
    }
  }, [names.length, isDrawing, canStop, stopLottery, allowRepeat, drawCount, engineRef, startLottery])

  // 处理右侧空白区域点击
  const handleRightSideClick = useCallback(() => {
    if (names.length === 0) return
    
    if (isDrawing) {
      // 如果正在抽奖，点击右侧停止抽奖
      if (canStop) {
        stopLottery()
      }
    } else {
      // 如果没有在抽奖，点击右侧开始抽奖
      const isDisabled = !allowRepeat && drawCount > engineRef.current.getRemainingCount()
      if (!isDisabled) {
        startLottery()
      }
    }
  }, [names.length, isDrawing, canStop, stopLottery, allowRepeat, drawCount, engineRef, startLottery])

  useEffect(() => {
    // 监听窗口大小调整事件
    const unlisten = listen('window-resize', () => {
      // 触发重新渲染
      window.requestAnimationFrame(() => {
        // 强制重新计算布局
        document.body.style.minHeight = '100vh';
        setTimeout(() => {
          document.body.style.minHeight = '';
        }, 0);
      });
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      {/* 左侧点击区域 */}
      <div 
        className="flex-1 min-h-screen cursor-pointer transition-colors hover:bg-gray-800/20 flex items-center justify-center"
        onClick={handleLeftSideClick}
        title={names.length === 0 ? "请先选择小组" : isDrawing ? (canStop ? "点击停止抽奖" : "抽奖进行中") : "点击开始抽奖"}
      >
        <div className="text-gray-600 text-sm select-none opacity-0 hover:opacity-50 transition-opacity">
          {names.length === 0 ? "请先选择小组" : isDrawing ? (canStop ? "点击停止" : "") : "点击开始"}
        </div>
      </div>
      
      {/* 中间主要内容区域 - 固定宽度 */}
      <div className="w-full max-w-4xl px-4 py-8">
        {/* 应用标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">StarRandom</h1>
          <p className="text-gray-400">现代化的抽奖系统</p>
        </div>

        {/* 文件信息 */}
        <FileInfoDisplay currentFile={currentFile} names={names} engineRef={engineRef} allowRepeat={allowRepeat} refreshTrigger={remainingCountTrigger} />

        {/* 抽奖结果区域 */}
        <LotteryResultDisplay 
          isDrawing={isDrawing} 
          rollingName={rollingName} 
          winners={winners} 
          settings={settings} 
          resetLottery={resetLottery} 
          startLottery={startLottery} 
          allowRepeat={allowRepeat} 
          drawCount={drawCount} 
          engineRef={engineRef} 
          names={names} 
        />

        {/* 抽奖人数配置 */}
        <DrawCountConfig 
          drawCount={drawCount} 
          setDrawCount={setDrawCount} 
          allowRepeat={allowRepeat} 
          names={names} 
        />

        {/* 控制区域 */}
        <ControlButtonsArea 
          selectedGroupId={selectedGroupId}
          groups={groups}
          selectGroup={selectGroup}
          isDrawing={isDrawing}
          startLottery={startLottery}
          names={names}
          canStop={canStop}
          stopLottery={stopLottery}
          settings={settings}
          drawnResults={drawnResults}
          exportResults={exportResults}
          setShowHistoryDialog={setShowHistoryDialog}
          setShowSettings={setShowSettings}
          showPasswordDialog={showPasswordDialogFunc}
        />

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 设置对话框 */}
        {showSettings && (
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <Card className="p-6 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">应用设置</h2>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                <TabsList>
                  <TabsTrigger value="groups">小组管理</TabsTrigger>
                  <TabsTrigger value="basic">基本设置</TabsTrigger>
                  <TabsTrigger value="animation">动画设置</TabsTrigger>
                  <TabsTrigger value="ui">界面设置</TabsTrigger>
                  <TabsTrigger value="advanced">高级设置</TabsTrigger>
                  <TabsTrigger value="security">安全设置</TabsTrigger>
                  <TabsTrigger value="about">关于</TabsTrigger>
                </TabsList>

                <TabsContent value="groups">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        小组管理
                      </h3>
                      <p className="text-gray-400 text-sm">创建和管理抽奖小组，支持文件导入和URL链接</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-medium text-gray-200">小组列表</h4>
                          <div className="flex gap-2">
                            <Button
                              onClick={sortGroupsByName}
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1.5 px-3 py-2 text-blue-400 border-blue-400 hover:bg-blue-400/10 transition-all duration-200"
                            >
                              <ArrowUpDown className="w-5 h-5" />
                              按名称排序
                            </Button>
                            <Button
                              onClick={clearGroupSelectionHistory}
                              variant="outline"
                              size="sm"
                              className="text-xs flex items-center gap-1.5 px-3 py-2 text-yellow-400 border-yellow-400 hover:bg-yellow-400/10 transition-all duration-200"
                            >
                              <RotateCcw className="w-5 h-5" />
                              清除历史
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {groups.map((group, index) => (
                            <div
                              key={group.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedGroupForEdit === group.id
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : selectedGroupId === group.id
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                              }`}
                              onClick={() => selectGroupForEdit(group.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">{group.name}</span>
                                    {selectedGroupId === group.id && (
                                      <span className="text-xs bg-green-600 text-white px-1 rounded">当前</span>
                                    )}
                                    {selectedGroupForEdit === group.id && (
                                      <span className="text-xs bg-blue-600 text-white px-1 rounded">编辑中</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {group.names.length} 人 | {group.filePath || group.url || '未加载'}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={(e: any) => {
                                      e.stopPropagation()
                                      moveGroupUp(index)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    onClick={(e: any) => {
                                      e.stopPropagation()
                                      moveGroupDown(index)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                                    disabled={index === groups.length - 1}
                                  >
                                    <ChevronDown className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    onClick={(e: any) => {
                                      e.stopPropagation()
                                      deleteGroup(group.id)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {groups.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                              还没有创建任何小组
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                          {selectedGroupForEdit ? (
                            <>
                              <Edit className="w-5 h-5" />
                              编辑小组
                            </>
                          ) : (
                            <>
                              <Users className="w-5 h-5" />
                              添加小组
                            </>
                          )}
                        </h4>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              小组名称
                            </label>
                            <input
                              type="text"
                              value={selectedGroupForEdit ? editingGroupName : newGroupName}
                              onChange={(e) => {
                                if (selectedGroupForEdit) {
                                  setEditingGroupName(e.target.value)
                                } else {
                                  setNewGroupName(e.target.value)
                                }
                              }}
                              placeholder="请输入小组名称"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200 flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              名单文件
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={selectedGroupForEdit ? (editingFile?.name || editingGroupPath) : newGroupPath}
                                placeholder="选择文件..."
                                readOnly
                                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                              <Button
                                onClick={() => {
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = '.csv,.txt,.json'
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) {
                                      if (selectedGroupForEdit) {
                                        setEditingFile(file)
                                      } else {
                                        setSelectedFile(file)
                                        setNewGroupPath(file.name)
                                      }
                                    }
                                  }
                                  input.click()
                                }}
                                variant="outline"
                                className="h-12"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                选择文件
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">支持 CSV、TXT、JSON 格式文件</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">或输入URL链接</label>
                            <input
                              type="url"
                              value={selectedGroupForEdit ? editingGroupUrl : newGroupUrl}
                              onChange={(e) => {
                                if (selectedGroupForEdit) {
                                  setEditingGroupUrl(e.target.value)
                                } else {
                                  setNewGroupUrl(e.target.value)
                                }
                              }}
                              placeholder="https://example.com/names.csv"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <p className="text-xs text-gray-500">从网络URL导入名单数据</p>
                          </div>
                          
                          <div className="pt-4 border-t border-gray-700">
                            <div className="flex gap-3">
                              {selectedGroupForEdit ? (
                                <>
                                  <Button onClick={updateGroup} className="flex-1 h-12">
                                    <Save className="w-4 h-4 mr-2" />
                                    保存修改
                                  </Button>
                                  <Button onClick={clearEditForm} variant="outline" className="flex-1 h-12">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    取消编辑
                                  </Button>
                                </>
                              ) : (
                                <Button onClick={addGroup} className="w-full h-12">
                                  <Users className="w-4 h-4 mr-2" />
                                  添加小组
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="basic">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">基本设置</h3>
                      <p className="text-gray-400 text-sm">配置抽奖的基本参数和行为</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">抽奖数量</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.drawCount}
                          onChange={(e) => updateSetting('drawCount', parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">设置每次抽奖的人数</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">抽奖模式</label>
                        <select
                          value={drawMode}
                          onChange={(e) => setDrawMode(e.target.value as 'equal' | 'weighted')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="equal">等概率抽奖</option>
                          <option value="weighted">权重抽奖</option>
                        </select>
                        <p className="text-xs text-gray-500">选择抽奖的概率分布方式</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200">行为选项</h4>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="allowRepeat"
                          checked={allowRepeat}
                          onChange={(e) => setAllowRepeat(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="allowRepeat" className="text-gray-200 font-medium cursor-pointer">允许重复抽取</label>
                          <p className="text-sm text-gray-400 mt-1">开启后同一个人可能被多次抽中</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="resetAfterDraw"
                          checked={settings.resetAfterDraw}
                          onChange={(e) => updateSetting('resetAfterDraw', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="resetAfterDraw" className="text-gray-200 font-medium cursor-pointer">抽奖后自动重置</label>
                          <p className="text-sm text-gray-400 mt-1">每次抽奖完成后自动重置名单，清空获奖者和抽奖结果历史</p>
                          <p className="text-xs text-orange-300 mt-1">💡 注意：开启后将完全重置抽奖状态，包括获奖者和历史记录</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="animation">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">动画设置</h3>
                      <p className="text-gray-400 text-sm">配置动画效果和音效设置</p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="useAnimation"
                          checked={settings.useAnimation}
                          onChange={(e) => updateSetting('useAnimation', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="useAnimation" className="text-gray-200 font-medium cursor-pointer">启用动画效果</label>
                          <p className="text-sm text-gray-400 mt-1">显示抽奖过程中的动画效果</p>
                        </div>
                      </div>
                      
                      {settings.useAnimation && (
                        <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg ml-6">
                          <input
                            type="checkbox"
                            id="manualStopMode"
                            checked={settings.manualStopMode}
                            onChange={(e) => updateSetting('manualStopMode', e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                          <div>
                            <label htmlFor="manualStopMode" className="text-gray-200 font-medium cursor-pointer">手动停止模式</label>
                            <p className="text-sm text-gray-400 mt-1">开启后需要手动点击停止，否则按设定时间自动停止</p>
                          </div>
                        </div>
                      )}
                      
                                              {!settings.manualStopMode && (
                      <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-200">动画持续时间</label>
                          <span className="text-sm text-blue-400 font-mono bg-blue-400/10 px-2 py-1 rounded">{settings.animationDuration}ms</span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="3000"
                          step="100"
                          value={settings.animationDuration}
                          onChange={(e) => updateSetting('animationDuration', parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((settings.animationDuration - 500) / (3000 - 500)) * 100}%, #374151 ${((settings.animationDuration - 500) / (3000 - 500)) * 100}%, #374151 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span className="bg-gray-600/50 px-2 py-1 rounded">500ms</span>
                          <span>快速</span>
                          <span>适中</span>
                          <span>缓慢</span>
                          <span className="bg-gray-600/50 px-2 py-1 rounded">3000ms</span>
                        </div>
                      </div>
                        )}
                        
                        {settings.manualStopMode && (
                          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                              <div>
                                <p className="text-blue-300 font-medium text-sm">手动停止模式已启用</p>
                                <p className="text-blue-200 text-xs mt-1">抽奖将持续进行直到您点击"立即停止"按钮</p>
                              </div>
                            </div>
                          </div>
                        )}
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="soundEnabled"
                          checked={settings.soundEnabled}
                          onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="soundEnabled" className="text-gray-200 font-medium cursor-pointer">启用声音效果</label>
                          <p className="text-sm text-gray-400 mt-1">播放抽奖相关的音效提示</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ui">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">界面设置</h3>
                      <p className="text-gray-400 text-sm">个性化界面外观和显示选项</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200 flex items-center gap-2">
                          {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          主题风格
                        </label>
                        <select
                          value={settings.theme}
                          onChange={async (e) => {
                            const newTheme = e.target.value
                            updateSetting('theme', newTheme)
                            
                            // 更新 HTML 根元素的主题类
                            if (newTheme === 'light') {
                              document.documentElement.classList.remove('dark')
                              document.documentElement.classList.add('light')
                            } else {
                              document.documentElement.classList.remove('light')
                              document.documentElement.classList.add('dark')
                            }
                            
                            // 立即保存设置到存储
                            try {
                              const { getStorageWayConfig, saveAllSettings } = await import('@/lib/officialStore')
                              const storageMethod = await getStorageWayConfig()
                              
                              const updatedSettings = { ...settings, theme: newTheme }
                              
                              if (storageMethod === 'tauriStore') {
                                await saveAllSettings({
                                  'lottery-settings': updatedSettings,
                                  'lottery-settings-updated': new Date().toISOString()
                                })
                                console.log('✅ 主题设置已立即保存到Tauri Store:', newTheme)
                              } else {
                                localStorage.setItem('lottery-settings', JSON.stringify(updatedSettings))
                                console.log('✅ 主题设置已立即保存到localStorage:', newTheme)
                              }
                            } catch (error) {
                              console.error('❌ 保存主题设置失败:', error)
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="dark">暗色主题</option>
                          <option value="light">亮色主题</option>
                        </select>
                        <p className="text-xs text-gray-500">选择您喜欢的界面主题</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200 flex items-center gap-2">
                          {settings.fontSize === 'small' ? <Smartphone className="w-4 h-4" /> : 
                           settings.fontSize === 'medium' ? <Monitor className="w-4 h-4" /> : 
                           <MonitorSpeaker className="w-4 h-4" />}
                          字体大小
                        </label>
                        <select
                          value={settings.fontSize}
                          onChange={(e) => updateSetting('fontSize', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="small">小号字体</option>
                          <option value="medium">中号字体（推荐）</option>
                          <option value="large">大号字体</option>
                        </select>
                        <p className="text-xs text-gray-500">调整界面文字的显示大小</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <h4 className="text-lg font-medium text-gray-200">特殊布局</h4>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="educationLayout"
                          checked={settings.educationLayout}
                          onChange={(e) => updateSetting('educationLayout', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-yellow-600 focus:ring-yellow-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="educationLayout" className="text-gray-200 font-medium cursor-pointer flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            启用智教布局
                          </label>
                          <p className="text-sm text-gray-400 mt-1">专为教学演示设计的特殊布局模式</p>
                        </div>
                      </div>
                      
                      {settings.educationLayout && (
                                                 <div className="ml-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                           <div className="flex items-center gap-2 text-blue-300 text-sm">
                             <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                             <span className="font-medium">智教布局特色</span>
                           </div>
                           <p className="text-xs text-blue-200 mt-1">
                             • 单人模式：超大字体显示获奖者姓名<br/>
                             • 多人模式：横向排列，只显示名字，无排名标注<br/>
                             • 按钮尺寸加大，便于点击操作<br/>
                             • 专为教学演示和大屏显示设计
                           </p>
                         </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-200 mb-4">预览效果</h4>
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="text-center">
                          <div className="mb-2 flex justify-center">
                            <Dice6 className="w-8 h-8 text-blue-400" />
                          </div>
                          <p className={`font-medium text-white ${
                            settings.educationLayout ? 'text-lg' : ''
                          }`}>
                            抽奖系统预览
                          </p>
                          <p className="text-sm mt-1 text-gray-400">
                            {settings.educationLayout 
                              ? '智教布局 - 大字体横向排列' 
                              : '这里是界面效果预览'
                            }
                          </p>
                          {settings.educationLayout && (
                            <div className="mt-3 px-3 py-1 bg-blue-600 rounded-full text-white text-xs font-bold inline-block">
                              智教布局模式
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">高级设置</h3>
                      <p className="text-gray-400 text-sm">配置高级功能和存储选项</p>
                    </div>
                    
                    {/* 数据存储方案 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <div className="border-b border-gray-700 pb-4">
                        <h4 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          数据存储方案
                        </h4>
                        <p className="text-gray-400 text-sm mt-2">选择数据保存方式，不同方案适用于不同的使用场景</p>
                        <div className="mt-2 text-xs text-blue-400 bg-blue-900/20 px-3 py-2 rounded-lg">
                          当前使用：{settings.storageMethod === 'localStorage' ? 'localStorage浏览器存储' : 'Tauri Store文件存储'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* localStorage */}
                        <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          settings.storageMethod === 'localStorage' 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          if (settings.storageMethod !== 'localStorage') {
                            handleStorageMethodChange('localStorage')
                          }
                        }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              settings.storageMethod === 'localStorage' 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-400'
                            }`}>
                              {settings.storageMethod === 'localStorage' && (
                                <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                              )}
                            </div>
                            <Monitor className="w-5 h-5 text-blue-400" />
                            <span className="font-medium text-white">浏览器存储</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">使用浏览器内置存储，数据保存在本地</p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>✓ 访问速度快</div>
                            <div>✓ 无需权限</div>
                            <div>✗ 存储容量有限</div>
                            <div>✗ 清除浏览器数据时会丢失</div>
                          </div>
                        </div>

                        {/* Tauri Store */}
                        <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          settings.storageMethod === 'tauriStore' 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          if (settings.storageMethod !== 'tauriStore') {
                            handleStorageMethodChange('tauriStore')
                          }
                        }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              settings.storageMethod === 'tauriStore' 
                                ? 'border-purple-500 bg-purple-500' 
                                : 'border-gray-400'
                            }`}>
                              {settings.storageMethod === 'tauriStore' && (
                                <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                              )}
                            </div>
                            <FileText className="w-5 h-5 text-purple-400" />
                            <span className="font-medium text-white">文件存储（推荐）</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">数据分离保存在exe文件同目录的 <span className="text-purple-300 font-mono">/coredata/</span> 文件夹中</p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>✓ settings.json - 应用设置和小组数据</div>
                            <div>✓ history.json - 历史抽奖记录</div>
                            <div>✓ 数据文件可见可编辑</div>
                            <div>✓ 易于备份和迁移</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">存储方案说明</span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-2">
                          <p><strong>浏览器存储</strong>：适合轻量使用，数据存储在浏览器中，简单快速。</p>
                          <p><strong>文件存储</strong>：数据分离保存在exe文件同目录的 <span className="text-purple-300 font-mono">/coredata/</span> 文件夹中，设置和历史记录分别保存在不同文件中，便于管理和备份。</p>
                          <div className="text-xs text-purple-200/70 bg-purple-900/20 p-2 rounded">
                            settings.json - 应用设置、小组数据<br/>
                            history.json - 历史抽奖记录
                          </div>
                          <p className="text-yellow-300">⚠ 切换存储方案时会自动迁移数据。</p>
                        </div>
                      </div>
                      

                      </div>
                    
                    {/* 其他高级设置 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200">系统选项</h4>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="autoSave"
                          checked={settings.autoSave}
                          onChange={(e) => updateSetting('autoSave', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="autoSave" className="text-gray-200 font-medium cursor-pointer">
                            自动保存设置
                          </label>
                          <p className="text-sm text-gray-400 mt-1">自动保存更改，无需手动保存</p>
                      </div>
                    </div>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="debugMode"
                          checked={settings.debugMode}
                          onChange={(e) => updateSetting('debugMode', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="debugMode" className="text-gray-200 font-medium cursor-pointer">
                            调试模式
                          </label>
                          <p className="text-sm text-gray-400 mt-1">开启调试信息和详细日志</p>
                        </div>
                      </div>
                      

                    </div>
                      
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-200 mb-4">日志管理</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">日志保留天数</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                            value={settings.logCleanDays || 7}
                            onChange={(e) => updateSetting('logRetentionDays', parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">设置系统日志的保留时长（1-365天）</p>
                      </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>



                <TabsContent value="security">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">安全设置</h3>
                      <p className="text-gray-400 text-sm">数据保护和备份恢复功能</p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <h4 className="text-lg font-medium text-gray-200">访问控制</h4>
                      
                      <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                        <input
                          type="checkbox"
                          id="passwordProtection"
                          checked={settings.passwordProtection}
                          onChange={(e) => updateSetting('passwordProtection', e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <label htmlFor="passwordProtection" className="text-gray-200 font-medium cursor-pointer flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            启用密码保护
                          </label>
                          <p className="text-sm text-gray-400 mt-1">开启后，进入设置界面需要输入密码</p>
                        </div>
                      </div>
                      
                      {settings.passwordProtection && (
                        <div className="space-y-4 ml-4 p-4 bg-gray-700/20 rounded-lg border border-gray-600/30">
                          {/* 当前密码 - 只有在已设置密码时才显示 */}
                          {settings.password && (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-200">当前密码</label>
                              <input
                                type="password"
                                id="currentPasswordInput"
                                placeholder="输入当前密码以验证身份"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                              />
                            </div>
                          )}
                          
                          {/* 新密码 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">新密码</label>
                            <input
                              type="password"
                              id="newPasswordInput"
                              placeholder="输入新密码"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                          </div>
                          
                          {/* 确认密码 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">确认密码</label>
                            <input
                              type="password"
                              id="confirmPasswordInput"
                              placeholder="再次输入新密码"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                          </div>
                          
                          {/* 设置按钮 */}
                          <div className="pt-2">
                                                      <Button
                            onClick={() => {
                              // 获取输入框的值
                              const currentPasswordInput = document.getElementById('currentPasswordInput') as HTMLInputElement
                              const newPasswordInput = document.getElementById('newPasswordInput') as HTMLInputElement
                              const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement
                              
                              const currentPassword = currentPasswordInput?.value || ''
                              const newPassword = newPasswordInput?.value || ''
                              const confirmPassword = confirmPasswordInput?.value || ''
                              
                              // 验证新密码
                              if (!newPassword) {
                                alert('新密码不能为空')
                                return
                              }
                              
                              if (newPassword !== confirmPassword) {
                                alert('两次输入的密码不一致')
                                return
                              }
                              
                              // 如果已经设置了密码，需要验证当前密码
                              if (settings.password) {
                                // 验证当前密码
                                if (!verifyPassword(currentPassword, settings.password)) {
                                  alert('当前密码不正确')
                                  return
                                }
                              }
                              
                              // 加密并保存新密码
                              const encryptedPassword = encryptPassword(newPassword)
                              updateSetting('password', encryptedPassword)
                              
                              // 清空输入框
                              if (currentPasswordInput) currentPasswordInput.value = ''
                              if (newPasswordInput) newPasswordInput.value = ''
                              if (confirmPasswordInput) confirmPasswordInput.value = ''
                              
                              showSuccess(settings.password ? '密码修改成功' : '密码设置成功')
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            设置密码
                          </Button>
                          </div>
                          
                          {/* 提示信息 */}
                          <div className="text-xs text-gray-500 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-yellow-300 font-medium">重要提示：</p>
                                <p className="mt-1">• 请务必记住您的密码，忘记密码将无法进入设置界面</p>
                                <p>• 建议设置包含字母、数字和符号的强密码</p>
                                <p>• 密码将安全存储在本地，不会上传到服务器</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <h4 className="text-lg font-medium text-gray-200">数据管理</h4>
                      <p className="text-sm text-gray-400">备份和恢复您的抽奖数据</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={() => {
                            try {
                              const data = {
                                groups: JSON.parse(localStorage.getItem('lottery-groups') || '[]'),
                                settings: JSON.parse(localStorage.getItem('lottery-settings') || '{}'),
                                drawMode: localStorage.getItem('lottery-draw-mode') || 'equal',
                                allowRepeat: JSON.parse(localStorage.getItem('lottery-allow-repeat') || 'false'),
                                exportTime: new Date().toISOString()
                              }
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `抽奖系统备份-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`
                              a.click()
                              URL.revokeObjectURL(url)
                            } catch (error) {
                              showError('导出失败：' + error)
                            }
                          }}
                          variant="outline"
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/10 h-12"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          导出数据
                        </Button>
                        
                        <Button
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.json'
                            input.onchange = async (e) => {
                              try {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (!file) return
                                
                                const text = await file.text()
                                const data = JSON.parse(text)
                                
                                showConfirm({
                                  title: '确认导入',
                                  message: '确定要导入数据吗？这将覆盖当前所有设置和小组数据。',
                                  type: 'warning',
                                  onConfirm: () => {
                                    if (data.groups) localStorage.setItem('lottery-groups', JSON.stringify(data.groups))
                                    if (data.settings) localStorage.setItem('lottery-settings', JSON.stringify(data.settings))
                                    if (data.drawMode) localStorage.setItem('lottery-draw-mode', data.drawMode)
                                    if (data.allowRepeat !== undefined) localStorage.setItem('lottery-allow-repeat', JSON.stringify(data.allowRepeat))
                                    
                                    window.location.reload()
                                  }
                                })
                              } catch (error) {
                                showError('导入失败：' + error)
                              }
                            }
                            input.click()
                          }}
                          variant="outline"
                          className="text-green-400 border-green-400 hover:bg-green-400/10 h-12"
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          导入数据
                        </Button>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-6">
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300 font-medium">危险操作</span>
                          </div>
                          <p className="text-sm text-red-200">清除所有数据将永久删除您的设置和小组信息</p>
                        </div>
                        
                        <Button
                          onClick={() => {
                            showConfirm({
                              title: '确认清除',
                              message: '确定要清除所有数据吗？此操作不可撤销。',
                              type: 'danger',
                              confirmText: '清除',
                              onConfirm: () => {
                                localStorage.clear()
                                window.location.reload()
                              }
                            })
                          }}
                          variant="outline"
                          className="w-full text-red-400 border-red-400 hover:bg-red-400/10 h-12"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          清除所有数据
                        </Button>
                      </div>
                      
                      {/* 希沃 LuckyRandom 替换功能 */}
                      <div className="border-t border-gray-700 pt-6">
                        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-purple-300 font-medium">希沃集成</span>
                          </div>
                          <p className="text-sm text-purple-200 mb-2">一键替换希沃白板中的 LuckyRandom 应用</p>
                          <p className="text-xs text-purple-300">将备份原有程序并创建 StarRandom 快捷方式，需要管理员权限</p>
                        </div>
                        
                        <div className="space-y-3">
                          <Button
                            onClick={async () => {
                              try {
                                const { Command } = await import('@tauri-apps/plugin-shell')
                                const { invoke } = await import('@tauri-apps/api/core')
                                
                                showConfirm({
                                  title: '确认替换希沃 LuckyRandom',
                                  message: '此操作将:\n1. 备份原有的 LuckyRandom.exe 为 LuckyRandom.exe.bak\n2. 创建 StarRandom 的快捷方式替换原程序\n\n路径: C:\\Program Files (x86)\\Seewo\\MiniApps\\LuckyRandom\n\n需要管理员权限，确定继续吗？',
                                  confirmText: '替换',
                                  onConfirm: async () => {
                                    try {
                                      const seewoPath = 'C:\\Program Files (x86)\\Seewo\\MiniApps\\LuckyRandom'
                                      
                                      // 获取当前应用路径
                                      const currentExePath = await invoke('get_current_exe_path') as string
                                      
                                      // 执行替换操作
                                      const replaceCommand = Command.create('replace-seewo-lucky', [
                                        'powershell', '-Command',
                                        `Start-Process powershell -ArgumentList '-Command "` +
                                        `cd \\"${seewoPath}\\"; ` +
                                        `if (Test-Path \\"LuckyRandom.exe\\") { ` +
                                        `  if (!(Test-Path \\"LuckyRandom.exe.bak\\")) { ` +
                                        `    Copy-Item \\"LuckyRandom.exe\\" \\"LuckyRandom.exe.bak\\" ` +
                                        `  }; ` +
                                        `  Remove-Item \\"LuckyRandom.exe\\" -Force ` +
                                        `}; ` +
                                        `$WshShell = New-Object -comObject WScript.Shell; ` +
                                        `$Shortcut = $WshShell.CreateShortcut(\\"${seewoPath}\\\\LuckyRandom.exe\\"); ` +
                                        `$Shortcut.TargetPath = \\"${currentExePath}\\"; ` +
                                        `$Shortcut.Save()\\"' -Verb RunAs`
                                      ])
                                      
                                      await replaceCommand.execute()
                                      showSuccess('希沃 LuckyRandom 替换成功！现在在希沃白板中打开 LuckyRandom 将启动 StarRandom')
                                    } catch (error) {
                                      console.error('替换失败:', error)
                                      showError('替换失败：' + (error as Error).message + '\n请确保以管理员身份运行此程序')
                                    }
                                  }
                                })
                              } catch (error) {
                                showError('功能初始化失败：' + (error as Error).message)
                              }
                            }}
                            variant="outline"
                            className="w-full text-purple-400 border-purple-400 hover:bg-purple-400/10 h-12"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            替换希沃 LuckyRandom
                          </Button>
                          
                          <Button
                            onClick={async () => {
                              try {
                                const { Command } = await import('@tauri-apps/plugin-shell')
                                
                                showConfirm({
                                  title: '确认恢复希沃 LuckyRandom',
                                  message: '此操作将恢复原有的 LuckyRandom.exe 程序，需要管理员权限，确定继续吗？',
                                  confirmText: '恢复',
                                  onConfirm: async () => {
                                    try {
                                      const seewoPath = 'C:\\Program Files (x86)\\Seewo\\MiniApps\\LuckyRandom'
                                      
                                      const restoreCommand = Command.create('restore-seewo-lucky', [
                                        'powershell', '-Command',
                                        `Start-Process powershell -ArgumentList '-Command "` +
                                        `cd \\"${seewoPath}\\"; ` +
                                        `if (Test-Path \\"LuckyRandom.exe.bak\\") { ` +
                                        `  if (Test-Path \\"LuckyRandom.exe\\") { ` +
                                        `    Remove-Item \\"LuckyRandom.exe\\" -Force ` +
                                        `  }; ` +
                                        `  Copy-Item \\"LuckyRandom.exe.bak\\" \\"LuckyRandom.exe\\" ` +
                                        `} else { ` +
                                        `  Write-Host \\"备份文件不存在，无法恢复\\" ` +
                                        `}\\"' -Verb RunAs`
                                      ])
                                      
                                      await restoreCommand.execute()
                                      showSuccess('希沃 LuckyRandom 已恢复为原始程序')
                                    } catch (error) {
                                      console.error('恢复失败:', error)
                                      showError('恢复失败：' + (error as Error).message + '\n请确保以管理员身份运行此程序')
                                    }
                                  }
                                })
                              } catch (error) {
                                showError('功能初始化失败：' + (error as Error).message)
                              }
                            }}
                            variant="outline"
                            className="w-full text-gray-400 border-gray-400 hover:bg-gray-400/10 h-12"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            恢复原始 LuckyRandom
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="about">
                  <div className="space-y-8">
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-xl font-semibold text-white mb-2">关于 StarRandom</h3>
                      <p className="text-gray-400 text-sm">现代化的抽奖系统 - 简单、快速、公平</p>
                    </div>
                    
                    {/* 应用信息 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden">
                          <img src="/icon.png" alt="StarRandom" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-white">StarRandom</h4>
                          <p className="text-gray-400">现代化抽奖系统</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">版本号：</span>
                            <span className="text-blue-400 font-mono">v1.0.7</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">构建日期：</span>
                            <span className="text-gray-400 font-mono">2025-06-29</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">运行环境：</span>
                            <span className="text-gray-400">
                              {typeof window !== 'undefined' && (window as any).__TAURI__ ? 'Tauri App' : 'Web Browser'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">技术栈：</span>
                            <span className="text-gray-400">React + TypeScript</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">UI 框架：</span>
                            <span className="text-gray-400">Tailwind CSS</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">桌面框架：</span>
                            <span className="text-gray-400">Tauri</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 功能特性 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                        <span className="text-yellow-400">⭐</span>
                        核心特性
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">多种抽奖模式</h5>
                            <p className="text-sm text-gray-400 mt-1">支持等概率和权重抽奖</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">小组管理</h5>
                            <p className="text-sm text-gray-400 mt-1">创建和管理多个抽奖小组</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">历史记录</h5>
                            <p className="text-sm text-gray-400 mt-1">完整的抽奖历史和结果管理</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">数据安全</h5>
                            <p className="text-sm text-gray-400 mt-1">密码保护和数据备份</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">多格式支持</h5>
                            <p className="text-sm text-gray-400 mt-1">CSV、TXT、JSON 文件导入</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                          <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                          <div>
                            <h5 className="text-gray-200 font-medium">跨平台</h5>
                            <p className="text-sm text-gray-400 mt-1">支持 Windows、macOS、Linux</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 开发信息 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                        <span className="text-blue-400">💻</span>
                        开发信息
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">开发者：</span>
                          <span className="text-gray-400">StarRandom Team</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">开源协议：</span>
                          <span className="text-gray-400">GPL-V3.0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">项目地址：</span>
                          <a href="https://github.com/vistaminc/StarRandom" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                            GitHub Repository
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {/* 系统信息 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                        <span className="text-green-400">🔧</span>
                        系统信息
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">浏览器：</span>
                            <span className="text-gray-400 font-mono text-sm">
                              {typeof navigator !== 'undefined' ? navigator.userAgent.match(/Chrome|Firefox|Safari|Edge/)?.[0] || 'Unknown' : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">分辨率：</span>
                            <span className="text-gray-400 font-mono text-sm">
                              {typeof window !== 'undefined' ? `${window.screen.width}×${window.screen.height}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">当前主题：</span>
                            <span className="text-gray-400 capitalize">
                              {settings.theme === 'dark' ? '暗色主题' : '亮色主题'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">存储方式：</span>
                            <span className="text-gray-400">
                              {settings.storageMethod === 'tauriStore' ? 'Tauri Store' : 'Local Storage'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 智教合作项目 */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <h4 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                        <span className="text-cyan-400">🤝</span>
                        智教合作项目
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div>
                            <h5 className="text-gray-200 font-medium">Seewo-HugoAura</h5>
                            <p className="text-sm text-gray-400 mt-1">下一代希沃管家注入式修改/破解方案</p>
                          </div>
                          <a 
                            href="https://github.com/HugoAura/Seewo-HugoAura" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm px-3 py-1 border border-cyan-400 rounded-lg hover:bg-cyan-400/10"
                          >
                            访问项目
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* 感谢信息 */}
                    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-600/30 rounded-lg p-6 text-center">
                      <h4 className="text-lg font-medium text-gray-200 mb-3">
                        <span className="text-purple-400">💝</span> 感谢使用 StarRandom
                      </h4>
                      <p className="text-gray-300 mb-4">
                        如果这个工具对您有帮助，欢迎给我们反馈和建议
                      </p>
                      <div className="flex justify-center gap-4 text-sm">
                        <span className="text-gray-400">版权所有 © 2025 StarRandom Team & 河南星熠寻光科技有限公司 & vistamin </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </Dialog>
        )}
        
        {/* Toast通知 - 最高层级 */}
        <div className="fixed inset-0 pointer-events-none z-[9999]">
        <ToastManager toasts={toasts} removeToast={removeToast} />
        </div>
        
        {/* 确认对话框 */}
        <ConfirmDialog />

        {/* 历史任务对话框 */}
        {showHistoryDialog && (
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <Card className="p-6 max-w-6xl w-full mx-auto max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  历史任务管理
                </h2>
                <Button
                  onClick={() => {
                    setShowHistoryDialog(false)
                    setSelectedHistoryTask('')
                    setSelectedTaskDetail(null)
                  }}
                  variant="ghost"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex flex-1 gap-6 min-h-0">
                {/* 左侧任务列表 */}
                                  <div className="w-1/3 border-r border-gray-700 pr-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-200">任务列表</h3>
                      <span className="text-sm text-gray-400">
                        {historySearchTerm.trim() ? `${filteredHistoryTasks.length}/${historyTasks.length}` : `共 ${historyTasks.length} 个`}
                      </span>
                    </div>
                    
                    {/* 搜索框 */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="搜索任务名称、小组或结果..."
                          value={historySearchTerm}
                          onChange={(e) => setHistorySearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {historySearchTerm && (
                          <button
                            onClick={() => setHistorySearchTerm('')}
                            className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 flex-1 overflow-y-auto">
                    {filteredHistoryTasks.length === 0 ? (
                      historyTasks.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无历史任务</p>
                        <p className="text-sm mt-2">完成抽奖并导出后，任务将出现在这里</p>
                      </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p>没有找到匹配的任务</p>
                          <p className="text-sm mt-2">尝试其他关键词或清空搜索条件</p>
                        </div>
                      )
                    ) : (
                      filteredHistoryTasks.map((task, index) => {
                        const isSelected = selectedHistoryTask === task.id
                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              setSelectedHistoryTask(task.id)
                              loadHistoryTaskDetail(task.id)
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                            }`}
                          >
                            <div className="font-medium text-white text-sm">{task.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(task.timestamp).toLocaleString('zh-CN')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {task.group_name} • {task.total_count} 人
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* 右侧任务详情 */}
                <div className="flex-1">
                  {selectedHistoryTask && selectedTaskDetail ? (
                    (() => {
                      const selectedTask = selectedTaskDetail
                      if (!selectedTask) return null
                      
                      return (
                        <div className="h-full flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-white">{selectedTask.name}</h3>
                              <div className="text-sm text-gray-400 space-y-1 mt-2">
                                <div>创建时间: {new Date(selectedTask.timestamp).toLocaleString('zh-CN')}</div>
                                <div>小组名称: {selectedTask.group_name}</div>
                                <div>总人数: {selectedTask.total_count}</div>
                                <div>导出文件: {selectedTask.file_path}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  // 如果任务设置了编辑保护，需要验证密码
                                  if (selectedTask.edit_protected && selectedTask.edit_password) {
                                    showPasswordDialogFunc({
                                      title: '编辑保护验证',
                                      message: '该任务已设置编辑保护，请输入编辑密码：',
                                      onConfirm: (password) => {
                                        if (!verifyPassword(password, selectedTask.edit_password)) {
                                          showError('编辑密码不正确')
                                          return
                                        }
                                        setEditingHistoryTask(selectedTask.id)
                                        setEditingResults(selectedTask.results.join('\n'))
                                      },
                                      onCancel: () => {
                                        setShowPasswordDialogState(false)
                                      }
                                    })
                                  } else {
                                  setEditingHistoryTask(selectedTask.id)
                                  setEditingResults(selectedTask.results.join('\n'))
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                className="px-3 py-2 text-orange-400 border-orange-400 hover:bg-orange-400/10 transition-all duration-200 flex items-center gap-1.5"
                              >
                                <Edit className="w-5 h-5" />
                                编辑
                              </Button>
                              <Button
                                onClick={() => {
                                  // 重新导出历史任务
                                  const content = selectedTask.results.map((result: string, i: number) => `${i + 1}. ${result}`).join('\n')
                                  const blob = new Blob([content], { type: 'text/plain' })
                                  const url = URL.createObjectURL(blob)
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = `${selectedTask.name}_重新导出.txt`
                                  link.click()
                                  URL.revokeObjectURL(url)
                                  showSuccess('任务重新导出成功')
                                }}
                                variant="outline"
                                size="sm"
                                className="px-3 py-2 text-blue-400 border-blue-400 hover:bg-blue-400/10 transition-all duration-200 flex items-center gap-1.5"
                              >
                                <Download className="w-5 h-5" />
                                导出
                              </Button>
                              <Button
                                onClick={() => {
                                  showConfirm({
                                    title: '确认删除',
                                    message: `确定要删除任务 "${selectedTask.name}" 吗？`,
                                    type: 'danger',
                                    onConfirm: async () => {
                                      if (settings.storageMethod === 'tauriStore') {
                                        // 使用Tauri Store分年月存储方案删除单个记录
                                        const { deleteHistoryTask } = await import('@/lib/officialStore')
                                        await deleteHistoryTask(selectedTask.id)
                                      } else {
                                        // 使用localStorage分年月存储方案删除单个记录
                                        await deleteHistoryTaskFromLocalStorage(selectedTask.id)
                                      }
                                      
                                      const updatedTasks = historyTasks.filter(t => t.id !== selectedTask.id)
                                      setHistoryTasks(updatedTasks)
                                      
                                      setSelectedHistoryTask('')
                                      setSelectedTaskDetail(null)
                                      showSuccess('任务删除成功')
                                    }
                                  })
                                }}
                                variant="outline"
                                size="sm"
                                className="px-3 py-2 text-red-400 border-red-400 hover:bg-red-400/10 transition-all duration-200 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* 抽奖结果显示/编辑 */}
                          <div className="flex-1 bg-gray-800/50 rounded-lg p-4 overflow-hidden">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-200">抽奖结果</h4>
                              <span className="text-xs text-gray-500">共 {selectedTask.results.length} 个结果</span>
                            </div>
                            
                            {editingHistoryTask === selectedTask.id ? (
                              /* 编辑模式 */
                              <div className="h-full flex flex-col">
                                <textarea
                                  value={editingResults}
                                  onChange={(e) => setEditingResults(e.target.value)}
                                  placeholder="每行一个抽奖结果..."
                                  className="flex-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    onClick={async () => {
                                      const newResults = editingResults.split('\n').filter(line => line.trim())
                                      if (newResults.length === 0) {
                                        showError('抽奖结果不能为空')
                                        return
                                      }
                                      
                                      const updatedTask = { ...selectedTask, results: newResults, total_count: newResults.length }
                                      
                                      if (settings.storageMethod === 'tauriStore') {
                                        // 使用Tauri Store分年月存储方案更新单个记录
                                        const { saveHistoryTask } = await import('@/lib/officialStore')
                                        await saveHistoryTask(updatedTask)
                                      } else {
                                        // 使用localStorage分年月存储方案更新单个记录
                                        await saveHistoryTaskToLocalStorage(updatedTask)
                                      }
                                      
                                      const updatedTasks = historyTasks.map(t => 
                                        t.id === selectedTask.id 
                                          ? updatedTask
                                          : t
                                      )
                                      setHistoryTasks(updatedTasks)
                                      setSelectedTaskDetail(updatedTask) // 更新详细视图
                                      
                                      setEditingHistoryTask('')
                                      setEditingResults('')
                                      showSuccess('抽奖结果已更新')
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    保存
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setEditingHistoryTask('')
                                      setEditingResults('')
                                    }}
                                    variant="outline"
                                  >
                                    取消
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* 查看模式 */
                              <div className="h-full overflow-y-auto">
                                <div className="grid grid-cols-1 gap-2">
                                  {selectedTask.results.map((result: string, i: number) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-sm"
                                    >
                                      <span className="text-gray-300">
                                        {i + 1}. {result}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>选择左侧任务查看详情</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 底部操作按钮 */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      showConfirm({
                        title: '重建历史记录索引',
                        message: '确定要重建历史记录索引吗？这将重新扫描所有历史记录并更新索引。',
                        type: 'info',
                        onConfirm: async () => {
                          try {
                            console.log('🔄 开始手动重建历史记录索引...');
                            
                            if (settings.storageMethod === 'tauriStore') {
                              // Tauri Store模式：重新加载历史数据
                              await loadHistoryTasks();
                              console.log('✅ Tauri Store历史记录已重新加载');
                            } else {
                              // localStorage模式：强制重建索引
                              const tasks = await loadHistoryTasksFromLocalStorage();
                              setHistoryTasks(tasks);
                              console.log('✅ localStorage历史记录索引已重建');
                            }
                            
                            showSuccess('历史记录索引重建完成');
                          } catch (error) {
                            console.error('❌ 重建索引失败:', error);
                            showError('重建索引失败: ' + error);
                          }
                        }
                      });
                    }}
                    variant="outline"
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重建索引
                  </Button>
                  
                <Button
                  onClick={() => {
                    showConfirm({
                      title: '确认清空',
                      message: '确定要清空所有历史任务吗？此操作不可撤销。',
                      type: 'warning',
                      onConfirm: async () => {
                        setHistoryTasks([])
                        if (settings.storageMethod === 'tauriStore') {
                          // 清空Tauri Store分年月存储数据
                          const { clearHistoryData } = await import('@/lib/officialStore')
                          await clearHistoryData()
                        } else {
                          // 清空localStorage分年月存储数据
                          const keysToRemove: string[] = []
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i)
                            if (key && key.startsWith('lottery-history-')) {
                              keysToRemove.push(key)
                            }
                          }
                          keysToRemove.forEach(key => localStorage.removeItem(key))
                          console.log('✅ 已清空localStorage分年月历史数据:', keysToRemove.length, '个存储键')
                        }
                        setSelectedHistoryTask('')
                        setSelectedTaskDetail(null)
                        showSuccess('历史任务已清空')
                      }
                    })
                  }}
                  variant="outline"
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                  disabled={historyTasks.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空所有历史
                </Button>
                </div>
                
                <Button
                  onClick={() => {
                    setShowHistoryDialog(false)
                    setSelectedHistoryTask('')
                    setSelectedTaskDetail(null)
                  }}
                  variant="outline"
                >
                  关闭
                </Button>
              </div>
            </Card>
          </Dialog>
        )}

        {/* 密码验证对话框 */}
        {showPasswordDialogState && passwordDialogConfig && (
          <Dialog open={showPasswordDialogState} onOpenChange={setShowPasswordDialogState}>
            <Card className="p-6 max-w-md w-full mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-400" />
                  {passwordDialogConfig.title}
                </h2>
                <Button
                  onClick={() => {
                    setShowPasswordDialogState(false)
                    passwordDialogConfig.onCancel?.()
                  }}
                  variant="ghost"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-300">{passwordDialogConfig.message}</p>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">密码</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        passwordDialogConfig.onConfirm(passwordInput)
                      }
                    }}
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => {
                      setShowPasswordDialogState(false)
                      passwordDialogConfig.onCancel?.()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={() => passwordDialogConfig.onConfirm(passwordInput)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={!passwordInput.trim()}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    验证
                  </Button>
                </div>
              </div>
            </Card>
          </Dialog>
        )}

        {/* 导出配置对话框 */}
        {showExportDialog && (
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <Card className="p-6 max-w-lg w-full mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">导出抽奖结果</h2>
                <Button
                  onClick={() => setShowExportDialog(false)}
                  variant="ghost"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* 文件名输入 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">文件名</label>
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    placeholder="请输入文件名"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 导出格式选择 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200">导出格式</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value=".csv">CSV 文件 (*.csv)</option>
                    <option value=".txt">文本文件 (*.txt)</option>
                    <option value=".json">JSON 文件 (*.json)</option>
                  </select>
                </div>

                {/* 编辑保护设置 */}
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    编辑保护设置
                  </h4>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enableEditProtection"
                      checked={enableEditProtection}
                      onChange={(e) => setEnableEditProtection(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="enableEditProtection" className="text-gray-200 font-medium cursor-pointer">
                        启用编辑保护
                      </label>
                      <p className="text-xs text-gray-400 mt-1">为历史任务设置编辑密码，防止误操作</p>
                    </div>
                  </div>
                  
                  {enableEditProtection && (
                    <div className="space-y-2 ml-7">
                      <label className="block text-sm font-medium text-gray-200">编辑密码</label>
                      <input
                        type="password"
                        value={editProtectionPassword}
                        onChange={(e) => setEditProtectionPassword(e.target.value)}
                        placeholder="请设置编辑密码"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500">设置后编辑历史任务时需要输入此密码</p>
                    </div>
                  )}
                </div>

                {/* 结果预览 */}
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-200">抽奖结果预览</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {drawnResults.slice(0, 10).map((result, index) => (
                      <div key={index} className="text-sm text-gray-300 py-1 px-2 bg-gray-700/30 rounded">
                        {index + 1}. {result}
                      </div>
                    ))}
                    {drawnResults.length > 10 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        ... 还有 {drawnResults.length - 10} 个结果
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    共 {drawnResults.length} 个抽奖结果
                  </div>
                </div>

                {/* 按钮区域 */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => setShowExportDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={performExport}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!exportFileName.trim()}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                </div>
              </div>
            </Card>
          </Dialog>
        )}
      </div>
      
      {/* 右侧点击区域 */}
      <div 
        className="flex-1 min-h-screen cursor-pointer transition-colors hover:bg-gray-800/20 flex items-center justify-center"
        onClick={handleRightSideClick}
        title={names.length === 0 ? "请先选择小组" : isDrawing ? (canStop ? "点击停止抽奖" : "抽奖进行中") : "点击开始抽奖"}
      >
        <div className="text-gray-600 text-sm select-none opacity-0 hover:opacity-50 transition-opacity">
          {names.length === 0 ? "请先选择小组" : isDrawing ? (canStop ? "点击停止" : "") : "点击开始"}
        </div>
      </div>
    </div>
  )
} 