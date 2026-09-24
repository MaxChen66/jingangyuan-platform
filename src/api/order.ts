import type { Order, OrderStatus, OrderType, PageResult } from '@/types'
import { request } from '@/utils/request'

/** 统一订单接口。商城、定制、开石共用，以 type 区分业务线 */

export type OrderQuery = {
  type?: OrderType
  /** 不传表示「全部」 */
  status?: OrderStatus
  page?: number
  pageSize?: number
}

export type CreateOrderItem = {
  productId: string
  quantity: number
}

export type CreateOrderParams = {
  items: CreateOrderItem[]
  addressId: string
  remark?: string
  /** 优惠金额，单位「分」 */
  discount?: number
}

export function fetchOrders(query: OrderQuery = {}): Promise<PageResult<Order>> {
  return request<PageResult<Order>>({ url: '/api/order/list', data: { ...query } })
}

export function fetchOrderDetail(id: string): Promise<Order> {
  return request<Order>({ url: `/api/order/${id}` })
}

export function createOrder(params: CreateOrderParams): Promise<Order> {
  return request<Order>({ url: '/api/order/create', method: 'POST', data: { ...params } })
}

/** 模拟支付。第 3 期替换为微信支付，页面调用方式不变 */
export function payOrder(id: string): Promise<Order> {
  return request<Order>({ url: `/api/order/${id}/pay`, method: 'POST', loading: true })
}

export function cancelOrder(id: string): Promise<Order> {
  return request<Order>({ url: `/api/order/${id}/cancel`, method: 'POST' })
}

export function confirmOrder(id: string): Promise<Order> {
  return request<Order>({ url: `/api/order/${id}/confirm`, method: 'POST' })
}

export function applyAfterSale(id: string): Promise<Order> {
  return request<Order>({ url: `/api/order/${id}/after-sale`, method: 'POST' })
}
