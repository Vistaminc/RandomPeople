// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::io::Write;
use std::fs;
use std::path::PathBuf;
use chrono::Datelike;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::process::Command;
use std::os::windows::process::CommandExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use log;
use std::sync::Arc;
use tauri_plugin_shell;
use tauri_plugin_window_state;
use tauri_plugin_store;
use std::time::Duration;

const CREATE_NO_WINDOW: u32 = 0x08000000;

// 检查是否具有管理员权限
fn is_admin() -> bool {
    if let Ok(output) = Command::new("net")
        .args(&["session"])
        .creation_flags(CREATE_NO_WINDOW)
        .output() {
        output.status.success()
    } else {
        false
    }
}

// 以管理员权限重启应用
fn restart_as_admin() -> Result<(), Box<dyn std::error::Error>> {
    let exe_path = std::env::current_exe()?;
    let exit_code = Command::new("powershell")
        .args(&[
            "Start-Process",
            &format!("'{}'", exe_path.display()),
            "-Verb",
            "RunAs",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()?
        .wait()?;

    if exit_code.success() {
        std::process::exit(0);
    }
    
    Ok(())
}

// 检查并申请管理员权限
#[tauri::command]
async fn request_admin_privileges(window: tauri::WebviewWindow) -> Result<bool, String> {
    if is_admin() {
        return Ok(true);
    }

    // 显示确认对话框
    let result = window.app_handle().dialog()
        .message("此操作需要管理员权限，是否继续？")
        .title("需要管理员权限")
        .buttons(MessageDialogButtons::YesNo)
        .kind(MessageDialogKind::Warning)
        .blocking_show();

    if result {
        if let Err(e) = restart_as_admin() {
            log::error!("以管理员权限重启失败: {}", e);
            return Err("无法获取管理员权限".to_string());
        }
    }

    Ok(false)
}

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

// 抽奖命令
#[tauri::command]
fn greet(name: &str) -> String {
    log::info!("执行greet命令，参数: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 保存抽奖结果到文件
#[tauri::command]
async fn save_lottery_result(app_handle: tauri::AppHandle, result: String) -> Result<(), String> {
    log::info!("保存抽奖结果: {}", result);
    
    let app_dir = app_handle.path().app_data_dir().map_err(|e| {
        let error = format!("获取应用数据目录失败: {}", e);
        log::error!("{}", error);
        error
    })?;
    
    let file_path = app_dir.join("lottery_results.txt");
    log::info!("保存路径: {:?}", file_path);
    
    // 确保目录存在
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            let error = format!("创建目录失败: {}", e);
            log::error!("{}", error);
            error.to_string()
        })?;
    }
    
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| {
            let error = format!("打开文件失败: {}", e);
            log::error!("{}", error);
            error.to_string()
        })?;
    
    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S");
    writeln!(file, "[{}] {}", timestamp, result).map_err(|e| {
        let error = format!("写入文件失败: {}", e);
        log::error!("{}", error);
        error.to_string()
    })?;
    
    Ok(())
}

// 读取抽奖历史
#[tauri::command]
async fn load_lottery_history(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    log::info!("加载抽奖历史");
    
    let app_dir = app_handle.path().app_data_dir().map_err(|e| {
        let error = format!("获取应用数据目录失败: {}", e);
        log::error!("{}", error);
        error
    })?;
    
    let file_path = app_dir.join("lottery_results.txt");
    log::info!("历史文件路径: {:?}", file_path);
    
    if !file_path.exists() {
        log::info!("历史文件不存在，返回空列表");
        return Ok(vec![]);
    }
    
    let content = std::fs::read_to_string(&file_path).map_err(|e| {
        let error = format!("读取历史文件失败: {}", e);
        log::error!("{}", error);
        error.to_string()
    })?;
    
    let lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
    log::info!("加载了 {} 条历史记录", lines.len());
    
    Ok(lines)
}

