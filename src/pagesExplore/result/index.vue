<template>
  <view class="result theme-ink">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!record"
      empty-title="暂无开奖结果"
      empty-desc="该订单可能尚未完成开石"
      empty-glyph="石"
      @retry="retry"
    >
      <template v-if="record">
        <view class="stage">
          <view class="glow" />

          <!-- 揭晓语 -->
          <view class="head">
            <text class="head-title">石开见喜</text>
            <text class="head-sub">{{ record.seriesName }}</text>
          </view>

          <!-- 所得之石 -->
          <view class="stone-wrap">
            <JyStoneVisual
              :tone="record.productCoverTone"
              :seed="record.productId"
              ratio="1"
              radius="10rpx"
              :glyph="record.productName"
            />
            <view class="grade-seal">
              <JySeal :text="record.grade" size="normal" />
            </view>
          </view>

          <!-- 结果信息 -->
          <view class="info">
            <text class="product-name">{{ record.productName }}</text>

            <view class="meta">
              <view class="meta-row">
                <text class="meta-label">收藏等级</text>
                <text class="meta-value gold">{{ record.grade }}</text>
              </view>
              <view class="meta-row">
                <text class="meta-label">实体编号</text>
                <text class="meta-value mono">{{ record.uniqueCode }}</text>
              </view>
              <view class="meta-row">
                <text class="meta-label">本石种概率</text>
                <text class="meta-value">{{ formatProbability(record.probability) }}</text>
              </view>
              <view class="meta-row">
                <text class="meta-label">开奖时间</text>
                <text class="meta-value">{{ formatDateTime(record.drawTime) }}</text>
              </view>
            </view>

            <view class="audit">
              <text class="audit-text">
                本次结果由服务端随机产生并已留档，记录编号 {{ record.id }}，
                算法版本 {{ record.algorithmVersion }}。结果不可人工修改。
              </text>
            </view>
          </view>

          <!-- 操作 -->
          <view class="actions">
            <JyButton text="放入石头柜" variant="gold" size="large" block @tap="goCollection" />

            <view class="secondary">
              <view class="secondary-item" @tap="goDetail">
                <text class="secondary-glyph">鉴</text>
                <text class="secondary-name">藏品详情</text>
              </view>
              <view class="secondary-item" @tap="goAgain">
                <text class="secondary-glyph">再</text>
                <text class="secondary-name">再探一次</text>
              </view>
              <view class="secondary-item" @tap="goCustom">
                <text class="secondary-glyph">作</text>
                <text class="secondary-name">让它成为作品</text>
              </view>
            </view>

            <text class="foot-note">
              藏品已存入石头柜，可随时申请实体发货。
              平台不提供现金回购、提现或用户间交易。
            </text>
          </view>

          <view class="jy-safe-bottom" />
        </view>
      </template>
    </JyStateView>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import type { Collection } from '@/types'
import { formatDateTime, formatProbability } from '@/utils/format'

/**
 * 开奖结果（UI-21）
 *
 * 实施文档 4.2 验收要点：「结果可追溯且不可人工修改」。
 * 因此本页完整回显实体编号、本石种概率、开奖时间与算法版本，
 * 并把审计说明置于首屏可见位置 —— 用户有据可查，是概率争议风险的主要对策（文档 17 节）。
 *
 * 「让它成为作品」是文档 3.3 的核心商业联动入口：
 * 开石获客 → 定制高客单变现。
 */

const orderId = ref('')
/** 该结果对应的藏品，用于跳转到藏品详情 */
const collection = ref<Collection | null>(null)

const { loading, error, data, retry } = useAsyncPage(
  async () => {
    const record = await exploreApi.fetchDrawResult(orderId.value)
    // 同时取回对应藏品，供「藏品详情」直达。
    // 失败不影响结果展示，因此单独捕获。
    try {
      const list = await exploreApi.fetchCollections()
      collection.value = list.find((c) => c.physicalItemId === record.physicalItemId) ?? null
    } catch {
      collection.value = null
    }
    return record
  },
  { immediate: false }
)

const record = data

onLoad((query) => {
  orderId.value = String(query?.orderId ?? '')
  void retry()
})

function goCollection(): void {
  uni.redirectTo({ url: '/pagesExplore/collection/index' })
}

function goDetail(): void {
  if (!collection.value) {
    uni.showToast({ title: '藏品已存入石头柜', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pagesExplore/collection/detail?id=${collection.value.id}` })
}

function goAgain(): void {
  const seriesId = record.value?.seriesId
  if (!seriesId) {
    uni.switchTab({ url: '/pagesExplore/home/index' })
    return
  }
  uni.redirectTo({ url: `/pagesExplore/purchase/index?seriesId=${seriesId}` })
}

function goCustom(): void {
  uni.navigateTo({ url: '/pagesCustom/index/index' })
}
</script>

<style lang="scss" scoped>
.result {
  min-height: 100vh;
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 $sp-5;
  overflow: hidden;
}

.glow {
  position: absolute;
  top: 6%;
  left: 50%;
  width: 640rpx;
  height: 640rpx;
  border-radius: 50%;
  transform: translate(-50%, 0);
  background: radial-gradient(circle, rgba(200, 161, 90, 0.26) 0%, rgba(200, 161, 90, 0) 70%);
  animation: jy-rise-glow 1.2s $ease-cn;
}

@keyframes jy-rise-glow {
  from {
    opacity: 0;
    transform: translate(-50%, 20rpx) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

// ---------------------------------------------------------------------------
// 揭晓语
// ---------------------------------------------------------------------------
.head {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-6 0 $sp-5;
}

.head-title {
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 12rpx;
}

.head-sub {
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 4rpx;
}

// ---------------------------------------------------------------------------
// 石
// ---------------------------------------------------------------------------
.stone-wrap {
  position: relative;
  width: 440rpx;
  animation: jy-reveal 0.9s $ease-cn;
}

@keyframes jy-reveal {
  from {
    opacity: 0;
    transform: scale(0.88) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.grade-seal {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
}

// ---------------------------------------------------------------------------
// 信息
// ---------------------------------------------------------------------------
.info {
  width: 100%;
  margin-top: $sp-6;
}

.product-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 6rpx;
  text-align: center;
}

.meta {
  margin-top: $sp-4;
  padding: $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.3);
  border-radius: $r-md;
  background: var(--c-surface);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
}

.meta-label {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.meta-value {
  font-size: $fs-sm;
  color: var(--c-ink);
}

.meta-value.gold {
  font-family: $ff-serif;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.mono {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-xs;
}

.audit {
  margin-top: $sp-3;
  padding: $sp-3;
  border: $hairline dashed var(--c-line);
  border-radius: $r-sm;
}

.audit-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}

// ---------------------------------------------------------------------------
// 操作
// ---------------------------------------------------------------------------
.actions {
  width: 100%;
  margin-top: $sp-6;
}

.secondary {
  display: flex;
  margin-top: $sp-4;
}

.secondary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-3 $sp-1;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.secondary-item + .secondary-item {
  margin-left: $sp-2;
}

.secondary-glyph {
  font-family: $ff-serif;
  font-size: 36rpx;
  color: var(--c-accent);
  line-height: 1;
}

.secondary-name {
  margin-top: 8rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-2);
  text-align: center;
}

.foot-note {
  display: block;
  margin-top: $sp-4;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
  text-align: center;
}
</style>
