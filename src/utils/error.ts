import { ErrorCode } from '@/types/common'

/**
 * 业务异常
 *
 * 独立于 request.ts 定义，避免「request → mock → request」的循环依赖。
 *
 * 注意：message 必须是面向用户的可读文案，不得携带数据库、堆栈等内部信息
 * （实施文档 15.2：错误码不得直接泄露数据库 / 内部异常信息）。
 */
export class ApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/** 常见错误的兜底文案 */
export const FALLBACK_MESSAGE: Record<number, string> = {
  [ErrorCode.NETWORK]: '网络连接失败，请检查网络后重试',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '暂无访问权限',
  [ErrorCode.NOT_FOUND]: '请求的内容不存在',
  [ErrorCode.INVALID_PARAM]: '参数有误，请检查后重试',
  [ErrorCode.OUT_OF_STOCK]: '库存不足，请减少数量',
  [ErrorCode.BATCH_CLOSED]: '该矿区已停售，看看别的矿区吧',
  [ErrorCode.DUPLICATE_DRAW]: '该订单已完成开石',
  [ErrorCode.SERVER]: '服务开小差了，请稍后重试',
}

export function messageOf(code: number, fallback?: string): string {
  return FALLBACK_MESSAGE[code] ?? fallback ?? '操作失败，请稍后重试'
}
