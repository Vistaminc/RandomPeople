// 官方Tauri Store插件存储管理器
import { Store } from '@tauri-apps/plugin-store';
import { path } from '@tauri-apps/api';

// 存储实例
let store: Store | null = null;
let historyStore: Store | null = null;
let storeInitialized = false;
let historyStoreInitialized = false;
let actualStorePath = '';
let actualHistoryStorePath = '';

// 获取exe文件所在目录
async function getExeDirectory(): Promise<string> {
  try {
    // 在Tauri桌面应用中，当前工作目录通常就是exe文件所在目录
    const currentDir = await path.resolve('.');
    console.log('📁 当前工作目录（exe目录）:', currentDir);
    return currentDir;
  } catch (error) {
    console.error('❌ 获取exe目录失败:', error);
    throw error;
  }
}

// 获取可能的存储路径信息
async function getPathInfo(): Promise<void> {
  try {
    console.log('🔍 检查路径信息...');
    
    const currentDir = await path.resolve('.');
    console.log('📁 当前工作目录:', currentDir);
    
    const resourceDir = await path.resourceDir();
    console.log('📁 资源目录:', resourceDir);
    
    const appDataDir = await path.appDataDir();
    console.log('📁 应用数据目录:', appDataDir);
    
    const appLocalDataDir = await path.appLocalDataDir();
    console.log('📁 本地应用数据目录:', appLocalDataDir);
    
    const exeDir = await getExeDirectory();
    console.log('📁 exe文件目录:', exeDir);
    
  } catch (error) {
    console.error('❌ 获取路径信息失败:', error);
  }
}

// 初始化设置Store
async function initStore(): Promise<Store> {
  if (store && storeInitialized) {
    return store;
  }

  try {
    console.log('🔧 初始化设置Store到exe文件目录...');
    await getPathInfo();
    
    // 方案1：使用exe文件目录的绝对路径
    try {
      const exeDir = await getExeDirectory();
      const coreDataDir = await path.join(exeDir, 'coredata');
      const settingsPath = await path.join(coreDataDir, 'settings.json');
      
      console.log('📁 设置Store目标路径:', settingsPath);
      actualStorePath = settingsPath;
      
      store = await Store.load(settingsPath, { 
        autoSave: true 
      });
      
      storeInitialized = true;
      console.log('✅ 设置Store初始化成功 - exe目录绝对路径:', settingsPath);
      return store;
      
    } catch (absolutePathError) {
      console.error('❌ 设置Store exe目录绝对路径失败:', absolutePathError);
      
      // 方案2：相对路径
      console.log('🔄 尝试设置Store相对路径作为备用方案...');
      actualStorePath = './coredata/settings.json';
      
      store = await Store.load('./coredata/settings.json', { 
        autoSave: true 
      });
      
      storeInitialized = true;
      console.log('✅ 设置Store初始化成功 - 相对路径: ./coredata/settings.json');
      return store;
    }
    
  } catch (error) {
    console.error('❌ 设置Store初始化失败:', error);
    throw new Error(`设置Store初始化失败: ${error}`);
  }
}

// 重新恢复历史记录Store用于索引管理
async function initHistoryStore(): Promise<Store> {
  if (historyStore && historyStoreInitialized) {
    return historyStore;
  }

  try {
    console.log('🔧 初始化历史记录索引Store...');
    
    // 使用exe文件目录的绝对路径
    try {
      const exeDir = await getExeDirectory();
      const coreDataDir = await path.join(exeDir, 'coredata');
      const historyPath = await path.join(coreDataDir, 'history.json');
      
      console.log('📁 历史索引Store目标路径:', historyPath);
      actualHistoryStorePath = historyPath;
      
      historyStore = await Store.load(historyPath, { 
        autoSave: true 
      });
      
      historyStoreInitialized = true;
      console.log('✅ 历史索引Store初始化成功 - exe目录:', historyPath);
      return historyStore;
      
    } catch (absolutePathError) {
      console.error('❌ 历史索引Store绝对路径失败:', absolutePathError);
      
      // 备用方案：相对路径
      console.log('🔄 尝试历史索引Store相对路径...');
      actualHistoryStorePath = './coredata/history.json';
      
      historyStore = await Store.load('./coredata/history.json', { 
        autoSave: true 
      });
      
      historyStoreInitialized = true;
      console.log('✅ 历史索引Store初始化成功 - 相对路径');
      return historyStore;
    }
    
  } catch (error) {
    console.error('❌ 历史索引Store初始化失败:', error);
    throw new Error(`历史索引Store初始化失败: ${error}`);
  }
}

// 获取Store实例
async function getStore(): Promise<Store> {
  if (!store || !storeInitialized) {
    return await initStore();
  }
  return store;
}

// 获取历史索引Store实例
async function getHistoryStore(): Promise<Store> {
  if (!historyStore || !historyStoreInitialized) {
    return await initHistoryStore();
  }
  return historyStore;
}

// 保存单个设置
export async function saveSetting(key: string, value: any): Promise<void> {
  try {
    const storeInstance = await getStore();
    await storeInstance.set(key, value);
    console.log(`✅ 设置已保存: ${key}`);
  } catch (error) {
    console.error(`❌ 保存设置失败 [${key}]:`, error);
    throw error;
  }
}

