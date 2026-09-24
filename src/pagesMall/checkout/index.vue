<template>
  <view class="checkout theme-paper">
    <JyStateView :loading="loading" :error="error" :empty="items.length === 0" empty-title="没有可结算的作品" @retry="init">
      <view class="jy-pad body">
        <!-- 收货地址 -->
        <view class="address" @tap="addressVisible = true">
          <template v-if="address">
            <view class="address-head">
              <text class="address-name">{{ address.name }}</text>
              <text class="address-phone">{{ maskPhone(address.phone) }}</text>
              <view v-if="address.isDefault" class="address-badge">
                <text class="address-badge-text">默认</text>
              </view>
            </view>
            <text class="address-detail">{{ address.region }} {{ address.detail }}</text>
          </template>
          <text v-else class="address-empty">请选择收货地址</text>
          <text class="address-arrow">›</text>
        </view>

        <!-- 商品清单 -->
        <JySectionTitle title="作品清单" :subtitle="`共 ${totalCount} 件`" />
        <JyCard flat>
          <view v-for="item in items" :key="item.productId" class="row">
            <view class="row-visual">
              <JyStoneVisual :tone="item.coverTone" :seed="item.productId" ratio="1" radius="6rpx" />
            </view>
            <view class="row-info">
              <text class="row-name">{{ item.name }}</text>
              <text class="row-spec">{{ item.spec }}</text>
              <view class="row-foot">
                <JyPrice :value="item.price" size="small" />
                <text class="row-qty">×{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </JyCard>

        <!-- 备注 -->
        <JySectionTitle title="买家留言" subtitle="选填" />
        <view class="remark">
          <input
            v-model="remark"
            class="remark-input"
            type="text"
            placeholder="如有特殊要求可在此说明，例如需要手写贺卡"
            placeholder-class="remark-ph"
            maxlength="60"
          />
        </view>

        <!-- 金额 -->
        <JySectionTitle title="金额明细" />
        <JyCard>
          <view class="amount-row">
            <text class="amount-label">商品总额</text>
            <text class="amount-value">{{ formatPrice(totalAmount) }}</text>
          </view>
          <view class="amount-row">
            <text class="amount-label">运费</text>
            <text class="amount-value">
              {{ freight === 0 ? '免运费' : formatPrice(freight) }}
            </text>
          </view>
          <view v-if="hintFreeShipping" class="amount-hint">
            <text class="hint-text">
              再购 {{ formatPrice(FREIGHT.freeThreshold - totalAmount) }} 可免运费
            </text>
          </view>
          <view class="amount-row total">
            <text class="amount-label">应付</text>
            <JyPrice :value="payAmount" size="normal" emphasis />
          </view>
        </JyCard>

        <view class="notice">
          <text class="notice-text">
            提交订单后将进入模拟支付流程。本期为前端骨架版本，不产生真实扣款。
          </text>
        </view>

        <view class="bottom-hold" />
      </view>

      <!-- 提交栏 -->
      <view class="bar jy-safe-bottom">
        <view class="bar-total">
          <text class="bar-label">应付</text>
          <JyPrice :value="payAmount" size="normal" emphasis />
        </view>
        <JyButton
          text="提交订单"
          variant="primary"
          size="normal"
          :loading="submitting"
          :disabled="!address"
          @tap="submit"
        />
      </view>
    </JyStateView>

    <!-- 地址选择 -->
    <JyPopup :visible="addressVisible" title="选择收货地址" @close="addressVisible = false">
      <view
        v-for="item in addresses"
        :key="item.id"
        class="addr-option"
        :class="{ active: item.id === address?.id }"
        @tap="pickAddress(item.id)"
      >
        <view class="addr-option-head">
          <text class="addr-option-name">{{ item.name }}</text>
          <text class="addr-option-phone">{{ maskPhone(item.phone) }}</text>
        </view>
        <text class="addr-option-detail">{{ item.region }} {{ item.detail }}</text>
      </view>
    </JyPopup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCard from '@/components/JyCard/JyCard.vue'
import JyPopup from '@/components/JyPopup/JyPopup.vue'
import JyPrice from '@/components/JyPrice/JyPrice.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { mallApi, orderApi } from '@/api'
import { calcFreight, FREIGHT } from '@/constants/config'
import { formatPrice, maskPhone } from '@/utils/format'
import { useCartStore } from '@/store/cart'
import { useOrderStore } from '@/store/order'
import { useUserStore } from '@/store/user'
import type { OrderItem, StoneTone } from '@/types'

/**
 * 确认订单（UI-06）
 *
 * 同时服务两种来源：
 *   mode=cart   —— 从购物车结算已勾选的商品
 *   mode=direct —— 商品详情页「立即购买」
 * 金额与运费规则引用 constants/config，与 Mock 服务端共用同一份定义。
 */

const cart = useCartStore()
const orderStore = useOrderStore()
const userStore = useUserStore()

const mode = ref<'cart' | 'direct'>('cart')
/** direct 模式的来源参数，在 onLoad 中从页面参数读入 */
const directProductId = ref('')
const directQuantity = ref(1)

const products = ref<OrderItem[]>([])
const addresses = ref<Awaited<ReturnType<typeof userStore.loadAddresses>>>([])
const selectedAddressId = ref('')
const remark = ref('')
const loading = ref(false)
const error = ref('')
const submitting = ref(false)
const addressVisible = ref(false)

const items = computed(() => products.value)

const totalAmount = computed(() =>
  items.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
)

const totalCount = computed(() => items.value.reduce((acc, item) => acc + item.quantity, 0))

const freight = computed(() => calcFreight(totalAmount.value))

const payAmount = computed(() => totalAmount.value + freight.value)

const hintFreeShipping = computed(
  () => freight.value > 0 && totalAmount.value < FREIGHT.freeThreshold
)

const address = computed(
  () => addresses.value.find((a) => a.id === selectedAddressId.value) ?? addresses.value[0] ?? null
)

onLoad(async (query) => {
  mode.value = query?.mode === 'direct' ? 'direct' : 'cart'
  // 必须先于 init 读入，init 依赖这两个值拉取商品
  directProductId.value = String(query?.productId ?? '')
  directQuantity.value = Math.max(1, Number(query?.quantity ?? 1) || 1)
  await init()
})

async function init(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    // 地址来源与商品清单相互独立，任一失败都只影响各自区块
    addresses.value = await userStore.loadAddresses()
    selectedAddressId.value = userStore.defaultAddress?.id ?? ''

    if (mode.value === 'direct') {
      // direct 模式的商品由商品详情页通过参数带入，此处回查完整信息
      if (!directProductId.value) {
        throw new Error('缺少商品信息，请返回重新选择')
      }
      const product = await mallApi.fetchProductDetail(directProductId.value)
      products.value = [
        {
          productId: product.id,
          name: product.name,
          cover: product.cover,
          coverTone: product.coverTone as StoneTone,
          price: product.price,
          quantity: directQuantity.value,
          spec: `${product.origin} · ${product.size}`,
        },
      ]
    } else {
      products.value = cart.checkedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        cover: item.cover,
        coverTone: item.coverTone,
        price: item.price,
        quantity: item.quantity,
        spec: item.spec,
      }))
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '结算信息加载失败'
  } finally {
    loading.value = false
  }
}

