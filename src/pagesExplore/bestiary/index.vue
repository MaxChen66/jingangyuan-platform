<template>
  <view class="bestiary theme-ink">
    <!-- 收集进度 -->
    <view class="head">
      <view class="head-left">
        <text class="head-title">矿物图鉴</text>
        <text class="head-sub">集齐一套，方见矿脉全貌</text>
      </view>
      <view class="head-progress">
        <text class="progress-num">{{ collectedCount }}</text>
        <text class="progress-total">/ {{ totalCount }}</text>
      </view>
    </view>

    <view class="progress-track">
      <view class="progress-fill" :style="{ width: percent }" />
    </view>

    <view class="jy-pad body">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="totalCount === 0"
        empty-title="图鉴暂无内容"
        empty-desc="矿区上架后此处会显示可收集的石种"
        empty-glyph="鉴"
        @retry="retry"
      >
        <view class="grid">
          <view
            v-for="entry in entries"
            :key="entry.productId"
            class="cell"
            :class="{ locked: !entry.collected }"
            @tap="onTap(entry)"
          >
            <view class="cell-visual" :class="{ locked: !entry.collected }">
              <JyStoneVisual
                :tone="entry.productCoverTone"
                :seed="entry.productId"
                ratio="1"
                radius="6rpx"
              />
              <view v-if="!entry.collected" class="lock">
                <text class="lock-mark">未</text>
              </view>
              <view v-else-if="entry.count > 1" class="count-badge">
                <text class="count-text">×{{ entry.count }}</text>
              </view>
            </view>

            <text class="cell-name">{{ entry.collected ? entry.productName : '尚未发现' }}</text>
            <text class="cell-grade">{{ entry.collected ? entry.grade : entry.seriesName }}</text>
          </view>
        </view>

        <view class="foot-note">
          <text class="foot-text">
            图鉴按矿区石种汇总。未发现的石种仅显示归属矿区与等级，
            集齐后可查看完整矿脉档案。
          </text>
        </view>

        <view class="jy-bottom-hold" />
      </JyStateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import type { BestiaryEntry } from '@/types'

/**
 * 矿物图鉴（UI-24）
 *
 * 实施文档 4.2 验收要点：「数据实时同步」。
 * 图鉴的已收集状态由用户藏品实时推导（Mock 服务端每次按当前藏品重算），
 * 而非维护一份可能失真的计数，因此开石后回到本页立即反映。
 *
 * 未发现的石种刻意保留占位并显示其归属矿区与等级，
 * 让用户知道还有哪些可追求，而不是完全隐藏。
 */

const { loading, error, data, retry } = useAsyncPage(() => exploreApi.fetchBestiary())

const entries = computed<BestiaryEntry[]>(() => data.value?.entries ?? [])
const collectedCount = computed(() => data.value?.collectedCount ?? 0)
const totalCount = computed(() => data.value?.totalCount ?? 0)

const percent = computed(() => {
  if (totalCount.value === 0) return '0%'
  return `${((collectedCount.value / totalCount.value) * 100).toFixed(1)}%`
})

function onTap(entry: BestiaryEntry): void {
  if (!entry.collected) {
    uni.showToast({
      title: `去「${entry.seriesName}」碰碰运气`,
      icon: 'none',
    })
    return
  }
  uni.showModal({
    title: entry.productName,
    content: `${entry.grade} · ${entry.material}\n已收集 ${entry.count} 件。完整藏品可在石头柜查看。`,
    showCancel: false,
    confirmText: '知道了',
  })
}
</script>

<style lang="scss" scoped>
.bestiary {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: $sp-6 $sp-4 $sp-4;
  background: radial-gradient(ellipse at 20% 0%, rgba(62, 107, 99, 0.24) 0%, rgba(62, 107, 99, 0) 70%);
}

.head-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 8rpx;
}

.head-sub {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

.head-progress {
  display: flex;
  align-items: baseline;
}

.progress-num {
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-accent);
}

.progress-total {
  margin-left: 6rpx;
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

.progress-track {
  height: 6rpx;
  margin: 0 $sp-4;
  border-radius: 3rpx;
  background: rgba(200, 161, 90, 0.15);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3rpx;
  background: linear-gradient(90deg, var(--c-glow-jade), var(--c-accent));
  transition: width $dur-slow $ease-cn;
}

.body {
  padding-top: $sp-5;
}

// ---------------------------------------------------------------------------
// 宫格
// ---------------------------------------------------------------------------
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.cell {
  width: 31.5%;
  margin-bottom: $sp-4;
}

.cell-visual {
  position: relative;
}

// 未发现：降饱和并压暗，做出「图鉴空位」的观感
.cell-visual.locked {
  opacity: 0.32;
  filter: grayscale(1);
}

.lock {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: $hairline dashed var(--c-line-strong);
  border-radius: 6rpx;
  background: rgba(12, 10, 8, 0.5);
}

.lock-mark {
  font-family: $ff-serif;
  font-size: 36rpx;
  color: var(--c-ink-3);
}

.count-badge {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  padding: 0 8rpx;
  border-radius: $r-xs;
  background: rgba(12, 10, 8, 0.8);
}

.count-text {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.cell-name {
  display: block;
  margin-top: 10rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.cell.locked .cell-name {
  color: var(--c-ink-3);
}

.cell-grade {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

// ---------------------------------------------------------------------------
// 说明
// ---------------------------------------------------------------------------
.foot-note {
  margin-top: $sp-4;
  padding: $sp-3;
  border: $hairline dashed var(--c-line);
  border-radius: $r-sm;
}

.foot-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}
</style>
