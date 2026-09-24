import type { Amount, StoneTone } from './common'

/**
 * 统一订单
 *
 * 文档 6 节：商城、定制、开石共用 order 表，以 type 区分业务线。
 * 一期仅实现 mall 与 explore 两条链路的模拟下单。
 */
export type OrderType = 'mall' | 'custom' | 'explore'

/**
 * 订单状态
 * 一期为 Mock 驱动，支付为「模拟支付」，但不改变状态机的流转顺序，
 * 以便第 3 期接入真实微信支付时无需改动页面逻辑。
 */
export type OrderStatus =
  | 'pending_pay' // 待付款
  | 'paid' // 已付款 / 待发货
  | 'shipped' // 已发货
  | 'done' // 已完成
  | 'closed' // 已关闭
  | 'after_sale' // 售后中

export interface OrderItem {
  productId: string
  name: string
  cover: string
  coverTone: StoneTone
  price: Amount
  quantity: number
  /** 规格描述，例如 材质 / 尺寸 */
  spec: string
  /** 开石订单额外携带：开奖后绑定的实体编号 */
  uniqueCode?: string
}

export interface ShippingInfo {
  company: string
  trackingNo: string
  /** 物流轨迹（一期为静态展示，第 3 期接真实物流接口） */
  traces: ShippingTrace[]
}

export interface ShippingTrace {
  time: string
  text: string
}

export interface Order {
  id: string
  orderNo: string
  type: OrderType
  status: OrderStatus
  items: OrderItem[]
  /** 商品总额 */
  totalAmount: Amount
  /** 运费 */
  freight: Amount
  /** 优惠 */
  discount: Amount
  /** 实付 */
  payAmount: Amount
  /** 收货地址快照 */
  address: Address | null
  remark: string
  createdAt: string
  payTime: string
  shipping: ShippingInfo | null
  /** 开石订单关联的批次，便于结果页追溯 */
  batchId?: string
  seriesName?: string
}

export interface Address {
  id: string
  name: string
  phone: string
  /** 省 / 市 / 区 */
  region: string
  detail: string
  isDefault: boolean
}

/**
 * 订单状态展示配置
 * 集中定义，避免各页面重复维护状态文案。
 */
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending_pay: '待付款',
  paid: '待发货',
  shipped: '已发货',
  done: '已完成',
  closed: '已关闭',
  after_sale: '售后中',
}
