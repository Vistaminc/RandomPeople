// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::io::Write;
use std::fs;
use std::path::PathBuf;
use chrono::Datelike;

// 初始化日志系统
fn init_logging() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let log_dir = std::env::current_dir()?.join("logs");
    fs::create_dir_all(&log_dir)?;
    let log_file = log_dir.join("starandom_debug.log");
    
    // 写入启动日志
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)?;
    
    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S");
    writeln!(file, "\n[{}] ==> StarRandom 星抽奖系统 v1.0.7 启动", timestamp)?;
    writeln!(file, "[{}] © 2025 河南星熠寻光科技有限公司 & vistamin. All rights reserved.", timestamp)?;
    writeln!(file, "[{}] 当前工作目录: {:?}", timestamp, std::env::current_dir()?)?;
    writeln!(file, "[{}] 日志文件位置: {:?}", timestamp, log_file)?;
    
    Ok(log_file)
}

// 记录错误到文件
fn log_error(message: &str) {
    if let Ok(log_dir) = std::env::current_dir().map(|d| d.join("logs")) {
        if let Ok(mut file) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("starandom_debug.log")) {
            let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S");
            let _ = writeln!(file, "[{}] ERROR: {}", timestamp, message);
        }
    }
    eprintln!("StarRandom ERROR: {}", message);
}

// 记录信息到文件
fn log_info(message: &str) {
    if let Ok(log_dir) = std::env::current_dir().map(|d| d.join("logs")) {
        if let Ok(mut file) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("starandom_debug.log")) {
            let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S");
            let _ = writeln!(file, "[{}] INFO: {}", timestamp, message);
        }
    }
    println!("StarRandom INFO: {}", message);
}

// 抽奖命令
#[tauri::command]
fn greet(name: &str) -> String {
    log_info(&format!("执行greet命令，参数: {}", name));
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 保存抽奖结果到文件
#[tauri::command]
async fn save_lottery_result(app_handle: tauri::AppHandle, result: String) -> Result<(), String> {
    log_info(&format!("保存抽奖结果: {}", result));
    
    let app_dir = app_handle.path().app_data_dir().map_err(|e| {
        let error = format!("获取应用数据目录失败: {}", e);
        log_error(&error);
        error
    })?;
    
    let file_path = app_dir.join("lottery_results.txt");
    log_info(&format!("保存路径: {:?}", file_path));
    
    // 确保目录存在
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            let error = format!("创建目录失败: {}", e);
            log_error(&error);
            error.to_string()
        })?;
    }
    
    // 追加结果到文件
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| {
            let error = format!("打开文件失败: {}", e);
            log_error(&error);
            error.to_string()
        })?;
    
    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S");
    writeln!(file, "[{}] {}", timestamp, result).map_err(|e| {
        let error = format!("写入文件失败: {}", e);
        log_error(&error);
        error.to_string()
    })?;
    
    log_info("抽奖结果保存成功");
    Ok(())
}

// 读取抽奖历史
#[tauri::command]
async fn load_lottery_history(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    log_info("加载抽奖历史");
    
    let app_dir = app_handle.path().app_data_dir().map_err(|e| {
        let error = format!("获取应用数据目录失败: {}", e);
        log_error(&error);
        error
    })?;
    
    let file_path = app_dir.join("lottery_results.txt");
    log_info(&format!("历史文件路径: {:?}", file_path));
    
    if !file_path.exists() {
        log_info("历史文件不存在，返回空列表");
        return Ok(vec![]);
    }
    
    let content = std::fs::read_to_string(&file_path).map_err(|e| {
        let error = format!("读取历史文件失败: {}", e);
        log_error(&error);
        error.to_string()
    })?;
    
    let lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
    log_info(&format!("加载了 {} 条历史记录", lines.len()));
    
    Ok(lines)
}

// 获取应用程序路径信息
#[tauri::command]
async fn get_app_paths(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    log_info("获取应用程序路径信息");
    
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let app_config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    let app_log_dir = app_handle.path().app_log_dir().map_err(|e| e.to_string())?;
    
    let paths = json!({
        "appDataDir": app_data_dir,
        "appConfigDir": app_config_dir,
        "appLogDir": app_log_dir,
        "lotteryResultsPath": app_data_dir.join("lottery_results.txt"),
        "configPath": app_config_dir.join("settings.json")
    });
    
    log_info(&format!("路径信息: {}", paths));
    Ok(paths)
}

