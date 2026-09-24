<template>
  <view class="cart theme-paper">
    <JyStateView
      v-if="cart.kindCount === 0"
      :loading="false"
      empty
      empty-title="购物车里还没有石头"
      empty-desc="去石斋挑一件，或先到探索馆听一次石开之声"
      empty-glyph="虛"
    >
      <view class="empty-actions">
        <JyButton text="去逛商城" variant="ghost" @tap="goMall" />
        <view class="gap" />
        <JyButton text="去开石" variant="primary" @tap="goExplore" />
      </view>
    </JyStateView>

    <template v-else>
      <view class="jy-pad list">
        <view v-for="item in cart.items" :key="item.productId" class="row">
          <view class="row-check" @tap="cart.toggleCheck(item.productId)">
            <JyCheck :model-value="item.checked" />
          </view>

          <view class="row-visual" @tap="goDetail(item.productId)">
            <JyStoneVisual :tone="item.coverTone" :seed="item.productId" ratio="1" radius="6rpx" />
          </view>

          <view class="row-info">
            <text class="row-name" @tap="goDetail(item.productId)">{{ item.name }}</text>
            <text class="row-spec">{{ item.spec }}</text>
            <view class="row-foot">
              <JyPrice :value="item.price" size="small" />
              <JyStepper
                :model-value="item.quantity"
                :max="item.stock"
                size="small"
                @update:model-value="(v: number) => cart.updateQuantity(item.productId, v)"
              />
            </view>
          </view>

          <view class="row-remove" @tap="confirmRemove(item.productId, item.name)">
            <text class="remove-mark">✕</text>
          </view>
        </view>

        <JyDivider spaced text="以上作品均附鉴定证书" />
        <view class="bottom-hold" />
      </view>

      <!-- 结算栏 -->
      <view class="bar jy-safe-bottom">
        <view class="bar-all" @tap="cart.toggleAll(!cart.allChecked)">
          <JyCheck :model-value="cart.allChecked" />
          <text class="bar-all-text">全选</text>
        </view>

        <view class="bar-total">
          <text class="bar-label">合计</text>
          <JyPrice :value="cart.totalAmount" size="normal" emphasis />
        </view>

        <JyButton
          :text="checkoutText"
          variant="primary"
          size="normal"
          :disabled="cart.checkedCount === 0"
          @tap="checkout"
        />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCheck from '@/components/JyCheck/JyCheck.vue'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStepper from '@/components/JyStepper/JyStepper.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { useCartStore } from '@/store/cart'

/** 购物车（UI-05）：增删改、勾选、合计、结算 */

const cart = useCartStore()

const checkoutText = computed(() =>
  cart.checkedCount > 0 ? `结算 (${cart.checkedCount})` : '结算'
)

function goDetail(productId: string): void {
  uni.navigateTo({ url: `/pagesMall/detail/index?id=${productId}` })
}

function goMall(): void {
  uni.switchTab({ url: '/pagesMall/home/index' })
}

function goExplore(): void {
  uni.switchTab({ url: '/pagesExplore/home/index' })
}

function checkout(): void {
  if (cart.checkedCount === 0) return
  uni.navigateTo({ url: '/pagesMall/checkout/index?mode=cart' })
}

function confirmRemove(productId: string, name: string): void {
  uni.showModal({
    title: '移出购物车',
    content: `确定将「${name}」移出购物车吗？`,
    confirmText: '移出',
    cancelText: '再想想',
    success: (res) => {
      if (res.confirm) {
        cart.remove(productId)
        uni.showToast({ title: '已移出', icon: 'none' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.cart {
  min-height: 100vh;
}

.empty-actions {
  display: flex;
  justify-content: center;
  margin-top: $sp-4;
}

.gap {
  width: $sp-3;
}

.list {
  padding-top: $sp-4;
}

// ---------------------------------------------------------------------------
// 商品行
// ---------------------------------------------------------------------------
.row {
  display: flex;
  align-items: center;
  padding: $sp-3;
  margin-bottom: $sp-3;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.row-check {
  flex-shrink: 0;
  padding-right: $sp-3;
}

.row-visual {
  flex-shrink: 0;
  width: 160rpx;
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

.row-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $sp-3;
}

.row-remove {
  flex-shrink: 0;
  padding: 0 0 0 $sp-2;
  align-self: flex-start;
}

.remove-mark {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 结算栏
// ---------------------------------------------------------------------------
.bottom-hold {
  height: 180rpx;
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

.bar-all {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bar-all-text {
  margin-left: 10rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.bar-total {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  padding-right: $sp-3;
}

.bar-label {
  margin-right: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}
</style>
