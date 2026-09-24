<template>
  <view class="collection-detail theme-ink">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!collection"
      empty-title="藏品不存在"
      @retry="retry"
    >
      <template v-if="collection">
        <!-- 主视觉 -->
        <view class="hero">
          <JyStoneVisual
            :tone="collection.productCoverTone"
            :seed="collection.productId"
            ratio="1.15"
            radius="0"
            :glyph="collection.productName"
          />
          <view class="hero-seal">
            <JySeal :text="collection.grade" size="normal" />
          </view>
        </view>

        <view class="jy-pad body">
          <text class="name">{{ collection.productName }}</text>
          <view class="sub-row">
            <JyTag :text="collection.seriesName" tone="gold" />
            <text class="found">发现于 {{ formatDateTime(collection.foundAt) }}</text>
          </view>

          <!-- 实体编号 -->
          <view class="code-card">
            <view class="code-head">
              <text class="code-label">实体唯一编号</text>
              <text class="code-copy" @tap="copyCode">复制</text>
            </view>
            <text class="code-value">{{ collection.uniqueCode }}</text>
            <text class="code-note">
              该编号与实物一一对应，是「一物一码」的凭证，不可转让或更改
            </text>
          </view>

          <!-- 石性档案 -->
          <view class="block">
            <view class="block-head">
              <view class="mark" />
              <text class="block-title">石性档案</text>
            </view>
            <view class="row">
              <text class="row-label">材质</text>
              <text class="row-value">{{ collection.material }}</text>
            </view>
            <view class="row">
              <text class="row-label">纹理</text>
              <text class="row-value">{{ collection.texture }}</text>
            </view>
            <view class="row">
              <text class="row-label">尺寸</text>
              <text class="row-value">{{ collection.size }}</text>
            </view>
            <view class="row">
              <text class="row-label">重量</text>
              <text class="row-value">{{ collection.weight }}</text>
            </view>
          </view>

          <!-- 溯源 -->
          <view class="block">
            <view class="block-head">
              <view class="mark" />
              <text class="block-title">溯源信息</text>
            </view>
            <view class="row">
              <text class="row-label">溯源编号</text>
              <text class="row-value mono">{{ collection.traceCode }}</text>
            </view>
            <view class="trace-entry" @tap="loadTrace">
              <text class="trace-entry-text">
                {{ traceLoaded ? '查看流转记录' : '加载流转记录' }}
              </text>
              <text class="trace-arrow">›</text>
            </view>
          </view>

          <!-- 流转记录 -->
          <template v-if="trace">
            <view class="block">
              <view class="block-head">
                <view class="mark" />
                <text class="block-title">流转记录</text>
              </view>
              <JySteps :steps="traceSteps" :active-index="trace.records.length - 1" finished />
            </view>
          </template>

          <!-- 发货状态 -->
          <view class="block">
            <view class="block-head">
              <view class="mark" />
              <text class="block-title">发货状态</text>
            </view>
            <view class="status-row">
              <text class="status-text" :class="`tone-${COLLECTION_STATUS_TONE[collection.status]}`">
                {{ COLLECTION_STATUS_TEXT[collection.status] }}
              </text>
              <text class="status-note">{{ statusNote }}</text>
            </view>
          </view>

          <view class="jy-bottom-hold" />
        </view>

        <!-- 底部栏 -->
        <view class="bar jy-safe-bottom">
          <JyButton
            v-if="collection.status === 'stored'"
            text="申请实体发货"
            variant="gold"
            size="large"
            block
            @tap="applyShipping"
          />
          <JyButton
            v-else-if="collection.status === 'shipping'"
            text="发货处理中"
            variant="ghost"
            size="large"
            block
            disabled
          />
          <JyButton
            v-else
            text="已发货 · 查看物流"
            variant="ghost"
            size="large"
            block
            @tap="goOrders"
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
import JySeal from '@/components/JySeal/JySeal.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JySteps from '@/components/JySteps/JySteps.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import JyTag from '@/components/JyTag/JyTag.vue'
import { exploreApi, mallApi } from '@/api'
import { COLLECTION_STATUS_TONE } from '@/constants/enums'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { COLLECTION_STATUS_TEXT } from '@/types'
import type { TraceInfo } from '@/types'
import { formatDateTime } from '@/utils/format'