// 保存应用设置
#[tauri::command]
async fn save_settings(app_handle: tauri::AppHandle, settings: serde_json::Value) -> Result<(), String> {
    log_info(&format!("保存设置: {}", settings));
    
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    let settings_path = config_dir.join("settings.json");
    
    // 确保配置目录存在
    if let Some(parent) = settings_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let settings_str = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&settings_path, settings_str).map_err(|e| e.to_string())?;
    
    log_info("设置保存成功");
    Ok(())
}

// 加载应用设置
#[tauri::command]
async fn load_settings(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    log_info("加载应用设置");
    
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    let settings_path = config_dir.join("settings.json");
    
    if !settings_path.exists() {
        log_info("设置文件不存在，返回默认设置");
        return Ok(serde_json::json!({
            "theme": "light",
            "autoSave": true,
            "soundEnabled": true
        }));
    }
    
    let content = std::fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
    let settings: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    log_info(&format!("加载的设置: {}", settings));
    Ok(settings)
}

// === JSON文件存储API ===

// 保存JSON文件
#[tauri::command]
async fn save_json_file(file_path: String, data: String) -> Result<(), String> {
    log_info(&format!("保存JSON文件: {}", file_path));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    // 确保目录存在
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            let error = format!("创建目录失败: {}", e);
            log_error(&error);
            error
        })?;
    }
    
    // 写入文件
    std::fs::write(&full_path, data).map_err(|e| {
        let error = format!("写入JSON文件失败: {}", e);
        log_error(&error);
        error.to_string()
    })?;
    
    log_info(&format!("JSON文件保存成功: {:?}", full_path));
    Ok(())
}

// 加载JSON文件
#[tauri::command]
async fn load_json_file(file_path: String) -> Result<String, String> {
    log_info(&format!("加载JSON文件: {}", file_path));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    if !full_path.exists() {
        log_info(&format!("JSON文件不存在: {:?}", full_path));
        return Ok(String::new());
    }
    
    let content = std::fs::read_to_string(&full_path).map_err(|e| {
        let error = format!("读取JSON文件失败: {}", e);
        log_error(&error);
        error.to_string()
    })?;
    
    log_info(&format!("JSON文件加载成功: {:?}, 大小: {} 字节", full_path, content.len()));
    Ok(content)
}

// 检查文件是否存在
#[tauri::command]
async fn file_exists(file_path: String) -> Result<bool, String> {
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    Ok(full_path.exists())
}

// 删除文件
#[tauri::command]
async fn delete_file(file_path: String) -> Result<(), String> {
    log_info(&format!("删除文件: {}", file_path));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    if full_path.exists() {
        std::fs::remove_file(&full_path).map_err(|e| {
            let error = format!("删除文件失败: {}", e);
            log_error(&error);
            error.to_string()
        })?;
        
        log_info(&format!("文件删除成功: {:?}", full_path));
    } else {
        log_info(&format!("文件不存在，无需删除: {:?}", full_path));
    }
    
    Ok(())
}

// 获取文件大小
#[tauri::command]
async fn get_file_size(file_path: String) -> Result<u64, String> {
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    if !full_path.exists() {
        return Ok(0);
    }
    
    let metadata = std::fs::metadata(&full_path).map_err(|e| e.to_string())?;
    Ok(metadata.len())
}

// 列出目录内容
#[tauri::command]
async fn list_directory(dir_path: String) -> Result<Vec<String>, String> {
    log_info(&format!("列出目录内容: {}", dir_path));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&dir_path);
    
    if !full_path.exists() {
        return Ok(vec![]);
    }
    
    let entries = std::fs::read_dir(&full_path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            files.push(name.to_string());
        }
    }
    
    log_info(&format!("目录 {:?} 包含 {} 个文件", full_path, files.len()));
    Ok(files)
}

// 获取调试信息
#[tauri::command]
async fn get_debug_info() -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    let debug_info = json!({
        "current_dir": std::env::current_dir().unwrap_or_default(),
        "exe_path": std::env::current_exe().unwrap_or_default(),
        "args": std::env::args().collect::<Vec<String>>(),
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "timestamp": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
    });
    
    log_info(&format!("调试信息: {}", debug_info));
    Ok(debug_info)
}

