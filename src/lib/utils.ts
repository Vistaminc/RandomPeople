import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 抽奖引擎工具函数
export class LotteryEngine {
  private names: string[] = []
  private weights: number[] = []
  private excludedIndices: Set<number> = new Set()

  loadData(names: string[], weights?: number[]) {
    if (!names || names.length === 0) {
      throw new Error("名单不能为空")
    }
    
    this.names = [...names]
    this.weights = weights ? [...weights] : new Array(names.length).fill(1)
    this.excludedIndices.clear()
  }

  drawOne(useWeight = true, allowRepeat = false): string | null {
    const availableIndices = this.names
      .map((_, index) => index)
      .filter(index => allowRepeat || !this.excludedIndices.has(index))

    if (availableIndices.length === 0) {
      return null
    }

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

  drawMultiple(count: number, useWeight = true, allowRepeat = false): string[] {
    const results: string[] = []
    
    for (let i = 0; i < count; i++) {
      const result = this.drawOne(useWeight, allowRepeat)
      if (result === null) break
      results.push(result)
    }
    
    return results
  }

  resetExclusions() {
    this.excludedIndices.clear()
  }

  getRemainingCount(): number {
    return this.names.length - this.excludedIndices.size
  }

  getTotalCount(): number {
    return this.names.length
  }

  getAllNames(): string[] {
    return [...this.names]
  }
}

// 数据解析工具函数
export class DataParser {
  static parseCSV(content: string): { names: string[], weights: number[] } {
    const lines = content.trim().split('\n')
    const names: string[] = []
    const weights: number[] = []

    lines.forEach(line => {
      const parts = line.split(',').map(part => part.trim())
      if (parts[0]) {
        names.push(parts[0])
        const weight = parts[1] ? parseFloat(parts[1]) : 1
        weights.push(isNaN(weight) ? 1 : Math.max(0, weight))
      }
    })

    return { names, weights }
  }

  static parseJSON(content: string): { names: string[], weights: number[] } {
    try {
      const data = JSON.parse(content)
      
      if (Array.isArray(data)) {
        return {
          names: data.map(item => String(item)),
          weights: new Array(data.length).fill(1)
        }
      } else if (typeof data === 'object') {
        const names = Object.keys(data)
        const weights = names.map(name => {
          const weight = parseFloat(data[name])
          return isNaN(weight) ? 1 : Math.max(0, weight)
        })
        return { names, weights }
      }
    } catch (error) {
      throw new Error('JSON格式错误')
    }
    
    throw new Error('不支持的JSON格式')
  }

  static parseTXT(content: string): { names: string[], weights: number[] } {
    const lines = content.trim().split('\n')
    const names: string[] = []
    const weights: number[] = []

    lines.forEach(line => {
      const parts = line.trim().split(/[\s,\t]+/)
      if (parts[0]) {
        names.push(parts[0])
        const weight = parts[1] ? parseFloat(parts[1]) : 1
        weights.push(isNaN(weight) ? 1 : Math.max(0, weight))
      }
    })

    return { names, weights }
  }

  static parseFile(file: File): Promise<{ names: string[], weights: number[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        try {
          let result: { names: string[], weights: number[] }

          switch (fileExtension) {
            case 'csv':
              result = this.parseCSV(content)
              break
            case 'json':
              result = this.parseJSON(content)
              break
            case 'txt':
              result = this.parseTXT(content)
              break
            default:
              // 尝试以CSV格式解析
              result = this.parseCSV(content)
          }

          if (result.names.length === 0) {
            reject(new Error('文件中没有找到有效的名单数据'))
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'UTF-8')
    })
  }
}

// 动画工具函数
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  },
  slideIn: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  }
}

// 文件验证工具
export const validateFile = (file: File): { valid: boolean, message: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['text/csv', 'application/json', 'text/plain']
  const allowedExtensions = ['csv', 'json', 'txt']
  
  if (file.size > maxSize) {
    return { valid: false, message: '文件大小不能超过10MB' }
  }
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return { valid: false, message: '只支持CSV、JSON、TXT格式的文件' }
  }
  
  return { valid: true, message: '文件验证通过' }
}

// 格式化工具
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
} 