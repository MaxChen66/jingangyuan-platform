import { MOCK_DELAY, MOCK_FAIL_RATE } from '@/constants/config'
import { ErrorCode } from '@/types/common'
import { ApiError } from '@/utils/error'
import { MOCK_USER_ID } from './session'

/**
 * Mock 接口注册表
 *
 * 以「METHOD + 路径模式」注册处理器，路径支持 :param 占位符。
 * 由 request.ts 在 USE_MOCK 为真时调用，业务页面完全无感知。
 */

export interface MockContext {
  /** 路径参数，由 :param 占位符解析而来 */
  params: Record<string, string>
  /** GET 的 query 或 POST 的 body */
  data: Record<string, unknown>
  /** 当前用户 ID */
  userId: string
}

export type MockHandler = (ctx: MockContext) => unknown | Promise<unknown>

interface MockRoute {
  method: string
  regex: RegExp
  keys: string[]
  handler: MockHandler
}

const routes: MockRoute[] = []

/** 把 /api/explore/series/:id 编译为带命名捕获的正则 */
function compile(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = []
  const source = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1))
        return '([^/]+)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { regex: new RegExp(`^${source}$`), keys }
}

export function defineMock(method: string, pattern: string, handler: MockHandler): void {
  const { regex, keys } = compile(pattern)
  routes.push({ method: method.toUpperCase(), regex, keys, handler })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 执行 Mock 请求。
 * 未注册的接口会抛 NOT_FOUND，便于在联调期尽早发现遗漏的接口定义。
 */
export async function runMock<T>(
  method: string,
  url: string,
  data?: Record<string, unknown>
): Promise<T> {
  await delay(MOCK_DELAY)

  if (MOCK_FAIL_RATE > 0 && Math.random() < MOCK_FAIL_RATE) {
    throw new ApiError(ErrorCode.SERVER, '服务开小差了，请稍后重试')
  }

  const path = url.split('?')[0]
  const upperMethod = method.toUpperCase()
  const route = routes.find((r) => r.method === upperMethod && r.regex.test(path))

  if (!route) {
    throw new ApiError(ErrorCode.NOT_FOUND, `接口未实现：${upperMethod} ${path}`)
  }

  const matched = route.regex.exec(path) as RegExpExecArray
  const params: Record<string, string> = {}
  route.keys.forEach((key, index) => {
    params[key] = decodeURIComponent(matched[index + 1])
  })

  const result = await route.handler({
    params,
    data: data ?? {},
    userId: MOCK_USER_ID,
  })
  return result as T
}