// 获取应用程序版本和版权信息
#[tauri::command]
async fn get_app_info() -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    let app_info = json!({
        "name": "StarRandom 星抽奖系统",
        "version": "v1.0.7",
        "copyright": "© 2025 河南星熠寻光科技有限公司 & vistamin. All rights reserved.",
        "company": "河南星熠寻光科技有限公司",
        "author": "vistamin",
        "description": "现代化的抽奖应用，支持多种抽奖模式和自定义配置",
        "license": "MIT",
        "build_date": chrono::Utc::now().format("%Y-%m-%d").to_string()
    });
    
    log_info(&format!("应用信息: {}", app_info));
    Ok(app_info)
}

// === 历史记录管理API ===

// 保存历史任务到分年月文件夹结构
#[tauri::command]
async fn save_history_task(task_data: serde_json::Value) -> Result<(), String> {
    log_info(&format!("保存历史任务: {}", task_data));
    
    // 解析任务数据
    let task_id = task_data.get("id")
        .and_then(|v| v.as_str())
        .ok_or("缺少任务ID")?;
    let task_name = task_data.get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("未命名任务");
    let timestamp = task_data.get("timestamp")
        .and_then(|v| v.as_str())
        .ok_or("缺少时间戳")?;
    
    // 解析年月信息
    let datetime = chrono::DateTime::parse_from_rfc3339(timestamp)
        .map_err(|e| format!("时间戳解析失败: {}", e))?;
    let year = datetime.year();
    let month = datetime.month();
    
    log_info(&format!("解析时间: {}年{}月", year, month));
    
    // 生成文件名（使用任务名称）
    let clean_name = task_name
        .replace(&['<', '>', ':', '"', '/', '\\', '|', '?', '*'][..], "_")
        .replace(' ', "_")
        .chars().take(50).collect::<String>();
    let file_name = format!("{}_{}.json", clean_name, task_id);
    
    // 创建年月目录结构
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let month_str = format!("{:02}", month);
    let year_dir = current_dir.join("coredata").join("history").join(year.to_string());
    let month_dir = year_dir.join(&month_str);
    
    // 确保目录存在
    std::fs::create_dir_all(&month_dir).map_err(|e| {
        let error = format!("创建年月目录失败: {}", e);
        log_error(&error);
        error
    })?;
    
    // 保存任务文件
    let file_path = month_dir.join(&file_name);
    let task_file_data = serde_json::json!({
        "task-data": task_data,
        "created-time": chrono::Utc::now().to_rfc3339(),
        "year": year,
        "month": month
    });
    
    let task_file_content = serde_json::to_string_pretty(&task_file_data)
        .map_err(|e| format!("序列化任务数据失败: {}", e))?;
    
    std::fs::write(&file_path, task_file_content).map_err(|e| {
        let error = format!("写入任务文件失败: {}", e);
        log_error(&error);
        error
    })?;
    
    log_info(&format!("任务文件保存成功: {:?}", file_path));
    
    // 更新history.json索引
    let history_index_path = current_dir.join("coredata").join("history.json");
    let mut history_index: Vec<serde_json::Value> = if history_index_path.exists() {
        let content = std::fs::read_to_string(&history_index_path)
            .map_err(|e| format!("读取历史索引失败: {}", e))?;
        serde_json::from_str(&content).unwrap_or_else(|_| vec![])
    } else {
        vec![]
    };
    
    // 创建新的索引条目
    let index_entry = serde_json::json!({
        "id": task_id,
        "name": task_name,
        "timestamp": timestamp,
        "fileName": file_name,
        "relativePath": format!("{}/{}/{}", year, month_str, file_name),
        "totalCount": task_data.get("total_count").unwrap_or(&serde_json::Value::Number(serde_json::Number::from(0))),
        "groupName": task_data.get("group_name").and_then(|v| v.as_str()).unwrap_or("未知小组"),
        "year": year,
        "month": month
    });
    
    // 检查是否已存在，更新或添加
    if let Some(pos) = history_index.iter().position(|item| {
        item.get("id").and_then(|v| v.as_str()) == Some(task_id)
    }) {
        history_index[pos] = index_entry;
        log_info("更新现有历史记录索引");
    } else {
        history_index.insert(0, index_entry);
        log_info("添加新历史记录索引");
    }
    
    // 保留最近100个记录
    history_index.truncate(100);
    
    // 保存索引文件
    let index_content = serde_json::to_string_pretty(&history_index)
        .map_err(|e| format!("序列化索引失败: {}", e))?;
    
    std::fs::write(&history_index_path, index_content).map_err(|e| {
        let error = format!("保存历史索引失败: {}", e);
        log_error(&error);
        error
    })?;
    
    log_info(&format!("历史记录索引已更新，总数: {}", history_index.len()));
    Ok(())
}

