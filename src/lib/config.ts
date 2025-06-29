/**
 * 应用程序设置管理模块
 * 提供设置的加载、保存和访问功能
 * 类似Python版本的settings.py功能
 */

// 类型定义
export type DrawMode = 'equal' | 'weighted'

export interface Group {
  id: string
  name: string
  names: string[]
  weights?: number[]
  source: 'file' | 'url' | 'manual'
  created: string
  updated: string
}

// 配置数据类型定义
export interface AppConfig {
  app_info: {
    name: string
    version: string
    config_version: string
    last_updated: string
    first_run: boolean
  }
  files: {
    last_file_directory: string
    name_files: string[]
    remote_urls: string[]
    supported_formats: string[]
    max_file_size: number
  }
  groups: {
    selected_group: string
    group_list: Group[]
    last_selected_group: string
    group_selection_history: string[]
    max_history_size: number
  }
  draw_settings: {
    draw_count: number
    draw_mode: DrawMode
    allow_repeat: boolean
    accumulate_results: boolean
    auto_reset_after_draw: boolean
    show_animation: boolean
  }
  ui: {
    theme_mode: 'dark' | 'light'
    font_size: 'small' | 'medium' | 'large'
    use_animation: boolean
    animation_duration: number
    animation_effects: {
      blur_scroll: boolean
      pulse_effect: boolean
      fade_in: boolean
    }
    window_size: {
      width: number
      height: number
    }
    window_position: {
      x: number
      y: number
    }
  }
  animation: {
    enabled: boolean
    scroll_speed: 'slow' | 'medium' | 'fast'
    duration: number
    effects: {
      blur_enabled: boolean
      pulse_enabled: boolean
      fade_enabled: boolean
    }
    sound_enabled: boolean
    sound_volume: number
  }
  advanced: {
    debug_mode: boolean
    auto_save: boolean
    auto_backup: boolean
    backup_interval: number
    max_backup_files: number
    enable_logging: boolean
    log_level: 'debug' | 'info' | 'warning' | 'error'
  }
  security: {
    password_protection: boolean
    password_hash: string
    auto_lock_timeout: number
    require_password_for_settings: boolean
    data_encryption: boolean
  }
  logging: {
    auto_clean_logs: boolean
    log_clean_days: number
    last_log_clean_time: string
    max_log_file_size: number
    log_rotation: boolean
  }
  performance: {
    max_names_display: number
    animation_fps: number
    preload_files: boolean
    cache_parsed_data: boolean
    cache_expiry: number
  }
  network: {
    timeout: number
    retry_attempts: number
    user_agent: string
    proxy_enabled: boolean
    proxy_host: string
    proxy_port: number
  }
  custom_parameters: Record<string, any>
  shortcuts: {
    draw: string
    settings: string
    clear_results: string
    import_file: string
    export_results: string
  }
  statistics: {
    total_draws: number
    total_names_drawn: number
    favorite_draw_mode: DrawMode
    app_usage_time: number
    last_usage_date: string
    session_count: number
  }
  recent: {
    files: string[]
    groups: string[]
    draw_modes: DrawMode[]
    max_recent_items: number
  }
  import_export: {
    default_export_format: string
    include_weights: boolean
    include_timestamps: boolean
    export_path: string
    auto_export: boolean
  }
  notifications: {
    show_welcome: boolean
    show_tips: boolean
    show_updates: boolean
    show_errors: boolean
    notification_duration: number
  }
  experimental: {
    enable_beta_features: boolean
    new_ui_components: boolean
    advanced_animations: boolean
    cloud_sync: boolean
  }
  system: {
    os: string
    browser: string
    screen_resolution: string
    timezone: string
    language: string
    first_install_date: string
    last_backup_date: string
  }
  error_reporting: {
    enabled: boolean
    auto_report: boolean
    include_system_info: boolean
    contact_email: string
  }
  updates: {
    auto_check: boolean
    check_interval: number
    last_check_time: string
    update_channel: 'stable' | 'beta' | 'dev'
    auto_download: boolean
  }
}

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  app_info: {
    name: "StarRandom",
    version: "2.0.0",
    config_version: "1.0",
    last_updated: "",
    first_run: true
  },
  files: {
    last_file_directory: "",
    name_files: [],
    remote_urls: [],
    supported_formats: ["csv", "txt", "json"],
    max_file_size: 10485760
  },
  groups: {
    selected_group: "",
    group_list: [],
    last_selected_group: "",
    group_selection_history: [],
    max_history_size: 10
  },
  draw_settings: {
    draw_count: 1,
    draw_mode: "equal",
    allow_repeat: false,
    accumulate_results: false,
    auto_reset_after_draw: false,
    show_animation: true
  },
  ui: {
    theme_mode: "dark",
    font_size: "medium",
    use_animation: true,
    animation_duration: 1200,
    animation_effects: {
      blur_scroll: true,
      pulse_effect: true,
      fade_in: true
    },
    window_size: {
      width: 1200,
      height: 800
    },
    window_position: {
      x: -1,
      y: -1
    }
  },
  animation: {
    enabled: true,
    scroll_speed: "medium",
    duration: 1200,
    effects: {
      blur_enabled: true,
      pulse_enabled: true,
      fade_enabled: true
    },
    sound_enabled: false,
    sound_volume: 0.5
  },
  advanced: {
    debug_mode: false,
    auto_save: true,
    auto_backup: false,
    backup_interval: 300,
    max_backup_files: 5,
    enable_logging: true,
    log_level: "info"
  },
  security: {
    password_protection: false,
    password_hash: "",
    auto_lock_timeout: 0,
    require_password_for_settings: false,
    data_encryption: false
  },
  logging: {
    auto_clean_logs: true,
    log_clean_days: 7,
    last_log_clean_time: "",
    max_log_file_size: 5242880,
    log_rotation: true
  },
  performance: {
    max_names_display: 1000,
    animation_fps: 60,
    preload_files: true,
    cache_parsed_data: true,
    cache_expiry: 3600
  },
  network: {
    timeout: 30,
    retry_attempts: 3,
    user_agent: "StarRandom/2.0.0",
    proxy_enabled: false,
    proxy_host: "",
    proxy_port: 0
  },
  custom_parameters: {},
  shortcuts: {
    draw: "Space",
    settings: "F2",
    clear_results: "Escape",
    import_file: "Ctrl+O",
    export_results: "Ctrl+S"
  },
  statistics: {
    total_draws: 0,
    total_names_drawn: 0,
    favorite_draw_mode: "equal",
    app_usage_time: 0,
    last_usage_date: "",
    session_count: 0
  },
  recent: {
    files: [],
    groups: [],
    draw_modes: [],
    max_recent_items: 10
  },
  import_export: {
    default_export_format: "json",
    include_weights: true,
    include_timestamps: true,
    export_path: "",
    auto_export: false
  },
  notifications: {
    show_welcome: true,
    show_tips: true,
    show_updates: true,
    show_errors: true,
    notification_duration: 3000
  },
  experimental: {
    enable_beta_features: false,
    new_ui_components: false,
    advanced_animations: false,
    cloud_sync: false
  },
  system: {
    os: "",
    browser: "",
    screen_resolution: "",
    timezone: "",
    language: "zh-CN",
    first_install_date: "",
    last_backup_date: ""
  },
  error_reporting: {
    enabled: false,
    auto_report: false,
    include_system_info: false,
    contact_email: ""
  },
  updates: {
    auto_check: true,
    check_interval: 86400,
    last_check_time: "",
    update_channel: "stable",
    auto_download: false
  }
}