function pickAddress(id: string): void {
  selectedAddressId.value = id
  addressVisible.value = false
}

async function submit(): Promise<void> {
  if (submitting.value) return
  if (!address.value) {
    uni.showToast({ title: '请先选择收货地址', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const order = await orderApi.createOrder({
      items: items.value.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      addressId: address.value.id,
      remark: remark.value,
    })

    orderStore.setLastOrder(order)

    // 下单成功后才清空已结算的商品。
    // 放在提交前会让用户中途返回时丢失购物车，因此必须置于此处。
    if (mode.value === 'cart') {
      cart.removeChecked()
    }

    uni.redirectTo({ url: `/pagesMall/order/detail?id=${order.id}` })
  } catch {
    // 错误提示由请求层统一 toast，这里只需恢复按钮
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.checkout {
  min-height: 100vh;
}

.body {
  padding-top: $sp-4;
}

// ---------------------------------------------------------------------------
// 地址
// ---------------------------------------------------------------------------
.address {
  position: relative;
  padding: $sp-4;
  padding-right: 60rpx;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.address-head {
  display: flex;
  align-items: center;
}

.address-name {
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.address-phone {
  margin-left: $sp-3;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.address-badge {
  margin-left: $sp-2;
  padding: 2rpx 8rpx;
  border: $hairline solid var(--c-accent);
  border-radius: $r-xs;
}

.address-badge-text {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.address-detail {
  display: block;
  margin-top: 10rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
  line-height: 1.6;
}

.address-empty {
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

.address-arrow {
  position: absolute;
  top: 50%;
  right: $sp-4;
  font-size: $fs-h3;
  color: var(--c-ink-3);
  transform: translateY(-50%);
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
// 备注
// ---------------------------------------------------------------------------
.remark {
  padding: $sp-3;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.remark-input {
  width: 100%;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.remark-ph {
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 金额
// ---------------------------------------------------------------------------
.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.amount-label {
  font-size: $fs-sm;
  color: var(--c-ink-2);
}

.amount-value {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.amount-hint {
  padding-bottom: 12rpx;
}

.hint-text {
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.amount-row.total {
  margin-top: $sp-2;
  padding-top: $sp-3;
  border-top: $hairline solid var(--c-line);
}

// ---------------------------------------------------------------------------
// 提示
// ---------------------------------------------------------------------------
.notice {
  margin-top: $sp-3;
  padding: $sp-3;
  border: $hairline dashed var(--c-line-strong);
  border-radius: $r-sm;
}

.notice-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 提交栏
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

.bar-total {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.bar-label {
  margin-right: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

// ---------------------------------------------------------------------------
// 地址选择
// ---------------------------------------------------------------------------
.addr-option {
  padding: $sp-3;
  margin-bottom: $sp-2;
  border: $hairline solid var(--c-line);
  border-radius: $r-sm;
}

.addr-option.active {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
}

.addr-option-head {
  display: flex;
  align-items: center;
}

.addr-option-name {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.addr-option-phone {
  margin-left: $sp-3;
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.addr-option-detail {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.6;
}
</style>
