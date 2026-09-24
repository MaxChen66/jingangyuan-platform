<template>
  <view class="explore-home theme-ink">
    <!-- 沉浸式头部 -->
    <view class="hero" :style="{ paddingTop: `${statusBarHeight + 24}px` }">
      <view class="hero-glow" />
      <view class="hero-content">
        <view class="hero-titles">
          <text class="hero-title">开石探索馆</text>
          <text class="hero-sub">听一次石开之声</text>
        </view>
        <JySeal text="开石" size="large" />
      </view>

      <!-- 探索进度 -->
      <view class="progress-card" @tap="goBestiary">
        <view class="progress-left">
          <text class="progress-label">矿石图鉴</text>
          <view class="progress-count">
            <text class="progress-num">{{ bestiary?.collectedCount ?? 0 }}</text>
            <text class="progress-total">/ {{ bestiary?.totalCount ?? 0 }}</text>
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: collectedPercent }" />
        </view>
        <text class="progress-arrow">›</text>
      </view>
    </view>

    <view class="jy-pad body">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="seriesList.length === 0"
        empty-title="暂无开售矿区"
        empty-desc="新的矿脉正在筹备，敬请期待"
        empty-glyph="矿"
        @retry="retry"
      >
        <!-- 今日矿区 -->
        <template v-if="featured">
          <view class="section-head">
            <view class="bar" />
            <text class="section-title">今日矿区</text>
            <text class="section-sub">{{ featured.batchNo }}</text>
          </view>

          <view class="featured" @tap="goSeries(featured.id)">
            <view class="featured-visual">
              <JyStoneVisual
                :tone="featured.coverTone"
                :seed="featured.id"
                ratio="1.5"
                radius="0"
                :glyph="featured.name"
              />
              <view class="featured-stock">
                <text class="stock-text">余 {{ featured.remainingStock }} / {{ featured.totalStock }}</text>
              </view>
            </view>

            <view class="featured-body">
              <text class="featured-name">{{ featured.name }}</text>
              <text class="featured-sub">{{ featured.subtitle }}</text>

              <view class="featured-meta">
                <view class="meta-item">
                  <text class="meta-label">价值区间</text>
                  <text class="meta-value">{{ featured.valueRange }}</text>
                </view>
                <view class="meta-item">
                  <text class="meta-label">石种</text>
                  <text class="meta-value">{{ featured.itemCount }} 类</text>
                </view>
              </view>

              <view class="featured-foot">
                <view class="price-wrap">
                  <text class="price-symbol">¥</text>
                  <text class="price-num">{{ featured.price / 100 }}</text>
                  <text class="price-unit">/ 次</text>
                </view>
                <view class="enter-btn">
                  <text class="enter-text">进入矿区</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 全部矿区 -->
        <view class="section-head">
          <view class="bar" />
          <text class="section-title">全部矿脉</text>
        </view>

        <view v-for="series in seriesList" :key="series.id" class="series" @tap="goSeries(series.id)">
          <view class="series-visual">
            <JyStoneVisual :tone="series.coverTone" :seed="series.id" ratio="1" radius="6rpx" />
          </view>
          <view class="series-info">
            <text class="series-name">{{ series.name }}</text>
            <text class="series-sub">{{ series.subtitle }}</text>
            <view class="series-meta">
              <text class="series-value">{{ series.valueRange }}</text>
              <text class="series-stock">余 {{ series.remainingStock }} 份</text>
            </view>
          </view>
          <view class="series-price">
            <text class="series-price-num">¥{{ series.price / 100 }}</text>
            <text class="series-price-unit">每次</text>
          </view>
        </view>

        <!-- 功能入口 -->
        <view class="entries">
          <view class="entry" @tap="goCollection">
            <text class="entry-glyph">柜</text>
            <text class="entry-name">我的石头柜</text>
            <text class="entry-desc">查看藏品与发货</text>
          </view>
          <view class="entry" @tap="goBestiary">
            <text class="entry-glyph">鉴</text>
            <text class="entry-name">矿物图鉴</text>
            <text class="entry-desc">收集进度</text>
          </view>
          <view class="entry" @tap="goRecords">
            <text class="entry-glyph">录</text>
            <text class="entry-name">探索记录</text>
            <text class="entry-desc">历史开石</text>
          </view>
        </view>

        <view class="compliance">
          <text class="compliance-text">
            本馆所有矿区均为矿石实物盲盒，购买前完整公示商品范围、数量与概率。
            抽取结果由服务端随机产生，与用户等级及充值金额无关。
            平台不提供现金回购、提现或用户间交易。
          </text>
        </view>

        <view class="jy-bottom-hold" />
      </JyStateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JySeal from '@/components/JySeal/JySeal.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'

/**
 * 开石馆首页（UI-18）
 *
 * 实施文档 4.2 验收要点：「用户 3 步内进入系列详情」。
 * 因此把「今日矿区」置于首屏最上方且整块可点，一次点击即可进入矿区详情。
 *
 * 全页使用幽玄矿物深色体系，与商城的宋式雅致明确区分，
 * 对应文档 17 节「开石独立视觉、独立专区，避免品牌稀释」。
 */

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight ?? 0

const { loading, error, data, run, retry } = useAsyncPage(async () => {
  const [series, bestiary] = await Promise.all([
    exploreApi.fetchSeriesList(),
    exploreApi.fetchBestiary(),
  ])
  return { series, bestiary }
})

const seriesList = computed(() => data.value?.series ?? [])
const bestiary = computed(() => data.value?.bestiary ?? null)

