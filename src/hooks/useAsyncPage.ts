import { ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

/**
 * 页面异步数据通用 Hook
 *
 * 实施文档 P1-FE-07 要求「加载 / 空 / 失败 / 重试」在每个核心页面均被覆盖。
 * 把三态逻辑收敛在这里，页面只需消费 state，
 * 配合 JyLoading / JyEmpty / JyError 三个组件即可，避免逐页重复实现。
 */

export interface AsyncPageOptions {
  /** 是否在调用时立即执行。默认 true */
  immediate?: boolean
  /** 失败时是否自动 toast。需要页面内联呈现错误时置 false */
  toast?: boolean
}

export interface AsyncPageState<T> {
  /** 首次加载中 */
  loading: Ref<boolean>
  /** 错误文案，为空表示无错误 */
  error: Ref<string>
  /** 业务数据 */
  data: ShallowRef<T | null>
  /** 是否已成功加载过一次，用于区分「尚无数据」与「暂无内容」 */
  loaded: Ref<boolean>
  /** 手动执行一次 */
  run: () => Promise<void>
  /** 供重试按钮调用 */
  retry: () => Promise<void>
}

export function useAsyncPage<T>(
  loader: () => Promise<T>,
  options: AsyncPageOptions = {}
): AsyncPageState<T> {
  const { immediate = true, toast = false } = options

  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const data = shallowRef<T | null>(null)

  async function run(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      data.value = await loader()
      loaded.value = true
    } catch (err) {
      // 错误对象可能是任意类型，统一降级为可展示的文案
      error.value = err instanceof Error ? err.message : '加载失败，请稍后重试'
      if (toast) {
        uni.showToast({ title: error.value, icon: 'none' })
      }
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    void run()
  }

  return { loading, error, data, loaded, run, retry: run }
}
