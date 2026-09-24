import type { CollectionStatus, OrderStatus, OrderType, ProductType } from '@/types'

/**
 * 展示层枚举映射
 *
 * 集中定义，避免同一份状态文案散落在多个页面里各自维护。
 */

export const ORDER_TYPE_TEXT: Record<OrderType, string> = {
  mall: '精品商城',
  custom: '私人定制',
  explore: '开石探索',
}

export const PRODUCT_TYPE_TEXT: Record<ProductType, string> = {
  spot: '精品现货',
  carving: '雕刻作品',
  collection: '收藏礼赠',
  explore: '开石藏品',
}

/**
 * 订单状态对应的强调色语义。
 * accent —— 需要用户行动（待付款）
 * gold   —— 进行中（待发货 / 已发货）
 * muted  —— 已终结（已完成 / 已关闭）
 * danger —— 异常（售后中）
 */
export const ORDER_STATUS_TONE: Record<OrderStatus, 'accent' | 'gold' | 'muted' | 'danger'> = {
  pending_pay: 'accent',
  paid: 'gold',
  shipped: 'gold',
  done: 'muted',
  closed: 'muted',
  after_sale: 'danger',
}

export const COLLECTION_STATUS_TONE: Record<CollectionStatus, 'gold' | 'muted' | 'accent'> = {
  stored: 'gold',
  shipping: 'accent',
  shipped: 'muted',
}

/** 订单列表的分页签 */
export const ORDER_TABS = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: 'pending_pay' },
  { label: '待发货', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'done' },
] as const

/** 商城列表的排序选项 */
export const SORT_OPTIONS = [
  { label: '综合', value: 'default' },
  { label: '销量', value: 'sales' },
  { label: '价格升序', value: 'price_asc' },
  { label: '价格降序', value: 'price_desc' },
] as const
