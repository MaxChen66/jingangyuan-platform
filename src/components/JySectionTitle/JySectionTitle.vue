<template>
  <view class="section" :class="{ compact }">
    <view class="left">
      <view class="bar" />
      <text class="title">{{ title }}</text>
      <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
    </view>
    <slot name="extra">
      <view v-if="more" class="more" @tap="emit('more')">
        <text class="more-text">{{ moreText }}</text>
        <text class="arrow">›</text>
      </view>
    </slot>
  </view>
</template>

<script setup lang="ts">
/**
 * 节标题
 *
 * 左侧一道朱砂短竖线 + 宋体标题，是中式版面里最经济的层级手段，
 * 比加粗大字或下划线都更含蓄。
 */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 是否显示「更多」入口 */
    more?: boolean
    moreText?: string
    /** 紧凑模式，减小上下留白 */
    compact?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    more: false,
    moreText: '全部',
    compact: false,
  }
)

const emit = defineEmits<{ more: [] }>()
</script>

<style lang="scss" scoped>
.section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $sp-5 0 $sp-3;
}

.section.compact {
  padding: $sp-3 0 $sp-2;
}

.left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.bar {
  width: 4rpx;
  height: 30rpx;
  margin-right: 14rpx;
  background: var(--c-accent);
  border-radius: 2rpx;
}

.title {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.subtitle {
  margin-left: 16rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.more {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.more-text {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.arrow {
  margin-left: 4rpx;
  font-size: $fs-sm;
  color: var(--c-ink-3);
}
</style>
