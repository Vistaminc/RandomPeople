// 文件系统数据存储管理器（注意：不再使用history.json，改用纯文件夹存储）
export class FileSystemStorage {
  private dataDir = 'lottery-data'
  private configFile = 'config.json'
  private groupsFile = 'groups.json'
  // 注意：已移除historyFile，改用分年月文件夹存储
  
  // 检查文件系统API支持
  private async checkFileSystemSupport(): Promise<boolean> {
    if ('showDirectoryPicker' in window) {
      return true
    }
    return false
  }

  // 初始化数据目录
  async initializeDataDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const supported = await this.checkFileSystemSupport()
      if (!supported) {
        console.warn('浏览器不支持文件系统API，将使用下载/上传方式')
        return null
      }

      // 请求用户选择数据存储目录
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      })
      
      // 保存目录句柄到localStorage（用于后续访问）
      const permission = await dirHandle.requestPermission({ mode: 'readwrite' })
      if (permission === 'granted') {
        return dirHandle
      }
      
      return null
    } catch (error) {
      console.error('初始化数据目录失败:', error)
      return null
    }
  }

  // 保存数据到文件
  async saveDataToFile(data: any, filename: string, dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      if (dirHandle) {
        // 使用文件系统API保存
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(JSON.stringify(data, null, 2))
        await writable.close()
        return true
      } else {
        // 回退到下载文件方式
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        return true
      }
    } catch (error) {
      console.error('保存文件失败:', error)
      return false
    }
  }

  // 从文件加载数据
  async loadDataFromFile(filename: string, dirHandle?: FileSystemDirectoryHandle): Promise<any | null> {
    try {
      if (dirHandle) {
        // 使用文件系统API读取
        const fileHandle = await dirHandle.getFileHandle(filename)
        const file = await fileHandle.getFile()
        const text = await file.text()
        return JSON.parse(text)
      } else {
        // 回退到文件选择器方式
        return new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json'
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const text = await file.text()
              resolve(JSON.parse(text))
            } else {
              resolve(null)
            }
          }
          input.click()
        })
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      return null
    }
  }

  // 保存小组数据
  async saveGroups(groups: any[], dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    const data = {
      groups,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    }
    return await this.saveDataToFile(data, this.groupsFile, dirHandle)
  }

  // 加载小组数据
  async loadGroups(dirHandle?: FileSystemDirectoryHandle): Promise<any[]> {
    const data = await this.loadDataFromFile(this.groupsFile, dirHandle)
    return data?.groups || []
  }

  // 保存配置数据
  async saveConfig(config: any, dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    const data = {
      ...config,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    }
    return await this.saveDataToFile(data, this.configFile, dirHandle)
  }

  // 加载配置数据
  async loadConfig(dirHandle?: FileSystemDirectoryHandle): Promise<any> {
    return await this.loadDataFromFile(this.configFile, dirHandle)
  }

  // 注意：历史记录已改用纯文件夹存储，这些方法已废弃
  // 保存抽奖历史（已废弃，改用分年月文件夹存储）
  async saveHistory(history: any[], dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    console.warn('⚠️ saveHistory已废弃，请使用分年月文件夹存储')
    return false
  }

  // 加载抽奖历史（已废弃，改用分年月文件夹存储）
  async loadHistory(dirHandle?: FileSystemDirectoryHandle): Promise<any[]> {
    console.warn('⚠️ loadHistory已废弃，请使用分年月文件夹存储')
    return []
  }

  // 批量保存所有数据（注意：不再保存history.json）
  async saveAllData(allData: {
    groups: any[]
    config: any
    history: any[]
  }, dirHandle?: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      console.log('🔧 批量保存数据（跳过history.json，使用分年月文件夹存储）')
      const results = await Promise.all([
        this.saveGroups(allData.groups, dirHandle),
        this.saveConfig(allData.config, dirHandle)
        // 注意：不再保存history.json，改用分年月文件夹存储
      ])
      
      return results.every(result => result === true)
    } catch (error) {
      console.error('批量保存失败:', error)
      return false
    }
  }

  // 批量加载所有数据（注意：不再加载history.json）
  async loadAllData(dirHandle?: FileSystemDirectoryHandle): Promise<{
    groups: any[]
    config: any
    history: any[]
  }> {
    try {
      console.log('🔧 批量加载数据（跳过history.json，使用分年月文件夹存储）')
      const [groups, config] = await Promise.all([
        this.loadGroups(dirHandle),
        this.loadConfig(dirHandle)
        // 注意：不再加载history.json，改用分年月文件夹存储
      ])
      
      return { groups, config, history: [] } // history始终返回空数组
    } catch (error) {
      console.error('批量加载失败:', error)
      return { groups: [], config: {}, history: [] }
    }
  }

  // 数据压缩（适用于大数据量）
  async compressData(data: any): Promise<string> {
    try {
      // 如果浏览器支持压缩API
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        writer.write(new TextEncoder().encode(JSON.stringify(data)))
        writer.close()
        
        const chunks = []
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          compressed.set(chunk, offset)
          offset += chunk.length
        }
        
        return btoa(String.fromCharCode(...Array.from(compressed)))
      } else {
        // 回退到普通JSON字符串
        return JSON.stringify(data)
      }
    } catch (error) {
      console.error('数据压缩失败:', error)
      return JSON.stringify(data)
    }
  }

  // 数据解压
  async decompressData(compressedData: string): Promise<any> {
    try {
      if ('DecompressionStream' in window && compressedData.length > 1000) {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0))
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        writer.write(compressed)
        writer.close()
        
        const chunks = []
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          decompressed.set(chunk, offset)
          offset += chunk.length
        }
        
        const text = new TextDecoder().decode(decompressed)
        return JSON.parse(text)
      } else {
        // 回退到普通JSON解析
        return JSON.parse(compressedData)
      }
    } catch (error) {
      console.error('数据解压失败:', error)
      return null
    }
  }
}

// 创建全局实例
export const fileStorage = new FileSystemStorage()

// 检查浏览器兼容性
export const checkFileSystemSupport = (): boolean => {
  return 'showDirectoryPicker' in window
}

// 存储方案推荐
export const getRecommendedStorage = (dataSize: number): 'filesystem' | 'indexeddb' | 'localstorage' => {
  if (dataSize > 50000) { // 大于50KB
    return checkFileSystemSupport() ? 'filesystem' : 'indexeddb'
  } else if (dataSize > 5000) { // 大于5KB
    return 'indexeddb'
  } else {
    return 'localstorage'
  }
} 