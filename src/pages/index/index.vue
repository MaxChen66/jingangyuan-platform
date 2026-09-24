<template>
  <view class="home theme-paper">
    <!-- 沉浸式品牌区：自定义头部，故自行留出状态栏高度 -->
    <view class="hero" :style="{ paddingTop: `${statusBarHeight + 20}px` }">
      <view class="hero-line">
        <view class="hero-rule" />
        <text class="hero-eyebrow">金伯利岩雕刻工艺品</text>
        <view class="hero-rule" />
      </view>

      <text class="hero-title">金刚之源</text>

      <view class="hero-seal">
        <JySeal text="金石" size="small" outline />
      </view>

      <text class="hero-slogan">{{ BRAND.slogan }}</text>
      <text class="hero-sub">{{ BRAND.subSlogan }}</text>
    </view>

    <view class="jy-pad">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="!homeData"
        empty-title="首页内容准备中"
        @retry="retry"
      >
        <template v-if="homeData">
          <!-- 开石探索馆入口：全页唯一的深色区块，用于把注意力引向新业务 -->
          <view class="explore-entry theme-ink" @tap="goExplore">
            <view class="explore-head">
              <view class="explore-titles">
                <text class="explore-name">开石探索馆</text>
                <text class="explore-slogan">听一次石开之声</text>
              </view>
              <JySeal text="开石" size="small" />
            </view>

            <view class="explore-series">
              <view v-for="series in seriesList" :key="series.id" class="series-mini">
                <view class="series-mini-visual">
                  <JyStoneVisual :tone="series.coverTone" :seed="series.id" ratio="1" radius="6rpx" />
                </view>
                <text class="series-mini-name">{{ series.name }}</text>
                <text class="series-mini-price">{{ formatPriceCompact(series.price) }} / 次</text>
                <text class="series-mini-stock">余 {{ series.remainingStock }} 份</text>
              </view>
            </view>

            <view class="explore-foot">
              <text class="explore-link">进入探索馆</text>
              <text class="explore-arrow">›</text>
            </view>
          </view>

          <!-- 私人定制 -->
          <JySectionTitle
            title="私人定制"
            subtitle="以石为媒，为你而作"
            more
            @more="goCustom"
          />
          <view class="custom-grid">
            <view
              v-for="entry in customEntries"
              :key="entry.key"
              class="custom-item"
              @tap="goCustom"
            >
              <text class="custom-glyph">{{ entry.glyph }}</text>
              <text class="custom-name">{{ entry.name }}</text>
              <text class="custom-desc">{{ entry.desc }}</text>
            </view>
          </view>

          <!-- 精品推荐 -->
          <JySectionTitle title="精品推荐" subtitle="老坑料 · 附证书" more @more="goMall" />
          <view class="goods-grid">
            <JyGoodsCard
              v-for="product in homeData.recommend"
              :key="product.id"
              :product="product"
              variant="grid"
              @tap="goDetail"
            />
          </view>

          <!-- 雕刻工坊 -->
          <JySectionTitle title="雕刻工坊" subtitle="开料 → 抛光，七道工序" more @more="goWorkshop" />
          <view class="workshop" @tap="goWorkshop">
            <view v-for="(stage, index) in workshopStages" :key="stage.name" class="stage">
              <view class="stage-node">
                <text class="stage-index">{{ index + 1 }}</text>
              </view>
              <text class="stage-name">{{ stage.name }}</text>
              <text class="stage-desc">{{ stage.desc }}</text>
            </view>
          </view>

          <!-- 矿石知识 -->
          <JySectionTitle title="矿石知识" subtitle="知其石，方识其价" />
          <view class="knowledge">
            <view
              v-for="item in knowledge"
              :key="item.title"
              class="knowledge-item"
              @tap="showKnowledge(item)"
            >
              <text class="knowledge-title">{{ item.title }}</text>
              <text class="knowledge-desc">{{ item.desc }}</text>
            </view>
          </view>

          <!-- 晒单 -->
          <JySectionTitle title="石友晒单" subtitle="来自藏家的真实记录" />
          <view class="showcase">
            <view v-for="item in showcase" :key="item.id" class="showcase-item">
              <view class="showcase-visual">
                <JyStoneVisual :tone="item.tone" :seed="item.id" ratio="1" radius="6rpx" />
              </view>
              <text class="showcase-text">{{ item.text }}</text>
              <text class="showcase-user">{{ item.user }}</text>
            </view>
          </view>

          <JyDivider spaced text="金刚之源 · 一物一码" />
          <view class="jy-bottom-hold" />
        </template>
      </JyStateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyGoodsCard from '@/components/JyGoodsCard/JyGoodsCard.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { BRAND } from '@/constants/config'
