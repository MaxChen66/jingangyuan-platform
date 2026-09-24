<template>
  <view class="detail theme-paper">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!product"
      empty-title="作品不存在"
      empty-desc="该作品可能已下架或被收藏"
      @retry="retry"
    >
      <template v-if="product">
        <!-- 作品主视觉 -->
        <view class="hero">
          <JyStoneVisual
            :tone="product.coverTone"
            :seed="product.id"
            ratio="1.05"
            radius="0"
            :glyph="product.name"
          />
          <view class="hero-badges">
            <JyTag v-for="tag in product.tags" :key="tag" :text="tag" tone="gold" />
          </view>
        </view>

        <view class="jy-pad">
          <!-- 标题与价格 -->
          <view class="title-block">
            <text class="name">{{ product.name }}</text>
            <text class="subtitle">{{ product.subtitle }}</text>
            <view class="price-row">
              <JyPrice
                :value="product.price"
                :origin-value="product.originalPrice"
                size="large"
                emphasis
              />
              <text class="sales">已售 {{ product.sales }} 件 · 余 {{ product.stock }} 件</text>
            </view>
          </view>

          <JyDivider spaced />

          <!-- 原石档案 -->
          <JySectionTitle title="原石档案" subtitle="一物一档" />
          <JyCard cornered flat>
            <view class="spec-list">
              <view v-for="spec in specs" :key="spec.label" class="spec-row">
                <text class="spec-label">{{ spec.label }}</text>
                <text class="spec-value">{{ spec.value }}</text>
              </view>
            </view>
          </JyCard>

          <!-- 工艺 -->
          <JySectionTitle title="工艺" />
          <JyCard>
            <text class="para">{{ product.craft }}</text>
          </JyCard>

          <!-- 寓意 -->
          <JySectionTitle title="寓意" />
          <JyCard>
            <view class="meaning">
              <text class="para flex-1">{{ product.meaning }}</text>
              <JySeal text="吉" size="small" outline />
            </view>
          </JyCard>

          <!-- 包装与证书 -->
          <JySectionTitle title="包装与证书" />
          <JyCard>
            <view class="cert">
              <view class="cert-row">
                <text class="spec-label">包装</text>
                <text class="spec-value">{{ product.packaging }}</text>
              </view>
              <view class="cert-row">
                <text class="spec-label">证书编号</text>
                <text class="spec-value">{{ product.certificate }}</text>
              </view>
              <view class="cert-row">
                <text class="spec-label">溯源编号</text>
                <text class="spec-value mono">{{ product.traceCode }}</text>
              </view>
            </view>

            <view class="trace-entry" @tap="openTrace">
              <JySeal text="溯源" size="small" outline />
              <view class="trace-text">
                <text class="trace-title">一物一码 · 查看全链档案</text>
                <text class="trace-desc">原石来源 · 加工节点 · 质检结果 · 鉴定证书</text>
              </view>
              <text class="trace-arrow">›</text>
            </view>
          </JyCard>

          <!-- 购买须知 -->
          <JySectionTitle title="购买须知" />
          <view class="notes">
            <text v-for="note in purchaseNotes" :key="note" class="note">· {{ note }}</text>
          </view>

          <JyDivider spaced text="金刚之源 · 附证书发货" />
          <view class="bottom-hold" />
        </view>
      </template>
    </JyStateView>

    <!-- 底部操作栏 -->
    <view v-if="product" class="bar jy-safe-bottom">
      <view class="bar-icon" @tap="goCart">
        <text class="bar-icon-mark">车</text>
        <text class="bar-icon-text">购物车</text>
        <view v-if="cart.totalCount > 0" class="dot">
          <text class="dot-text">{{ cart.totalCount }}</text>
        </view>
      </view>
      <view class="bar-actions">
        <JyButton text="加入购物车" variant="ghost" block @tap="addToCart" />
        <view class="bar-gap" />
        <JyButton text="立即购买" variant="primary" block @tap="buyNow" />
      </view>
    </view>

    <!-- 溯源档案 -->
    <JyPopup :visible="traceVisible" title="溯源档案" tall @close="traceVisible = false">
      <view v-if="trace">
        <view class="trace-head">
          <text class="trace-code">{{ trace.traceCode }}</text>
          <text class="trace-cert">证书 {{ trace.certificate }}</text>
        </view>

        <view class="spec-list">
          <view class="spec-row">
            <text class="spec-label">材质</text>
            <text class="spec-value">{{ trace.material }}</text>
          </view>
          <view class="spec-row">
            <text class="spec-label">产地</text>
            <text class="spec-value">{{ trace.origin }}</text>
          </view>
          <view class="spec-row">
            <text class="spec-label">尺寸</text>
            <text class="spec-value">{{ trace.size }}</text>
          </view>
          <view class="spec-row">
            <text class="spec-label">重量</text>
            <text class="spec-value">{{ trace.weight }}</text>
          </view>
          <view class="spec-row">
            <text class="spec-label">工艺</text>
            <text class="spec-value">{{ trace.craft }}</text>
          </view>
        </view>

        <JySectionTitle title="流转记录" compact />
        <JySteps :steps="traceSteps" :active-index="trace.records.length - 1" finished />
      </view>
    </JyPopup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCard from '@/components/JyCard/JyCard.vue'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyPopup from '@/components/JyPopup/JyPopup.vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JySteps from '@/components/JySteps/JySteps.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import JyTag from '@/components/JyTag/JyTag.vue'
import { mallApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { useCartStore } from '@/store/cart'
import type { TraceInfo } from '@/types'

/**
 * 商品详情（UI-04）
 *
 * 实施文档 4.1 要求展示：图片/视频、原石档案、尺寸重量、工艺、寓意、
 * 包装、证书、溯源。一期无图片素材，主视觉由 JyStoneVisual 承担。
 */

const cart = useCartStore()
const productId = ref('')

const { loading, error, data, retry } = useAsyncPage(async () => {
  const detail = await mallApi.fetchProductDetail(productId.value)
  return detail
}, { immediate: false })

const product = computed(() => data.value)

const specs = computed(() => {
  const p = product.value
  if (!p) return []
  return [
    { label: '材质', value: p.material },
    { label: '产地', value: p.origin },
    { label: '尺寸', value: p.size },
    { label: '重量', value: p.weight },
  ]
})

const purchaseNotes = [
  '本品为天然石材手工雕刻，纹理与色泽各体相异，以实物为准。',
  '附鉴定证书与一物一码溯源编号，扫码可查看全链档案。',
  '支持 7 天无理由退换，定制类作品因已开工不适用。',
  '全场满 ¥99 免运费，默认顺丰发货。',
]

onLoad((query) => {
  productId.value = String(query?.id ?? '')
  void retry()
})

function addToCart(): void {
  if (!product.value) return
  cart.add(product.value, 1)
  uni.showToast({ title: '已放入购物车', icon: 'none' })
}

function buyNow(): void {
  if (!product.value) return
  uni.navigateTo({
    url: `/pagesMall/checkout/index?mode=direct&productId=${product.value.id}&quantity=1`,
  })
}

function goCart(): void {
  uni.navigateTo({ url: '/pagesMall/cart/index' })
}

// ---------------------------------------------------------------------------
// 溯源档案
// ---------------------------------------------------------------------------
const traceVisible = ref(false)
const trace = ref<TraceInfo | null>(null)

const traceSteps = computed(() =>
  (trace.value?.records ?? []).map((r) => ({
    key: r.time,
    title: `${r.title} · ${r.time}`,
    desc: r.desc,
  }))
)

async function openTrace(): Promise<void> {
  traceVisible.value = true
  if (trace.value || !productId.value) return
  try {
    trace.value = await mallApi.fetchProductTrace(productId.value)
  } catch (err) {
    traceVisible.value = false
    uni.showToast({
      title: err instanceof Error ? err.message : '溯源档案加载失败',
      icon: 'none',
    })
  }
}
</script>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 主视觉
// ---------------------------------------------------------------------------
.hero {
  position: relative;
}

.hero-badges {
  position: absolute;
  bottom: $sp-3;
  left: $sp-4;
  display: flex;
}

.hero-badges > * {
  margin-right: $sp-2;
}

// ---------------------------------------------------------------------------
// 标题
// ---------------------------------------------------------------------------
.title-block {
  padding-top: $sp-4;
}

.name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 4rpx;
  line-height: 1.4;
}

.subtitle {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

.price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: $sp-3;
}

.sales {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 档案
// ---------------------------------------------------------------------------
.spec-list {
  display: flex;
  flex-direction: column;
}

.spec-row {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
  border-bottom: $hairline solid var(--c-line);
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-label {
  flex-shrink: 0;
  width: 150rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.spec-value {
  flex: 1;
  font-size: $fs-sm;
  color: var(--c-ink);
  line-height: 1.6;
}

.mono {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-xs;
  letter-spacing: 1rpx;
}

.para {
  font-size: $fs-sm;
  color: var(--c-ink-2);
  line-height: 1.9;
}

.meaning {
  display: flex;
  align-items: center;
}

.flex-1 {
  flex: 1;
  margin-right: $sp-3;
}

.cert-row {
  display: flex;
  align-items: flex-start;
  padding: 10rpx 0;
}

.cert {
  padding-bottom: $sp-3;
  border-bottom: $hairline solid var(--c-line);
}

// ---------------------------------------------------------------------------
// 溯源入口
// ---------------------------------------------------------------------------
.trace-entry {
  display: flex;
  align-items: center;
  margin-top: $sp-4;
}

.trace-text {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.trace-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.trace-desc {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.trace-arrow {
  font-size: $fs-body;
  color: var(--c-ink-3);
}

.trace-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: $sp-3;
  border-bottom: $hairline solid var(--c-line);
}

.trace-code {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-xs;
  color: var(--c-accent);
}

.trace-cert {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 购买须知
// ---------------------------------------------------------------------------
.notes {
  padding: $sp-3 0;
}

.note {
  display: block;
  margin-bottom: 10rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 底部操作栏
// ---------------------------------------------------------------------------
.bottom-hold {
  height: 200rpx;
}

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
  border-top: $hairline solid var(--c-line);
}

.bar-icon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 96rpx;
}

.bar-icon-mark {
  font-family: $ff-serif;
  font-size: 32rpx;
  color: var(--c-ink-2);
  line-height: 1;
}

.bar-icon-text {
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.dot {
  position: absolute;
  top: -6rpx;
  right: 10rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 6rpx;
  border-radius: 15rpx;
  background: var(--c-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-text {
  font-size: 18rpx;
  color: var(--c-ink-inverse);
  line-height: 1;
}

.bar-actions {
  flex: 1;
  display: flex;
  min-width: 0;
}

.bar-actions > * {
  flex: 1;
}

.bar-gap {
  width: $sp-2;
  flex: 0 0 auto;
}
</style>
