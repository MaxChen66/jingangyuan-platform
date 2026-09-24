import type {
  BestiaryResult,
  Collection,
  DrawRecord,
  ExploreProbability,
  ExploreRecordsResult,
  ExploreSeries,
  ExploreSummary,
  Order,
  ShippingApplyResult,
} from '@/types'
import { request } from '@/utils/request'

/**
 * 开石探索馆接口
 *
 * 对应实施文档第 8 节的 API 执行清单。
 *
 * 重要：开奖结果完全由服务端判定（此处即 Mock 服务端），
 * 前端不参与任何随机过程，也无法通过篡改请求伪造结果（P5-07）。
 */

export function fetchSeriesList(): Promise<ExploreSummary[]> {
  return request<ExploreSummary[]>({ url: '/api/explore/series' })
}

export function fetchSeriesDetail(id: string): Promise<ExploreSeries> {
  return request<ExploreSeries>({ url: `/api/explore/series/${id}` })
}

/** 概率与商品分布。购买前必须展示，且可回看 */
export function fetchProbability(id: string): Promise<ExploreProbability> {
  return request<ExploreProbability>({ url: `/api/explore/series/${id}/probability` })
}

export type ExploreOrderParams = {
  seriesId: string
  quantity: number
  /** 用户主动确认购买规则。服务端会再次校验，不接受默认勾选 */
  agreedRule: boolean
}

export function createExploreOrder(params: ExploreOrderParams): Promise<Order> {
  return request<Order>({ url: '/api/explore/order', method: 'POST', data: { ...params } })
}

/**
 * 执行开奖。接口幂等 —— 同一订单重复调用只返回同一结果。
 * 因此开石页的防重复点击即使被绕过，也不会产生第二个结果。
 */
export function drawStone(orderId: string): Promise<DrawRecord> {
  return request<DrawRecord>({
    url: '/api/explore/draw',
    method: 'POST',
    data: { orderId },
    // 开奖是资金与库存相关的关键操作，失败必须显式呈现给用户，不做静默 toast
    toast: false,
  })
}

export function fetchDrawResult(orderId: string): Promise<DrawRecord> {
  return request<DrawRecord>({ url: `/api/explore/result/${orderId}`, toast: false })
}

export function fetchCollections(): Promise<Collection[]> {
  return request<Collection[]>({ url: '/api/explore/collection' })
}

export function fetchCollectionDetail(id: string): Promise<Collection> {
  return request<Collection>({ url: `/api/explore/collection/${id}` })
}

export function fetchBestiary(): Promise<BestiaryResult> {
  return request<BestiaryResult>({ url: '/api/explore/bestiary' })
}

export function fetchExploreRecords(): Promise<ExploreRecordsResult> {
  return request<ExploreRecordsResult>({ url: '/api/explore/records' })
}

export type ShippingParams = {
  collectionIds: string[]
  addressId: string
}

export function applyShipping(params: ShippingParams): Promise<ShippingApplyResult> {
  return request<ShippingApplyResult>({
    url: '/api/explore/shipping',
    method: 'POST',
    data: { ...params },
  })
}
