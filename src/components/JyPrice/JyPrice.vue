<template>
  <view class="price" :class="[`size-${size}`, { emphasis }]">
    <text class="symbol">¥</text>
    <text class="int">{{ parts.int }}</text>
    <text v-if="parts.dec" class="dec">.{{ parts.dec }}</text>
    <text v-if="originValue > value" class="origin">¥{{ originText }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 价格
 *
 * 金额一律以「分」传入。符号、整数、小数分三级字号，
 * 是中式版面里少见的「非对称数字排版」，用于强调价格主体。
 */
const props = withDefaults(
  defineProps<{
    /** 现价，单位「分」 */
    value: number
    /** 划线价，单位「分」。为 0 或不大于现价时不显示 */
    originValue?: number
    size?: 'small' | 'normal' | 'large'
    /** 是否使用点睛色强调 */
    emphasis?: boolean
  }>(),
  {
    originValue: 0,
    size: 'normal',
    emphasis: false,
  }
)

const parts = computed(() => {
  const fen = Math.max(0, Math.round(props.value))
  const int = String(Math.floor(fen / 100))
  const dec = String(fen % 100).padStart(2, '0')
  return {
    int: int.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    // 整元不显示小数位，避免视觉噪音
    dec: dec === '00' ? '' : dec,
  }
})

const originText = computed(() => {
  const fen = Math.max(0, Math.round(props.originValue))
  const int = String(Math.floor(fen / 100))
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
})
</script>

<style lang="scss" scoped>
.price {
  display: flex;
  align-items: baseline;
  font-family: $ff-serif;
  color: var(--c-ink);
}

.symbol {
  margin-right: 2rpx;
  font-size: 0.62em;
}

.int {
  font-weight: 500;
}

.dec {
  font-size: 0.68em;
}

.origin {
  margin-left: 12rpx;
  font-size: 0.5em;
  color: var(--c-ink-3);
  text-decoration: line-through;
  text-decoration-color: var(--c-ink-3);
}

.size-small {
  font-size: $fs-body;
}

.size-normal {
  font-size: $fs-h3;
}

.size-large {
  font-size: $fs-h1;
}

.emphasis {
  color: var(--c-accent);
}
</style>
