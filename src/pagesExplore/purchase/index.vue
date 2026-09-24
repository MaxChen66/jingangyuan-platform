<template>
  <view class="purchase theme-ink">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!series"
      empty-title="矿区不存在"
      @retry="retry"
    >
      <template v-if="series">
        <view class="jy-pad body">
          <!-- 矿区摘要 -->
          <view class="summary">
            <view class="summary-visual">
              <JyStoneVisual :tone="series.coverTone" :seed="series.id" ratio="1" radius="6rpx" />
            </view>
            <view class="summary-info">
              <text class="summary-name">{{ series.name }}</text>
              <text class="summary-batch">批次 {{ series.batchNo }}</text>
              <text class="summary-value">价值区间 {{ series.valueRange }}</text>
            </view>
          </view>

          <!-- 数量 -->
          <view class="qty-block">
            <view class="qty-row">
              <view class="qty-text">
                <text class="qty-label">开石次数</text>
                <text class="qty-hint">
                  每人限购 {{ series.limitPerUser }} 次 · 本批剩余 {{ series.remainingStock }} 份
                </text>
              </view>
              <JyStepper v-model="quantity" :min="1" :max="maxQuantity" />
            </view>
          </view>

          <!-- 商品范围与概率，可随时回看 -->
          <view class="recap" @tap="probVisible = true">
            <view class="recap-left">
              <text class="recap-title">商品范围与抽取概率</text>
              <text class="recap-desc">
                共 {{ series.items.length }} 类石种 · 概率合计
                {{ formatProbability(probabilitySum) }}
              </text>
            </view>
            <view class="recap-action">
              <text class="recap-action-text">回看</text>
              <text class="recap-arrow">›</text>
            </view>
          </view>

          <!-- 发货说明 -->
          <view class="rule">
            <text class="rule-label">发货说明</text>
            <text class="rule-value">{{ series.shippingRule }}</text>
          </view>

          <!-- 用户主动确认 -->
          <view class="agree" @tap="agreed = !agreed">
            <!--
              隔离复选框自身的 tap：小程序的 tap 会冒泡，
              若不加 .stop，点子上的方框会先被组件翻转一次，
              再冒泡到本行被翻回，净效果是不变。
            -->
            <view class="agree-check" @tap.stop>
              <JyCheck v-model="agreed" />
            </view>
            <view class="agree-text">
              <text class="agree-main">
                我已完整阅读并同意《开石购买规则》，理解抽取结果随机产生
              </text>
              <text class="agree-sub">
                结果与用户等级、充值金额无关；平台不提供现金回购、提现或用户间交易
              </text>
            </view>
          </view>

          <view class="agree-link" @tap="probVisible = true">
            <text class="agree-link-text">再次查看完整规则与概率</text>
          </view>

          <!-- 金额 -->
          <view class="amount">
            <view class="amount-row">
              <text class="amount-label">单次价格</text>
              <text class="amount-value">¥{{ series.price / 100 }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">开石次数</text>
              <text class="amount-value">×{{ quantity }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">运费</text>
              <text class="amount-value">开石阶段免运费</text>
            </view>
            <view class="amount-row total">
              <text class="amount-label">应付</text>
              <view class="total-price">
                <text class="price-symbol">¥</text>
                <text class="price-num">{{ fen2yuan(payAmount) }}</text>
              </view>
            </view>
          </view>

          <view class="jy-bottom-hold" />
        </view>

        <!-- 底部栏 -->
        <view class="bar jy-safe-bottom">
          <view class="bar-left">
            <text class="bar-label">应付</text>
            <text class="bar-price">¥{{ fen2yuan(payAmount) }}</text>
          </view>
          <JyButton
            text="支付并开石"
            variant="gold"
            size="large"
            :disabled="!agreed"
            :loading="submitting"
            @tap="submit"
          />
        </view>
      </template>
    </JyStateView>

    <!-- 概率回看 -->
    <JyPopup :visible="probVisible" title="商品范围与抽取概率" tall @close="probVisible = false">
      <text v-if="series" class="popup-note">
        本批共投放 {{ series.totalStock }} 份，当前剩余 {{ series.remainingStock }} 份。
        概率由各石种投放数量推导，批次创建时固化并留档。
      </text>
      <JyProbBar v-if="series" :items="series.items" />
    </JyPopup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCheck from '@/components/JyCheck/JyCheck.vue'
import JyPopup from '@/components/JyPopup/JyPopup.vue'
import JyProbBar from '@/components/JyProbBar/JyProbBar.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStepper from '@/components/JyStepper/JyStepper.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi, orderApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { fen2yuan, formatProbability } from '@/utils/format'

/**
 * 购买确认（EXP-03）
 *
 * 合规上最关键的一步。实施文档 4.2 明确要求
 * 「用户主动确认，不使用默认勾选替代」，
 * 因此 agreed 初始为 false，且服务端会再次校验该字段 —— 前端即使被绕过，
 * Mock 服务端仍会以 INVALID_PARAM 拒绝。
 *
 * 同时提供「回看」入口，满足合规验收清单中「关键规则可回看」的要求。
 */

const seriesId = ref('')
const quantity = ref(1)
const agreed = ref(false)
const submitting = ref(false)
const probVisible = ref(false)

const { loading, error, data, retry } = useAsyncPage(
  () => exploreApi.fetchSeriesDetail(seriesId.value),
  { immediate: false }
)

const series = computed(() => data.value)

/** 受剩余库存与限购规则双重约束 */
const maxQuantity = computed(() => {
  const s = series.value
  if (!s) return 1
  const byLimit = s.limitPerUser > 0 ? s.limitPerUser : s.remainingStock
  return Math.max(1, Math.min(byLimit, s.remainingStock))
})

const payAmount = computed(() => (series.value?.price ?? 0) * quantity.value)

const probabilitySum = computed(() =>
  (series.value?.items ?? []).reduce((acc, item) => acc + item.probability, 0)
)

onLoad((query) => {
  seriesId.value = String(query?.seriesId ?? '')
  void retry()
})

async function submit(): Promise<void> {
  const s = series.value
  if (!s || submitting.value) return

  // 双保险：前端禁用按钮，服务端再校验一次
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意购买规则', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const order = await exploreApi.createExploreOrder({
      seriesId: s.id,
      quantity: quantity.value,
      agreedRule: true,
    })

    // 一期为模拟支付。第 3 期替换为真实微信支付，此处调用顺序不变
    await orderApi.payOrder(order.id)

    uni.redirectTo({ url: `/pagesExplore/draw/index?orderId=${order.id}` })
  } catch {
    // 请求层已 toast。失败时留在本页，用户可减少数量后重试
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.purchase {
  min-height: 100vh;
}

.body {
  padding-top: $sp-4;
}

// ---------------------------------------------------------------------------
// 摘要
// ---------------------------------------------------------------------------
.summary {
  display: flex;
  align-items: center;
  padding: $sp-3;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.summary-visual {
  flex-shrink: 0;
  width: 150rpx;
}

.summary-info {
  flex: 1;
  min-width: 0;
  padding-left: $sp-3;
}

.summary-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.summary-batch {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.summary-value {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 数量
// ---------------------------------------------------------------------------
.qty-block {
  margin-top: $sp-3;
  padding: $sp-4;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty-text {
  flex: 1;
  min-width: 0;
  padding-right: $sp-3;
}

.qty-label {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.qty-hint {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 概率回看入口
// ---------------------------------------------------------------------------
.recap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $sp-3;
  padding: $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.32);
  border-radius: $r-md;
  background: rgba(200, 161, 90, 0.05);
}

.recap-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.recap-desc {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.recap-action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.recap-action-text {
  font-size: $fs-xs;
  color: var(--c-accent);
}

.recap-arrow {
  margin-left: 4rpx;
  font-size: $fs-sm;
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 规则
// ---------------------------------------------------------------------------
.rule {
  display: flex;
  align-items: flex-start;
  margin-top: $sp-3;
  padding: $sp-3 $sp-4;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.rule-label {
  flex-shrink: 0;
  width: 130rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.rule-value {
  flex: 1;
  font-size: $fs-xs;
  color: var(--c-ink-2);
  line-height: 1.75;
}

// ---------------------------------------------------------------------------
// 主动确认
// ---------------------------------------------------------------------------
.agree {
  display: flex;
  align-items: flex-start;
  margin-top: $sp-4;
  padding: $sp-3 $sp-4;
  border: $hairline solid rgba(200, 161, 90, 0.32);
  border-radius: $r-md;
}

.agree-check {
  flex-shrink: 0;
  padding-top: 2rpx;
}

.agree-text {
  flex: 1;
  min-width: 0;
  padding-left: $sp-3;
}

.agree-main {
  display: block;
  font-size: $fs-xs;
  color: var(--c-ink);
  line-height: 1.7;
}

.agree-sub {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

.agree-link {
  align-self: flex-end;
  margin-top: $sp-2;
  padding: 8rpx 0;
}

.agree-link-text {
  font-size: $fs-xxs;
  color: var(--c-accent);
  text-decoration: underline;
}

// ---------------------------------------------------------------------------
// 金额
// ---------------------------------------------------------------------------
.amount {
  margin-top: $sp-4;
  padding: $sp-4;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
}

.amount-label {
  font-size: $fs-sm;
  color: var(--c-ink-2);
}

.amount-value {
  font-size: $fs-sm;
  color: var(--c-ink);
}

.amount-row.total {
  margin-top: $sp-2;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line);
}

.total-price {
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

.bar-left {
  flex: 1;
}

.bar-label {
  display: block;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.bar-price {
  display: block;
  margin-top: 2rpx;
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 弹层
// ---------------------------------------------------------------------------
.popup-note {
  display: block;
  margin-bottom: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}
</style>
