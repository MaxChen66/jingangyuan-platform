/**
 * 本地存储封装
 *
 * 统一 try/catch 与 JSON 序列化。小程序在存储超限或数据损坏时会抛异常，
 * 此处降级为返回默认值，避免因缓存问题白屏。
 */

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = uni.getStorageSync(key)
    if (raw === '' || raw === null || raw === undefined) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setStorage(key: string, value: unknown): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch {
    // 存储失败不应阻断业务，静默降级
  }
}

export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch {
    // 同上
  }
}
