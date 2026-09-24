import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { PageResult } from '@/types'

/**
 * 分页列表通用 Hook
 *
 * 覆盖「首屏加载 / 下拉刷新 / 触底加载更多 / 失败重试 / 空列表」五种状态，
 * 商品列表、订单列表、石头柜、图鉴等页共用一个实现。
 */

export interface PagedListState<T> {
  list: Ref<T[]>
  page: Ref<number>
  total: Ref<number>
  /** 首屏或重置加载中 */
  loading: Ref<boolean>
  /** 追加加载中 */
  loadingMore: Ref<boolean>
  error: Ref<string>
  /** 是否已加载完毕 */
  finished: Ref<boolean>
  /** 已加载成功但结果为空 */
  isEmpty: Ref<boolean>
  load: (reset?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  retry: () => Promise<void>
}

export function usePagedList<T>(
  fetcher: (page: number, pageSize: number) => Promise<PageResult<T>>,
  pageSize = 10
): PagedListState<T> {
  // 泛型数组在 ref 下会被 UnwrapRef 处理，此处显式收窄以保持元素类型
  const list = ref([]) as Ref<T[]>
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')

  const finished = computed(() => !loading.value && !loadingMore.value && list.value.length >= total.value)
  const isEmpty = computed(
    () => !loading.value && !error.value && list.value.length === 0
  )

  async function load(reset = false): Promise<void> {
    if (reset) {
      page.value = 1
      total.value = 0
      error.value = ''
    }

    const isFirstPage = page.value === 1
    if (isFirstPage) loading.value = true
    else loadingMore.value = true

    try {
      const result = await fetcher(page.value, pageSize)
      list.value = isFirstPage ? result.list : [...list.value, ...result.list]
      total.value = result.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败，请稍后重试'
      // 首屏失败时清空列表，避免展示上一次的残留数据
      if (isFirstPage) list.value = []
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function loadMore(): Promise<void> {
    // 已在加载中或已到底，直接忽略，避免重复请求
    if (loading.value || loadingMore.value || finished.value || error.value) return
    page.value += 1
    await load()
  }

  async function retry(): Promise<void> {
    await load(true)
  }

  return {
    list,
    page,
    total,
    loading,
    loadingMore,
    error,
    finished,
    isEmpty,
    load,
    loadMore,
    retry,
  }
}
