// IndexedDB 大数据量存储管理器
export class IndexedDBStorage {
  private dbName = 'LotterySystemDB'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  // 数据库存储对象名称
  private stores = {
    groups: 'groups',
    settings: 'settings', 
    history: 'history',
    metadata: 'metadata'
  }

  // 初始化数据库
  async initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => {
        console.error('IndexedDB 打开失败:', request.error)
        reject(false)
      }
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB 初始化成功')
        resolve(true)
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建小组存储
        if (!db.objectStoreNames.contains(this.stores.groups)) {
          const groupStore = db.createObjectStore(this.stores.groups, { keyPath: 'id' })
          groupStore.createIndex('name', 'name', { unique: false })
          groupStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
        
        // 创建设置存储
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' })
        }
        
        // 创建历史记录存储
        if (!db.objectStoreNames.contains(this.stores.history)) {
          const historyStore = db.createObjectStore(this.stores.history, { keyPath: 'id', autoIncrement: true })
          historyStore.createIndex('timestamp', 'timestamp', { unique: false })
          historyStore.createIndex('groupId', 'groupId', { unique: false })
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          db.createObjectStore(this.stores.metadata, { keyPath: 'key' })
        }
        
        console.log('IndexedDB 数据库结构创建完成')
      }
    })
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<boolean> {
    if (!this.db) {
      return await this.initDB()
    }
    return true
  }

  // 通用数据保存方法
  private async saveData<T>(storeName: string, data: T): Promise<boolean> {
    try {
      await this.ensureDB()
      if (!this.db) return false

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.put(data)
        
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(false)
      })
    } catch (error) {
      console.error('保存数据失败:', error)
      return false
    }
  }

  // 通用数据获取方法
  private async getData<T>(storeName: string, key: string): Promise<T | null> {
    try {
      await this.ensureDB()
      if (!this.db) return null

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(key)
        
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(null)
      })
    } catch (error) {
      console.error('获取数据失败:', error)
      return null
    }
  }

  // 获取所有数据
  private async getAllData<T>(storeName: string): Promise<T[]> {
    try {
      await this.ensureDB()
      if (!this.db) return []

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.getAll()
        
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject([])
      })
    } catch (error) {
      console.error('获取所有数据失败:', error)
      return []
    }
  }

  // 删除数据
  private async deleteData(storeName: string, key: string): Promise<boolean> {
    try {
      await this.ensureDB()
      if (!this.db) return false

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(key)
        
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(false)
      })
    } catch (error) {
      console.error('删除数据失败:', error)
      return false
    }
  }

  // === 小组数据管理 ===
  
  // 保存小组
  async saveGroup(group: any): Promise<boolean> {
    const groupWithMetadata = {
      ...group,
      updatedAt: new Date().toISOString()
    }
    return await this.saveData(this.stores.groups, groupWithMetadata)
  }

  // 获取所有小组
  async getAllGroups(): Promise<any[]> {
    return await this.getAllData(this.stores.groups)
  }

  // 获取单个小组
  async getGroup(groupId: string): Promise<any | null> {
    return await this.getData(this.stores.groups, groupId)
  }

  // 删除小组
  async deleteGroup(groupId: string): Promise<boolean> {
    return await this.deleteData(this.stores.groups, groupId)
  }

  // === 设置数据管理 ===
  
  // 保存设置
  async saveSetting(key: string, value: any): Promise<boolean> {
    const setting = {
      key,
      value,
      updatedAt: new Date().toISOString()
    }
    return await this.saveData(this.stores.settings, setting)
  }

  // 获取设置
  async getSetting(key: string): Promise<any> {
    const result = await this.getData(this.stores.settings, key) as any
    return result?.value || null
  }

  // 获取所有设置
  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.getAllData(this.stores.settings)
    const result: Record<string, any> = {}
    settings.forEach((setting: any) => {
      result[setting.key] = setting.value
    })
    return result
  }

  // === 抽奖历史管理 ===
  
  // 保存抽奖记录
  async saveDrawHistory(record: {
    groupId: string
    groupName: string
    winner: string
    drawMode: string
    participants: number
    timestamp?: string
  }): Promise<boolean> {
    const historyRecord = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString()
    }
    return await this.saveData(this.stores.history, historyRecord)
  }

  // 获取抽奖历史
  async getDrawHistory(limit?: number): Promise<any[]> {
    try {
      await this.ensureDB()
      if (!this.db) return []

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.stores.history], 'readonly')
        const store = transaction.objectStore(this.stores.history)
        const index = store.index('timestamp')
        const request = index.openCursor(null, 'prev') // 倒序

        const results: any[] = []
        let count = 0

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor && (!limit || count < limit)) {
            results.push(cursor.value)
            count++
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        
        request.onerror = () => reject([])
      })
    } catch (error) {
      console.error('获取抽奖历史失败:', error)
      return []
    }
  }

  // === 数据统计 ===
  
  // 获取数据库大小统计
  async getStorageStats(): Promise<{
    groupsCount: number
    historyCount: number
    settingsCount: number
    estimatedSize: number
  }> {
    try {
      const [groups, history, settings] = await Promise.all([
        this.getAllGroups(),
        this.getDrawHistory(),
        this.getAllSettings()
      ])

      // 估算数据大小（粗略计算）
      const estimatedSize = 
        JSON.stringify(groups).length +
        JSON.stringify(history).length +
        JSON.stringify(settings).length

      return {
        groupsCount: groups.length,
        historyCount: history.length,
        settingsCount: Object.keys(settings).length,
        estimatedSize
      }
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return {
        groupsCount: 0,
        historyCount: 0,
        settingsCount: 0,
        estimatedSize: 0
      }
    }
  }

  // === 数据导入导出 ===
  
  // 导出所有数据
  async exportAllData(): Promise<any> {
    try {
      const [groups, settings, history] = await Promise.all([
        this.getAllGroups(),
        this.getAllSettings(),
        this.getDrawHistory()
      ])

      return {
        groups,
        settings,
        history,
        exportTime: new Date().toISOString(),
        version: '1.0'
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      return null
    }
  }

  // 导入所有数据
  async importAllData(data: any): Promise<boolean> {
    try {
      await this.ensureDB()
      if (!this.db) return false

      // 清空现有数据
      await this.clearAllData()

      // 导入小组数据
      if (data.groups && Array.isArray(data.groups)) {
        for (const group of data.groups) {
          await this.saveGroup(group)
        }
      }

      // 导入设置数据
      if (data.settings && typeof data.settings === 'object') {
        for (const [key, value] of Object.entries(data.settings)) {
          await this.saveSetting(key, value)
        }
      }

      // 导入历史数据
      if (data.history && Array.isArray(data.history)) {
        for (const record of data.history) {
          await this.saveDrawHistory(record)
        }
      }

      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<boolean> {
    try {
      await this.ensureDB()
      if (!this.db) return false

      const storeNames = [this.stores.groups, this.stores.settings, this.stores.history]
      
      for (const storeName of storeNames) {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          const request = store.clear()
          
          request.onsuccess = () => resolve()
          request.onerror = () => reject()
        })
      }

      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }
}

// 创建全局实例
export const indexedDBStorage = new IndexedDBStorage()

// 自动初始化
indexedDBStorage.initDB().catch(console.error) 