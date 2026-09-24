<template>
  <view class="seal" :class="[`size-${size}`, { outline }]">
    <!-- 多字竖排，取钤印的纵向秩序 -->
    <text v-for="(char, index) in chars" :key="index" class="char">{{ char }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 印章
 *
 * 中式版面最强的点睛元素。多字自动竖排 —— 用 flex 纵向堆叠而非
 * writing-mode，因为微信小程序对 writing-mode 支持不稳定。
 */
const props = withDefaults(
  defineProps<{
    text?: string
    size?: 'small' | 'normal' | 'large'
    /** 阴文（描边）而非阳文（实底） */
    outline?: boolean
  }>(),
  {
    text: '金刚',
    size: 'normal',
    outline: false,
  }
)

const chars = computed(() => props.text.split('').slice(0, 4))
</script>

<style lang="scss" scoped>
.seal {
  @include jy-vertical-text;
  justify-content: center;
  border-radius: $r-xs;
  background: var(--c-accent);
  color: var(--c-ink-inverse);
  font-family: $ff-serif;
}

.char {
  line-height: 1.05;
}

.size-small {
  width: 44rpx;
  height: 44rpx;
  font-size: 22rpx;
}

.size-normal {
  width: 68rpx;
  height: 68rpx;
  font-size: 28rpx;
}

.size-large {
  width: 96rpx;
  height: 96rpx;
  font-size: 38rpx;
}

.outline {
  background: transparent;
  border: 2rpx solid var(--c-accent);
  color: var(--c-accent);
}
</style>
