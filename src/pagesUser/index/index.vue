<template>
  <view class="user theme-paper">
    <!-- 用户信息 -->
    <view class="profile">
      <view class="avatar">
        <text class="avatar-glyph">{{ avatarChar }}</text>
      </view>
      <view class="profile-info">
        <view class="profile-name-row">
          <text class="profile-name">{{ profile?.nickname ?? '未登录' }}</text>
          <view v-if="profile" class="level">
            <text class="level-text">{{ profile.levelName }}</text>
          </view>
        </view>
        <text class="profile-phone">{{ profile ? maskPhone(profile.phone) : '点击登录' }}</text>
      </view>
      <JySeal text="藏家" size="small" outline />
    </view>

    <!-- 成长值 -->
    <view v-if="profile" class="growth">
      <view class="growth-head">
        <text class="growth-label">成长值 {{ profile.growth }}</text>
        <text class="growth-next">
          {{ profile.growthToNext > 0 ? `再 ${profile.growthToNext} 升级` : '已达最高等级' }}
        </text>
      </view>
      <view class="growth-track">
        <view class="growth-fill" :style="{ width: growthPercent }" />
      </view>
    </view>

    <!-- 资产 -->
    <view class="assets">
      <view class="asset" @tap="goPoints">
        <text class="asset-num">{{ profile?.points ?? 0 }}</text>
        <text class="asset-label">积分</text>
      </view>
      <view class="asset" @tap="goCollection">
        <text class="asset-num">{{ member?.collectionCount ?? 0 }}</text>
        <text class="asset-label">藏石</text>
      </view>
      <view class="asset" @tap="goOrders()">
        <text class="asset-num">{{ member?.orderCount ?? 0 }}</text>
        <text class="asset-label">订单</text>
      </view>
    </view>

    <view class="jy-pad body">
      <!-- 订单快捷入口 -->
      <JyCard flat>
        <view class="card-head" @tap="goOrders()">
          <text class="card-title">我的订单</text>
          <view class="card-more">
            <text class="card-more-text">全部订单</text>
            <text class="card-arrow">›</text>
          </view>
        </view>

        <view class="order-types">
          <view
            v-for="entry in orderEntries"
            :key="entry.status"
            class="order-type"
            @tap="goOrders(entry.status)"
          >
            <view class="order-type-icon">
              <text class="order-type-glyph">{{ entry.glyph }}</text>
              <view v-if="entry.count > 0" class="badge">
                <text class="badge-text">{{ entry.count }}</text>
              </view>
            </view>
            <text class="order-type-name">{{ entry.name }}</text>
          </view>
        </view>
      </JyCard>

      <!-- 功能入口 -->
      <JySectionTitle title="我的服务" />
      <JyCard flat>
        <view
          v-for="(entry, index) in serviceEntries"
          :key="entry.name"
          class="service"
          :class="{ 'has-line': index < serviceEntries.length - 1 }"
          @tap="entry.action()"
        >
          <view class="service-left">
            <text class="service-glyph">{{ entry.glyph }}</text>
            <view class="service-text">
              <text class="service-name">{{ entry.name }}</text>
              <text v-if="entry.desc" class="service-desc">{{ entry.desc }}</text>
            </view>
          </view>
          <view class="service-right">
            <text v-if="entry.badge" class="service-badge">{{ entry.badge }}</text>
            <text class="service-arrow">›</text>
          </view>
        </view>
      </JyCard>

      <view class="version">
        <text class="version-text">金刚之源 · 前端骨架版本 V0.1</text>
        <text class="version-note">
          本版本为第 1 期交付：页面与流程完整，数据由本地 Mock 提供，
          不含真实支付、真实开奖与真实物流。
        </text>
      </view>

      <view class="jy-bottom-hold" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JyCard from '@/components/JyCard/JyCard.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import { orderApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { useUserStore } from '@/store/user'
import { maskPhone } from '@/utils/format'
import type { OrderStatus } from '@/types'