/**
 * 藏品详情（UI-23）
 *
 * 实施文档 4.2 验收要点：「与实体编号绑定」。
 * 因此实体唯一编号被置于首屏最显著位置，并附「不可转让或更改」的说明。
 *
 * 流转记录复用商品的溯源接口 —— 藏品与其商品本体共用同一条溯源链，
 * 这与文档 9.5「商城与开石藏品统一纳入溯源体系」的要求一致。
 */

const collectionId = ref('')
const trace = ref<TraceInfo | null>(null)

const { loading, error, data, retry } = useAsyncPage(
  () => exploreApi.fetchCollectionDetail(collectionId.value),
  { immediate: false }
)

const collection = computed(() => data.value)

const traceLoaded = computed(() => trace.value !== null)

const traceSteps = computed(() =>
  (trace.value?.records ?? []).map((r) => ({
    key: r.time,
    title: `${r.title} · ${r.time}`,
    desc: r.desc,
  }))
)

const statusNote = computed(() => {
  switch (collection.value?.status) {
    case 'stored':
      return '藏品在柜，可随时申请实体发货'
    case 'shipping':
      return '仓库正在备货，3 个工作日内寄出'
    case 'shipped':
      return '已寄出，签收后可在订单中确认收货'
    default:
      return ''
  }
})

onLoad((query) => {
  collectionId.value = String(query?.id ?? '')
  void retry()
})

async function loadTrace(): Promise<void> {
  if (!collection.value) return
  if (trace.value) {
    uni.showToast({ title: '流转记录已展开', icon: 'none' })
    return
  }
  try {
    trace.value = await mallApi.fetchProductTrace(collection.value.productId)
  } catch {
    // 请求层已提示
  }
}

function copyCode(): void {
  if (!collection.value) return
  uni.setClipboardData({
    data: collection.value.uniqueCode,
    success: () => uni.showToast({ title: '编号已复制', icon: 'none' }),
  })
}

function applyShipping(): void {
  if (!collection.value) return
  const target = collection.value
  uni.showModal({
    title: '申请发货',
    content: `将「${target.productName}」寄出，运费由平台承担。确认提交？`,
    confirmText: '提交申请',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await exploreApi.applyShipping({
          collectionIds: [target.id],
          addressId: 'addr_01',
        })
        uni.showToast({ title: result.message, icon: 'none' })
        await retry()
      } catch {
        // 请求层已提示
      }
    },
  })
}

function goOrders(): void {
  uni.navigateTo({ url: '/pagesMall/order/list' })
}
</script>

<style lang="scss" scoped>
.collection-detail {
  min-height: 100vh;
}

.hero {
  position: relative;
}

.hero-seal {
  position: absolute;
  right: $sp-4;
  bottom: -24rpx;
}

.body {
  padding-top: $sp-5;
}

.name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 6rpx;
}

.sub-row {
  display: flex;
  align-items: center;
  margin-top: $sp-3;
}

.found {
  margin-left: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 编号
// ---------------------------------------------------------------------------
.code-card {
  margin-top: $sp-4;
  padding: $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.34);
  border-radius: $r-md;
  background: rgba(200, 161, 90, 0.06);
}

.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-label {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.code-copy {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.code-value {
  display: block;
  margin-top: $sp-2;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-h3;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.code-note {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 区块
// ---------------------------------------------------------------------------
.block {
  margin-top: $sp-5;
}

.block-head {
  display: flex;
  align-items: center;
  margin-bottom: $sp-3;
}

.mark {
  width: 4rpx;
  height: 28rpx;
  margin-right: 14rpx;
  background: var(--c-accent);
  border-radius: 2rpx;
}

.block-title {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.row {
  display: flex;
  align-items: flex-start;
  padding: 14rpx 0;
  border-bottom: $hairline solid var(--c-line);
}

.row:last-child {
  border-bottom: none;
}

.row-label {
  flex-shrink: 0;
  width: 150rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.row-value {
  flex: 1;
  font-size: $fs-sm;
  color: var(--c-ink-2);
  line-height: 1.7;
}

.mono {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-xs;
}

// ---------------------------------------------------------------------------
// 溯源入口
// ---------------------------------------------------------------------------
.trace-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 0;
}

.trace-entry-text {
  font-size: $fs-sm;
  color: var(--c-accent);
}

.trace-arrow {
  font-size: $fs-h3;
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 状态
// ---------------------------------------------------------------------------
.status-row {
  display: flex;
  align-items: baseline;
}

.status-text {
  font-family: $ff-serif;
  font-size: $fs-body;
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

.status-note {
  margin-left: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
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

.bar > * {
  flex: 1;
}
</style>
