import type { Amount, StoneTone } from './common'
import type { Address } from './order'

/**
 * 开石探索馆领域模型
 *
 * 对应文档 10.2 开石核心数据模型。
 * 一期的关键约束：批次与概率在开售前固化，结果由服务端判定，
 * 前端只负责展示 —— 因此本文件中的 probability、remainingQty 等字段
 * 全部视为「服务端下发的只读展示数据」。
 */

/** 开石系列（= 一个矿区主题） */
export interface ExploreSeries {
  id: string
  /** 系列名，例如「刚玉 · 初雪矿脉」 */
  name: string
  subtitle: string
  cover: string
  coverTone: StoneTone
  /** 矿区故事，用于系列详情的沉浸式叙述 */
  story: string
  /** 单次开石价格 */
  price: Amount
  /** 划线价 */
  originalPrice: Amount
  status: 'on' | 'off' | 'soldout'

  // ---- 批次信息（一个系列当前生效的批次）----
  batchId: string
  batchNo: string
  totalStock: number
  remainingStock: number
  soldCount: number
  /** 每用户限购数量，0 表示不限 */
  limitPerUser: number
  saleStart: string
  saleEnd: string

  /** 商品价值区间描述，例如「¥ 180 ~ ¥ 2,600」 */
  valueRange: string
  /** 发货规则说明 */
  shippingRule: string
  /** 合规提示，购买前必须可见 */
  complianceNotice: string

  /** 批次内的商品分布与概率 */
  items: ExploreBatchItem[]
}

/**
 * 批次商品分布
 *
 * probability 为百分比数值（例如 12.5 表示 12.5%）。
 * 文档 6.1 硬性要求：同一批次内 probability 之和必须等于 100。
 */
export interface ExploreBatchItem {
  productId: string
  productName: string
  productCover: string
  productCoverTone: StoneTone
  /** 收藏等级，例如「典藏」「珍品」「雅品」 */
  grade: string
  probability: number
  initialQty: number
  remainingQty: number
  /** 该商品的参考价值，用于构成价值区间 */
  value: Amount
  material: string
  size: string
}

/** 开奖记录（文档 6 节 draw_record，合规审计的核心凭证） */
export interface DrawRecord {
  id: string
  orderId: string
  userId: string
  batchId: string
  seriesId: string
  seriesName: string
  productId: string
  productName: string
  productCover: string
  productCoverTone: StoneTone
  /** 绑定的实体商品 ID */
  physicalItemId: string
  /** 实体唯一编号，一物一码 */
  uniqueCode: string
  grade: string
  /** 本次开奖命中的概率，结果页需回显以示透明 */
  probability: number
  drawTime: string
  /** 算法版本，用于审计追溯 */
  algorithmVersion: string
}

/** 用户藏品（石头柜） */
export type CollectionStatus =
  /** 在柜 */
  | 'stored'
  /** 发货中 */
  | 'shipping'
  /** 已发货 */
  | 'shipped'

export interface Collection {
  id: string
  userId: string
  physicalItemId: string
  uniqueCode: string
  productId: string
  productName: string
  productCover: string
  productCoverTone: StoneTone
  seriesId: string
  seriesName: string
  grade: string
  material: string
  /** 纹理描述，藏品详情展示 */
  texture: string
  size: string
  weight: string
  /** 发现时间 */
  foundAt: string
  status: CollectionStatus
  traceCode: string
}

/** 矿物图鉴条目（已收集 / 未发现） */
export interface BestiaryEntry {
  productId: string
  productName: string
  productCover: string
  productCoverTone: StoneTone
  grade: string
  material: string
  seriesId: string
  seriesName: string
  /** 是否已收集 */
  collected: boolean
  /** 已收集时的实例数量 */
  count: number
}

export const COLLECTION_STATUS_TEXT: Record<CollectionStatus, string> = {
  stored: '在柜',
  shipping: '发货中',
  shipped: '已发货',
}

/**
 * 开石动画阶段
 * 文档 7.4：一期采用轻量 2D 动效实现「观察 → 敲击 → 裂纹 → 揭晓」，
 * 要求可跳过、结果不可被前端伪造。
 */
export type DrawPhase = 'observe' | 'striking' | 'cracking' | 'revealing' | 'done'

// ---------------------------------------------------------------------------
// 开石接口的传输结构（DTO）
// 同样定义在 types/ 而非 mock/，确保页面不依赖 mock 层。
// ---------------------------------------------------------------------------

/** 系列列表项。去掉 story、items 等大字段 */
export interface ExploreSummary {
  id: string
  name: string
  subtitle: string
  cover: string
  coverTone: StoneTone
  price: Amount
  originalPrice: Amount
  status: ExploreSeries['status']
  batchNo: string
  totalStock: number
  remainingStock: number
  soldCount: number
  /** 商品价值区间描述 */
  valueRange: string
  /** 该矿区的商品种类数 */
  itemCount: number
}

/** 概率公示。购买前必须完整可查（文档 9.1 合规要求） */
export interface ExploreProbability {
  seriesId: string
  batchNo: string
  totalStock: number
  remainingStock: number
  /** 概率之和，前端展示配置完整性，正常恒为 100 */
  probabilitySum: number
  /** 剩余可开石实体总数 */
  remainingSum: number
  items: ExploreBatchItem[]
}

/** 图鉴结果 */
export interface BestiaryResult {
  entries: BestiaryEntry[]
  collectedCount: number
  totalCount: number
}

/** 探索记录条目 */
export interface ExploreRecordItem {
  id: string
  collectionId: string
  productId: string
  seriesName: string
  productName: string
  productCover: string
  productCoverTone: StoneTone
  grade: string
  uniqueCode: string
  foundAt: string
  status: CollectionStatus
}

export interface ExploreRecordsResult {
  list: ExploreRecordItem[]
  total: number
}

/** 实体发货申请结果 */
export interface ShippingApplyResult {
  shippingId: string
  collectionIds: string[]
  address: Address
  freight: Amount
  estimatedAt: string
  message: string
}
