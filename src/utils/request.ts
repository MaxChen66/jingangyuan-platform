import { API_BASE_URL, REQUEST_TIMEOUT, USE_MOCK } from '@/constants/config'
import { ErrorCode } from '@/types/common'
import type { ApiResponse } from '@/types/common'
import { ApiError, messageOf } from '@/utils/error'
import { runMock } from '@/mock'

/**
 * 统一请求层
 *
 * 本期架构上最关键的一层：Mock 的判定完全收敛在这里。
 * 业务页面只调用 api/ 下的函数，永远不接触 mock/，
 * 因此第 2 期把 USE_MOCK 置为 false 即可切到真实后端，页面零改动。
 *
 * 统一响应结构遵循实施文档 15.2：
 *   { "code": 0, "message": "success", "data": {} }
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: Record<string, unknown>
  /** 是否展示全屏 loading。默认关闭，由页面自行控制局部加载态 */
  loading?: boolean
  /** 失败时是否自动 toast。默认开启；页面需要自定义错误态时置 false */
  toast?: boolean
  header?: Record<string, string>
}

/**
 * loading 引用计数。
 * 并发请求时避免后到的 hideLoading 提前关掉前一个请求的遮罩。
 */
let loadingCount = 0

function showLoading(): void {
  loadingCount += 1
  if (loadingCount === 1) {
    uni.showLoading({ title: '加载中', mask: true })
  }
}

function hideLoading(): void {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    uni.hideLoading()
  }
}

/** 走真实后端。第 2 期接入后启用 */
function invokeApi<T>(options: RequestOptions): Promise<T> {
  const method = options.method ?? 'GET'
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${options.url}`,
      method,
      data: options.data,
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: (res) => {
        const body = res.data as unknown as ApiResponse<T>
        if (!body || typeof body.code !== 'number') {
          reject(new ApiError(ErrorCode.SERVER, '响应格式异常，请稍后重试'))
          return
        }
        if (body.code !== ErrorCode.SUCCESS) {
          // 只透出面向用户的文案，不透出后端原始异常信息
          reject(new ApiError(body.code, messageOf(body.code, body.message)))
          return
        }
        resolve(body.data)
      },
      fail: () => {
        reject(new ApiError(ErrorCode.NETWORK, messageOf(ErrorCode.NETWORK)))
      },
    })
  })
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { loading = false, toast = true } = options
  if (loading) showLoading()

  try {
    if (USE_MOCK) {
      return await runMock<T>(options.method ?? 'GET', options.url, options.data)
    }
    return await invokeApi<T>(options)
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(ErrorCode.SERVER, messageOf(ErrorCode.SERVER))

    if (toast) {
      uni.showToast({ title: apiError.message, icon: 'none' })
    }
    throw apiError
  } finally {
    if (loading) hideLoading()
  }
}
