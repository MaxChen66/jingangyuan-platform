<template>
  <view v-if="visible" class="popup">
    <view class="mask" @tap="onMaskTap" />
    <view class="sheet" :class="{ tall }">
      <view class="head">
        <text class="title">{{ title }}</text>
        <view class="close" @tap="close">
          <text class="close-mark">✕</text>
        </view>
      </view>
      <scroll-view class="body" scroll-y>
        <slot />
      </scroll-view>
      <view v-if="$slots.footer" class="footer jy-safe-bottom">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 底部抽屉
 *
 * 用于概率公示、发货选择等需要「不离开当前上下文」的场景。
 * 点击遮罩可关闭，但 maskClosable 为 false 时只能通过显式操作关闭，
 * 用于购买规则确认这类必须走完的流程。
 */
const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    /** 更高的抽屉，用于概率公示这类长列表 */
    tall?: boolean
    /** 点击遮罩是否关闭。购买规则确认等必须走完的流程应置 false */
    maskClosable?: boolean
  }>(),
  {
    title: '',
    tall: false,
    maskClosable: true,
  }
)

const emit = defineEmits<{ close: [] }>()

function close(): void {
  emit('close')
}

function onMaskTap(): void {
  if (props.maskClosable) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.popup {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 900;
}

.mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--c-mask);
  animation: jy-fade $dur-base $ease-cn;
}

.sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  max-height: 68vh;
  border-top-left-radius: $r-lg;
  border-top-right-radius: $r-lg;
  background: var(--c-surface);
  animation: jy-rise $dur-base $ease-cn;
}

.sheet.tall {
  max-height: 84vh;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: $sp-4;
  border-bottom: $hairline solid var(--c-line);
}

.title {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.close {
  padding: 8rpx 12rpx;
}

.close-mark {
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

.body {
  flex: 1;
  overflow: hidden;
  padding: $sp-4;
}

.footer {
  flex-shrink: 0;
  padding: $sp-3 $sp-4;
  border-top: $hairline solid var(--c-line);
}

@keyframes jy-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes jy-rise {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