/**
 * 配置管理类
 * 类似Python版本的Settings类
 */
export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig
  private readonly STORAGE_KEY = 'StarRandom-config'

  private constructor() {
    this.config = this.loadConfig()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 从localStorage加载配置
   */
  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedConfig = JSON.parse(stored)
        // 合并默认配置和存储的配置，确保所有字段都存在
        return this.mergeConfig(DEFAULT_CONFIG, parsedConfig)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    return { ...DEFAULT_CONFIG }
  }

  /**
   * 深度合并配置对象
   */
  private mergeConfig(defaultConfig: any, userConfig: any): any {
    const result = { ...defaultConfig }
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key]) && userConfig[key] !== null) {
          result[key] = this.mergeConfig(defaultConfig[key] || {}, userConfig[key])
        } else {
          result[key] = userConfig[key]
        }
      }
    }
    
    return result
  }

  /**
   * 保存配置到localStorage
   */
  private saveConfig(): void {
    try {
      this.config.app_info.last_updated = new Date().toISOString()
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  /**
   * 获取配置值
   */
  get<T = any>(path: string): T {
    const keys = path.split('.')
    let value: any = this.config
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined as T
      }
    }
    
    return value as T
  }

  /**
   * 设置配置值
   */
  set(path: string, value: any): void {
    const keys = path.split('.')
    let current: any = this.config
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[keys[keys.length - 1]] = value
    this.saveConfig()
  }

  /**
   * 获取完整配置
   */
  getAll(): AppConfig {
    return { ...this.config }
  }

  /**
   * 重置配置为默认值
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.saveConfig()
  }

  /**
   * 添加小组到历史记录
   */
  addToGroupHistory(groupName: string): void {
    const history = this.get<string[]>('groups.group_selection_history') || []
    const maxSize = this.get<number>('groups.max_history_size') || 10
    
    // 移除已存在的项目
    const filteredHistory = history.filter(name => name !== groupName)
    
    // 添加到开头
    filteredHistory.unshift(groupName)
    
    // 限制历史记录大小
    const newHistory = filteredHistory.slice(0, maxSize)
    
    this.set('groups.group_selection_history', newHistory)
  }

  /**
   * 清除小组历史记录
   */
  clearGroupHistory(): void {
    this.set('groups.group_selection_history', [])
  }

  /**
   * 添加文件到最近使用
   */
  addToRecentFiles(filePath: string): void {
    const recent = this.get<string[]>('recent.files') || []
    const maxItems = this.get<number>('recent.max_recent_items') || 10
    
    const filtered = recent.filter(path => path !== filePath)
    filtered.unshift(filePath)
    
    this.set('recent.files', filtered.slice(0, maxItems))
  }

  /**
   * 更新统计数据
   */
  updateStatistics(drawCount: number, namesDrawn: number, mode: DrawMode): void {
    const stats = this.get('statistics')
    this.set('statistics.total_draws', stats.total_draws + drawCount)
    this.set('statistics.total_names_drawn', stats.total_names_drawn + namesDrawn)
    this.set('statistics.last_usage_date', new Date().toISOString())
    this.set('statistics.favorite_draw_mode', mode)
  }

  /**
   * 增加会话计数
   */
  incrementSessionCount(): void {
    const count = this.get<number>('statistics.session_count') || 0
    this.set('statistics.session_count', count + 1)
  }

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * 从JSON导入配置
   */
  importConfig(jsonString: string): boolean {
    try {
      const importedConfig = JSON.parse(jsonString)
      this.config = this.mergeConfig(DEFAULT_CONFIG, importedConfig)
      this.saveConfig()
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance() 