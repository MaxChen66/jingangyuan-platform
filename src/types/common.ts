/**
 * 通用类型
 *
 * 统一响应结构遵循实施文档 15.2 的 API 标准：
 *   { "code": 0, "message": "success", "data": {} }
 */

/** 后端统一响应包 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页结果。所有列表接口统一使用该结构（文档 15.2） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 分页请求参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
}

/** 业务错误码 */
export const ErrorCode = {
  SUCCESS: 0,
  /** 网络异常 / 请求未送达 */
  NETWORK: -1,
  /** 未登录 */
  UNAUTHORIZED: 401,
  /** 无权限 */
  FORBIDDEN: 403,
  /** 资源不存在 */
  NOT_FOUND: 404,
  /** 参数错误 */
  INVALID_PARAM: 1001,
  /** 库存不足 */
  OUT_OF_STOCK: 2001,
  /** 批次已停售 */
  BATCH_CLOSED: 2002,
  /** 重复开奖（幂等命中） */
  DUPLICATE_DRAW: 2003,
  /** 服务异常 */
  SERVER: 500,
} as const

/** 金额单位为「分」，全站以整数存储与传输，避免浮点误差 */
export type Amount = number

/**
 * 视觉基调 —— 一期的图片占位方案
 *
 * 本项目尚无真实图片素材，且微信小程序对外链图片有域名白名单限制，
 * 因此一期以「矿物色调 + CSS 石纹」渲染视觉占位，保证工程自包含、可离线、
 * 无需配置任何图片域名。
 *
 * 第 2 期接入 OSS 后，各实体的 cover 字段填入真实 URL，
 * 渲染组件按「有 cover 用图片、无 cover 用石纹」自动切换，无需改动页面。
 */
export type StoneTone =
  /** 青玉 · 黛青 */
  | 'jade'
  /** 紫晶 · 幽紫 */
  | 'amethyst'
  /** 琥珀 · 暖褐 */
  | 'amber'
  /** 玄墨 · 深黑 */
  | 'ink'
  /** 朱砂 · 正红 */
  | 'crimson'
  /** 宣纸 · 米白 */
  | 'paper'