// 获取历史记录数据
#[tauri::command]
async fn get_history_data() -> Result<Vec<serde_json::Value>, String> {
    log_info("获取历史记录数据");
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_index_path = current_dir.join("coredata").join("history.json");
    
    if !history_index_path.exists() {
        log_info("历史索引文件不存在，返回空列表");
        return Ok(vec![]);
    }
    
    // 读取历史索引
    let index_content = std::fs::read_to_string(&history_index_path)
        .map_err(|e| format!("读取历史索引失败: {}", e))?;
    
    let history_index: Vec<serde_json::Value> = serde_json::from_str(&index_content)
        .unwrap_or_else(|_| vec![]);
    
    log_info(&format!("从索引加载了 {} 条历史记录", history_index.len()));
    
    let mut history_data = Vec::new();
    
    // 为每个索引项加载完整的任务数据
    for index_item in &history_index {
        if let Some(relative_path) = index_item.get("relativePath").and_then(|v| v.as_str()) {
            let task_file_path = current_dir.join("coredata").join("history").join(relative_path);
            
            if task_file_path.exists() {
                match std::fs::read_to_string(&task_file_path) {
                    Ok(task_content) => {
                        if let Ok(task_file_data) = serde_json::from_str::<serde_json::Value>(&task_content) {
                            if let Some(task_data) = task_file_data.get("task-data") {
                                history_data.push(task_data.clone());
                                continue;
                            }
                        }
                    }
                    Err(e) => {
                        log_error(&format!("读取任务文件失败 {}: {}", relative_path, e));
                    }
                }
            }
            
            // 如果无法加载完整数据，使用索引信息生成备用数据
            let backup_data = serde_json::json!({
                "id": index_item.get("id"),
                "name": index_item.get("name"),
                "timestamp": index_item.get("timestamp"),
                "total_count": index_item.get("totalCount"),
                "group_name": index_item.get("groupName"),
                "results": [],
                "file_path": index_item.get("fileName"),
                "edit_protected": false,
                "edit_password": ""
            });
            history_data.push(backup_data);
        }
    }
    
    log_info(&format!("返回 {} 条完整历史记录", history_data.len()));
    Ok(history_data)
}

// 获取单个历史任务
#[tauri::command]
async fn get_history_task(task_id: String) -> Result<Option<serde_json::Value>, String> {
    log_info(&format!("获取历史任务: {}", task_id));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_index_path = current_dir.join("coredata").join("history.json");
    
    if !history_index_path.exists() {
        return Ok(None);
    }
    
    // 读取历史索引
    let index_content = std::fs::read_to_string(&history_index_path)
        .map_err(|e| format!("读取历史索引失败: {}", e))?;
    
    let history_index: Vec<serde_json::Value> = serde_json::from_str(&index_content)
        .unwrap_or_else(|_| vec![]);
    
    // 查找指定任务
    if let Some(index_item) = history_index.iter().find(|item| {
        item.get("id").and_then(|v| v.as_str()) == Some(&task_id)
    }) {
        if let Some(relative_path) = index_item.get("relativePath").and_then(|v| v.as_str()) {
            let task_file_path = current_dir.join("coredata").join("history").join(relative_path);
            
            if task_file_path.exists() {
                let task_content = std::fs::read_to_string(&task_file_path)
                    .map_err(|e| format!("读取任务文件失败: {}", e))?;
                
                if let Ok(task_file_data) = serde_json::from_str::<serde_json::Value>(&task_content) {
                    if let Some(task_data) = task_file_data.get("task-data") {
                        log_info(&format!("成功加载历史任务: {}", task_id));
                        return Ok(Some(task_data.clone()));
                    }
                }
            }
        }
    }
    
    log_info(&format!("未找到历史任务: {}", task_id));
    Ok(None)
}

