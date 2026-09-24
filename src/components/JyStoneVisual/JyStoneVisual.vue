<template>
  <view class="stone" :style="style">
    <!-- 天然纹理：由 seed 派生的多层径向渐变，使每件商品各不相同 -->
    <view class="grain" />
    <!-- 细线与高光，模拟打磨后的石面反光 -->
    <view class="sheen" />
    <text v-if="glyphChar" class="glyph">{{ glyphChar }}</text>
    <view class="overlay">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoneTone } from '@/types'

/**
 * 矿石视觉占位
 *
 * 一期没有真实图片素材，且微信小程序对外链图片有域名白名单限制，
 * 因此以「矿物色调 + 种子派生的渐变石纹」承担全部商品与藏品的视觉表达。
 *
 * 这不是缺图占位，而是刻意的设计语言：每件石头由 seed（商品 ID）派生
 * 唯一纹理，同一商品每次渲染结果稳定，不同商品彼此可辨。
 *
 * 第 2 期接入 OSS 后，在调用处判断 cover 是否为空即可切换为 <image>，
 * 本组件无需改动。
 */

const props = withDefaults(
  defineProps<{
    tone?: StoneTone
    /** 纹理种子，通常传商品 ID，保证同一商品纹理稳定 */
    seed?: string
    /** 高宽比，例如 '1' 正方形、'0.75' 略扁 */
    ratio?: string
    /** 圆角 */
    radius?: string
    /** 是否显示篆意单字 */
    glyph?: string
  }>(),
  {
    tone: 'jade',
    seed: '',
    ratio: '1',
    radius: '8rpx',
    glyph: '',
  }
)

interface ToneSpec {
  base: string
  glowA: string
  glowB: string
  text: string
}

/** 六种矿物基调。深色基调配浅字，浅色基调配深字 */
const TONES: Record<StoneTone, ToneSpec> = {
  jade: { base: '#2E4A45', glowA: '78,131,120', glowB: '120,168,150', text: '#D8E8E2' },
  amethyst: { base: '#3A3050', glowA: '107,78,122', glowB: '150,120,175', text: '#E2D9EC' },
  amber: { base: '#4A3620', glowA: '168,112,58', glowB: '205,155,92', text: '#F0E2CB' },
  ink: { base: '#1A1815', glowA: '58,54,48', glowB: '92,86,76', text: '#D6CFC2' },
  crimson: { base: '#4A1E1B', glowA: '158,43,37', glowB: '192,88,80', text: '#F0DAD6' },
  paper: { base: '#D5CDBB', glowA: '239,233,220', glowB: '255,253,248', text: '#3A352C' },
}

/** 由字符串派生稳定散列，用于生成独一无二的纹理布局 */
function hashCode(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

const style = computed(() => {
  const spec = TONES[props.tone]
  const hash = hashCode(props.seed || props.tone)

  // 四层渐变的位置与强度均由散列派生，因此同一 seed 结果稳定
  const pos = (shift: number, min: number, span: number) => min + ((hash >> shift) % span)
  const alpha = (shift: number) => 0.28 + ((hash >> shift) % 30) / 100

  const layers = [
    `radial-gradient(circle at ${pos(0, 14, 40)}% ${pos(3, 12, 36)}%, rgba(${spec.glowA}, ${alpha(
      6
    ).toFixed(2)}) 0%, rgba(${spec.glowA}, 0) 46%)`,
    `radial-gradient(circle at ${pos(9, 55, 35)}% ${pos(12, 10, 32)}%, rgba(${spec.glowB}, ${alpha(
      15
    ).toFixed(2)}) 0%, rgba(${spec.glowB}, 0) 40%)`,
    `radial-gradient(circle at ${pos(17, 30, 45)}% ${pos(20, 58, 32)}%, rgba(${spec.glowA}, ${alpha(
      23
    ).toFixed(2)}) 0%, rgba(${spec.glowA}, 0) 44%)`,
    `radial-gradient(circle at ${pos(25, 60, 32)}% ${pos(27, 62, 30)}%, rgba(${spec.glowB}, ${alpha(
      29
    ).toFixed(2)}) 0%, rgba(${spec.glowB}, 0) 38%)`,
  ]

  return {
    backgroundColor: spec.base,
    backgroundImage: layers.join(','),
    paddingBottom: `${Number(props.ratio) * 100}%`,
    borderRadius: props.radius,
    color: spec.text,
  }
})

/** 取商品名首字作为篆意标记，增强每件石头的辨识度 */
const glyphChar = computed(() => {
  if (props.glyph) return props.glyph.slice(0, 1)
  return ''
})
</script>

<style lang="scss" scoped>
.stone {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
}

// 细密的颗粒感，避免大色块显得扁平
.grain {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 60%),
    repeating-linear-gradient(
      38deg,
      rgba(255, 255, 255, 0.022) 0rpx,
      rgba(255, 255, 255, 0.022) 2rpx,
      transparent 2rpx,
      transparent 7rpx
    );
}

// 斜向高光，模拟抛光石面
.sheen {
  position: absolute;
  top: -40%;
  left: -20%;
  width: 70%;
  height: 180%;
  background: linear-gradient(
    104deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.07) 48%,
    rgba(255, 255, 255, 0) 62%
  );
  transform: rotate(6deg);
}

.glyph {
  position: absolute;
  right: 12rpx;
  bottom: 8rpx;
  font-family: $ff-serif;
  font-size: 40rpx;
  line-height: 1;
  opacity: 0.32;
}

.overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
