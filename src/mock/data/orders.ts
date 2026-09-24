import { STORAGE_KEYS } from '@/constants/config'
import type { Order } from '@/types'
import { getStorage, setStorage } from '@/utils/storage'

/**
 * 订单 Mock 数据
 *
 * 订单持久化到本地存储，使「模拟下单 → 订单列表 → 订单详情」在刷新后依然成立，
 * 一期验收门要求该链路无需真实后端即可完整走通。
 */

const SEED_ORDERS: Order[] = [
  {
    id: 'o_seed_01',
    orderNo: 'JGZ2026091520370142',
    type: 'mall',
    status: 'done',
    items: [
      {
        productId: 'p_1004',
        name: '平安无事牌 · 挂件',
        cover: '',
        coverTone: 'paper',
        price: 168000,
        quantity: 1,
        spec: '湖南沅江 · 46 × 28 × 9 mm',
      },
    ],
    totalAmount: 168000,
    freight: 0,
    discount: 0,
    payAmount: 168000,
    address: {
      id: 'addr_01',
      name: '陈砚舟',
      phone: '13800138000',
      region: '浙江省 杭州市 西湖区',
      detail: '文三路 199 号 云谷大厦 A 座 1201 室',
      isDefault: true,
    },
    remark: '',
    createdAt: '2026-09-15T20:37:00',
    payTime: '2026-09-15T20:38:12',
    shipping: {
      company: '顺丰速运',
      trackingNo: 'SF1234567890123',
      traces: [
        { time: '2026-09-18T09:12:00', text: '已签收，感谢您选择金刚之源' },
        { time: '2026-09-17T14:26:00', text: '快件已到达【杭州西湖文三路营业点】' },
        { time: '2026-09-16T21:03:00', text: '快件已发出，下一站【杭州转运中心】' },
        { time: '2026-09-16T18:40:00', text: '商品已出库，仓库：金刚之源杭州仓' },
      ],
    },
  },
  {
    id: 'o_seed_02',
    orderNo: 'JGZ2026091822100338',
    type: 'explore',
    status: 'paid',
    items: [
      {
        productId: 'p_1005',
        name: '招财貔貅 · 手把件',
        cover: '',
        coverTone: 'amber',
        price: 328000,
        quantity: 1,
        spec: '玄青矿脉 · 珍品 · 实体编号 JGZ-PI-8004',
        uniqueCode: 'JGZ-PI-8004',
      },
    ],
    totalAmount: 39800,
    freight: 0,
    discount: 0,
    payAmount: 39800,
    address: null,
    remark: '',
    createdAt: '2026-09-18T22:10:00',
    payTime: '2026-09-18T22:10:26',
    shipping: null,
    batchId: 'b_2026090501',
    seriesName: '玄青矿脉',
  },
  {
    id: 'o_seed_03',
    orderNo: 'JGZ2026092109450217',
    type: 'mall',
    status: 'pending_pay',
    items: [
      {
        productId: 'p_1008',
        name: '竹报平安 · 笔搁',
        cover: '',
        coverTone: 'jade',
        price: 128000,
        quantity: 2,
        spec: '山东蒙阴 · 112 × 30 × 26 mm',
      },
    ],
    totalAmount: 256000,
    freight: 0,
    discount: 12800,
    payAmount: 243200,
    address: {
      id: 'addr_01',
      name: '陈砚舟',
      phone: '13800138000',
      region: '浙江省 杭州市 西湖区',
      detail: '文三路 199 号 云谷大厦 A 座 1201 室',
      isDefault: true,
    },
    remark: '希望附赠一张手写贺卡',
    createdAt: '2026-09-21T09:45:00',
    payTime: '',
    shipping: null,
  },
]

export function loadOrders(): Order[] {
  return getStorage<Order[]>(STORAGE_KEYS.orders, SEED_ORDERS)
}

export function saveOrders(list: Order[]): void {
  setStorage(STORAGE_KEYS.orders, list)
}

export function findOrder(id: string): Order | undefined {
  return loadOrders().find((o) => o.id === id)
}

export function insertOrder(order: Order): Order {
  const list = loadOrders()
  list.unshift(order)
  saveOrders(list)
  return order
}

export function patchOrder(id: string, patch: Partial<Order>): Order | undefined {
  const list = loadOrders()
  const target = list.find((o) => o.id === id)
  if (!target) return undefined
  Object.assign(target, patch)
  saveOrders(list)
  return target
}
