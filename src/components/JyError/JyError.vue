<template>
  <view class="jy-error">
    <!-- 断裂的细线圆环，取「石有裂」之意 -->
    <view class="crack">
      <view class="ring" />
      <view class="slash" />
    </view>
    <text class="title">{{ title }}</text>
    <text class="desc">{{ message }}</text>
    <view class="action" @tap="emit('retry')">
      <text class="action-text">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 错误详情，通常来自接口异常信息 */
    message?: string
    title?: string
    actionText?: string
  }>(),
  {
    message: '请检查网络后重试',
    title: '取石未成',
    actionText: '重新尝试',
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<style lang="scss" scoped>
.jy-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $sp-7 $sp-4;
}

.crack {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}

.ring {
  width: 100%;
  height: 100%;
  border: $hairline solid var(--c-line);
  border-radius: 50%;
}

.slash {
  position: absolute;
  top: 50%;
  left: 12%;
  width: 76%;
  height: $hairline;
  background: var(--c-accent);
  transform: rotate(-38deg);
  transform-origin: center;
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

.action {
  @include jy-hairline-card(transparent, var(--c-accent));
  margin-top: $sp-5;
  padding: 16rpx 48rpx;
}

.action-text {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
  letter-spacing: 4rpx;
}
</style>
