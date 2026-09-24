<template>
  <view class="jy-state">
    <JyLoading v-if="loading" :text="loadingText" :height="height" />
    <JyError v-else-if="error" :message="error" @retry="emit('retry')" />
    <JyEmpty
      v-else-if="empty"
      :title="emptyTitle"
      :desc="emptyDesc"
      :glyph="emptyGlyph"
    />
    <slot v-else />
  </view>
</template>

<script setup lang="ts">
import JyEmpty from '@/components/JyEmpty/JyEmpty.vue'
import JyError from '@/components/JyError/JyError.vue'
import JyLoading from '@/components/JyLoading/JyLoading.vue'

/**
 * 三态容器
 *
 * P1-FE-07 要求加载 / 空 / 失败三态在每个核心页面均覆盖。
 * 页面把状态透传给本组件即可，无需逐页重复写 v-if 分支。
 *
 * 用法：
 *   <JyStateView :loading="loading" :error="error" :empty="isEmpty" @retry="retry">
 *     <实际内容 />
 *   </JyStateView>
 */
withDefaults(
  defineProps<{
    loading?: boolean
    /** 非空即视为失败态 */
    error?: string
    empty?: boolean
    loadingText?: string
    emptyTitle?: string
    emptyDesc?: string
    emptyGlyph?: string
    height?: string
  }>(),
  {
    loading: false,
    error: '',
    empty: false,
    loadingText: '正在取石',
    emptyTitle: '此处尚空',
    emptyDesc: '',
    emptyGlyph: '空',
    height: '400rpx',
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<style lang="scss" scoped>
.jy-state {
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
