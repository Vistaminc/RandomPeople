/**
 * 简化的存储管理器
 * 专门处理storeway.json配置和存储方式管理
 */

// 存储方式类型
export type StorageMethod = 'localStorage' | 'tauriStore';

// Storeway配置接口
export interface StorageWayConfig {
  'storage-method': StorageMethod;
  'config-version': string;
  'app-version': string;
  'created-time': string;
  'updated-time': string;
  description: string;
  'available-methods': StorageMethod[];
  'default-method': StorageMethod;
}

// 默认配置
const DEFAULT_STOREWAY_CONFIG: StorageWayConfig = {
  'storage-method': 'tauriStore',
  'config-version': '1.0',
  'app-version': '1.0.7',
  'created-time': new Date().toISOString(),
  'updated-time': new Date().toISOString(),
  description: '存储方式配置文件 - 记录应用程序使用的数据存储方案',
  'available-methods': ['localStorage', 'tauriStore'],
  'default-method': 'tauriStore'
};

class StorageManager {
  private static instance: StorageManager;
  private currentMethod: StorageMethod = 'tauriStore';
  private isInitialized = false;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 初始化存储管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 初始化存储管理器...');
      
      // 强制确保目录和文件存在
      await this.ensureStorewayExists();
      
      // 尝试读取storeway.json
      const storedMethod = await this.readStorageWayConfig();
      if (storedMethod) {
        this.currentMethod = storedMethod;
        console.log('✅ 从storeway.json读取存储方式:', storedMethod);
      } else {
        // 创建默认配置
        await this.saveStorageWayConfig(this.currentMethod);
        console.log('✅ 创建默认storeway.json配置:', this.currentMethod);
      }