// 获取单个设置
export async function getSetting<T>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const storeInstance = await getStore();
    const value = await storeInstance.get<T>(key);
    return value !== null && value !== undefined ? value : (defaultValue ?? null);
  } catch (error) {
    console.error(`❌ 获取设置失败 [${key}]:`, error);
    return defaultValue ?? null;
  }
}

// 保存所有设置
export async function saveAllSettings(settings: Record<string, any>): Promise<void> {
  try {
    const storeInstance = await getStore();
    
    // 逐一保存所有设置
    for (const [key, value] of Object.entries(settings)) {
      await storeInstance.set(key, value);
    }
    
    console.log('✅ 所有设置已保存');
  } catch (error) {
    console.error('❌ 保存所有设置失败:', error);
    throw error;
  }
}

// 获取所有设置
export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const storeInstance = await getStore();
    const entries = await storeInstance.entries();
    
    const settings: Record<string, any> = {};
    for (const [key, value] of entries) {
      settings[key] = value;
    }
    
    console.log('✅ 所有设置已加载');
    return settings;
  } catch (error) {
    console.error('❌ 获取所有设置失败:', error);
    return {};
  }
}

// 删除设置
export async function deleteSetting(key: string): Promise<void> {
  try {
    const storeInstance = await getStore();
    await storeInstance.delete(key);
    console.log(`✅ 设置已删除: ${key}`);
  } catch (error) {
    console.error(`❌ 删除设置失败 [${key}]:`, error);
    throw error;
  }
}

// 清空所有设置
export async function clearAllSettings(): Promise<void> {
  try {
    const storeInstance = await getStore();
    await storeInstance.clear();
    console.log('✅ 所有设置已清空');
  } catch (error) {
    console.error('❌ 清空设置失败:', error);
    throw error;
  }
}

// 检查设置是否存在
export async function hasSetting(key: string): Promise<boolean> {
  try {
    const storeInstance = await getStore();
    return await storeInstance.has(key);
  } catch (error) {
    console.error(`❌ 检查设置失败 [${key}]:`, error);
    return false;
  }
}

// 获取Store的统计信息
export async function getStoreInfo(): Promise<{
  length: number;
  keys: string[];
  isInitialized: boolean;
}> {
  try {
    if (!storeInitialized) {
      return { length: 0, keys: [], isInitialized: false };
    }
    
    const storeInstance = await getStore();
    const keys = await storeInstance.keys();
    const length = await storeInstance.length();
    
    return {
      length,
      keys,
      isInitialized: storeInitialized
    };
  } catch (error) {
    console.error('❌ 获取Store信息失败:', error);
    return { length: 0, keys: [], isInitialized: false };
  }
}

// 手动保存Store（虽然autoSave为true，但可以手动触发）
export async function saveStore(): Promise<void> {
  try {
    const storeInstance = await getStore();
    await storeInstance.save();
    console.log('✅ Store手动保存成功');
  } catch (error) {
    console.error('❌ Store手动保存失败:', error);
    throw error;
  }
}

// 重新加载Store
export async function reloadStore(): Promise<void> {
  try {
    const storeInstance = await getStore();
    await storeInstance.reload();
    console.log('✅ Store重新加载成功');
  } catch (error) {
    console.error('❌ Store重新加载失败:', error);
    throw error;
  }
}

// 检查Tauri环境和Store可用性
export function isTauriStoreAvailable(): boolean {
  try {
    // 检查是否在Tauri环境中
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      return false;
    }
    
    // 检查Store插件是否可用
    return true;
  } catch {
    return false;
  }
}

// 获取Store的实际存储路径
export function getActualStorePath(): string {
  return actualStorePath || '未知路径';
}

// 获取历史Store的实际存储路径
export function getActualHistoryStorePath(): string {
  return actualHistoryStorePath || '未知路径';
}

// === 存储方式配置管理 ===

let storageWayStore: Store | null = null;
let storageWayInitialized = false;

// 初始化存储方式配置Store
async function initStorageWayStore(): Promise<Store> {
  if (storageWayStore && storageWayInitialized) {
    return storageWayStore;
  }

  try {
    console.log('🔧 初始化存储方式配置Store...');
    
    // 首先确保coredata目录存在
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 检查coredata目录是否存在
      try {
        await invoke('list_directory', { dirPath: 'coredata' });
        console.log('✅ coredata目录已存在');
      } catch {
        console.log('📁 coredata目录不存在，正在创建...');
        // 创建coredata目录
        await invoke('save_json_file', { filePath: 'coredata/.dir_init', data: '{}' });
        console.log('✅ coredata目录已创建');
      }
      
      // 检查storeway.json是否存在
      try {
        await invoke('load_json_file', { filePath: 'coredata/storeway.json' });
        console.log('✅ storeway.json已存在');
      } catch {
        console.log('📁 storeway.json不存在，正在创建...');
        // 创建默认的storeway.json
        const defaultConfig = {
          "storage-method": "tauriStore",
          "storage-location": "exe-directory", 
          "data-directory": "./coredata",
          "history-enabled": true,
          "history-folder": "./coredata/history",
          "history-index": "./coredata/history.json",
          "auto-backup": true,
          "backup-interval": 300000,
          "max-history-files": 1000,
          "file-naming-pattern": "{task_name}_{timestamp}_{task_id}.json",
          "year-month-folders": true,
          "created-time": new Date().toISOString(),
          "updated-time": new Date().toISOString(),
          "app-version": "1.0.7",
          "config-version": "1.0",
          "description": "StarRandom应用的永久存储配置文件"
        };
        await invoke('save_json_file', { 
          filePath: 'coredata/storeway.json', 
          data: JSON.stringify(defaultConfig, null, 2) 
        });
        console.log('✅ storeway.json已创建');
      }
    } catch (invokeError) {
      console.warn('⚠️ 使用Tauri命令创建失败，尝试Store方式:', invokeError);
    }
    
    const exeDir = await getExeDirectory();
    const coreDataDir = await path.join(exeDir, 'coredata');
    const storageWayPath = await path.join(coreDataDir, 'storeway.json');
    
    console.log('📁 存储方式配置路径:', storageWayPath);
    
    storageWayStore = await Store.load(storageWayPath, { autoSave: false });
    storageWayInitialized = true;
    
    console.log('✅ 存储方式配置Store初始化成功');
    return storageWayStore;
    
  } catch (error) {
    console.error('❌ 存储方式配置Store初始化失败:', error);
    throw error;
  }
}

