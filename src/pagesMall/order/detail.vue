<template>
  <view class="order-detail theme-paper">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!order"
      empty-title="订单不存在"
      empty-desc="该订单可能已被删除"
      @retry="reload"
    >
      <template v-if="order">
        <!-- 状态区 -->
        <view class="status">
          <view class="status-main">
            <text class="status-text">{{ statusText }}</text>
            <text class="status-hint">{{ statusHint }}</text>
          </view>
          <JySeal :text="sealText" size="normal" outline />
        </view>

        <view class="jy-pad body">
          <!-- 进度 -->
          <view class="progress">
            <JySteps :steps="steps" :active-index="activeStep" :finished="order.status === 'done'" />
          </view>

          <!-- 商品 -->
          <JySectionTitle title="作品清单" :subtitle="`${order.type === 'explore' ? '开石' : '商城'} · ${ORDER_TYPE_TEXT[order.type]}`" />
          <JyCard flat>
            <view v-for="item in order.items" :key="item.productId" class="row">
              <view class="row-visual">
                <JyStoneVisual :tone="item.coverTone" :seed="item.productId" ratio="1" radius="6rpx" />
              </view>
              <view class="row-info">
                <text class="row-name">{{ item.name }}</text>
                <text class="row-spec">{{ item.spec }}</text>
                <text v-if="item.uniqueCode" class="row-code">实体编号 {{ item.uniqueCode }}</text>
                <view class="row-foot">
                  <JyPrice :value="item.price" size="small" />
                  <text class="row-qty">×{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </JyCard>

          <!-- 物流 -->
          <template v-if="order.shipping">
            <JySectionTitle title="物流信息" :subtitle="`${order.shipping.company} ${order.shipping.trackingNo}`" />
            <JyCard>
              <view v-for="(trace, index) in order.shipping.traces" :key="trace.time" class="trace">
                <view class="trace-rail">
                  <view class="trace-dot" :class="{ latest: index === 0 }" />
                  <view v-if="index < order.shipping.traces.length - 1" class="trace-line" />
                </view>
                <view class="trace-body">
                  <text class="trace-text" :class="{ latest: index === 0 }">{{ trace.text }}</text>
                  <text class="trace-time">{{ formatDateTime(trace.time) }}</text>
                </view>
              </view>
            </JyCard>
          </template>

          <!-- 收货地址 -->
          <template v-if="order.address">
            <JySectionTitle title="收货地址" />
            <JyCard>
              <view class="addr-head">
                <text class="addr-name">{{ order.address.name }}</text>
                <text class="addr-phone">{{ maskPhone(order.address.phone) }}</text>
              </view>
              <text class="addr-detail">{{ order.address.region }} {{ order.address.detail }}</text>
            </JyCard>
          </template>

          <!-- 金额 -->
          <JySectionTitle title="金额明细" />
          <JyCard>
            <view class="amount-row">
              <text class="amount-label">{{ order.type === 'explore' ? '开石金额' : '商品总额' }}</text>
              <text class="amount-value">{{ formatPrice(order.totalAmount) }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">运费</text>
              <text class="amount-value">
                {{ order.freight === 0 ? '免运费' : formatPrice(order.freight) }}
              </text>
            </view>
            <view v-if="order.discount > 0" class="amount-row">
              <text class="amount-label">优惠</text>
              <text class="amount-value discount">-{{ formatPrice(order.discount) }}</text>
            </view>
            <view class="amount-row total">
              <text class="amount-label">实付</text>
              <JyPrice :value="order.payAmount" size="normal" emphasis />
            </view>
          </JyCard>

          <!-- 订单信息 -->
          <JySectionTitle title="订单信息" />
          <JyCard>
            <view class="info-row">
              <text class="info-label">订单编号</text>
              <text class="info-value mono">{{ order.orderNo }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">下单时间</text>
              <text class="info-value">{{ formatDateTime(order.createdAt) }}</text>
            </view>
            <view v-if="order.payTime" class="info-row">
              <text class="info-label">支付时间</text>
              <text class="info-value">{{ formatDateTime(order.payTime) }}</text>
            </view>
            <view v-if="order.seriesName" class="info-row">
              <text class="info-label">开石矿区</text>
              <text class="info-value">{{ order.seriesName }}</text>
            </view>
            <view v-if="order.remark" class="info-row">
              <text class="info-label">买家留言</text>
              <text class="info-value">{{ order.remark }}</text>
            </view>
          </JyCard>

          <view class="bottom-hold" />
        </view>

        <!-- 操作栏 -->
        <view class="bar jy-safe-bottom">
          <template v-if="order.status === 'pending_pay'">
            <JyButton text="取消订单" variant="ghost" @tap="cancel" />
            <view class="bar-gap" />
            <JyButton text="立即支付" variant="primary" :loading="acting" @tap="pay" />
          </template>

          <template v-else-if="needsDraw">
            <JyButton text="去开石" variant="primary" block @tap="goDraw" />
          </template>

          <template v-else-if="order.status === 'shipped'">
            <JyButton text="查看溯源" variant="ghost" @tap="goTrace" />
            <view class="bar-gap" />
            <JyButton text="确认收货" variant="primary" :loading="acting" @tap="confirm" />
          </template>

          <template v-else-if="order.status === 'done'">
            <JyButton text="申请售后" variant="ghost" @tap="afterSale" />
            <view class="bar-gap" />
            <JyButton
              v-if="order.type === 'explore'"
              text="再探一次"
              variant="primary"
              @tap="goExplore"
            />
            <JyButton v-else text="查看溯源" variant="primary" @tap="goTrace" />
          </template>

          <template v-else>
            <JyButton text="申请售后" variant="ghost" block @tap="afterSale" />
          </template>
        </view>
      </template>
    </JyStateView>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCard from '@/components/JyCard/JyCard.vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JySteps from '@/components/JySteps/JySteps.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { orderApi } from '@/api'
import { ORDER_TYPE_TEXT } from '@/constants/enums'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { ORDER_STATUS_TEXT } from '@/types'
import type { Order } from '@/types'
import { formatDateTime, formatPrice, maskPhone } from '@/utils/format'

/**
 * 订单详情（UI-08）
 *
 * 状态区 + 进度 + 清单 + 物流 + 金额 + 订单信息 + 随状态变化的操作栏。
 * 开石订单额外呈现矿区与实体编号，使「订单 → 开奖结果 → 实体」三者可相互追溯。
 */

const orderId = ref('')
const acting = ref(false)

const { loading, error, data, run } = useAsyncPage(
  () => orderApi.fetchOrderDetail(orderId.value),
  { immediate: false }
)

const order = computed<Order | null>(() => data.value)

const statusText = computed(() => (order.value ? ORDER_STATUS_TEXT[order.value.status] : ''))

const statusHint = computed(() => {
  const o = order.value
  if (!o) return ''
  switch (o.status) {
    case 'pending_pay':
      return '请尽快完成支付，逾期订单将自动关闭'
    case 'paid':
      return o.type === 'explore' ? '已完成支付，去开石见证结果' : '已付款，仓库正在备货'
    case 'shipped':
      return '作品已寄出，请留意物流'
    case 'done':
      return '感谢收藏，愿此石相伴长久'
    case 'closed':
      return '订单已关闭'
    case 'after_sale':
      return '售后处理中，客服会与您联系'
    default:
      return ''
  }
})

/** 印章单字，随状态变化，是订单详情页唯一的情绪表达 */
const sealText = computed(() => {
  switch (order.value?.status) {
    case 'pending_pay':
      return '待付'
    case 'paid':
      return '备货'
    case 'shipped':
      return '在途'
    case 'done':
      return '圆满'
    case 'after_sale':
      return '售后'
    default:
      return '已闭'
  }
})

const steps = [
  { key: 'created', title: '提交订单', desc: '订单已生成' },
  { key: 'paid', title: '支付成功', desc: '款项已确认' },
  { key: 'shipped', title: '作品出库', desc: '已交付物流' },
  { key: 'done', title: '已签收', desc: '交易完成' },
]

const activeStep = computed(() => {
  switch (order.value?.status) {
    case 'pending_pay':
      return 0
    case 'paid':
    case 'after_sale':
      return 1
    case 'shipped':
      return 2
    case 'done':
      return 3
    default:
      return 0
  }
})

/** 已支付但尚未开奖的开石订单 */
const needsDraw = computed(
  () =>
    order.value?.type === 'explore' &&
    order.value?.status === 'paid' &&
    !order.value?.items[0]?.uniqueCode
)

onLoad((query) => {
  orderId.value = String(query?.id ?? '')
  void run()
})

function reload(): Promise<void> {
  return run()
}

async function pay(): Promise<void> {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    await orderApi.payOrder(order.value.id)
    uni.showToast({ title: '支付成功', icon: 'none' })
    await reload()
  } catch {
    // 请求层已提示
  } finally {
    acting.value = false
  }
}

function cancel(): void {
  uni.showModal({
    title: '取消订单',
    content: '取消后该订单将关闭，库存会被释放。',
    confirmText: '确认取消',
    cancelText: '再想想',
    success: async (res) => {
      if (!res.confirm || !order.value) return
      try {
        await orderApi.cancelOrder(order.value.id)
        uni.showToast({ title: '订单已取消', icon: 'none' })
        await reload()
      } catch {
        // 请求层已提示
      }
    },
  })
}

async function confirm(): Promise<void> {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    await orderApi.confirmOrder(order.value.id)
    uni.showToast({ title: '已确认收货', icon: 'none' })
    await reload()
  } catch {
    // 请求层已提示
  } finally {
    acting.value = false
  }
}

function afterSale(): void {
  uni.showModal({
    title: '申请售后',
    content: '完整的售后流程将在下一批次开放。当前可联系客服处理退换、维修与重做。',
    showCancel: false,
    confirmText: '知道了',
  })
}

function goTrace(): void {
  uni.showModal({
    title: '一物一码溯源',
    content: '溯源查询页将在下一批次开放。当前可在作品详情页查看完整溯源档案。',
    showCancel: false,
    confirmText: '知道了',
  })
}

function goDraw(): void {
  if (!order.value) return
  uni.navigateTo({ url: `/pagesExplore/draw/index?orderId=${order.value.id}` })
}

function goExplore(): void {
  uni.switchTab({ url: '/pagesExplore/home/index' })
}
</script>

<style lang="scss" scoped>
.order-detail {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 状态区
// ---------------------------------------------------------------------------
.status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $sp-6 $sp-4;
  background: radial-gradient(ellipse at 30% 0%, rgba(28, 27, 25, 0.05) 0%, rgba(28, 27, 25, 0) 70%);
  border-bottom: $hairline solid var(--c-line);
}

.status-main {
  flex: 1;
  min-width: 0;
}

.status-text {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 6rpx;
}

.status-hint {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.body {
  padding-top: $sp-4;
}

.progress {
  padding: $sp-4;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

// ---------------------------------------------------------------------------
// 商品行
// ---------------------------------------------------------------------------
.row {
  display: flex;
  padding: $sp-3;
}

.row + .row {
  border-top: $hairline solid var(--c-line);
}

.row-visual {
  flex-shrink: 0;
  width: 140rpx;
}

.row-info {
  flex: 1;
  min-width: 0;
  padding-left: $sp-3;
}

.row-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.row-spec {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

.row-code {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-gold);
}

.row-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 10rpx;
}

.row-qty {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 物流轨迹
// ---------------------------------------------------------------------------
.trace {
  display: flex;
}

.trace-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32rpx;
  flex-shrink: 0;
}

.trace-dot {
  width: 12rpx;
  height: 12rpx;
  margin-top: 10rpx;
  border-radius: 50%;
  background: var(--c-line);
}

.trace-dot.latest {
  width: 16rpx;
  height: 16rpx;
  margin-top: 8rpx;
  background: var(--c-accent);
}

.trace-line {
  flex: 1;
  width: $hairline;
  min-height: 36rpx;
  background: var(--c-line);
}

.trace-body {
  flex: 1;
  min-width: 0;
  padding-bottom: $sp-3;
  padding-left: $sp-2;
}

.trace-text {
  display: block;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.6;
}

.trace-text.latest {
  color: var(--c-ink);
}

.trace-time {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 地址
// ---------------------------------------------------------------------------
.addr-head {
  display: flex;
  align-items: center;
}

.addr-name {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.addr-phone {
  margin-left: $sp-3;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.addr-detail {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
  line-height: 1.6;
}

// ---------------------------------------------------------------------------
// 金额与信息
// ---------------------------------------------------------------------------
.amount-row,
.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12rpx 0;
}

.amount-label,
.info-label {
  flex-shrink: 0;
  margin-right: $sp-3;
  font-size: $fs-sm;
  color: var(--c-ink-2);
}

.amount-value,
.info-value {
  font-size: $fs-sm;
  color: var(--c-ink);
  text-align: right;
  line-height: 1.6;
}

.amount-value.discount {
  color: var(--c-accent);
}

.mono {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: $fs-xs;
}

.amount-row.total {
  margin-top: $sp-2;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line);
}

// ---------------------------------------------------------------------------
// 操作栏
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

.bar > * {
  flex: 1;
}

.bar-gap {
  width: $sp-2;
  flex: 0 0 auto;
}
</style>