/** 首个在售矿区作为今日推荐 */
const featured = computed(() => seriesList.value.find((s) => s.status === 'on') ?? null)

const collectedPercent = computed(() => {
  const b = bestiary.value
  if (!b || b.totalCount === 0) return '0%'
  return `${((b.collectedCount / b.totalCount) * 100).toFixed(1)}%`
})

let entered = false
onShow(() => {
  if (!entered) {
    entered = true
    return
  }
  void run()
})

function goSeries(id: string): void {
  uni.navigateTo({ url: `/pagesExplore/series/index?id=${id}` })
}

function goCollection(): void {
  uni.navigateTo({ url: '/pagesExplore/collection/index' })
}

function goBestiary(): void {
  uni.navigateTo({ url: '/pagesExplore/bestiary/index' })
}

function goRecords(): void {
  uni.navigateTo({ url: '/pagesExplore/records/index' })
}
</script>

<style lang="scss" scoped>
.explore-home {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.hero {
  position: relative;
  padding-bottom: $sp-5;
  overflow: hidden;
}

// 矿脉辉光：头部的一层幽微底色
.hero-glow {
  position: absolute;
  top: -120rpx;
  right: -80rpx;
  width: 520rpx;
  height: 520rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(62, 107, 99, 0.28) 0%, rgba(62, 107, 99, 0) 68%);
}

.hero-content {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 $sp-4;
}

.hero-titles {
  flex: 1;
}

.hero-title {
  display: block;
  font-family: $ff-serif;
  font-size: 64rpx;
  color: var(--c-ink);
  letter-spacing: 10rpx;
}

.hero-sub {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 4rpx;
}

// ---------------------------------------------------------------------------
// 进度
// ---------------------------------------------------------------------------
.progress-card {
  position: relative;
  display: flex;
  align-items: center;
  margin: $sp-5 $sp-4 0;
  padding: $sp-3 $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.3);
  border-radius: $r-sm;
  background: rgba(200, 161, 90, 0.05);
}

.progress-left {
  flex-shrink: 0;
  margin-right: $sp-3;
}

.progress-label {
  display: block;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.progress-count {
  display: flex;
  align-items: baseline;
  margin-top: 4rpx;
}

.progress-num {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-accent);
}

.progress-total {
  margin-left: 6rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.progress-bar {
  flex: 1;
  height: 6rpx;
  border-radius: 3rpx;
  background: rgba(200, 161, 90, 0.15);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3rpx;
  background: linear-gradient(90deg, var(--c-glow-jade), var(--c-accent));
}

.progress-arrow {
  margin-left: $sp-3;
  font-size: $fs-h3;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 区块标题
// ---------------------------------------------------------------------------
.body {
  padding-top: $sp-2;
}

.section-head {
  display: flex;
  align-items: center;
  padding: $sp-5 0 $sp-3;
}

.bar {
  width: 4rpx;
  height: 28rpx;
  margin-right: 14rpx;
  background: var(--c-accent);
  border-radius: 2rpx;
}

.section-title {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.section-sub {
  margin-left: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 今日矿区
// ---------------------------------------------------------------------------
.featured {
  border: $hairline solid rgba(200, 161, 90, 0.32);
  border-radius: $r-md;
  overflow: hidden;
  background: var(--c-surface);
}

.featured-visual {
  position: relative;
}

.featured-stock {
  position: absolute;
  top: $sp-3;
  right: $sp-3;
  padding: 4rpx 12rpx;
  border-radius: $r-xs;
  background: rgba(12, 10, 8, 0.72);
}

.stock-text {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.featured-body {
  padding: $sp-4;
}

.featured-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 6rpx;
}

.featured-sub {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.featured-meta {
  display: flex;
  margin-top: $sp-4;
}

.meta-item {
  flex: 1;
}

.meta-label {
  display: block;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.meta-value {
  display: block;
  margin-top: 4rpx;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.featured-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $sp-4;
  padding-top: $sp-4;
  border-top: $hairline solid var(--c-line);
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
  margin-left: 6rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.enter-btn {
  padding: 14rpx 36rpx;
  border: $hairline solid var(--c-accent);
  border-radius: $r-xs;
}

.enter-text {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
  letter-spacing: 4rpx;
}

// ---------------------------------------------------------------------------
// 矿脉列表
// ---------------------------------------------------------------------------
.series {
  display: flex;
  align-items: center;
  padding: $sp-3;
  margin-bottom: $sp-3;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.series-visual {
  flex-shrink: 0;
  width: 150rpx;
}

.series-info {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.series-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink);
  letter-spacing: 3rpx;
}

.series-sub {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

.series-meta {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.series-value {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.series-stock {
  margin-left: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.series-price {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.series-price-num {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
}

.series-price-unit {
  margin-top: 2rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 功能入口
// ---------------------------------------------------------------------------
.entries {
  display: flex;
  margin-top: $sp-5;
}

.entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-4 $sp-2;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.entry + .entry {
  margin-left: $sp-2;
}

.entry-glyph {
  font-family: $ff-serif;
  font-size: 40rpx;
  color: var(--c-accent);
  line-height: 1;
}

.entry-name {
  margin-top: $sp-2;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.entry-desc {
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  text-align: center;
}

// ---------------------------------------------------------------------------
// 合规提示
// ---------------------------------------------------------------------------
.compliance {
  margin-top: $sp-5;
  padding: $sp-3;
  border: $hairline dashed rgba(200, 161, 90, 0.28);
  border-radius: $r-sm;
}

.compliance-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}
</style>