// 获取应用程序路径信息
#[tauri::command]
async fn get_app_paths(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    log::info!("获取应用程序路径信息");
    
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
    
    log::info!("路径信息: {}", paths);
    Ok(paths)
}

// 保存应用设置
#[tauri::command]
async fn save_settings(app_handle: tauri::AppHandle, settings: serde_json::Value) -> Result<(), String> {
    log::info!("保存设置: {}", settings);
    
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    let settings_path = config_dir.join("settings.json");
    
    // 确保配置目录存在
    if let Some(parent) = settings_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let settings_str = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&settings_path, settings_str).map_err(|e| e.to_string())?;
    
    log::info!("设置保存成功");
    Ok(())
}

// 加载应用设置
#[tauri::command]
async fn load_settings(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    log::info!("加载应用设置");
    
    let config_dir = app_handle.path().app_config_dir().map_err(|e| e.to_string())?;
    let settings_path = config_dir.join("settings.json");
    
    if !settings_path.exists() {
        log::info!("设置文件不存在，返回默认设置");
        return Ok(serde_json::json!({
            "theme": "light",
            "autoSave": true,
            "soundEnabled": true
        }));
    }
    
    let content = std::fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
    let settings: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    log::info!("加载的设置: {}", settings);
    Ok(settings)
}

// === JSON文件存储API ===

// 保存JSON文件
#[tauri::command]
async fn save_json_file(file_path: String, data: String) -> Result<(), String> {
    log::info!("保存JSON文件: {}", file_path);
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    // 确保目录存在
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            let error = format!("创建目录失败: {}", e);
            log::error!("{}", error);
            error
        })?;
    }
    
    // 写入文件
    std::fs::write(&full_path, data).map_err(|e| {
        let error = format!("写入JSON文件失败: {}", e);
        log::error!("{}", error);
        error.to_string()
    })?;
    
    log::info!("JSON文件保存成功: {:?}", full_path);
    Ok(())
}

// 加载JSON文件
#[tauri::command]
async fn load_json_file(file_path: String) -> Result<String, String> {
    log::info!("加载JSON文件: {}", file_path);
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    if !full_path.exists() {
        log::info!("JSON文件不存在: {:?}", full_path);
        return Ok(String::new());
    }
    
    let content = std::fs::read_to_string(&full_path).map_err(|e| {
        let error = format!("读取JSON文件失败: {}", e);
        log::error!("{}", error);
        error.to_string()
    })?;
    
    log::info!("JSON文件加载成功: {:?}, 大小: {} 字节", full_path, content.len());
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
    log::info!("删除文件: {}", file_path);
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let full_path = current_dir.join(&file_path);
    
    if full_path.exists() {
        std::fs::remove_file(&full_path).map_err(|e| {
            let error = format!("删除文件失败: {}", e);
            log::error!("{}", error);
            error.to_string()
        })?;
        
        log::info!("文件删除成功: {:?}", full_path);
    } else {
        log::info!("文件不存在，无需删除: {:?}", full_path);
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
    log::info!("列出目录内容: {}", dir_path);
    
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
    
    log::info!("目录 {:?} 包含 {} 个文件", full_path, files.len());
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
    
    log::info!("调试信息: {}", debug_info);
    Ok(debug_info)
}

// 获取当前exe文件路径
#[tauri::command]
async fn get_current_exe_path() -> Result<String, String> {
    log::info!("获取当前exe文件路径");
    
    let exe_path = std::env::current_exe().map_err(|e| {
        let error = format!("获取exe路径失败: {}", e);
        log::error!("{}", error);
        error.to_string()
    })?;
    
    let path_str = exe_path.to_string_lossy().to_string();
    log::info!("当前exe路径: {}", path_str);
    
    Ok(path_str)
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
    
    log::info!("应用信息: {}", app_info);
    Ok(app_info)
}

// === 历史记录管理API ===

// 保存历史任务到分年月文件夹结构
#[tauri::command]
async fn save_history_task(task_data: serde_json::Value) -> Result<(), String> {
    log::info!("保存历史任务: {}", task_data);
    
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
    
    log::info!("解析时间: {}年{}月", year, month);
    
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
        log::error!("{}", error);
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
        log::error!("{}", error);
        error
    })?;
    
    log::info!("任务文件保存成功: {:?}", file_path);
    
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
        log::info!("更新现有历史记录索引");
    } else {
        history_index.insert(0, index_entry);
        log::info!("添加新历史记录索引");
    }
    
    // 保留最近100个记录
    history_index.truncate(100);
    
    // 保存索引文件
    let index_content = serde_json::to_string_pretty(&history_index)
        .map_err(|e| format!("序列化索引失败: {}", e))?;
    
    std::fs::write(&history_index_path, index_content).map_err(|e| {
        let error = format!("保存历史索引失败: {}", e);
        log::error!("{}", error);
        error
    })?;
    
    log::info!("历史记录索引已更新，总数: {}", history_index.len());
    Ok(())
}