// 删除历史任务
#[tauri::command]
async fn delete_history_task(task_id: String) -> Result<(), String> {
    log_info(&format!("删除历史任务: {}", task_id));
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_index_path = current_dir.join("coredata").join("history.json");
    
    if !history_index_path.exists() {
        return Ok(());
    }
    
    // 读取历史索引
    let index_content = std::fs::read_to_string(&history_index_path)
        .map_err(|e| format!("读取历史索引失败: {}", e))?;
    
    let mut history_index: Vec<serde_json::Value> = serde_json::from_str(&index_content)
        .unwrap_or_else(|_| vec![]);
    
    // 查找并删除任务文件
    if let Some(index_item) = history_index.iter().find(|item| {
        item.get("id").and_then(|v| v.as_str()) == Some(&task_id)
    }) {
        if let Some(relative_path) = index_item.get("relativePath").and_then(|v| v.as_str()) {
            let task_file_path = current_dir.join("coredata").join("history").join(relative_path);
            
            if task_file_path.exists() {
                std::fs::remove_file(&task_file_path).map_err(|e| {
                    format!("删除任务文件失败: {}", e)
                })?;
                log_info(&format!("任务文件已删除: {:?}", task_file_path));
            }
        }
    }
    
    // 从索引中移除
    history_index.retain(|item| {
        item.get("id").and_then(|v| v.as_str()) != Some(&task_id)
    });
    
    // 保存更新后的索引
    let index_content = serde_json::to_string_pretty(&history_index)
        .map_err(|e| format!("序列化索引失败: {}", e))?;
    
    std::fs::write(&history_index_path, index_content).map_err(|e| {
        format!("保存历史索引失败: {}", e)
    })?;
    
    log_info(&format!("历史任务已删除: {}", task_id));
    Ok(())
}

