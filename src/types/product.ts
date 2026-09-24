import type { Amount, StoneTone } from './common'

/**
 * 统一商品体系
 *
 * 文档 6 节：商城与开石共享 product 表。type 区分业务来源，
 * 但价格、材质、溯源等字段结构一致，便于共用组件与统一仓储。
 */
export type ProductType =
  /** 精品现货 */
  | 'spot'
  /** 雕刻作品 */
  | 'carving'
  /** 收藏 / 礼赠 */
  | 'collection'
  /** 开石藏品（由 physical_item 绑定而来） */
  | 'explore'

export interface Product {
  id: string
  name: string
  /** 副标题 / 一句话卖点 */
  subtitle: string
  type: ProductType
  price: Amount
  /** 划线价，无则为 0 */
  originalPrice: Amount
  /** 封面图 URL。一期为空字符串，由 coverTone 渲染石纹占位 */
  cover: string
  /** 无图片时的视觉基调 */
  coverTone: StoneTone
  images: string[]
  categoryId: string

  // ---- 原石档案（文档 4.1 商品详情必备信息）----
  /** 材质，例如 金伯利岩 */
  material: string
  /** 产地 */
  origin: string
  /** 尺寸，例如 120 × 80 × 65 mm */
  size: string
  /** 重量，例如 1.86 kg */
  weight: string
  /** 工艺说明 */
  craft: string
  /** 寓意 */
  meaning: string
  /** 包装说明 */
  packaging: string
  /** 鉴定证书编号 */
  certificate: string
  /** 一物一码溯源编号 */
  traceCode: string

  stock: number
  sales: number
  tags: string[]
  status: 'on' | 'off'
  createdAt: string
}

export interface ProductCategory {
  id: string
  name: string
  /** 分类副标题，用于列表页的筛选侧栏 */
  desc: string
}