import { mallApi, exploreApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import type { ExploreSummary, MallHomeData, Product, StoneTone } from '@/types'
import { formatPriceCompact } from '@/utils/format'

/**
 * 首页（UI-01）
 *
 * 品牌总入口。实施文档 4.1 要求包含：
 * 品牌Banner、精品推荐、私人定制、开石入口、工坊、矿石知识、晒单。
 *
 * 版面策略：整页为宋式雅致体系，唯独「开石探索馆」入口使用幽玄矿物深色体系，
 * 使新业务在不破坏主品牌调性的前提下获得视觉优先级。
 */

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight ?? 0

const { loading, error, data, run, retry } = useAsyncPage(async () => {
  // 首页同时需要商城内容与开石系列，两个请求并发以减少首屏等待
  const [home, series] = await Promise.all([
    mallApi.fetchMallHome(),
    exploreApi.fetchSeriesList(),
  ])
  return { home, series }
})

const homeData = computed<MallHomeData | null>(() => data.value?.home ?? null)
const seriesList = computed<ExploreSummary[]>(() => data.value?.series ?? [])

// 从后台切回前台时刷新，使开石库存等数据保持新鲜。
// 首次 onShow 紧跟 useAsyncPage 的即时加载，故跳过以免重复请求。
let entered = false
onShow(() => {
  if (!entered) {
    entered = true
    return
  }
  void run()
})

const customEntries = [
  { key: 'wedding', glyph: '囍', name: '新婚定制', desc: '姓名 · 婚期 · 寄语' },
  { key: 'business', glyph: '商', name: '企业商务', desc: 'LOGO · 批量 · 报价' },
  { key: 'private', glyph: '私', name: '私人主题', desc: '题材 · 风格 · 预算' },
]

const workshopStages = [
  { name: '开料', desc: '依石形定题' },
  { name: '粗雕', desc: '定势取形' },
  { name: '精修', desc: '走刀见神' },
  { name: '抛光', desc: '七道成器' },
]

const knowledge = [
  {
    title: '什么是金伯利岩',
    desc: '金伯利岩是原生金刚石的母岩，质地致密、色沉而润，是国内雕刻用石中的稀见之材。',
  },
  {
    title: '为什么产地影响价值',
    desc: '辽宁瓦房店、山东蒙阴、湖南沅江为国内三大产区，石色与巾纹各有性格，老坑料尤受追捧。',
  },
  {
    title: '一物一码如何溯源',
    desc: '每件作品拥有唯一编号，扫码可查看原石来源、加工节点、质检结果与鉴定证书。',
  },
]

const showcase = [
  { id: 'sc_01', tone: 'jade' as StoneTone, text: '开料那道水线留在竹节处，反而成了点睛之笔。', user: '石友 · 溪山' },
  { id: 'sc_02', tone: 'amber' as StoneTone, text: '貔貅盘了两个月，颜色明显沉下去了，越看越顺。', user: '石友 · 长夜' },
  { id: 'sc_03', tone: 'crimson' as StoneTone, text: '印章刻了名字，落款的时候很有仪式感。', user: '石友 · 砚秋' },
]

function goExplore(): void {
  uni.switchTab({ url: '/pagesExplore/home/index' })
}

function goMall(): void {
  uni.switchTab({ url: '/pagesMall/home/index' })
}

function goWorkshop(): void {
  uni.switchTab({ url: '/pagesWorkshop/index/index' })
}

function goCustom(): void {
  uni.navigateTo({ url: '/pagesCustom/index/index' })
}

function goDetail(product: Product): void {
  uni.navigateTo({ url: `/pagesMall/detail/index?id=${product.id}` })
}

function showKnowledge(item: { title: string; desc: string }): void {
  uni.showModal({ title: item.title, content: item.desc, showCancel: false, confirmText: '知道了' })
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: var(--c-bg);
}

// ---------------------------------------------------------------------------
// 品牌区
// ---------------------------------------------------------------------------
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: $sp-7;
  // 极淡的墨晕，模拟宣纸上的落墨
  background: radial-gradient(ellipse at 50% 0%, rgba(28, 27, 25, 0.05) 0%, rgba(28, 27, 25, 0) 62%);
}

