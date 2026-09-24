<template>
  <view class="series-detail theme-ink">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!series"
      empty-title="矿区不存在"
      empty-desc="该矿区可能已下线"
      @retry="retry"
    >
      <template v-if="series">
        <!-- 主视觉 -->
        <view class="hero">
          <JyStoneVisual
            :tone="series.coverTone"
            :seed="series.id"
            ratio="1.35"
            radius="0"
            :glyph="series.name"
          />
          <view class="hero-info">
            <text class="hero-name">{{ series.name }}</text>
            <text class="hero-batch">批次 {{ series.batchNo }}</text>
          </view>
        </view>

        <view class="jy-pad body">
          <!-- 矿区故事 -->
          <view class="story">
            <view class="story-head">
              <view class="mark" />
              <text class="story-title">矿区故事</text>
            </view>
            <text class="story-text">{{ series.story }}</text>
          </view>

          <!-- 关键信息 -->
          <view class="facts">
            <view class="fact">
              <text class="fact-label">单次价格</text>
              <text class="fact-value accent">¥{{ series.price / 100 }}</text>
            </view>
            <view class="fact">
              <text class="fact-label">价值区间</text>
              <text class="fact-value">{{ series.valueRange }}</text>
            </view>
            <view class="fact">
              <text class="fact-label">批次总量</text>
              <text class="fact-value">{{ series.totalStock }} 份</text>
            </view>
            <view class="fact">
              <text class="fact-label">剩余数量</text>
              <text class="fact-value accent">{{ series.remainingStock }} 份</text>
            </view>
            <view class="fact">
              <text class="fact-label">已开石</text>
              <text class="fact-value">{{ series.soldCount }} 份</text>
            </view>
            <view class="fact">
              <text class="fact-label">每人限购</text>
              <text class="fact-value">{{ series.limitPerUser }} 份</text>
            </view>
          </view>

          <!-- 概率公示 -->
          <view class="prob-block">
            <view class="prob-head">
              <view class="mark" />
              <text class="prob-title">商品范围与抽取概率</text>
            </view>
            <text class="prob-note">
              以下概率为批次创建时固化并留档，售出期间不做调整。
              概率由各石种的批次投放数量推导，可自行核对。
            </text>
            <JyProbBar :items="series.items" />
          </view>

          <!-- 购买规则 -->
          <view class="rules">
            <view class="rules-head">
              <view class="mark" />
              <text class="rules-title">购买与发货规则</text>
            </view>
            <view class="rule">
              <text class="rule-label">开售时间</text>
              <text class="rule-value">{{ formatDateTime(series.saleStart) }}</text>
            </view>
            <view class="rule">
              <text class="rule-label">停售时间</text>
              <text class="rule-value">{{ formatDateTime(series.saleEnd) }}</text>
            </view>
            <view class="rule">
              <text class="rule-label">发货说明</text>
              <text class="rule-value">{{ series.shippingRule }}</text>
            </view>
          </view>

          <!-- 合规提示 -->
          <view class="compliance">
            <text class="compliance-title">购买前请阅读</text>
            <text class="compliance-text">{{ series.complianceNotice }}</text>
          </view>

          <view class="jy-bottom-hold" />
        </view>

        <!-- 底部栏 -->
        <view class="bar jy-safe-bottom">
          <view class="bar-price">
            <view class="price-wrap">
              <text class="price-symbol">¥</text>
              <text class="price-num">{{ series.price / 100 }}</text>
            </view>
            <text class="price-unit">每次开石</text>
          </view>
          <JyButton
            :text="series.status === 'on' ? '立即开石' : '已停售'"
            variant="gold"
            size="large"
            :disabled="series.status !== 'on'"
            @tap="goPurchase"
          />
        </view>
      </template>
    </JyStateView>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyProbBar from '@/components/JyProbBar/JyProbBar.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { formatDateTime } from '@/utils/format'