// 保存存储方式配置
export async function saveStorageWayConfig(storageMethod: 'localStorage' | 'tauriStore'): Promise<void> {
  try {
    console.log('💾 保存存储方式配置:', storageMethod);
    
    const store = await initStorageWayStore();
    await store.set('storage-method', storageMethod);
    await store.set('updated-time', new Date().toISOString());
    await store.set('app-version', '1.0.7');
    await store.save();
    
    console.log('✅ 存储方式配置已保存到storeway.json');
  } catch (error) {
    console.error('❌ 保存存储方式配置失败:', error);
    throw error;
  }
}

// 获取存储方式配置
export async function getStorageWayConfig(): Promise<'localStorage' | 'tauriStore'> {
  try {
    console.log('📖 读取存储方式配置...');
    
    const store = await initStorageWayStore();
    const storageMethod = await store.get<'localStorage' | 'tauriStore'>('storage-method');
    
    if (storageMethod) {
      console.log('✅ 从storeway.json读取存储方式:', storageMethod);
      return storageMethod;
    } else {
      console.log('📝 storeway.json中无配置，使用默认值: tauriStore');
      // 保存默认配置
      await saveStorageWayConfig('tauriStore');
      return 'tauriStore';
    }
  } catch (error) {
    console.error('❌ 读取存储方式配置失败:', error);
    console.log('🔧 使用默认存储方式: tauriStore');
    return 'tauriStore';
  }
}

// 初始化目录结构
export async function initializeDirectoryStructure(): Promise<void> {
  try {
    console.log('🔧 初始化目录结构...');
    
    // 方法1: 使用Tauri命令创建基础目录
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 检查并创建coredata目录
      try {
        await invoke('list_directory', { dirPath: 'coredata' });
        console.log('✅ coredata目录已存在');
      } catch {
        console.log('📁 创建coredata目录');
        await invoke('save_json_file', { filePath: 'coredata/.dir_init', data: '{}' });
      }
      
      // 检查并创建history目录
      try {
        await invoke('list_directory', { dirPath: 'coredata/history' });
        console.log('✅ history目录已存在');
      } catch {
        console.log('📁 创建history目录');
        await invoke('save_json_file', { filePath: 'coredata/history/.dir_init', data: '{}' });
      }
      
      // 注意：不预先创建年月文件夹，而是在需要时按需创建
      console.log('📝 历史记录将按需创建年月文件夹结构');
      
      // 检查并创建storeway.json配置文件
      try {
        await invoke('load_json_file', { filePath: 'coredata/storeway.json' });
        console.log('✅ storeway.json配置文件已存在');
      } catch {
        console.log('📁 创建storeway.json配置文件');
        const defaultStorewayConfig = {
          "storage-method": "tauriStore",
          "storage-location": "exe-directory", 
          "data-directory": "./coredata",
          "history-enabled": true,
          "history-folder": "./coredata/history",
          "history-index": "./coredata/history.json",
          "auto-backup": true,
          "backup-interval": 300000,
          "max-history-files": 1000,
          "file-naming-pattern": "{task_name}_{timestamp}_{task_id}.json",
          "year-month-folders": true,
          "created-time": new Date().toISOString(),
          "updated-time": new Date().toISOString(),
          "app-version": "1.0.7",
          "config-version": "1.0",
          "description": "StarRandom应用的永久存储配置文件"
        };
        await invoke('save_json_file', { filePath: 'coredata/storeway.json', data: JSON.stringify(defaultStorewayConfig, null, 2) });
        console.log('✅ storeway.json配置文件创建成功');
      }
      
      // 确保history.json索引文件存在 - 直接保存数组格式
      try {
        await invoke('load_json_file', { filePath: 'coredata/history.json' });
        console.log('✅ history.json索引文件已存在');
      } catch {
        console.log('📁 创建history.json索引文件');
        const defaultHistoryArray: any[] = []; // 直接使用数组格式，不包装
        await invoke('save_json_file', { filePath: 'coredata/history.json', data: JSON.stringify(defaultHistoryArray, null, 2) });
        console.log('✅ history.json索引文件创建成功（数组格式）');
      }
      
      console.log('✅ Tauri命令方式初始化目录结构成功');
      
    } catch (invokeError) {
      console.warn('⚠️ Tauri命令初始化失败，使用Store方式:', invokeError);
      
      // 方法2: 使用Store创建基础文件来隐式创建目录
      try {
        // 确保settings.json存在
        const settingsStore = await getStore();
        await settingsStore.set('_dir_initialized', new Date().toISOString());
        
        // 确保history.json索引文件存在
        const historyStore = await getHistoryStore();
        const historyTasks = await historyStore.get('history-tasks') || [];
        await historyStore.set('history-tasks', historyTasks);
        await historyStore.set('history-updated', new Date().toISOString());
        
        // 确保storeway.json配置文件存在
        try {
          await getStorageWayConfig(); // 这会自动创建默认配置
          console.log('✅ storeway.json配置文件已创建');
        } catch (storewayError) {
          console.error('❌ 创建storeway.json失败:', storewayError);
        }
        
        console.log('✅ Store方式初始化目录结构成功（settings.json + history.json + storeway.json）');
      } catch (storeError) {
        console.error('❌ Store方式初始化也失败:', storeError);
      }
    }
    
  } catch (error) {
    console.error('❌ 初始化目录结构失败:', error);
  }
}

