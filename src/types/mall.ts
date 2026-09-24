import type { Product, ProductCategory } from './product'
import type { StoneTone } from './common'

/**
 * 商城接口的传输结构（DTO）
 *
 * 定义在 types/ 而非 mock/ 内，是为了让「页面 → api/ → types/」这条依赖链
 * 完全不经过 mock/。mock 模块反向 import 这些类型，
 * 从而保证第 2 期切换真实后端时，接口契约只需实现同一组 DTO。
 */

/** 首页轮播。一期无图片素材，以文案 + 基调渲染中式版面 */
export interface HomeBanner {
  id: string
  title: string
  subtitle: string
  tone: StoneTone
  /** 点击去向（小程序页面路径） */
  link: string
}

export interface MallHomeData {
  banners: HomeBanner[]
  categories: ProductCategory[]
  recommend: Product[]
  newArrivals: Product[]
}

/** 商品溯源档案（商品详情页溯源入口） */
export interface TraceInfo {
  traceCode: string
  certificate: string
  material: string
  origin: string
  size: string
  weight: string
  craft: string
  records: TraceRecord[]
}

export interface TraceRecord {
  time: string
  title: string
  desc: string
}
