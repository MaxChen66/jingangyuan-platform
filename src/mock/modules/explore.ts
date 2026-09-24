import { ErrorCode } from '@/types'
import type {
  BestiaryResult,
  Collection,
  DrawRecord,
  ExploreBatchItem,
  ExploreProbability,
  ExploreRecordsResult,
  ExploreSeries,
  ExploreSummary,
  Order,
  OrderItem,
  ShippingApplyResult,
} from '@/types'
import { ApiError } from '@/utils/error'
import { genOrderNo } from '@/utils/format'
import { defineMock } from '../registry'
import { DRAW_ALGORITHM_VERSION, appendDrawRecord, findDrawByOrder } from '../data/draws'
import { findSeries, findSeriesByBatch } from '../data/explore'
import {
  appendCollection,
  buildBestiary,
  loadCollections,
  mockSeries,
  nextPhysicalCode,
  patchCollection,
} from '../data/explore'
import { findOrder, patchOrder, insertOrder } from '../data/orders'
import { mockAddresses } from '../data/user'

/**
 * 开石探索馆 Mock 接口
 *
 * 一期的两个必须守住的行为（文档 10.4）：
 *   P5-01 幂等 —— 同一订单重复请求开奖只返回同一结果
 *   P5-02 库存 —— 按剩余数量抽取，库存不为负
 *
 * 前端不参与任何结果判定：开奖结果完全由本模块产生，页面只负责展示。
 * 这样即使通过抓包篡改请求参数，也无法影响服务端最终结果（P5-07）。
 */

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** 系列列表用的摘要结构，去掉大字段 */
function toSummary(series: ExploreSeries): ExploreSummary {
  return {
    id: series.id,
    name: series.name,
    subtitle: series.subtitle,
    cover: series.cover,
    coverTone: series.coverTone,
    price: series.price,
    originalPrice: series.originalPrice,
    status: series.status,
    batchNo: series.batchNo,
    totalStock: series.totalStock,
    remainingStock: series.remainingStock,
    soldCount: series.soldCount,
    valueRange: series.valueRange,
    itemCount: series.items.length,
  }
}

/**
 * 按剩余实体数量加权抽取。
 *
 * 这是文档 7.1 推荐的一期方案「批次实体库存随机抽取」：
 * 因为批次的 probability 由 initialQty / totalStock 推导而来，
 * 按剩余数量均匀抽取的结果与公示概率完全一致 —— 概率不是另配的一套数字，
 * 而是库存分布的真实投影，事后可被用户用数量反推核对。
 */
function pickWeighted(items: ExploreBatchItem[]): ExploreBatchItem | null {
  const pool = items.filter((item) => item.remainingQty > 0)
  const total = pool.reduce((acc, item) => acc + item.remainingQty, 0)
  if (pool.length === 0 || total <= 0) return null

  let cursor = Math.random() * total
  for (const item of pool) {
    cursor -= item.remainingQty
    if (cursor <= 0) return item
  }
  return pool[pool.length - 1]
}

// ---------------------------------------------------------------------------
// 系列
// ---------------------------------------------------------------------------

defineMock('GET', '/api/explore/series', (): ExploreSummary[] => mockSeries.map(toSummary))

defineMock('GET', '/api/explore/series/:id', (ctx): ExploreSeries => {
  const series = findSeries(ctx.params.id)
  if (!series) throw new ApiError(ErrorCode.NOT_FOUND, '矿区不存在或已下线')
  return series
})

/** 概率与商品分布。购买前必须完整可查（文档 9.1 合规要求） */
defineMock('GET', '/api/explore/series/:id/probability', (ctx): ExploreProbability => {
  const series = findSeries(ctx.params.id)
  if (!series) throw new ApiError(ErrorCode.NOT_FOUND, '矿区不存在或已下线')
  const total = series.items.reduce((acc, item) => acc + item.remainingQty, 0)
  return {
    seriesId: series.id,
    batchNo: series.batchNo,
    totalStock: series.totalStock,
    remainingStock: series.remainingStock,
    /** 概率之和，前端可据此向用户展示配置完整性 */
    probabilitySum: series.items.reduce((acc, item) => acc + item.probability, 0),
    remainingSum: total,
    items: series.items,
  }
})

// ---------------------------------------------------------------------------
// 购买
// ---------------------------------------------------------------------------

