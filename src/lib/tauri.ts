import { invoke } from '@tauri-apps/api/core'

// Tauri后端命令接口
const tauriCommands = {
  // 基础命令
  greet: (name: string) => invoke<string>('greet', { name }),
  saveLotteryResult: (result: string) => invoke<void>('save_lottery_result', { result }),
  loadLotteryHistory: () => invoke<string[]>('load_lottery_history'),
  getAppPaths: () => invoke<any>('get_app_paths'),
  saveSettings: (settings: any) => invoke<void>('save_settings', { settings }),
  loadSettings: () => invoke<any>('load_settings'),
  getDebugInfo: () => invoke<any>('get_debug_info'),
  getAppInfo: () => invoke<any>('get_app_info'),
  
  // JSON文件操作命令
  saveJsonFile: (filePath: string, data: string) => invoke<void>('save_json_file', { filePath, data }),
  loadJsonFile: (filePath: string) => invoke<string>('load_json_file', { filePath }),
  fileExists: (filePath: string) => invoke<boolean>('file_exists', { filePath }),
  deleteFile: (filePath: string) => invoke<void>('delete_file', { filePath }),
  getFileSize: (filePath: string) => invoke<number>('get_file_size', { filePath }),
  listDirectory: (dirPath: string) => invoke<string[]>('list_directory', { dirPath }),
  
  // 新增的历史记录管理命令
  saveHistoryTask: (taskData: any) => invoke<void>('save_history_task', { taskData }),
  getHistoryData: () => invoke<any[]>('get_history_data'),
  getHistoryTask: (taskId: string) => invoke<any | null>('get_history_task', { taskId }),
  deleteHistoryTask: (taskId: string) => invoke<void>('delete_history_task', { taskId }),
  clearHistoryData: () => invoke<void>('clear_history_data'),
  getHistoryStats: () => invoke<any>('get_history_stats')
}

// 检查是否在Tauri环境中
export function isTauriEnvironment(): boolean {
  try {
    return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
  } catch {
    return false
  }
}

// 历史记录管理（使用新的Tauri命令）
export async function saveHistoryToTauri(task: any): Promise<void> {
  try {
    console.log('🔧 使用新的Tauri命令保存历史记录...', task);
    await tauriCommands.saveHistoryTask(task);
    console.log('✅ 历史记录已通过Tauri命令保存');
  } catch (error) {
    console.error('❌ Tauri命令保存历史记录失败:', error);
    throw error;
  }
}

export async function getHistoryFromTauri(): Promise<any[]> {
  try {
    console.log('🔧 使用新的Tauri命令获取历史记录...');
    const historyData = await tauriCommands.getHistoryData();
    console.log('✅ 历史记录已通过Tauri命令获取:', historyData.length, '条记录');
    return historyData;
  } catch (error) {
    console.error('❌ Tauri命令获取历史记录失败:', error);
    return [];
  }
}

export async function deleteHistoryFromTauri(taskId: string): Promise<void> {
  try {
    console.log('🔧 使用新的Tauri命令删除历史记录...', taskId);
    await tauriCommands.deleteHistoryTask(taskId);
    console.log('✅ 历史记录已通过Tauri命令删除');
  } catch (error) {
    console.error('❌ Tauri命令删除历史记录失败:', error);
    throw error;
  }
}

export async function clearHistoryFromTauri(): Promise<void> {
  try {
    console.log('🔧 使用新的Tauri命令清空历史记录...');
    await tauriCommands.clearHistoryData();
    console.log('✅ 历史记录已通过Tauri命令清空');
  } catch (error) {
    console.error('❌ Tauri命令清空历史记录失败:', error);
    throw error;
  }
}

export async function getHistoryStatsFromTauri(): Promise<any> {
  try {
    console.log('🔧 使用新的Tauri命令获取历史统计...');
    const stats = await tauriCommands.getHistoryStats();
    console.log('✅ 历史统计已通过Tauri命令获取:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Tauri命令获取历史统计失败:', error);
    return {
      total_tasks: 0,
      total_results: 0,
      years: [],
      months: {}
    };
  }
}

// 兼容性检查和自动选择存储方式
export async function saveHistory(task: any, storageMethod?: 'tauriStore' | 'localStorage'): Promise<void> {
  if (!storageMethod) {
    // 自动检测存储方式
    if (isTauriEnvironment()) {
      storageMethod = 'tauriStore';
    } else {
      storageMethod = 'localStorage';
    }
  }
  
  if (storageMethod === 'tauriStore' && isTauriEnvironment()) {
    await saveHistoryToTauri(task);
  } else {
    // 回退到localStorage或其他存储方式
    console.log('⚠️ 使用localStorage存储历史记录');
    // 这里可以调用localStorage的保存函数
  }
}

// 原有的功能保持兼容
export async function testTauriConnection(): Promise<boolean> {
  try {
    if (!isTauriEnvironment()) {
      console.log('❌ 不在Tauri环境中')
      return false
    }

    const result = await tauriCommands.greet('Tauri测试')
    console.log('✅ Tauri连接测试成功:', result)
    return true
  } catch (error) {
    console.error('❌ Tauri连接测试失败:', error)
    return false
  }
}

export async function saveLotteryResult(result: string): Promise<void> {
  try {
    if (!isTauriEnvironment()) {
      throw new Error('不在Tauri环境中')
    }

    await tauriCommands.saveLotteryResult(result)
    console.log('✅ 抽奖结果保存成功')
  } catch (error) {
    console.error('❌ 保存抽奖结果失败:', error)
    throw error
  }
}

export async function loadLotteryHistory(): Promise<string[]> {
  try {
    if (!isTauriEnvironment()) {
      throw new Error('不在Tauri环境中')
    }

    const history = await tauriCommands.loadLotteryHistory()
    console.log('✅ 抽奖历史加载成功:', history.length, '条记录')
    return history
  } catch (error) {
    console.error('❌ 加载抽奖历史失败:', error)
    return []
  }
}

export default tauriCommands 