// 获取历史记录数据
#[tauri::command]
async fn get_history_data() -> Result<Vec<serde_json::Value>, String> {
    log::info!("获取历史记录数据");
    
    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    let history_index_path = current_dir.join("coredata").join("history.json");
    
    if !history_index_path.exists() {
        log::info!("历史索引文件不存在，返回空列表");
        return Ok(vec![]);
    }
    
    // 读取历史索引
    let index_content = std::fs::read_to_string(&history_index_path)
        .map_err(|e| format!("读取历史索引失败: {}", e))?;
    
    let history_index: Vec<serde_json::Value> = serde_json::from_str(&index_content)
        .unwrap_or_else(|_| vec![]);
    
    log::info!("从索引加载了 {} 条历史记录", history_index.len());
    
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
                        log::error!("读取任务文件失败 {}: {}", relative_path, e);
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
    
    log::info!("返回 {} 条完整历史记录", history_data.len());
    Ok(history_data)
}

// 获取单个历史任务
#[tauri::command]
async fn get_history_task(task_id: String) -> Result<Option<serde_json::Value>, String> {
    log::info!("获取历史任务: {}", task_id);
    
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
                        log::info!("成功加载历史任务: {}", task_id);
                        return Ok(Some(task_data.clone()));
                    }
                }
            }
        }
    }
    
    log::info!("未找到历史任务: {}", task_id);
    Ok(None)
}

// 删除历史任务
#[tauri::command]
async fn delete_history_task(task_id: String) -> Result<(), String> {
    log::info!("删除历史任务: {}", task_id);
    
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
                log::info!("任务文件已删除: {:?}", task_file_path);
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
    
    log::info!("历史任务已删除: {}", task_id);
    Ok(())
}

// 清空所有历史记录
#[tauri::command]
async fn clear_history_data() -> Result<(), String> {
    log::info!("清空所有历史记录");
    
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
                                                log::info!("删除历史文件: {:?}", file_entry.path());
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
    
    log::info!("所有历史记录已清空");
    Ok(())
}

// 获取历史记录统计信息
#[tauri::command]
async fn get_history_stats() -> Result<serde_json::Value, String> {
    log::info!("获取历史记录统计信息");
    
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
    
    log::info!("历史记录统计: {}", stats);
    Ok(stats)
}

fn main() {
    // 初始化日志系统
    if let Err(e) = init_logging() {
        eprintln!("日志系统初始化失败: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();
            
            // 设置窗口最小尺寸
            main_window.set_min_size(Some(tauri::LogicalSize::new(800.0, 600.0))).unwrap();
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            save_lottery_result,
            load_lottery_history,
            get_app_paths,
            save_settings,
            load_settings,
            save_json_file,
            load_json_file,
            file_exists,
            delete_file,
            get_file_size,
            list_directory,
            get_debug_info,
            get_current_exe_path,
            get_app_info,
            save_history_task,
            get_history_data,
            get_history_task,
            delete_history_task,
            clear_history_data,
            get_history_stats,
            request_admin_privileges,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 