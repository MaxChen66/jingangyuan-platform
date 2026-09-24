<template>
  <view class="check" :class="{ checked: modelValue, disabled }" @tap="toggle">
    <text v-if="modelValue" class="tick">✓</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 选择框
 *
 * 用朱砂方框而非圆形单选 —— 与宋式版面的直角语言一致。
 * 小程序原生 checkbox 样式难以贴合设计，故自行实现。
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle(): void {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<style lang="scss" scoped>
.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-xs;
  background: transparent;
}

.check.checked {
  background: var(--c-accent);
  border-color: var(--c-accent);
}

.tick {
  font-size: 22rpx;
  color: var(--c-ink-inverse);
  line-height: 1;
}

.disabled {
  opacity: 0.35;
}
</style>
