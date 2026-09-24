import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { orderApi } from '@/api'
import type { Order, OrderStatus, OrderType } from '@/types'

/**
 * 订单态
 *
 * 订单数据以服务端（一期即 Mock）为准，本 store 只做列表缓存与最后操作订单的暂存，
 * 用于「结算 → 下单成功 → 订单详情」之间的页面交接。
 */
export const useOrderStore = defineStore('order', () => {
  const list = ref<Order[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  /** 最近一次下单/支付的订单，供详情页优先读取 */
  const lastOrder = ref<Order | null>(null)

  const isEmpty = computed(() => !loading.value && list.value.length === 0)

  async function loadList(type?: OrderType, status?: OrderStatus): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const result = await orderApi.fetchOrders({ type, status, page: 1, pageSize: 50 })
      list.value = result.list
      total.value = result.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '订单加载失败'
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function setLastOrder(order: Order): void {
    lastOrder.value = order
  }

  /** 订单状态变更后就地更新列表，避免整表重拉 */
  function patchLocal(order: Order): void {
    const index = list.value.findIndex((o) => o.id === order.id)
    if (index >= 0) list.value[index] = order
    if (lastOrder.value?.id === order.id) lastOrder.value = order
  }

  return {
    list,
    total,
    loading,
    error,
    lastOrder,
    isEmpty,
    loadList,
    setLastOrder,
    patchLocal,
  }
})
