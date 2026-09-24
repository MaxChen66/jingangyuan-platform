/**
 * 全局配置
 */

/**
 * 是否启用 Mock 数据。
 *
 * 一期的验收门要求「用户无需真实后端也可走通两条完整链路」，因此默认开启。
 * 第 2 期接入 Spring Boot 底座时改为 false 即可，
 * —— 业务页面只依赖 api/ 下的函数，不感知 Mock 的存在，无需任何改动。
 */
export const USE_MOCK = true

/** 后端基础地址（第 2 期接入后填写） */
export const API_BASE_URL = ''

/** 请求超时（毫秒） */
export const REQUEST_TIMEOUT = 15000

/** Mock 模拟网络延迟（毫秒），用于让加载态在视觉验收时可见 */
export const MOCK_DELAY = 320

/** Mock 随机失败率（0~1）。设为 0 可关闭，用于演示失败重试态 */
export const MOCK_FAIL_RATE = 0

/** 本地存储键 */
export const STORAGE_KEYS = {
  user: 'jgz_user',
  cart: 'jgz_cart',
  collection: 'jgz_collection',
  orders: 'jgz_orders',
  drawRecords: 'jgz_draw_records',
  searchHistory: 'jgz_search_history',
} as const

/** 品牌信息 */
export const BRAND = {
  name: '金刚之源',
  slogan: '一石一世界，一雕一春秋',
  subSlogan: '金伯利岩雕刻工艺品 · 私人定制 · 一物一码溯源',
} as const

/**
 * 运费规则
 *
 * 集中定义并被结算页与服务端（一期为 Mock）共同引用。
 * 第 2 期改由后端运费模板计算后，此处仅保留前端预估用途。
 */
export const FREIGHT = {
  /** 基础运费，「分」 */
  base: 1500,
  /** 免运费门槛，「分」 */
  freeThreshold: 9900,
} as const

/** 按商品总额计算运费 */
export function calcFreight(totalAmount: number): number {
  return totalAmount >= FREIGHT.freeThreshold ? 0 : FREIGHT.base
}
