import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { DrawRecord, DrawPhase, ExploreSeries } from '@/types'

/**
 * 开石探索态
 *
 * 承载「购买 → 开石 → 结果」这条链路的跨页状态。
 *
 * 关键约束：本 store 只缓存展示所需的数据，不参与任何结果判定。
 * 开奖结果一律以服务端返回为准（P5-07：前端不决定结果）。
 */
export const useExploreStore = defineStore('explore', () => {
  /** 当前正在开石的订单 */
  const pendingOrderId = ref('')
  /** 当前矿区，供开石页与结果页展示系列信息 */
  const currentSeries = ref<ExploreSeries | null>(null)
  /** 最近一次开奖结果，结果页优先读取，避免重复请求 */
  const lastRecord = ref<DrawRecord | null>(null)
  /** 动画阶段 */
  const phase = ref<DrawPhase>('observe')
  /** 开奖请求是否进行中 —— 用于防重复点击 */
  const drawing = ref(false)

  const isDrawing = computed(() => drawing.value)

  function beginDraw(orderId: string, series: ExploreSeries | null): void {
    pendingOrderId.value = orderId
    currentSeries.value = series
    lastRecord.value = null
    phase.value = 'observe'
  }

  function setRecord(record: DrawRecord): void {
    lastRecord.value = record
    phase.value = 'done'
  }

  function setPhase(next: DrawPhase): void {
    phase.value = next
  }

  function reset(): void {
    pendingOrderId.value = ''
    currentSeries.value = null
    lastRecord.value = null
    phase.value = 'observe'
    drawing.value = false
  }

  return {
    pendingOrderId,
    currentSeries,
    lastRecord,
    phase,
    drawing,
    isDrawing,
    beginDraw,
    setRecord,
    setPhase,
    reset,
  }
})
