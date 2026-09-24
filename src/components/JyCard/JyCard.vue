<template>
  <view class="card" :class="{ cornered, flat, gold }">
    <view v-if="title" class="head">
      <text class="card-title">{{ title }}</text>
      <slot name="head-extra" />
    </view>
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * 卡片
 *
 * 宋式版面以 1rpx 细线代替重投影。gold 变体用于开石体系的鎏金描边。
 */
withDefaults(
  defineProps<{
    title?: string
    /** 是否绘制回纹角标 */
    cornered?: boolean
    /** 无内边距，用于内嵌列表 */
    flat?: boolean
    /** 鎏金描边（开石体系） */
    gold?: boolean
  }>(),
  {
    title: '',
    cornered: false,
    flat: false,
    gold: false,
  }
)
</script>

<style lang="scss" scoped>
.card {
  @include jy-hairline-card(var(--c-surface), var(--c-line));
  padding: $sp-4;
}

.card.cornered {
  @include jy-corner-mark;
}

.card.gold {
  @include jy-gold-edge;
}

.card.flat {
  padding: 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $sp-3;
}

.card-title {
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}
</style>