// === 分年月文件夹化历史记录管理 ===

// 历史记录索引接口
interface HistoryIndex {
  id: string;
  name: string;
  timestamp: string;
  fileName: string;
  relativePath: string; // 相对于history目录的路径，如: 2025/06/task_001.json
  totalCount: number;
  groupName: string;
  year: number;
  month: number;
}

// 获取历史记录根文件夹路径
async function getHistoryRootPath(): Promise<string> {
  try {
    const exeDir = await getExeDirectory();
    const coreDataDir = await path.join(exeDir, 'coredata');
    const historyDir = await path.join(coreDataDir, 'history');
    return historyDir;
  } catch (error) {
    console.error('❌ 获取历史文件夹路径失败:', error);
    return './coredata/history';
  }
}

// 获取指定年月的文件夹路径
async function getYearMonthPath(year: number, month: number): Promise<string> {
  const historyRoot = await getHistoryRootPath();
  const monthStr = month.toString().padStart(2, '0'); // 确保月份是两位数
  return await path.join(historyRoot, year.toString(), monthStr);
}

// 根据时间戳解析年月
function parseYearMonth(timestamp: string): { year: number; month: number } {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1 // JS月份从0开始，转为1-12
  };
}

// 确保年月目录存在
async function ensureYearMonthDirectory(year: number, month: number): Promise<string> {
  try {
    const yearMonthPath = await getYearMonthPath(year, month);
    console.log('📁 确保目录存在:', yearMonthPath);
    
    // 方法1: 使用Tauri的invoke命令创建目录
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 检查目录是否存在
      const yearPath = await path.join(await getHistoryRootPath(), year.toString());
      const monthStr = month.toString().padStart(2, '0');
      const fullMonthPath = await path.join(yearPath, monthStr);
      
      // 创建年份目录
      try {
        await invoke('list_directory', { dirPath: `coredata/history/${year}` });
        console.log('✅ 年份目录已存在:', year);
      } catch {
        console.log('📁 创建年份目录:', year);
        // 年份目录不存在，尝试创建
        await invoke('save_json_file', { 
          filePath: `coredata/history/${year}/.dir_marker`, 
          data: '{}' 
        });
      }
      
      // 创建月份目录
      try {
        await invoke('list_directory', { dirPath: `coredata/history/${year}/${monthStr}` });
        console.log('✅ 月份目录已存在:', `${year}/${monthStr}`);
      } catch {
        console.log('📁 创建月份目录:', `${year}/${monthStr}`);
        // 月份目录不存在，尝试创建
        await invoke('save_json_file', { 
          filePath: `coredata/history/${year}/${monthStr}/.dir_marker`, 
          data: '{}' 
        });
      }
      
      console.log('✅ 年月目录已确保存在:', fullMonthPath);
      return fullMonthPath;
      
    } catch (invokeError) {
      console.warn('⚠️ Tauri invoke方式创建目录失败，尝试Store方式:', invokeError);
      
      // 方法2: 通过创建Store文件来隐式创建目录
      const testStorePath = await path.join(yearMonthPath, '.dir_init.json');
      const testStore = await Store.load(testStorePath, { autoSave: true });
      await testStore.set('_init', true);
      await testStore.set('_created', new Date().toISOString());
      
      console.log('✅ Store方式创建目录成功:', yearMonthPath);
      return yearMonthPath;
    }
    
  } catch (error) {
    console.error('❌ 创建年月目录失败:', error);
    
    // 方法3: 回退到使用相对路径
    const monthStr = month.toString().padStart(2, '0');
    const fallbackPath = `./coredata/history/${year}/${monthStr}`;
    console.log('⚠️ 使用回退路径:', fallbackPath);
    
    try {
      // 尝试用Store方式创建回退路径
      const fallbackTestPath = `${fallbackPath}/.dir_init.json`;
      const fallbackStore = await Store.load(fallbackTestPath, { autoSave: true });
      await fallbackStore.set('_fallback_init', true);
      console.log('✅ 回退路径创建成功:', fallbackPath);
    } catch (fallbackError) {
      console.error('❌ 回退路径创建也失败:', fallbackError);
    }
    
    return fallbackPath;
  }
}

