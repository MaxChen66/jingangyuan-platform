<template>
  <view class="steps">
    <view v-for="(step, index) in steps" :key="step.key" class="step">
      <view class="rail">
        <view class="dot" :class="dotClass(index)">
          <text v-if="dotClass(index) === 'done'" class="tick">✓</text>
        </view>
        <view v-if="index < steps.length - 1" class="line" :class="{ passed: index < activeIndex }" />
      </view>
      <view class="content">
        <text class="step-title" :class="dotClass(index)">{{ step.title }}</text>
        <text v-if="step.desc" class="step-desc">{{ step.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 纵向流程
 *
 * 用于订单状态、定制订单状态这类需要「看得见走到哪一步」的场景。
 * 已完成的节点用实心朱砂点加对勾，当前节点用空心描边点，
 * 未到达的节点退为浅色，整体不做高饱和色块。
 */
export interface StepItem {
  key: string
  title: string
  desc?: string
}

const props = withDefaults(
  defineProps<{
    steps: StepItem[]
    /** 当前所处的步骤下标。之前的都视为已完成 */
    activeIndex: number
    /** 流程是否已全部完成 */
    finished?: boolean
  }>(),
  {
    finished: false,
  }
)

const currentIndex = computed(() => Math.min(props.activeIndex, props.steps.length - 1))

function dotClass(index: number): string {
  if (props.finished || index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'current'
  return 'pending'
}
</script>

<style lang="scss" scoped>
.steps {
  display: flex;
  flex-direction: column;
}

.step {
  display: flex;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40rpx;
  flex-shrink: 0;
}

.dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18rpx;
  height: 18rpx;
  margin-top: 10rpx;
  border-radius: 50%;
}

.dot.done {
  width: 26rpx;
  height: 26rpx;
  margin-top: 6rpx;
  background: var(--c-accent);
}

.dot.current {
  width: 22rpx;
  height: 22rpx;
  margin-top: 8rpx;
  border: 2rpx solid var(--c-accent);
  background: transparent;
}

.dot.pending {
  background: var(--c-line);
}

.tick {
  font-size: 16rpx;
  color: var(--c-ink-inverse);
  line-height: 1;
}

.line {
  flex: 1;
  width: $hairline;
  min-height: 40rpx;
  background: var(--c-line);
}

.line.passed {
  background: var(--c-accent);
  opacity: 0.5;
}

.content {
  flex: 1;
  min-width: 0;
  padding-bottom: $sp-4;
  padding-left: $sp-2;
}

.step-title {
  font-family: $ff-serif;
  font-size: $fs-sm;
  letter-spacing: 2rpx;
}

.step-title.done {
  color: var(--c-ink-2);
}

.step-title.current {
  color: var(--c-accent);
}

.step-title.pending {
  color: var(--c-ink-3);
}

.step-desc {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.6;
}
</style>
