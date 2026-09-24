<template>
  <view class="tag" :class="[`tone-${tone}`, { solid }]">
    <text class="text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 标签
 *
 * 用细线方框而非圆角胶囊 —— 方框与宋式版面的直角语言一致。
 */
withDefaults(
  defineProps<{
    text?: string
    tone?: 'default' | 'accent' | 'gold' | 'jade'
    /** 是否实底填充 */
    solid?: boolean
  }>(),
  {
    text: '',
    tone: 'default',
    solid: false,
  }
)
</script>

<style lang="scss" scoped>
.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34rpx;
  padding: 0 10rpx;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
  color: var(--c-ink-3);
}

.text {
  font-size: $fs-xxs;
  line-height: 1;
  letter-spacing: 2rpx;
}

.tone-accent {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.tone-gold {
  border-color: var(--c-gold);
  color: var(--c-gold);
}

.tone-jade {
  border-color: var(--c-jade);
  color: var(--c-jade);
}

.solid {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: var(--c-ink-inverse);
}
</style>