defineMock('POST', '/api/explore/order', (ctx): Order => {
  const seriesId = str(ctx.data.seriesId)
  const quantity = Math.max(1, num(ctx.data.quantity, 1))
  const agreedRule = ctx.data.agreedRule === true

  // 合规要求：购买规则必须由用户主动确认，不接受默认勾选
  if (!agreedRule) {
    throw new ApiError(ErrorCode.INVALID_PARAM, '请先阅读并同意购买规则')
  }

  const series = findSeries(seriesId)
  if (!series) throw new ApiError(ErrorCode.NOT_FOUND, '矿区不存在或已下线')
  if (series.status !== 'on') throw new ApiError(ErrorCode.BATCH_CLOSED, '该矿区已停售')
  if (series.remainingStock < quantity) {
    throw new ApiError(ErrorCode.OUT_OF_STOCK, `该矿区仅剩 ${series.remainingStock} 份`)
  }
  if (series.limitPerUser > 0 && quantity > series.limitPerUser) {
    throw new ApiError(ErrorCode.INVALID_PARAM, `每个用户最多购买 ${series.limitPerUser} 份`)
  }

  const totalAmount = series.price * quantity
  const order: Order = {
    id: `o_${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    orderNo: genOrderNo('KQ'),
    type: 'explore',
    status: 'pending_pay',
    items: [
      {
        productId: series.id,
        name: `${series.name} · 开石`,
        cover: series.cover,
        coverTone: series.coverTone,
        price: series.price,
        quantity,
        spec: `批次 ${series.batchNo}`,
      },
    ],
    totalAmount,
    freight: 0,
    discount: 0,
    payAmount: totalAmount,
    address: null,
    remark: '',
    createdAt: new Date().toISOString(),
    payTime: '',
    shipping: null,
    batchId: series.batchId,
    seriesName: series.name,
  }

  // 下单即锁定批次库存，避免支付成功后才发现无货
  series.remainingStock -= quantity
  series.soldCount += quantity

  return insertOrder(order)
})

// ---------------------------------------------------------------------------
// 开奖
// ---------------------------------------------------------------------------

defineMock('POST', '/api/explore/draw', (ctx): DrawRecord => {
  const orderId = str(ctx.data.orderId)
  if (!orderId) throw new ApiError(ErrorCode.INVALID_PARAM, '缺少订单号')

  // 幂等：该订单已开过奖，直接返回原结果，杜绝重复开奖与重复扣库存
  const existing = findDrawByOrder(orderId)
  if (existing) return existing

  const order = findOrder(orderId)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')
  if (order.type !== 'explore') throw new ApiError(ErrorCode.INVALID_PARAM, '该订单不是开石订单')
  if (order.status === 'pending_pay') {
    throw new ApiError(ErrorCode.INVALID_PARAM, '订单尚未支付，无法开石')
  }

  const series = findSeriesByBatch(order.batchId ?? '')
  if (!series) throw new ApiError(ErrorCode.NOT_FOUND, '批次不存在')

  const quantity = order.items[0]?.quantity ?? 1
  const drawn: ExploreBatchItem[] = []

  // 批次库存的预订模型：
  //   下单时扣 series.remainingStock（锁定可售额度，防止超卖）
  //   开奖时只扣对应石种的 item.remainingQty（消耗具体实物）
  // 因此这里不再重复扣减 series.remainingStock —— 否则同一份购买会被扣两次。
  //
  // 由此得到两条不变量：
  //   remainingStock     = 真实可售额度 - 已下单未开奖的预订量
  //   Σ item.remainingQty = 真实剩余实物数（含已售未开的预订）
  // 每一笔「下单 + 开奖」完成后两者重新相等；仅下单未开奖时，前者小于后者。
  for (let i = 0; i < quantity; i += 1) {
    const picked = pickWeighted(series.items)
    if (!picked) break
    // 原子扣减对应实物，扣减后立即判定，保证库存不为负
    picked.remainingQty -= 1
    drawn.push(picked)
  }

  if (drawn.length === 0) {
    throw new ApiError(ErrorCode.OUT_OF_STOCK, '该批次已无可开石库存，请联系客服处理')
  }

  const primary = drawn[0]
  const uniqueCode = nextPhysicalCode()
  const now = new Date().toISOString()

  const record: DrawRecord = {
    id: `dr_${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    orderId,
    userId: ctx.userId,
    batchId: series.batchId,
    seriesId: series.id,
    seriesName: series.name,
    productId: primary.productId,
    productName: primary.productName,
    productCover: primary.productCover,
    productCoverTone: primary.productCoverTone,
    physicalItemId: `pi_${uniqueCode}`,
    uniqueCode,
    grade: primary.grade,
    probability: primary.probability,
    drawTime: now,
    algorithmVersion: DRAW_ALGORITHM_VERSION,
  }
  appendDrawRecord(record)

  // 绑定实体编号并创建用户藏品
  const collection: Collection = {
    id: `col_${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    userId: ctx.userId,
    physicalItemId: record.physicalItemId,
    uniqueCode,
    productId: primary.productId,
    productName: primary.productName,
    productCover: primary.productCover,
    productCoverTone: primary.productCoverTone,
    seriesId: series.id,
    seriesName: series.name,
    grade: primary.grade,
    material: primary.material,
    texture: `${series.name}出石 · ${primary.material} · 天然纹理，各体相异`,
    size: primary.size,
    weight: '以实物称重为准',
    foundAt: now,
    status: 'stored',
    traceCode: `JGZ.TR.${now.slice(0, 10).replace(/-/g, '')}.${uniqueCode.slice(-4)}`,
  }
  appendCollection(collection)

  // 回写订单：记录实体编号，使订单详情与结果页可相互追溯
  const nextItems: OrderItem[] = order.items.map((item) => ({ ...item, uniqueCode }))
  patchOrder(orderId, { items: nextItems, status: 'paid' })

  return record
})

defineMock('GET', '/api/explore/result/:orderId', (ctx): DrawRecord => {
  const record = findDrawByOrder(ctx.params.orderId)
  if (!record) throw new ApiError(ErrorCode.NOT_FOUND, '该订单暂无开奖结果')
  return record
})

// ---------------------------------------------------------------------------
// 石头柜 / 图鉴
// ---------------------------------------------------------------------------

defineMock('GET', '/api/explore/collection', (ctx): Collection[] => {
  return loadCollections().filter((c) => c.userId === ctx.userId)
})

defineMock('GET', '/api/explore/collection/:id', (ctx): Collection => {
  const target = loadCollections().find((c) => c.id === ctx.params.id && c.userId === ctx.userId)
  if (!target) throw new ApiError(ErrorCode.NOT_FOUND, '藏品不存在')
  return target
})

defineMock('GET', '/api/explore/bestiary', (ctx): BestiaryResult => {
  const entries = buildBestiary(ctx.userId)
  return {
    entries,
    collectedCount: entries.filter((e) => e.collected).length,
    totalCount: entries.length,
  }
})

/** 探索记录：开石订单与开奖结果合并展示 */
defineMock('GET', '/api/explore/records', (ctx): ExploreRecordsResult => {
  const records = loadCollections().filter((c) => c.userId === ctx.userId)
  return {
    list: records.map((c) => ({
      id: c.id,
      collectionId: c.id,
      productId: c.productId,
      seriesName: c.seriesName,
      productName: c.productName,
      productCover: c.productCover,
      productCoverTone: c.productCoverTone,
      grade: c.grade,
      uniqueCode: c.uniqueCode,
      foundAt: c.foundAt,
      status: c.status,
    })),
    total: records.length,
  }
})

// ---------------------------------------------------------------------------
// 实体发货
// ---------------------------------------------------------------------------

defineMock('POST', '/api/explore/shipping', (ctx): ShippingApplyResult => {
  const raw = ctx.data.collectionIds
  const ids = Array.isArray(raw) ? raw.map((v) => String(v)) : []
  if (ids.length === 0) throw new ApiError(ErrorCode.INVALID_PARAM, '请先选择要发货的藏品')

  const addressId = str(ctx.data.addressId)
  const address = mockAddresses.find((a) => a.id === addressId) ?? mockAddresses[0]

  const all = loadCollections()
  const targets = all.filter((c) => ids.includes(c.id) && c.userId === ctx.userId)

  if (targets.length === 0) throw new ApiError(ErrorCode.NOT_FOUND, '未找到可发货的藏品')

  // 只有「在柜」的藏品可申请发货，已在途或已发货的不可重复申请
  const invalid = targets.find((c) => c.status !== 'stored')
  if (invalid) {
    throw new ApiError(ErrorCode.INVALID_PARAM, `藏品 ${invalid.uniqueCode} 正在发货或已发货`)
  }

  targets.forEach((c) => patchCollection(c.id, { status: 'shipping' }))

  return {
    shippingId: `sp_${Date.now()}`,
    collectionIds: targets.map((c) => c.id),
    address,
    freight: 0,
    estimatedAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    message: '发货申请已提交，仓库将在 3 个工作日内安排寄出',
  }
})

/** 供发货页选择地址 */
defineMock('GET', '/api/user/address', () => mockAddresses)