      this.isInitialized = true;
      console.log('✅ 存储管理器初始化完成');
    } catch (error) {
      console.error('❌ 存储管理器初始化失败:', error);
      // 即使失败也标记为已初始化，使用默认值
      this.isInitialized = true;
    }
  }

  /**
   * 强制确保storeway.json存在
   */
  private async ensureStorewayExists(): Promise<void> {
    try {
      console.log('🔧 确保storeway.json文件存在...');
      
      // 方法1：使用Tauri命令直接创建
      if (await this.isTauriAvailable()) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          
          // 检查storeway.json是否已存在
          try {
            await invoke('load_json_file', { filePath: 'coredata/storeway.json' });
            console.log('✅ storeway.json已存在');
            return;
          } catch {
            // 文件不存在，需要创建
            console.log('📁 创建storeway.json文件...');
            
            // 确保coredata目录存在
            try {
              await invoke('save_json_file', { filePath: 'coredata/.dir_init', data: '{}' });
            } catch (dirError) {
              console.warn('⚠️ 创建coredata目录时遇到警告:', dirError);
            }
            
            // 创建storeway.json
            await invoke('save_json_file', { 
              filePath: 'coredata/storeway.json', 
              data: JSON.stringify(DEFAULT_STOREWAY_CONFIG, null, 2) 
            });
            
            console.log('✅ storeway.json通过Tauri命令创建成功');
            return;
          }
        } catch (tauriError) {
          console.warn('⚠️ Tauri命令创建storeway.json失败:', tauriError);
        }
      }
      
      // 方法2：使用Tauri Store作为备选方案
      try {
        await this.createStorewayViaStore();
        console.log('✅ storeway.json通过Store方式创建成功');
      } catch (storeError) {
        console.warn('⚠️ Store方式创建storeway.json失败:', storeError);
      }
      
    } catch (error) {
      console.error('❌ 确保storeway.json存在失败:', error);
    }
  }

  /**
   * 通过Store方式创建storeway.json
   */
  private async createStorewayViaStore(): Promise<void> {
    if (await this.isTauriAvailable()) {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('./coredata/storeway.json', { autoSave: true });
      
      // 批量保存默认配置
      for (const [key, value] of Object.entries(DEFAULT_STOREWAY_CONFIG)) {
        await store.set(key, value);
      }
      
      // 手动保存确保文件创建
      await store.save();
    }
  }

  /**
   * 获取当前存储方式
   */
  async getCurrentStorageMethod(): Promise<StorageMethod> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.currentMethod;
  }

  /**
   * 切换存储方式
   */
  async setStorageMethod(method: StorageMethod): Promise<void> {
    try {
      console.log('🔄 切换存储方式到:', method);
      
      // 确保文件存在
      await this.ensureStorewayExists();
      
      // 保存到storeway.json
      await this.saveStorageWayConfig(method);
      
      // 更新内存中的值
      this.currentMethod = method;
      
      console.log('✅ 存储方式已切换到:', method);
    } catch (error) {
      console.error('❌ 切换存储方式失败:', error);
      throw error;
    }
  }

  /**
   * 读取storeway.json配置
   */
  private async readStorageWayConfig(): Promise<StorageMethod | null> {
    try {
      // 方法1: 尝试使用Tauri命令直接读取
      if (await this.isTauriAvailable()) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const content = await invoke('load_json_file', { filePath: 'coredata/storeway.json' });
          if (content && typeof content === 'string') {
            const config = JSON.parse(content) as StorageWayConfig;
            console.log('📖 从Tauri命令读取storeway.json:', config['storage-method']);
            return config['storage-method'];
          }
        } catch (tauriError) {
          console.warn('⚠️ Tauri命令读取storeway.json失败:', tauriError);
        }
      }

      // 方法2: 尝试使用Tauri Store
      if (await this.isTauriAvailable()) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('./coredata/storeway.json', { autoSave: false });
          const method = await store.get<StorageMethod>('storage-method');
          if (method) {
            console.log('📖 从Tauri Store读取storeway.json:', method);
            return method;
          }
        } catch (storeError) {
          console.warn('⚠️ Tauri Store读取storeway.json失败:', storeError);
        }
      }

      // 方法3: 尝试从localStorage读取备份
      const backup = localStorage.getItem('_storeway_backup');
      if (backup) {
        const config = JSON.parse(backup) as StorageWayConfig;
        console.log('📖 从localStorage备份读取storeway.json:', config['storage-method']);
        return config['storage-method'];
      }

      return null;
    } catch (error) {
      console.error('❌ 读取storeway.json失败:', error);
      return null;
    }
  }

  /**
   * 保存storeway.json配置
   */
  private async saveStorageWayConfig(method: StorageMethod): Promise<void> {
    const config: StorageWayConfig = {
      ...DEFAULT_STOREWAY_CONFIG,
      'storage-method': method,
      'updated-time': new Date().toISOString()
    };

    console.log('💾 保存storeway.json配置:', config);

    // 方法1: 尝试使用Tauri命令
    if (await this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_json_file', { 
          filePath: 'coredata/storeway.json', 
          data: JSON.stringify(config, null, 2) 
        });
        console.log('✅ storeway.json已通过Tauri命令保存');
      } catch (tauriError) {
        console.warn('⚠️ Tauri命令保存失败:', tauriError);
        
        // 方法2: 回退到Tauri Store
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('./coredata/storeway.json', { autoSave: true });
          
          // 批量保存配置
          for (const [key, value] of Object.entries(config)) {
            await store.set(key, value);
          }
          
          // 手动保存确保文件写入
          await store.save();
          console.log('✅ storeway.json已通过Tauri Store保存');
        } catch (storeError) {
          console.warn('⚠️ Tauri Store保存失败:', storeError);
        }
      }
    }

    // 方法3: 同时保存到localStorage作为备份
    try {
      localStorage.setItem('_storeway_backup', JSON.stringify(config));
      console.log('✅ storeway.json备份已保存到localStorage');
    } catch (localError) {
      console.warn('⚠️ localStorage备份保存失败:', localError);
    }
  }

  /**
   * 检查Tauri是否可用
   */
  private async isTauriAvailable(): Promise<boolean> {
    try {
      return typeof window !== 'undefined' && 
             (window as any).__TAURI__ !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * 验证storeway.json配置
   */
  async verifyConfig(): Promise<boolean> {
    try {
      const method = await this.readStorageWayConfig();
      const isValid = method === 'localStorage' || method === 'tauriStore';
      
      console.log('🔍 storeway.json验证结果:', {
        method,
        isValid,
        initialized: this.isInitialized
      });
      
      return isValid;
    } catch (error) {
      console.error('❌ 配置验证失败:', error);
      return false;
    }
  }

  /**
   * 获取完整配置信息
   */
  async getFullConfig(): Promise<StorageWayConfig | null> {
    try {
      const method = await this.readStorageWayConfig();
      if (!method) return null;

      return {
        ...DEFAULT_STOREWAY_CONFIG,
        'storage-method': method,
        'updated-time': new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 获取完整配置失败:', error);
      return null;
    }
  }

  /**
   * 重置配置为默认值
   */
  async resetConfig(): Promise<void> {
    await this.setStorageMethod('tauriStore');
    console.log('✅ 配置已重置为默认值');
  }
}

// 导出单例实例
export const storageManager = StorageManager.getInstance();

// 导出便捷方法
export async function initializeStorageManager(): Promise<void> {
  await storageManager.initialize();
}

export async function getCurrentStorageMethod(): Promise<StorageMethod> {
  return await storageManager.getCurrentStorageMethod();
}

export async function setStorageMethod(method: StorageMethod): Promise<void> {
  await storageManager.setStorageMethod(method);
}

export async function verifyStorageConfig(): Promise<boolean> {
  return await storageManager.verifyConfig();
}

export async function getStorageFullConfig(): Promise<StorageWayConfig | null> {
  return await storageManager.getFullConfig();
}

export async function resetStorageConfig(): Promise<void> {
  await storageManager.resetConfig();
} 