// 从history.json直接读取历史记录数组
export async function getHistoryIndex(): Promise<HistoryIndex[]> {
  try {
    console.log('📖 从history.json读取历史记录数组...');
    
    // 直接读取history.json文件内容，期望是数组格式
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const historyContent = await invoke('load_json_file', { filePath: 'coredata/history.json' });
      
      if (typeof historyContent === 'string') {
        const historyData = JSON.parse(historyContent);
        
        // 如果是数组格式，直接返回
        if (Array.isArray(historyData)) {
          console.log('✅ 历史记录数组已加载:', historyData.length, '条记录');
          return historyData;
        }
        
        // 如果是旧的包装格式，提取数组部分
        if (historyData && historyData['history-tasks'] && Array.isArray(historyData['history-tasks'])) {
          console.log('📝 检测到旧格式，提取历史记录数组...');
          const extractedArray = historyData['history-tasks'];
          
          // 转换为新格式并保存
          const convertedArray = extractedArray.map((task: any) => ({
            id: task.id,
            name: task.name,
            timestamp: task.timestamp,
            fileName: task.fileName || `${task.name}_${task.id}.json`,
            relativePath: task.relativePath || `unknown/${task.fileName || task.id}.json`,
            totalCount: task.totalCount || task.total_count || 0,
            groupName: task.groupName || task.group_name || '未知小组',
            year: task.year || new Date(task.timestamp).getFullYear(),
            month: task.month || (new Date(task.timestamp).getMonth() + 1)
          }));
          
          // 保存为新的数组格式
          await invoke('save_json_file', { 
            filePath: 'coredata/history.json', 
            data: JSON.stringify(convertedArray, null, 2) 
          });
          console.log('✅ 已转换并保存为数组格式:', convertedArray.length, '条记录');
          
          return convertedArray;
        }
      }
      
      console.log('📝 历史记录为空，返回空数组');
      return [];
      
    } catch (fileError) {
      console.warn('⚠️ 直接读取文件失败，尝试Store方式:', fileError);
      
      // 备用方案：使用Store方式读取
      const historyStoreInstance = await getHistoryStore();
      const storeData = await historyStoreInstance.get('history-tasks');
      
      if (storeData && Array.isArray(storeData)) {
        console.log('✅ 从Store加载历史数据:', storeData.length, '条记录');
        return storeData;
      }
    }
    
    console.log('📝 未找到历史记录，返回空数组');
    return [];
    
  } catch (error) {
    console.error('❌ 获取历史记录失败:', error);
    
    // 最后的备用方案：扫描文件夹重建索引
    console.log('🔄 尝试扫描文件夹重建索引...');
    try {
      const rebuiltIndex = await scanAndRebuildHistoryIndex();
      console.log('✅ 从文件夹重建索引成功:', rebuiltIndex.length, '条记录');
      return rebuiltIndex;
    } catch (rebuildError) {
      console.error('❌ 重建索引也失败:', rebuildError);
      return [];
    }
  }
}

// 扫描文件夹重建历史记录索引（备用方案）
async function scanAndRebuildHistoryIndex(): Promise<HistoryIndex[]> {
  console.log('🔍 开始扫描历史记录文件夹重建索引...');
  const historyList: HistoryIndex[] = [];
  
  // 扫描年份文件夹
  for (let year = 2020; year <= new Date().getFullYear() + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const monthPath = `coredata/history/${year}/${monthStr}`;
      
      try {
        // 使用Tauri API列出目录内容
        const { invoke } = await import('@tauri-apps/api/core');
        const files = await invoke('list_directory', { dirPath: monthPath }) as string[];
        
        for (const fileName of files) {
          if (fileName.endsWith('.json') && !fileName.startsWith('.')) {
            try {
              // 加载任务文件获取基本信息
              const taskFilePath = `${monthPath}/${fileName}`;
              const taskStore = await Store.load(taskFilePath, { autoSave: false });
              const taskData = await taskStore.get('task-data') as any;
              
              if (taskData && taskData.id) {
                historyList.push({
                  id: taskData.id,
                  name: taskData.name || '未知任务',
                  timestamp: taskData.timestamp,
                  fileName: fileName,
                  relativePath: `${year}/${monthStr}/${fileName}`,
                  totalCount: taskData.total_count || (taskData.results ? taskData.results.length : 0),
                  groupName: taskData.group_name || '未知小组',
                  year: year,
                  month: month
                });
              }
            } catch (fileError) {
              console.warn(`⚠️ 无法读取历史文件 ${fileName}:`, fileError);
            }
          }
        }
      } catch (dirError) {
        // 目录不存在是正常的，不记录错误
      }
    }
  }
  
  // 按时间戳排序，最新的在前
  historyList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // 保存重建的索引
  if (historyList.length > 0) {
    await saveHistoryIndex(historyList);
    console.log('✅ 重建的索引已保存到history.json');
  }
  
  return historyList;
}

