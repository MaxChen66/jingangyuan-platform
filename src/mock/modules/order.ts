import { calcFreight } from '@/constants/config'
import { ErrorCode } from '@/types'
import type { Order, OrderItem, OrderStatus, OrderType, PageResult, StoneTone } from '@/types'
import { ApiError } from '@/utils/error'
import { genOrderNo } from '@/utils/format'
import { defineMock } from '../registry'
import { findOrder, insertOrder, loadOrders, patchOrder } from '../data/orders'
import { findProduct } from '../data/goods'
import { mockAddresses } from '../data/user'

/**
 * 统一订单 Mock 接口
 *
 * 商城、定制、开石共用同一套订单读写，仅以 type 区分业务线（文档 6 节）。
 * 一期的「支付」为模拟支付，但状态流转顺序与真实支付保持一致，
 * 第 3 期接入微信支付时页面逻辑无需改动。
 */

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// 注意：'list' 必须注册在 ':id' 之前，匹配按注册顺序生效
defineMock('GET', '/api/order/list', (ctx): PageResult<Order> => {
  const type = str(ctx.data.type) as OrderType | ''
  const status = str(ctx.data.status) as OrderStatus | ''
  const page = Math.max(1, num(ctx.data.page, 1))
  const pageSize = Math.max(1, num(ctx.data.pageSize, 10))

  let list = loadOrders()
  if (type) list = list.filter((o) => o.type === type)
  if (status) list = list.filter((o) => o.status === status)

  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
})

defineMock('GET', '/api/order/:id', (ctx): Order => {
  const order = findOrder(ctx.params.id)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')
  return order
})

/** 创建商城订单（结算页提交） */
defineMock('POST', '/api/order/create', (ctx): Order => {
  const rawItems = ctx.data.items
  const items = Array.isArray(rawItems) ? rawItems : []
  if (items.length === 0) throw new ApiError(ErrorCode.INVALID_PARAM, '订单中没有商品')

  const orderItems: OrderItem[] = []
  let totalAmount = 0

  for (const raw of items) {
    const entry = raw as Record<string, unknown>
    const productId = str(entry.productId)
    const quantity = Math.max(1, num(entry.quantity, 1))
    const product = findProduct(productId)

    if (!product) throw new ApiError(ErrorCode.NOT_FOUND, `商品不存在：${productId}`)
    if (product.stock < quantity) {
      throw new ApiError(ErrorCode.OUT_OF_STOCK, `「${product.name}」库存不足，仅剩 ${product.stock} 件`)
    }

    totalAmount += product.price * quantity
    orderItems.push({
      productId: product.id,
      name: product.name,
      cover: product.cover,
      coverTone: product.coverTone as StoneTone,
      price: product.price,
      quantity,
      spec: `${product.origin} · ${product.size}`,
    })
  }

  const addressId = str(ctx.data.addressId)
  const address = mockAddresses.find((a) => a.id === addressId) ?? mockAddresses[0]
  // 与前端预估共用同一条规则，避免两处阈值各自漂移
  const freight = calcFreight(totalAmount)
  const discount = num(ctx.data.discount, 0)
  const payAmount = totalAmount + freight - discount

  const order: Order = {
    id: `o_${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
    orderNo: genOrderNo('JGZ'),
    type: 'mall',
    status: 'pending_pay',
    items: orderItems,
    totalAmount,
    freight,
    discount,
    payAmount,
    address,
    remark: str(ctx.data.remark),
    createdAt: new Date().toISOString(),
    payTime: '',
    shipping: null,
  }

  return insertOrder(order)
})

/** 模拟支付。真实微信支付在文档第 3 期接入，此处只推进状态机 */
defineMock('POST', '/api/order/:id/pay', (ctx): Order => {
  const order = findOrder(ctx.params.id)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')

  // 幂等：已支付的订单重复请求不再改变状态
  if (order.status !== 'pending_pay') return order

  const paid = patchOrder(order.id, {
    status: 'paid',
    payTime: new Date().toISOString(),
  })
  return paid as Order
})

defineMock('POST', '/api/order/:id/cancel', (ctx): Order => {
  const order = findOrder(ctx.params.id)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')
  if (order.status !== 'pending_pay') {
    throw new ApiError(ErrorCode.INVALID_PARAM, '仅待付款订单可以取消')
  }
  return patchOrder(order.id, { status: 'closed' }) as Order
})

defineMock('POST', '/api/order/:id/confirm', (ctx): Order => {
  const order = findOrder(ctx.params.id)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')
  if (order.status !== 'shipped') {
    throw new ApiError(ErrorCode.INVALID_PARAM, '订单尚未发货，无法确认收货')
  }
  return patchOrder(order.id, { status: 'done' }) as Order
})

/** 售后申请。一期仅记录诉求并推进状态，完整售后流程在批次 2 的 UI-09 实现 */
defineMock('POST', '/api/order/:id/after-sale', (ctx): Order => {
  const order = findOrder(ctx.params.id)
  if (!order) throw new ApiError(ErrorCode.NOT_FOUND, '订单不存在')
  if (order.status === 'pending_pay' || order.status === 'closed') {
    throw new ApiError(ErrorCode.INVALID_PARAM, '该订单状态不支持申请售后')
  }
  return patchOrder(order.id, { status: 'after_sale' }) as Order
})
