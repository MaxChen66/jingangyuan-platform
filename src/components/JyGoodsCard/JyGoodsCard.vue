<template>
  <view class="goods" :class="[`variant-${variant}`]" @tap="emit('tap', product)">
    <view class="visual" :class="{ gold }">
      <JyStoneVisual
        :tone="product.coverTone"
        :seed="product.id"
        :ratio="variant === 'grid' ? '0.92' : '1'"
        :radius="variant === 'grid' ? '8rpx' : '6rpx'"
        :glyph="product.name"
      />
      <view v-if="discountLabel" class="badge">
        <text class="badge-text">{{ discountLabel }}</text>
      </view>
    </view>

    <view class="info">
      <text class="name">{{ product.name }}</text>
      <text v-if="variant === 'row'" class="subtitle">{{ product.subtitle }}</text>

      <view class="tags">
        <JyTag v-for="tag in visibleTags" :key="tag" :text="tag" />
      </view>

      <view class="bottom">
        <JyPrice
          :value="product.price"
          :origin-value="product.originalPrice"
          :size="variant === 'grid' ? 'normal' : 'small'"
        />
        <text v-if="product.sales > 0" class="sales">已售 {{ product.sales }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import JyTag from '@/components/JyTag/JyTag.vue'
import type { Product } from '@/types'

/**
 * 商品卡
 *
 * grid —— 双列瀑布流用，竖版
 * row  —— 单列列表用，横版
 *
 * 图片位统一交给 JyStoneVisual 处理，因此本组件在有真实图片后
 * 只需替换 visual 内部实现，卡片布局不受影响。
 */
const props = withDefaults(
  defineProps<{
    product: Product
    variant?: 'grid' | 'row'
    /** 鎏金描边，用于开石体系的卡片 */
    gold?: boolean
    /** 最多显示几个标签 */
    maxTags?: number
  }>(),
  {
    variant: 'grid',
    gold: false,
    maxTags: 2,
  }
)

const emit = defineEmits<{ tap: [product: Product] }>()

const visibleTags = computed(() => props.product.tags.slice(0, props.maxTags))

/** 有划线价时算出折扣，作为角标 */
const discountLabel = computed(() => {
  const { price, originalPrice } = props.product
  if (originalPrice <= price) return ''
  const rate = price / originalPrice
  return `${(rate * 10).toFixed(1)} 折`
})
</script>

<style lang="scss" scoped>
.goods {
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  overflow: hidden;
}

.visual {
  position: relative;
}

.visual.gold {
  @include jy-gold-edge;
}

.badge {
  position: absolute;
  top: $sp-2;
  left: $sp-2;
  padding: 2rpx 8rpx;
  border-radius: $r-xs;
  background: var(--c-accent);
}

.badge-text {
  font-size: $fs-xxs;
  color: var(--c-ink-inverse);
  line-height: 1.4;
}

.info {
  padding: $sp-3;
}

.name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  line-height: 1.45;
  @include jy-ellipsis(1);
}

.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.tags > * {
  margin-right: 8rpx;
  margin-bottom: 6rpx;
}

.bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 10rpx;
}

.sales {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---- 横版 ----
.variant-row {
  display: flex;
  padding: $sp-3;
}

.variant-row .visual {
  flex-shrink: 0;
  width: 200rpx;
}

.variant-row .info {
  flex: 1;
  min-width: 0;
  padding: 0 0 0 $sp-3;
}
</style>