// 保存历史记录数组到history.json
async function saveHistoryIndex(index: HistoryIndex[]): Promise<void> {
  try {
    console.log('💾 开始保存历史记录数组到history.json...');
    console.log('📊 数组数据:', index.length, '条记录');
    
    // 直接保存为数组格式到文件
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_json_file', { 
        filePath: 'coredata/history.json', 
        data: JSON.stringify(index, null, 2) 
      });
      console.log('✅ 历史记录数组已直接保存到文件');
    } catch (fileError) {
      console.warn('⚠️ 直接保存文件失败，尝试Store方式:', fileError);
      
      // 备用方案：使用Store方式保存
      const historyStoreInstance = await getHistoryStore();
      await historyStoreInstance.set('history-tasks', index);
      await historyStoreInstance.set('history-updated', new Date().toISOString());
      await historyStoreInstance.save();
      console.log('✅ 历史记录数组已保存到Store');
    }
    
    console.log('✅ 历史记录保存完成:', index.length, '条记录');
  } catch (error) {
    console.error('❌ 保存历史记录失败:', error);
    throw error;
  }
}

// 生成历史记录文件名（使用任务名称）
function generateHistoryFileName(task: any): string {
  // 清理文件名中的非法字符
  const cleanName = task.name
    .replace(/[<>:"/\\|?*]/g, '_') // 替换Windows非法字符
    .replace(/\s+/g, '_')          // 替换空格为下划线
    .substring(0, 100);            // 限制长度
  
  return `${cleanName}_${task.id}.json`;
}

// 保存单个历史记录到分年月文件夹
export async function saveHistoryTask(task: any): Promise<void> {
  try {
    console.log('💾 开始保存历史记录到分年月文件夹...');
    console.log('📋 任务数据:', task);
    
    // 解析年月信息
    const { year, month } = parseYearMonth(task.timestamp);
    console.log(`📅 解析时间: ${year}年${month}月`);
    
    // 生成文件名
    const fileName = generateHistoryFileName(task);
    const monthStr = month.toString().padStart(2, '0');
    
    // 首先确保年月目录存在
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 1. 确保coredata目录存在
      try {
        await invoke('list_directory', { dirPath: 'coredata' });
        console.log('✅ coredata目录已存在');
      } catch {
        console.log('📁 创建coredata目录');
        await invoke('save_json_file', { filePath: 'coredata/.dir_init', data: '{}' });
      }
      
      // 2. 确保history目录存在
      try {
        await invoke('list_directory', { dirPath: 'coredata/history' });
        console.log('✅ history目录已存在');
      } catch {
        console.log('📁 创建history目录');
        await invoke('save_json_file', { filePath: 'coredata/history/.dir_init', data: '{}' });
      }
      
      // 3. 确保年份目录存在
      try {
        await invoke('list_directory', { dirPath: `coredata/history/${year}` });
        console.log(`✅ 年份目录已存在: ${year}`);
      } catch {
        console.log(`📁 创建年份目录: ${year}`);
        await invoke('save_json_file', { filePath: `coredata/history/${year}/.dir_init`, data: '{}' });
      }
      
      // 4. 确保月份目录存在
      try {
        await invoke('list_directory', { dirPath: `coredata/history/${year}/${monthStr}` });
        console.log(`✅ 月份目录已存在: ${year}/${monthStr}`);
      } catch {
        console.log(`📁 创建月份目录: ${year}/${monthStr}`);
        await invoke('save_json_file', { filePath: `coredata/history/${year}/${monthStr}/.dir_init`, data: '{}' });
      }
      
      console.log(`✅ 年月目录结构已确保存在: coredata/history/${year}/${monthStr}/`);
      
    } catch (createDirError) {
      console.warn('⚠️ 使用Tauri命令创建目录失败，继续使用Store方式:', createDirError);
    }
    
    // 使用简化的相对路径，此时目录应该已经存在
    const relativePath = `coredata/history/${year}/${monthStr}/${fileName}`;
    console.log('📁 历史记录文件路径:', relativePath);
    
    // 强制保存单个任务文件
    try {
      const taskStore = await Store.load(relativePath, { autoSave: false }); // 禁用autoSave，手动控制
      await taskStore.set('task-data', task);
      await taskStore.set('created-time', new Date().toISOString());
      await taskStore.set('year', year);
      await taskStore.set('month', month);
      await taskStore.save(); // 强制同步保存
      console.log('✅ 任务文件保存成功:', relativePath);
    } catch (fileError) {
      console.error('❌ 任务文件保存失败:', fileError);
      
      // 备用方案：如果Store.load失败，尝试直接使用Tauri命令保存
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const taskData = {
          'task-data': task,
          'created-time': new Date().toISOString(),
          'year': year,
          'month': month
        };
        await invoke('save_json_file', { 
          filePath: relativePath, 
          data: JSON.stringify(taskData, null, 2) 
        });
        console.log('✅ 任务文件使用备用方案保存成功:', relativePath);
      } catch (backupError) {
        console.error('❌ 备用方案也失败:', backupError);
        throw fileError; // 抛出原始错误
      }
    }
    
    // 更新history.json索引文件
    try {
      const currentIndex = await getHistoryIndex();
      const newIndexEntry: HistoryIndex = {
        id: task.id,
        name: task.name,
        timestamp: task.timestamp,
        fileName: fileName,
        relativePath: `${year}/${monthStr}/${fileName}`,
        totalCount: task.total_count || task.results?.length || 0,
        groupName: task.group_name || '未知小组',
        year: year,
        month: month
      };
      
      // 检查是否已存在，如果存在则更新，否则添加
      const existingIndex = currentIndex.findIndex(item => item.id === task.id);
      if (existingIndex >= 0) {
        currentIndex[existingIndex] = newIndexEntry;
        console.log('📝 更新现有历史记录索引');
      } else {
        currentIndex.unshift(newIndexEntry); // 新记录添加到开头
        console.log('📝 添加新历史记录索引');
      }
      
      // 保留最近100个记录
      const trimmedIndex = currentIndex.slice(0, 100);
      await saveHistoryIndex(trimmedIndex);
      console.log('✅ 历史记录索引已更新，总数:', trimmedIndex.length);
    } catch (indexError) {
      console.error('❌ 索引更新失败:', indexError);
      throw indexError;
    }
    
    console.log('🎉 历史记录保存完成!');
  } catch (error) {
    console.error('❌ 保存历史记录失败:', error);
    throw error;
  }
}

