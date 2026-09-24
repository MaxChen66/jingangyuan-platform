<template>
  <view class="order" @tap="emit('tap', order)">
    <view class="head">
      <text class="type">{{ ORDER_TYPE_TEXT[order.type] }}</text>
      <text class="no">{{ order.orderNo }}</text>
      <text class="status" :class="`tone-${statusTone}`">{{ statusText }}</text>
    </view>

    <view class="items">
      <view v-for="item in order.items" :key="item.productId" class="item">
        <view class="thumb">
          <JyStoneVisual :tone="item.coverTone" :seed="item.productId" ratio="1" radius="6rpx" />
        </view>
        <view class="item-info">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-spec">{{ item.spec }}</text>
          <text v-if="item.uniqueCode" class="item-code">编号 {{ item.uniqueCode }}</text>
        </view>
        <view class="item-right">
          <JyPrice :value="item.price" size="small" />
          <text class="qty">×{{ item.quantity }}</text>
        </view>
      </view>
    </view>

    <view class="foot">
      <view class="total">
        <text class="total-label">{{ order.type === 'explore' ? '实付' : '合计' }}</text>
        <JyPrice :value="order.payAmount" size="normal" emphasis />
      </view>
      <view class="actions" @tap.stop>
        <slot name="actions" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { ORDER_STATUS_TONE, ORDER_TYPE_TEXT } from '@/constants/enums'
import { ORDER_STATUS_TEXT } from '@/types'
import type { Order } from '@/types'

/**
 * 订单卡
 *
 * 商城 / 定制 / 开石三类订单共用一张卡，以 type 区分业务线标识。
 * 操作按钮由父级通过 actions 插槽注入，
 * 因为「待付款」与「已发货」的可操作项完全不同，由页面决定更清晰。
 */
const props = defineProps<{ order: Order }>()

const emit = defineEmits<{ tap: [order: Order] }>()

const statusText = computed(() => ORDER_STATUS_TEXT[props.order.status])
const statusTone = computed(() => ORDER_STATUS_TONE[props.order.status])
</script>

<style lang="scss" scoped>
.order {
  padding: $sp-4;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.head {
  display: flex;
  align-items: center;
  padding-bottom: $sp-3;
  border-bottom: $hairline solid var(--c-line);
}

.type {
  flex-shrink: 0;
  margin-right: $sp-2;
  padding: 2rpx 10rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-xs;
  font-size: $fs-xxs;
  color: var(--c-ink-2);
}

.no {
  flex: 1;
  min-width: 0;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

.status {
  flex-shrink: 0;
  margin-left: $sp-2;
  font-family: $ff-serif;
  font-size: $fs-sm;
  letter-spacing: 2rpx;
}

.tone-accent {
  color: var(--c-accent);
}

.tone-gold {
  color: var(--c-gold);
}

.tone-muted {
  color: var(--c-ink-3);
}

.tone-danger {
  color: var(--c-danger);
}

.items {
  padding: $sp-3 0;
}

.item {
  display: flex;
  align-items: flex-start;
  margin-bottom: $sp-3;
}

.item:last-child {
  margin-bottom: 0;
}

.thumb {
  flex-shrink: 0;
  width: 130rpx;
}

.item-info {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-2 0 $sp-3;
}

.item-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.item-spec {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

.item-code {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-gold);
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.qty {
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line);
}

.total {
  display: flex;
  align-items: baseline;
}

.total-label {
  margin-right: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.actions {
  display: flex;
  align-items: center;
}

.actions > * {
  margin-left: $sp-2;
}
</style>
