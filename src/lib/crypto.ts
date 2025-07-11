/**
 * 简单的密码加密工具
 * 提供基本的加密和解密功能
 */

// 简单的字符串加密函数（基于Base64和简单的字符转换）
export function encryptPassword(password: string): string {
  if (!password) return ''
  
  try {
    // 第一步：将字符串转换为Base64
    const base64 = btoa(unescape(encodeURIComponent(password)))
    
    // 第二步：简单的字符替换加密
    let encrypted = ''
    for (let i = 0; i < base64.length; i++) {
      const char = base64.charCodeAt(i)
      // 简单的字符码偏移
      const encryptedChar = String.fromCharCode(char + 3)
      encrypted += encryptedChar
    }
    
    // 第三步：再次Base64编码
    return btoa(encrypted)
  } catch (error) {
    console.error('密码加密失败:', error)
    return password // 如果加密失败，返回原密码
  }
}

// 简单的字符串解密函数
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) return ''
  
  try {
    // 第一步：Base64解码
    const step1 = atob(encryptedPassword)
    
    // 第二步：字符替换解密
    let decrypted = ''
    for (let i = 0; i < step1.length; i++) {
      const char = step1.charCodeAt(i)
      // 还原字符码偏移
      const decryptedChar = String.fromCharCode(char - 3)
      decrypted += decryptedChar
    }
    
    // 第三步：Base64解码
    return decodeURIComponent(escape(atob(decrypted)))
  } catch (error) {
    console.error('密码解密失败:', error)
    return encryptedPassword // 如果解密失败，返回原密码
  }
}

// 验证密码是否匹配
export function verifyPassword(inputPassword: string, storedEncryptedPassword: string): boolean {
  if (!inputPassword || !storedEncryptedPassword) return false
  
  try {
    const decrypted = decryptPassword(storedEncryptedPassword)
    return inputPassword === decrypted
  } catch (error) {
    console.error('密码验证失败:', error)
    // 如果解密失败，可能是明文密码，直接比较
    return inputPassword === storedEncryptedPassword
  }
}

// 检查密码是否已加密
export function isPasswordEncrypted(password: string): boolean {
  if (!password) return false
  
  try {
    // 尝试解密，如果能成功解密且结果不同，则说明是加密的
    const decrypted = decryptPassword(password)
    return decrypted !== password
  } catch (error) {
    // 解密失败，说明不是加密格式
    return false
  }
} 