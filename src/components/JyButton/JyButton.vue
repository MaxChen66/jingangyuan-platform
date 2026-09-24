<template>
  <view
    class="jy-btn"
    :class="[`variant-${variant}`, `size-${size}`, { block, disabled, plain }]"
    @tap="onTap"
  >
    <JyLoading v-if="loading" text="" height="40rpx" />
    <text v-else class="label">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
import JyLoading from '@/components/JyLoading/JyLoading.vue'

/**
 * 中式按钮
 *
 * 全站唯一的按钮实现。四种变体覆盖两套视觉体系：
 *   primary —— 朱砂实底，用于主行动
 *   ghost   —— 细线描边，与宋式版面相合
 *   gold    —— 鎏金描边，开石体系专用
 *   text    —— 纯文字，用于次级操作
 */
const props = withDefaults(
  defineProps<{
    text?: string
    variant?: 'primary' | 'ghost' | 'gold' | 'text'
    size?: 'small' | 'normal' | 'large'
    block?: boolean
    disabled?: boolean
    loading?: boolean
    /** 仅在实底变体下生效：降为浅底淡字 */
    plain?: boolean
  }>(),
  {
    text: '',
    variant: 'primary',
    size: 'normal',
    block: false,
    disabled: false,
    loading: false,
    plain: false,
  }
)

const emit = defineEmits<{ tap: [] }>()

function onTap(): void {
  if (props.disabled || props.loading) return
  emit('tap')
}
</script>

<style lang="scss" scoped>
.jy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $r-sm;
  font-family: $ff-serif;
  letter-spacing: 4rpx;
  transition: opacity $dur-fast $ease-cn;
}

.jy-btn:active {
  opacity: 0.72;
}

.block {
  width: 100%;
}

// ---- 尺寸 ----
.size-small {
  height: 56rpx;
  padding: 0 $sp-3;
  font-size: $fs-xs;
}

.size-normal {
  height: 76rpx;
  padding: 0 $sp-4;
  font-size: $fs-sm;
}

.size-large {
  height: 92rpx;
  padding: 0 $sp-5;
  font-size: $fs-h3;
}

// ---- 变体 ----
.variant-primary {
  background: var(--c-accent);
  color: var(--c-ink-inverse);
  border: $hairline solid var(--c-accent);
}

.variant-primary.plain {
  background: var(--c-accent-soft);
  color: var(--c-accent);
  border-color: transparent;
}

.variant-ghost {
  background: transparent;
  color: var(--c-ink);
  border: $hairline solid var(--c-line-strong);
}

.variant-gold {
  background: transparent;
  color: var(--c-accent);
  border: $hairline solid var(--c-accent);
}

.variant-text {
  background: transparent;
  border: none;
  color: var(--c-ink-2);
  letter-spacing: 2rpx;
}

.label {
  line-height: 1;
}

.disabled {
  opacity: 0.4;
}
</style>