// 清空所有历史记录
#[tauri::command]
async fn clear_history_data() -> Result<(), String> {
    log_info("清空所有历史记录");
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_dir = current_dir.join("coredata").join("history");
    
    // 删除所有历史文件
    if history_dir.exists() {
        // 遍历年份目录
        if let Ok(year_entries) = std::fs::read_dir(&history_dir) {
            for year_entry in year_entries.flatten() {
                if year_entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    // 遍历月份目录
                    if let Ok(month_entries) = std::fs::read_dir(year_entry.path()) {
                        for month_entry in month_entries.flatten() {
                            if month_entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                                // 删除月份目录中的所有JSON文件
                                if let Ok(file_entries) = std::fs::read_dir(month_entry.path()) {
                                    for file_entry in file_entries.flatten() {
                                        if let Some(ext) = file_entry.path().extension() {
                                            if ext == "json" {
                                                let _ = std::fs::remove_file(file_entry.path());
                                                log_info(&format!("删除历史文件: {:?}", file_entry.path()));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 清空索引文件
    let history_index_path = current_dir.join("coredata").join("history.json");
    let empty_index = serde_json::to_string_pretty(&serde_json::Value::Array(vec![]))
        .map_err(|e| format!("序列化空索引失败: {}", e))?;
    
    std::fs::write(&history_index_path, empty_index).map_err(|e| {
        format!("保存空索引失败: {}", e)
    })?;
    
    log_info("所有历史记录已清空");
    Ok(())
}

// 获取历史记录统计信息
#[tauri::command]
async fn get_history_stats() -> Result<serde_json::Value, String> {
    log_info("获取历史记录统计信息");
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_index_path = current_dir.join("coredata").join("history.json");
    
    if !history_index_path.exists() {
        return Ok(serde_json::json!({
            "total_tasks": 0,
            "total_results": 0,
            "years": [],
            "months": {}
        }));
    }
    
    // 读取历史索引
    let index_content = std::fs::read_to_string(&history_index_path)
        .map_err(|e| format!("读取历史索引失败: {}", e))?;
    
    let history_index: Vec<serde_json::Value> = serde_json::from_str(&index_content)
        .unwrap_or_else(|_| vec![]);
    
    let mut total_results = 0;
    let mut years = std::collections::HashSet::new();
    let mut months: std::collections::HashMap<String, i32> = std::collections::HashMap::new();
    
    for item in &history_index {
        // 统计结果总数
        if let Some(count) = item.get("totalCount").and_then(|v| v.as_i64()) {
            total_results += count as i32;
        }
        
        // 统计年份
        if let Some(year) = item.get("year").and_then(|v| v.as_i64()) {
            years.insert(year as i32);
        }
        
        // 统计月份
        if let (Some(year), Some(month)) = (
            item.get("year").and_then(|v| v.as_i64()),
            item.get("month").and_then(|v| v.as_i64())
        ) {
            let month_key = format!("{}-{:02}", year, month);
            *months.entry(month_key).or_insert(0) += 1;
        }
    }
    
    let mut years_vec: Vec<i32> = years.into_iter().collect();
    years_vec.sort();
    
    let stats = serde_json::json!({
        "total_tasks": history_index.len(),
        "total_results": total_results,
        "years": years_vec,
        "months": months
    });
    
    log_info(&format!("历史记录统计: {}", stats));
    Ok(stats)
}

fn main() {
    // 初始化日志
    match init_logging() {
        Ok(log_file) => {
            log_info(&format!("日志系统初始化成功，日志文件: {:?}", log_file));
        }
        Err(e) => {
            eprintln!("日志系统初始化失败: {}", e);
        }
    }
    
    log_info("开始构建Tauri应用程序");
    
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| {
            log_info("执行应用程序setup");
            
            // 检查前端文件
            let current_dir = std::env::current_dir().unwrap_or_default();
            let out_dir = current_dir.join("out");
            let index_file = out_dir.join("index.html");
            
            log_info(&format!("当前目录: {:?}", current_dir));
            log_info(&format!("out目录: {:?}", out_dir));
            log_info(&format!("index.html: {:?}", index_file));
            log_info(&format!("out目录存在: {}", out_dir.exists()));
            log_info(&format!("index.html存在: {}", index_file.exists()));
            
            if let Ok(entries) = fs::read_dir(&out_dir) {
                log_info("out目录内容:");
                for entry in entries.flatten() {
                    log_info(&format!("  - {:?}", entry.path()));
                }
            }
            
            // 确保coredata目录存在
            let coredata_dir = current_dir.join("coredata");
            if let Err(e) = fs::create_dir_all(&coredata_dir) {
                log_error(&format!("创建coredata目录失败: {}", e));
            } else {
                log_info(&format!("coredata目录已准备: {:?}", coredata_dir));
            }
            
            #[cfg(debug_assertions)] // 只在调试模式下打开开发者工具
            {
                log_info("开启开发者工具");
                if let Some(window) = _app.get_webview_window("main") {
                window.open_devtools();
                }
            }
            
            log_info("Setup完成");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            save_lottery_result,
            load_lottery_history,
            get_app_paths,
            save_settings,
            load_settings,
            get_debug_info,
            get_app_info,
            // JSON文件存储API
            save_json_file,
            load_json_file,
            file_exists,
            delete_file,
            get_file_size,
            list_directory,
            // 历史记录管理API
            save_history_task,
            get_history_data,
            get_history_task,
            delete_history_task,
            clear_history_data,
            get_history_stats
        ])
        .run(tauri::generate_context!());
    
    match result {
        Ok(_) => {
            log_info("应用程序正常退出");
        }
        Err(e) => {
            log_error(&format!("应用程序运行失败: {}", e));
            eprintln!("StarRandom 启动失败: {}", e);
            
            // 显示错误对话框
            #[cfg(target_os = "windows")]
            {
                use std::ffi::CString;
                use std::ptr;
                
                extern "system" {
                    fn MessageBoxA(
                        hwnd: *mut std::ffi::c_void,
                        text: *const i8,
                        caption: *const i8,
                        utype: u32,
                    ) -> i32;
                }
                
                let message = CString::new(format!("StarRandom启动失败:\n\n{}\n\n请查看logs/starandom_debug.log获取详细信息", e)).unwrap();
                let title = CString::new("StarRandom 错误").unwrap();
                
                unsafe {
                    MessageBoxA(
                        ptr::null_mut(),
                        message.as_ptr(),
                        title.as_ptr(),
                        0x00000010, // MB_ICONERROR
                    );
                }
            }
            
            std::process::exit(1);
        }
    }
} 