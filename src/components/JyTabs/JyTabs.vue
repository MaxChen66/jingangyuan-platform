<template>
  <scroll-view class="tabs" scroll-x :show-scrollbar="false">
    <view class="track">
      <view
        v-for="item in items"
        :key="item.value"
        class="tab"
        :class="{ active: item.value === modelValue }"
        @tap="select(item.value)"
      >
        <text class="label">{{ item.label }}</text>
        <view class="underline" />
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
/**
 * 分页签
 *
 * 选中态用朱砂短横线，而非填充色块 —— 与宋式的克制一致。
 */
export interface TabItem {
  label: string
  value: string
}

withDefaults(
  defineProps<{
    items: TabItem[]
    modelValue: string
    sticky?: boolean
  }>(),
  {
    sticky: false,
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function select(value: string): void {
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.tabs {
  width: 100%;
  white-space: nowrap;
  background: var(--c-bg);
  border-bottom: $hairline solid var(--c-line);
}

.track {
  display: inline-flex;
  align-items: center;
  padding: 0 $sp-2;
}

.tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-3 $sp-3 0;
}

.label {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

.underline {
  width: 32rpx;
  height: 4rpx;
  margin-top: 10rpx;
  margin-bottom: 8rpx;
  border-radius: 2rpx;
  background: transparent;
}

.active .label {
  color: var(--c-ink);
  font-weight: 500;
}

.active .underline {
  background: var(--c-accent);
}
</style>