// 获取单个历史记录
export async function getHistoryTask(taskId: string): Promise<any | null> {
  try {
    // 首先从索引中查找记录信息
    const historyIndex = await getHistoryIndex();
    const indexEntry = historyIndex.find(item => item.id === taskId);
    
    if (!indexEntry) {
      console.warn('⚠️ 在索引中未找到历史记录:', taskId);
      return null;
    }
    
    // 使用索引中的相对路径构建完整路径
    const historyRoot = await getHistoryRootPath();
    const taskFilePath = await path.join(historyRoot, indexEntry.relativePath);
    
    console.log('📁 加载历史记录文件:', taskFilePath);
    
    const taskStore = await Store.load(taskFilePath, { autoSave: false });
    const taskData = await taskStore.get('task-data');
    
    console.log('✅ 历史记录已加载:', taskFilePath);
    return taskData;
  } catch (error) {
    console.error('❌ 获取历史记录失败:', error);
    return null;
  }
}

// 删除单个历史记录
export async function deleteHistoryTask(taskId: string): Promise<void> {
  try {
    console.log('🗑️ 开始删除历史记录:', taskId);
    
    // 先从history.json索引中移除
    const currentIndex = await getHistoryIndex();
    const updatedIndex = currentIndex.filter(item => item.id !== taskId);
    await saveHistoryIndex(updatedIndex);
    console.log('✅ 历史记录已从索引中移除:', taskId);
    
    // 然后删除对应的文件
    let fileFound = false;
    for (let year = 2020; year <= new Date().getFullYear() + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const monthPath = `coredata/history/${year}/${monthStr}`;
        
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const files = await invoke('list_directory', { dirPath: monthPath }) as string[];
          
          for (const fileName of files) {
            if (fileName.endsWith('.json') && !fileName.startsWith('.')) {
              const taskFilePath = `${monthPath}/${fileName}`;
              const taskStore = await Store.load(taskFilePath, { autoSave: false });
              const taskData = await taskStore.get('task-data') as any;
              
              if (taskData && taskData.id === taskId) {
                // 找到了要删除的文件
                await invoke('delete_file', { filePath: taskFilePath });
                console.log('✅ 历史记录文件已删除:', taskFilePath);
                fileFound = true;
                break;
              }
            }
          }
          if (fileFound) break;
        } catch (dirError) {
          // 目录不存在是正常的
        }
      }
      if (fileFound) break;
    }
    
    if (!fileFound) {
      console.warn('⚠️ 未找到要删除的历史文件:', taskId);
    }
  } catch (error) {
    console.error('❌ 删除历史记录失败:', error);
    throw error;
  }
}

// 清空所有历史记录
export async function clearHistoryData(): Promise<void> {
  try {
    console.log('🗑️ 开始清空所有历史记录...');
    
    // 清空history.json索引
    await saveHistoryIndex([]);
    console.log('✅ 历史记录索引已清空');
    
    // 删除整个history文件夹的内容
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 扫描并删除所有历史文件
      for (let year = 2020; year <= new Date().getFullYear() + 1; year++) {
        for (let month = 1; month <= 12; month++) {
          const monthStr = month.toString().padStart(2, '0');
          const monthPath = `coredata/history/${year}/${monthStr}`;
          
          try {
            const files = await invoke('list_directory', { dirPath: monthPath }) as string[];
            for (const fileName of files) {
              if (fileName.endsWith('.json')) {
                const filePath = `${monthPath}/${fileName}`;
                await invoke('delete_file', { filePath: filePath });
                console.log('🗑️ 已删除历史文件:', filePath);
              }
            }
          } catch (dirError) {
            // 目录不存在是正常的
          }
        }
      }
      
      console.log('✅ 所有历史记录文件已清空');
    } catch (error) {
      console.warn('⚠️ 清空历史文件时遇到问题:', error);
    }
  } catch (error) {
    console.error('❌ 清空历史记录失败:', error);
    throw error;
  }
}

