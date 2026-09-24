<template>
  <view class="jy-loading" :style="{ minHeight: height }">
    <view class="mark">
      <view v-for="n in 3" :key="n" class="dot" :class="`dot-${n}`" />
    </view>
    <text class="label">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string
    /** 占位高度，避免加载态与内容态之间跳版 */
    height?: string
  }>(),
  {
    text: '正在取石',
    height: '400rpx',
  }
)
</script>

<style lang="scss" scoped>
// 中式加载态：三枚墨点依次落定，替代常见的旋转菊花
.jy-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $sp-6 0;
}

.mark {
  display: flex;
  align-items: flex-end;
  height: 32rpx;
}

.dot {
  width: 12rpx;
  height: 12rpx;
  margin: 0 8rpx;
  border-radius: 50%;
  background: var(--c-ink-3);
  animation: jy-dot 1.2s $ease-cn infinite;
}

.dot-2 {
  animation-delay: 0.15s;
}

.dot-3 {
  animation-delay: 0.3s;
}

@keyframes jy-dot {
  0%,
  60%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-12rpx) scale(1.25);
    opacity: 1;
  }
}

.label {
  margin-top: $sp-3;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink-3);
  letter-spacing: 4rpx;
}
</style>
