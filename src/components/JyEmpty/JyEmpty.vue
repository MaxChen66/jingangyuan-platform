<template>
  <view class="jy-empty">
    <!-- 中式空态图形：素框留白，中置一字。纯 CSS 绘制，不依赖图片素材 -->
    <view class="frame">
      <view class="frame-inner">
        <text class="glyph">{{ glyph }}</text>
      </view>
    </view>
    <text class="title">{{ title }}</text>
    <text v-if="desc" class="desc">{{ desc }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    desc?: string
    /** 框中单字，用于区分场景语气 */
    glyph?: string
  }>(),
  {
    title: '此处尚空',
    desc: '',
    glyph: '空',
  }
)
</script>

<style lang="scss" scoped>
.jy-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $sp-7 $sp-4;
}

// 双层细线方框，取中式装裱的内外框意象
.frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  border: $hairline solid var(--c-line);
  border-radius: $r-sm;
}

.frame-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
}

.glyph {
  font-family: $ff-serif;
  font-size: 60rpx;
  color: var(--c-line);
  line-height: 1;
}

.title {
  margin-top: $sp-5;
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink-2);
  letter-spacing: 4rpx;
}

.desc {
  margin-top: $sp-2;
  font-size: $fs-sm;
  color: var(--c-ink-3);
  text-align: center;
  line-height: 1.7;
}
</style>
