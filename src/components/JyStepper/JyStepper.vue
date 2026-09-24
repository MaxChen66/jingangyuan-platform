<template>
  <view class="stepper" :class="`size-${size}`">
    <view class="btn" :class="{ disabled: atMin }" @tap="step(-1)">
      <text class="symbol">−</text>
    </view>
    <text class="value">{{ modelValue }}</text>
    <view class="btn" :class="{ disabled: atMax }" @tap="step(1)">
      <text class="symbol">＋</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { clamp } from '@/utils/format'

/**
 * 数量步进器
 *
 * 上下限由商品库存与限购规则决定，越界时按钮显式置灰而非静默忽略，
 * 让用户知道为何加不上去。
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    size?: 'small' | 'normal'
  }>(),
  {
    min: 1,
    max: 99,
    size: 'normal',
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const atMin = computed(() => props.modelValue <= props.min)
const atMax = computed(() => props.modelValue >= props.max)

function step(delta: number): void {
  const next = clamp(props.modelValue + delta, props.min, props.max)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}
</script>

<style lang="scss" scoped>
.stepper {
  display: flex;
  align-items: center;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
  overflow: hidden;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 100%;
  background: var(--c-surface-2);
}

.btn.disabled {
  opacity: 0.35;
}

.symbol {
  font-size: $fs-sm;
  color: var(--c-ink-2);
  line-height: 1;
}

.value {
  min-width: 72rpx;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  text-align: center;
}

.size-normal {
  height: 64rpx;
}

.size-small {
  height: 52rpx;
}

.size-small .btn {
  width: 48rpx;
}

.size-small .value {
  min-width: 60rpx;
  font-size: $fs-xs;
}
</style>