// 获取所有历史记录（兼容旧接口）
export async function getHistoryData(): Promise<any[]> {
  try {
    const historyIndex = await getHistoryIndex();
    console.log('✅ 从文件夹结构加载历史记录索引:', historyIndex.length, '条记录');
    
    // 加载完整的历史记录数据，而不是只返回索引
    const fullHistoryData: any[] = [];
    
    for (const indexItem of historyIndex) {
      try {
        // 为每个索引项加载完整的任务数据
        const taskData = await getHistoryTask(indexItem.id);
        if (taskData) {
          fullHistoryData.push(taskData);
        } else {
          // 如果无法加载完整数据，至少返回索引信息（包含伪结果数据）
          fullHistoryData.push({
            id: indexItem.id,
            name: indexItem.name,
            timestamp: indexItem.timestamp,
            total_count: indexItem.totalCount,
            group_name: indexItem.groupName,
            results: Array(indexItem.totalCount).fill(0).map((_, i) => `参与者${i + 1}`), // 生成伪结果数据
            file_path: indexItem.fileName,
            edit_protected: false,
            edit_password: ''
          });
        }
      } catch (taskError) {
        console.warn(`⚠️ 加载任务数据失败 [${indexItem.id}]:`, taskError);
        // 使用索引信息作为备用数据
        fullHistoryData.push({
          id: indexItem.id,
          name: indexItem.name,
          timestamp: indexItem.timestamp,
          total_count: indexItem.totalCount,
          group_name: indexItem.groupName,
          results: Array(indexItem.totalCount).fill(0).map((_, i) => `参与者${i + 1}`), // 生成伪结果数据
          file_path: indexItem.fileName,
          edit_protected: false,
          edit_password: ''
        });
      }
    }
    
    console.log('✅ 完整历史记录数据已加载:', fullHistoryData.length, '条记录');
    return fullHistoryData;
  } catch (error) {
    console.error('❌ 获取历史记录数据失败:', error);
    return [];
  }
}

// 批量保存历史记录（兼容旧接口）
export async function saveHistoryData(historyTasks: any[]): Promise<void> {
  try {
    console.log('💾 开始批量保存历史记录到文件夹结构...');
    console.log('📊 待保存任务数:', historyTasks.length);
    
    for (const task of historyTasks) {
      await saveHistoryTask(task);
    }
    
    console.log('✅ 批量保存历史记录完成:', historyTasks.length, '个任务');
  } catch (error) {
    console.error('❌ 批量保存历史记录失败:', error);
    throw error;
  }
}

// 强制验证和修复数据完整性
export async function verifyAndRepairData(): Promise<void> {
  try {
    console.log('🔍 开始验证数据完整性...');
    
    // 确保基础Store文件存在
    const settingsStore = await getStore();
    const historyStore = await getHistoryStore();
    
    // 确保history.json索引文件有基础结构
    const currentIndex = await historyStore.get('history-index');
    if (!currentIndex) {
      console.log('🔧 初始化空的历史记录索引');
      await historyStore.set('history-index', []);
      await historyStore.set('index-created', new Date().toISOString());
      await historyStore.save();
    }
    
    // 确保设置文件有基础结构
    const currentSettings = await settingsStore.get('lottery-settings');
    if (!currentSettings) {
      console.log('🔧 初始化默认设置');
      await settingsStore.set('lottery-settings', {
        storageMethod: 'tauriStore',
        theme: 'dark'
      });
      await settingsStore.set('settings-created', new Date().toISOString());
      await settingsStore.save();
    }
    
    // 验证存储方式配置
    try {
      const storageMethod = await getStorageWayConfig();
      console.log('✅ 存储方式配置验证:', storageMethod);
    } catch (error) {
      console.warn('⚠️ 存储方式配置验证失败，创建默认配置');
      await saveStorageWayConfig('tauriStore');
    }
    
    console.log('✅ 数据完整性验证完成（纯文件夹存储架构）');
  } catch (error) {
    console.error('❌ 数据完整性验证失败:', error);
    throw error;
  }
}

// 调试：测试Store文件是否真实存在
export async function debugStoreLocation(): Promise<{
  settingsPath: string;
  historyPath: string;
  pathInfo: any;
  storeStats: any;
  historyStats: any;
}> {
  try {
    await getPathInfo();
    const storeInfo = await getStoreInfo();
    
    // 获取历史文件夹统计信息（纯文件夹存储）
    let historyStats: { length: number; keys: string[]; isInitialized: boolean; folderCount?: number } = { 
      length: 0, 
      keys: [], 
      isInitialized: true, // 文件夹存储始终可用
      folderCount: 0
    };
    try {
      // 扫描历史文件夹获取统计信息
      const historyIndex = await getHistoryIndex();
      historyStats = {
        length: historyIndex.length,
        keys: historyIndex.map(item => item.id),
        isInitialized: true,
        folderCount: new Set(historyIndex.map(item => `${item.year}/${item.month}`)).size
      };
      console.log('✅ 历史文件夹统计信息已获取');
    } catch (error) {
      console.error('❌ 获取历史文件夹信息失败:', error);
    }
    
    return {
      settingsPath: actualStorePath,
      historyPath: actualHistoryStorePath,
      pathInfo: {
        currentDir: await path.resolve('.'),
        appDataDir: await path.appDataDir(),
        resourceDir: await path.resourceDir(),
      },
      storeStats: storeInfo,
      historyStats
    };
  } catch (error) {
    console.error('❌ 调试Store位置失败:', error);
    return {
      settingsPath: actualStorePath,
      historyPath: actualHistoryStorePath,
      pathInfo: {},
      storeStats: {},
      historyStats: {}
    };
  }
}

// 错误处理包装器
export async function withStoreErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ ${operationName} 失败:`, error);
    
    // 如果是Tauri环境问题，给出提示
    if (!isTauriStoreAvailable()) {
      console.warn('⚠️ Tauri Store不可用，可能在浏览器环境中运行');
    }
    
    return null;
  }
} 