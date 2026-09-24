<template>
  <view class="prob">
    <view v-for="item in rows" :key="item.productId" class="row">
      <view class="head">
        <text class="name">{{ item.productName }}</text>
        <JyTag :text="item.grade" :tone="item.grade === '典藏' || item.grade === '孤品' ? 'gold' : 'default'" />
      </view>

      <view class="meta">
        <text class="value">参考价值 {{ formatPriceCompact(item.value) }}</text>
        <text class="qty">余 {{ item.remainingQty }} / 共 {{ item.initialQty }} 件</text>
      </view>

      <view class="bar-row">
        <view class="bar-track">
          <view
            class="bar-fill"
            :class="{ rare: item.probability <= 1 }"
            :style="{ width: barWidth(item) }"
          />
        </view>
        <text class="prob-text">{{ formatProbability(item.probability) }}</text>
      </view>
    </view>

    <view class="summary">
      <text class="summary-text">概率合计 {{ formatProbability(probabilitySum) }}</text>
      <text class="summary-note">剩余可开石 {{ remainingSum }} 件</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyTag from '@/components/JyTag/JyTag.vue'
import type { ExploreBatchItem } from '@/types'
import { formatPriceCompact, formatProbability } from '@/utils/format'

/**
 * 概率与商品分布公示
 *
 * 这是本项目的合规核心组件。实施文档 9.1 要求购买前显著展示
 * 「商品范围、样式、抽取规则、商品分布、限量数量、抽取概率、商品价值范围」，
 * 因此本组件刻意不做任何信息折叠：
 *   - 每个商品的名称、等级、参考价值、剩余量、初始量、概率全部平铺
 *   - 概率数字始终以文本形式给出，条形图仅作辅助，不替代数字
 *   - 底部回显概率合计，便于用户核对配置完整性
 *
 * 条形宽度按「相对最高概率」缩放，使 0.5% 这类极低概率也可见；
 * 权威数值始终是右侧的百分比文本，而非条形长度。
 */

const props = defineProps<{
  items: ExploreBatchItem[]
}>()

/** 按概率降序，便于用户先看到最可能的结果 */
const rows = computed(() => [...props.items].sort((a, b) => b.probability - a.probability))

const maxProbability = computed(() => Math.max(...rows.value.map((r) => r.probability), 1))

const probabilitySum = computed(() =>
  props.items.reduce((acc, item) => acc + item.probability, 0)
)

const remainingSum = computed(() =>
  props.items.reduce((acc, item) => acc + item.remainingQty, 0)
)

/** 最短也留出可见宽度，避免极低概率被渲染成一条看不见的线 */
function barWidth(item: ExploreBatchItem): string {
  const ratio = (item.probability / maxProbability.value) * 100
  return `${Math.max(2, ratio).toFixed(1)}%`
}
</script>

<style lang="scss" scoped>
.prob {
  display: flex;
  flex-direction: column;
}

.row {
  padding: $sp-3 0;
  border-bottom: $hairline solid var(--c-line);
}

.row:last-of-type {
  border-bottom: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  flex: 1;
  margin-right: $sp-2;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6rpx;
}

.value,
.qty {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.bar-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.bar-track {
  flex: 1;
  height: 8rpx;
  margin-right: $sp-3;
  border-radius: 4rpx;
  background: var(--c-surface-2);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4rpx;
  background: var(--c-accent);
  opacity: 0.55;
}

// 极低概率用鎏金标出，提示其稀有属性
.bar-fill.rare {
  background: var(--c-gold);
  opacity: 1;
}

.prob-text {
  flex-shrink: 0;
  min-width: 92rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink);
  text-align: right;
}

.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $sp-3;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line-strong);
}

.summary-text {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.summary-note {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}
</style>