/**
 * 我的（UI-26）
 *
 * 实施文档 4.3 定义的用户资产中心。
 * 本批次实现订单快捷入口、资产概览与服务列表；
 * 积分明细、会员权益、地址管理、售后与客服页面属批次 2，
 * 此处以明确的「下一批次开放」提示承接，不留死链。
 */

const userStore = useUserStore()

const { data, run } = useAsyncPage(async () => {
  const [profile, member, orders] = await Promise.all([
    userStore.loadProfile(),
    userStore.loadMember(),
    orderApi.fetchOrders({ page: 1, pageSize: 100 }),
  ])
  return { profile, member, orders: orders.list }
})

const profile = computed(() => data.value?.profile ?? null)
const member = computed(() => data.value?.member ?? null)

const avatarChar = computed(() => profile.value?.nickname.slice(0, 1) ?? '石')

const growthPercent = computed(() => {
  const p = profile.value
  if (!p || p.growthToNext <= 0) return '100%'
  const total = p.growth + p.growthToNext
  return `${((p.growth / total) * 100).toFixed(1)}%`
})

/** 按状态统计订单数，用于入口角标 */
function countByStatus(status: OrderStatus): number {
  return (data.value?.orders ?? []).filter((o) => o.status === status).length
}

const orderEntries = computed(() => [
  { status: 'pending_pay' as OrderStatus, name: '待付款', glyph: '付', count: countByStatus('pending_pay') },
  { status: 'paid' as OrderStatus, name: '待发货', glyph: '备', count: countByStatus('paid') },
  { status: 'shipped' as OrderStatus, name: '已发货', glyph: '途', count: countByStatus('shipped') },
  { status: 'done' as OrderStatus, name: '已完成', glyph: '成', count: countByStatus('done') },
])

const serviceEntries = computed(() => [
  {
    name: '我的藏品',
    glyph: '柜',
    desc: '石头柜 · 藏品与发货',
    badge: String(member.value?.collectionCount ?? 0),
    action: goCollection,
  },
  { name: '会员与积分', glyph: '会', desc: '权益 · 积分明细', badge: '', action: goPoints },
  { name: '地址管理', glyph: '址', desc: '收货地址', badge: '', action: notReady('地址管理') },
  { name: '售后服务', glyph: '售', desc: '退款 · 退货 · 维修 · 重做', badge: '', action: notReady('售后服务') },
  { name: '常见问题', glyph: '问', desc: '', badge: '', action: notReady('常见问题') },
  { name: '客服', glyph: '客', desc: '人工客服与投诉建议', badge: '', action: contactService },
  { name: '设置与协议', glyph: '设', desc: '隐私政策 · 用户协议', badge: '', action: notReady('设置与协议') },
])

// 每次进入重新计算，使下单、发货后的角标即时更新
let entered = false
onShow(() => {
  if (!entered) {
    entered = true
    return
  }
  void run()
})

function goOrders(status?: OrderStatus): void {
  const query = status ? `?status=${status}` : ''
  uni.navigateTo({ url: `/pagesMall/order/list${query}` })
}

function goCollection(): void {
  uni.navigateTo({ url: '/pagesExplore/collection/index' })
}

function goPoints(): void {
  uni.showModal({
    title: '会员与积分',
    content: '积分明细与会员权益页将在下一批次开放。当前积分可用于刻字、包装等增值服务。',
    showCancel: false,
    confirmText: '知道了',
  })
}

function contactService(): void {
  uni.showModal({
    title: '联系客服',
    content: '客服接入将在上线前完成配置（微信客服 / 企业微信）。',
    showCancel: false,
    confirmText: '知道了',
  })
}

/** 批次 2 页面统一以此承接，保证无死链且提示明确 */
function notReady(name: string): () => void {
  return () => {
    uni.showModal({
      title: name,
      content: `「${name}」将在下一批次随定制与溯源模块一并开放。`,
      showCancel: false,
      confirmText: '知道了',
    })
  }
}
</script>

