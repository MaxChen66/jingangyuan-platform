<template>
  <view class="records theme-ink">
    <view class="head">
      <text class="head-title">探索记录</text>
      <text class="head-sub">共 {{ total }} 次开石</text>
    </view>

    <view class="jy-pad body">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="list.length === 0"
        empty-title="还没有开石记录"
        empty-desc="去矿区开一次石，记录会保留在这里"
        empty-glyph="录"
        @retry="retry"
      >
        <view class="timeline">
          <view v-for="(item, index) in list" :key="item.id" class="row">
            <view class="rail">
              <view class="dot" />
              <view v-if="index < list.length - 1" class="line" />
            </view>

            <view class="row-body" @tap="goDetail(item)">
              <view class="row-head">
                <text class="row-series">{{ item.seriesName }}</text>
                <text class="row-time">{{ formatShortDateTime(item.foundAt) }}</text>
              </view>

              <view class="row-main">
                <view class="row-visual">
                  <JyStoneVisual
                    :tone="item.productCoverTone"
                    :seed="item.productId"
                    ratio="1"
                    radius="6rpx"
                  />
                </view>
                <view class="row-info">
                  <text class="row-name">{{ item.productName }}</text>
                  <view class="row-tags">
                    <JyTag :text="item.grade" tone="gold" />
                  </view>
                  <text class="row-code">编号 {{ item.uniqueCode }}</text>
                </view>
                <view class="row-right">
                  <text class="row-status" :class="`tone-${COLLECTION_STATUS_TONE[item.status]}`">
                    {{ COLLECTION_STATUS_TEXT[item.status] }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="foot-note">
          <text class="foot-text">
            每条记录均对应唯一实体编号，可在石头柜中查看完整藏品信息。
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
import JyTag from '@/components/JyTag/JyTag.vue'
import { exploreApi } from '@/api'
import { COLLECTION_STATUS_TONE } from '@/constants/enums'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { COLLECTION_STATUS_TEXT } from '@/types'
import type { ExploreRecordItem } from '@/types'
import { formatShortDateTime } from '@/utils/format'

/**
 * 探索记录（UI-25）
 *
 * 实施文档 4.2 验收要点：「支持查询历史记录」。
 * 以时间轴呈现每一次开石，使「每次支付 → 唯一结果」的链路对用户可见，
 * 是概率争议风险（文档 17 节）的应对手段之一。
 */

const { loading, error, data, retry } = useAsyncPage(() => exploreApi.fetchExploreRecords())

const list = computed<ExploreRecordItem[]>(() => data.value?.list ?? [])
const total = computed(() => data.value?.total ?? 0)

function goDetail(item: ExploreRecordItem): void {
  uni.navigateTo({ url: `/pagesExplore/collection/detail?id=${item.collectionId}` })
}
</script>

<style lang="scss" scoped>
.records {
  min-height: 100vh;
}

.head {
  padding: $sp-6 $sp-4 $sp-4;
  background: radial-gradient(ellipse at 20% 0%, rgba(107, 78, 122, 0.2) 0%, rgba(107, 78, 122, 0) 70%);
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

.body {
  padding-top: $sp-2;
}

// ---------------------------------------------------------------------------
// 时间轴
// ---------------------------------------------------------------------------
.row {
  display: flex;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32rpx;
  flex-shrink: 0;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  margin-top: 14rpx;
  border-radius: 50%;
  background: var(--c-accent);
}

.line {
  flex: 1;
  width: $hairline;
  background: var(--c-line);
}

.row-body {
  flex: 1;
  min-width: 0;
  padding: 0 0 $sp-4 $sp-2;
}

.row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.row-series {
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.row-time {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.row-main {
  display: flex;
  align-items: center;
  margin-top: $sp-3;
  padding: $sp-3;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.row-visual {
  flex-shrink: 0;
  width: 130rpx;
}

.row-info {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.row-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.row-tags {
  display: flex;
  margin-top: 8rpx;
}

.row-code {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.row-right {
  flex-shrink: 0;
}

.row-status {
  font-family: $ff-serif;
  font-size: $fs-xs;
  letter-spacing: 2rpx;
}

.tone-gold {
  color: var(--c-accent);
}

.tone-accent {
  color: var(--c-glow-jade);
}

.tone-muted {
  color: var(--c-ink-3);
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