.hero-line {
  display: flex;
  align-items: center;
}

.hero-rule {
  width: 48rpx;
  height: $hairline;
  background: var(--c-line-strong);
}

.hero-eyebrow {
  margin: 0 $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  letter-spacing: 6rpx;
}

.hero-title {
  margin-top: $sp-4;
  font-family: $ff-serif;
  font-size: 84rpx;
  font-weight: 500;
  color: var(--c-ink);
  letter-spacing: 16rpx;
  // letter-spacing 会在末字后留白，左移半格使视觉居中
  margin-left: 16rpx;
}

.hero-seal {
  margin-top: $sp-3;
}

.hero-slogan {
  margin-top: $sp-4;
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink-2);
  letter-spacing: 8rpx;
  margin-left: 8rpx;
}

.hero-sub {
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

// ---------------------------------------------------------------------------
// 开石入口
// ---------------------------------------------------------------------------
.explore-entry {
  padding: $sp-4;
  border-radius: $r-md;
  @include jy-gold-edge;
}

.explore-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.explore-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h2;
  color: var(--c-ink);
  letter-spacing: 6rpx;
}

.explore-slogan {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

.explore-series {
  display: flex;
  margin-top: $sp-4;
}

.series-mini {
  flex: 1;
  min-width: 0;
}

.series-mini + .series-mini {
  margin-left: $sp-3;
}

.series-mini-visual {
  width: 100%;
}

.series-mini-name {
  display: block;
  margin-top: 10rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.series-mini-price {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-gold);
}

.series-mini-stock {
  display: block;
  margin-top: 2rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.explore-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: $sp-4;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line);
}

.explore-link {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-gold);
  letter-spacing: 2rpx;
}

.explore-arrow {
  margin-left: 6rpx;
  font-size: $fs-sm;
  color: var(--c-gold);
}

// ---------------------------------------------------------------------------
// 定制入口
// ---------------------------------------------------------------------------
.custom-grid {
  display: flex;
}

.custom-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-4 $sp-2;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.custom-item + .custom-item {
  margin-left: $sp-2;
}

.custom-glyph {
  font-family: $ff-serif;
  font-size: 44rpx;
  color: var(--c-accent);
  line-height: 1;
}

.custom-name {
  margin-top: $sp-2;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.custom-desc {
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  text-align: center;
}

// ---------------------------------------------------------------------------
// 商品宫格
// ---------------------------------------------------------------------------
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-grid > * {
  width: 48.5%;
  margin-bottom: $sp-3;
}

// ---------------------------------------------------------------------------
// 工坊工序
// ---------------------------------------------------------------------------
.workshop {
  display: flex;
  padding: $sp-4 $sp-2;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.stage-node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: 50%;
}

.stage-index {
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.stage-name {
  margin-top: 10rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.stage-desc {
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  text-align: center;
}

// ---------------------------------------------------------------------------
// 矿石知识
// ---------------------------------------------------------------------------
.knowledge-item {
  padding: $sp-3 0;
  border-bottom: $hairline solid var(--c-line);
}

.knowledge-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.knowledge-desc {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 晒单
// ---------------------------------------------------------------------------
.showcase {
  display: flex;
}

.showcase-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $sp-3;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.showcase-item + .showcase-item {
  margin-left: $sp-2;
}

.showcase-visual {
  width: 100%;
}

.showcase-text {
  margin-top: $sp-3;
  font-size: $fs-xs;
  color: var(--c-ink-2);
  line-height: 1.6;
}

.showcase-user {
  margin-top: $sp-2;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}
</style>