<style lang="scss" scoped>
.user {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 用户信息
// ---------------------------------------------------------------------------
.profile {
  display: flex;
  align-items: center;
  padding: $sp-6 $sp-4 $sp-5;
  background: radial-gradient(ellipse at 20% 0%, rgba(28, 27, 25, 0.05) 0%, rgba(28, 27, 25, 0) 68%);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110rpx;
  height: 110rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: 50%;
  background: var(--c-surface);
}

.avatar-glyph {
  font-family: $ff-serif;
  font-size: 48rpx;
  color: var(--c-ink-2);
}

.profile-info {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.profile-name-row {
  display: flex;
  align-items: center;
}

.profile-name {
  font-family: $ff-serif;
  font-size: $fs-h2;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.level {
  margin-left: $sp-3;
  padding: 2rpx 10rpx;
  border: $hairline solid var(--c-gold);
  border-radius: $r-xs;
}

.level-text {
  font-size: $fs-xxs;
  color: var(--c-gold);
}

.profile-phone {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 成长值
// ---------------------------------------------------------------------------
.growth {
  padding: 0 $sp-4 $sp-4;
}

.growth-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.growth-label {
  font-size: $fs-xxs;
  color: var(--c-ink-2);
}

.growth-next {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.growth-track {
  height: 6rpx;
  margin-top: 10rpx;
  border-radius: 3rpx;
  background: var(--c-bg-deep);
  overflow: hidden;
}

.growth-fill {
  height: 100%;
  border-radius: 3rpx;
  background: linear-gradient(90deg, var(--c-gold), var(--c-accent));
}

// ---------------------------------------------------------------------------
// 资产
// ---------------------------------------------------------------------------
.assets {
  display: flex;
  margin: 0 $sp-4;
  padding: $sp-4 0;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.asset {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.asset + .asset {
  border-left: $hairline solid var(--c-line);
}

.asset-num {
  font-family: $ff-serif;
  font-size: $fs-h2;
  color: var(--c-ink);
}

.asset-label {
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.body {
  padding-top: $sp-5;
}

// ---------------------------------------------------------------------------
// 订单入口
// ---------------------------------------------------------------------------
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $sp-4 $sp-4 $sp-3;
}

.card-title {
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.card-more {
  display: flex;
  align-items: center;
}

.card-more-text {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.card-arrow {
  margin-left: 4rpx;
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

.order-types {
  display: flex;
  padding: $sp-2 $sp-2 $sp-4;
}

.order-type {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.order-type-icon {
  position: relative;
}

.order-type-glyph {
  font-family: $ff-serif;
  font-size: 40rpx;
  color: var(--c-ink-2);
  line-height: 1;
}

.badge {
  position: absolute;
  top: -10rpx;
  right: -18rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  border-radius: 14rpx;
  background: var(--c-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  font-size: 18rpx;
  color: var(--c-ink-inverse);
  line-height: 1;
}

.order-type-name {
  margin-top: 10rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-2);
}

// ---------------------------------------------------------------------------
// 服务列表
// ---------------------------------------------------------------------------
.service {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $sp-3 $sp-4;
}

.service.has-line {
  border-bottom: $hairline solid var(--c-line);
}

.service-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.service-glyph {
  width: 48rpx;
  font-family: $ff-serif;
  font-size: 32rpx;
  color: var(--c-accent);
}

.service-text {
  flex: 1;
  min-width: 0;
  padding-left: $sp-3;
}

.service-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.service-desc {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.service-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.service-badge {
  margin-right: 8rpx;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
}

.service-arrow {
  font-size: $fs-h3;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 版本
// ---------------------------------------------------------------------------
.version {
  margin-top: $sp-5;
  padding: $sp-3;
  border: $hairline dashed var(--c-line-strong);
  border-radius: $r-sm;
}

.version-text {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-ink-2);
  letter-spacing: 2rpx;
}

.version-note {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}
</style>