/**
 * 矿区详情 / 系列详情（UI-19）
 *
 * 这是本项目的合规核心页面。实施文档 4.2 的验收要点是
 * 「支付前可完整查看关键信息」，9.1 进一步要求购买前显著展示
 * 商品范围、样式、抽取规则、商品分布、限量数量、抽取概率、商品价值范围。
 *
 * 因此概率区块刻意不做折叠、不做分页、不做「展开查看」，
 * 全部石种一次性平铺，且概率数字始终以文本给出。
 */

const seriesId = ref('')

const { loading, error, data, retry } = useAsyncPage(
  () => exploreApi.fetchSeriesDetail(seriesId.value),
  { immediate: false }
)

const series = computed(() => data.value)


onLoad((query) => {
  seriesId.value = String(query?.id ?? '')
  void retry()
})

function goPurchase(): void {
  if (!series.value) return
  uni.navigateTo({ url: `/pagesExplore/purchase/index?seriesId=${series.value.id}` })
}
</script>

<style lang="scss" scoped>
.series-detail {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 主视觉
// ---------------------------------------------------------------------------
.hero {
  position: relative;
}

.hero-info {
  position: absolute;
  right: $sp-4;
  bottom: $sp-4;
  left: $sp-4;
}

.hero-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-display;
  color: #ede6d8;
  letter-spacing: 10rpx;
  text-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.6);
}

.hero-batch {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: rgba(237, 230, 216, 0.7);
  letter-spacing: 2rpx;
}

.body {
  padding-top: $sp-5;
}

// ---------------------------------------------------------------------------
// 区块通用
// ---------------------------------------------------------------------------
.mark {
  width: 4rpx;
  height: 28rpx;
  margin-right: 14rpx;
  background: var(--c-accent);
  border-radius: 2rpx;
}

.story-head,
.prob-head,
.rules-head {
  display: flex;
  align-items: center;
}

.story-title,
.prob-title,
.rules-title {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

// ---------------------------------------------------------------------------
// 矿区故事
// ---------------------------------------------------------------------------
.story-text {
  display: block;
  margin-top: $sp-3;
  font-size: $fs-sm;
  color: var(--c-ink-2);
  line-height: 2;
  text-align: justify;
}

// ---------------------------------------------------------------------------
// 关键信息
// ---------------------------------------------------------------------------
.facts {
  display: flex;
  flex-wrap: wrap;
  margin-top: $sp-5;
  padding: $sp-3 $sp-4;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.fact {
  width: 50%;
  padding: 10rpx 0;
}

.fact-label {
  display: block;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.fact-value {
  display: block;
  margin-top: 4rpx;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.fact-value.accent {
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 概率公示
// ---------------------------------------------------------------------------
.prob-block {
  margin-top: $sp-5;
  padding: $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.3);
  border-radius: $r-md;
  background: var(--c-surface);
}

.prob-note {
  display: block;
  margin: $sp-3 0;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}

// ---------------------------------------------------------------------------
// 规则
// ---------------------------------------------------------------------------
.rule {
  display: flex;
  align-items: flex-start;
  padding: 14rpx 0;
  border-bottom: $hairline solid var(--c-line);
}

.rule:last-child {
  border-bottom: none;
}

.rule-label {
  flex-shrink: 0;
  width: 150rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.rule-value {
  flex: 1;
  font-size: $fs-sm;
  color: var(--c-ink-2);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 合规
// ---------------------------------------------------------------------------
.compliance {
  margin-top: $sp-5;
  padding: $sp-3;
  border: $hairline dashed rgba(200, 161, 90, 0.28);
  border-radius: $r-sm;
}

.compliance-title {
  display: block;
  margin-bottom: 8rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.compliance-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}

// ---------------------------------------------------------------------------
// 底部栏
// ---------------------------------------------------------------------------
.bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  padding: $sp-3 $sp-4;
  background: var(--c-surface);
  border-top: $hairline solid rgba(200, 161, 90, 0.28);
}

.bar-price {
  flex: 1;
}

.price-wrap {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  margin-right: 2rpx;
  font-size: $fs-sm;
  color: var(--c-accent);
}

.price-num {
  font-family: $ff-serif;
  font-size: $fs-h2;
  color: var(--c-accent);
}

.price-unit {
  display: block;
  margin-top: 2rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}
</style>
