<template>
  <view class="order-list theme-paper">
    <JyTabs v-model="status" :items="tabs" />

    <view class="jy-pad body">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="isEmpty"
        empty-title="这里还没有订单"
        empty-desc="去石斋挑一件作品，或到探索馆听一次石开之声"
        empty-glyph="单"
        @retry="retry"
      >
        <view v-for="order in list" :key="order.id" class="card-wrap">
          <JyOrderCard :order="order" @tap="goDetail">
            <template #actions>
              <JyButton
                v-if="order.status === 'pending_pay'"
                text="取消"
                variant="ghost"
                size="small"
                @tap="cancel(order)"
              />
              <JyButton
                v-if="order.status === 'pending_pay'"
                text="立即支付"
                variant="primary"
                size="small"
                @tap="pay(order)"
              />
              <JyButton
                v-if="order.status === 'shipped'"
                text="确认收货"
                variant="primary"
                size="small"
                @tap="confirm(order)"
              />
              <JyButton
                v-if="needsDraw(order)"
                text="去开石"
                variant="gold"
                size="small"
                @tap="goDraw(order)"
              />
            </template>
          </JyOrderCard>
        </view>

        <view class="foot">
          <JyLoading v-if="loadingMore" text="继续取石" height="120rpx" />
          <JyDivider v-else-if="finished && list.length > 0" spaced text="已至尽头" />
        </view>
        <view class="jy-bottom-hold" />
      </JyStateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyLoading from '@/components/JyLoading/JyLoading.vue'
import JyOrderCard from '@/components/JyOrderCard/JyOrderCard.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyTabs from '@/components/JyTabs/JyTabs.vue'
import { orderApi } from '@/api'
import { ORDER_TABS } from '@/constants/enums'
import { usePagedList } from '@/hooks/usePagedList'
import type { Order, OrderStatus } from '@/types'

/**
 * 订单列表（UI-07）
 *
 * 商城、定制、开石统一列表，以状态分页签筛选。
 * 操作按钮随状态变化，其中开石订单额外提供「去开石」——
 * 已支付但尚未开奖的订单需要在此重新进入开石流程，否则用户中途退出就无从继续。
 */

const status = ref('all')

const tabs = ORDER_TABS.map((t) => ({ label: t.label, value: t.value as string }))

// 「我的」页可按状态直达，初始分页签取该参数
onLoad((query) => {
  const initialStatus = String(query?.status ?? '')
  if (initialStatus && tabs.some((t) => t.value === initialStatus)) {
    status.value = initialStatus
  }
})

const paged = usePagedList<Order>((page, pageSize) =>
  orderApi.fetchOrders({
    status: status.value === 'all' ? undefined : (status.value as OrderStatus),
    page,
    pageSize,
  })
)

const { list, loading, loadingMore, error, finished, isEmpty, load, loadMore, retry } = paged

watch(status, () => {
  void load(true)
})

// 每次进入都重新加载，使支付/开奖流程返回后的状态变化即时可见
onShow(() => {
  void load(true)
})

onReachBottom(() => {
  void loadMore()
})

/** 已支付但尚未开奖的开石订单 */
function needsDraw(order: Order): boolean {
  return order.type === 'explore' && order.status === 'paid' && !order.items[0]?.uniqueCode
}

function goDetail(order: Order): void {
  uni.navigateTo({ url: `/pagesMall/order/detail?id=${order.id}` })
}

function goDraw(order: Order): void {
  uni.navigateTo({ url: `/pagesExplore/draw/index?orderId=${order.id}` })
}

async function pay(order: Order): Promise<void> {
  try {
    await orderApi.payOrder(order.id)
    uni.showToast({ title: '支付成功', icon: 'none' })
    await load(true)
  } catch {
    // 请求层已提示
  }
}

function cancel(order: Order): void {
  uni.showModal({
    title: '取消订单',
    content: '取消后该订单将关闭，库存会被释放。',
    confirmText: '确认取消',
    cancelText: '再想想',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.cancelOrder(order.id)
        uni.showToast({ title: '订单已取消', icon: 'none' })
        await load(true)
      } catch {
        // 请求层已提示
      }
    },
  })
}

function confirm(order: Order): void {
  uni.showModal({
    title: '确认收货',
    content: '请确认已收到作品且完好无损。',
    confirmText: '确认收货',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderApi.confirmOrder(order.id)
        uni.showToast({ title: '已确认收货', icon: 'none' })
        await load(true)
      } catch {
        // 请求层已提示
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.order-list {
  min-height: 100vh;
}

.body {
  padding-top: $sp-4;
}

.card-wrap {
  margin-bottom: $sp-3;
}

.foot {
  padding-top: $sp-2;
}
</style>
