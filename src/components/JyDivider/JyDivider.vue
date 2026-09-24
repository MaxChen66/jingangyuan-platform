<template>
  <view class="divider" :class="{ spaced, plain }">
    <!-- 细线中段缀一枚菱形节点，是中式分隔的典型语言 -->
    <view class="line">
      <view v-if="!plain" class="node" />
      <text v-if="text" class="text">{{ text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 居中文字，例如「已到底」 */
    text?: string
    /** 上下留白 */
    spaced?: boolean
    /** 去掉菱形节点，退化为普通细线 */
    plain?: boolean
  }>(),
  {
    text: '',
    spaced: false,
    plain: false,
  }
)
</script>

<style lang="scss" scoped>
.divider {
  padding: 0;
}

.divider.spaced {
  padding: $sp-4 0;
}

.line {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: $hairline;
  background: var(--c-line);
}

.node {
  position: absolute;
  left: 50%;
  width: 10rpx;
  height: 10rpx;
  background: var(--c-line);
  transform: translate(-50%, 0) rotate(45deg);
}

.text {
  position: relative;
  padding: 0 $sp-3;
  background: var(--c-bg);
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  letter-spacing: 4rpx;
}
</style>
