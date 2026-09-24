<template>
  <view class="collection theme-ink">
    <JyTabs v-model="filter" :items="tabs" />

    <view class="jy-pad body">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="visible.length === 0"
        empty-title="石头柜还是空的"
        empty-desc="去矿区开一次石，所得藏品会自动存入这里"
        empty-glyph="柜"
        @retry="retry"
      >
        <!-- 发货模式提示 -->
        <view v-if="selectMode" class="select-hint">
          <text class="select-hint-text">请选择要申请发货的藏品（仅「在柜」的藏品可发货）</text>
        </view>

        <view
          v-for="item in visible"
          :key="item.id"
          class="item"
          :class="{ selectable: selectMode, disabled: selectMode && item.status !== 'stored' }"
          @tap="onItemTap(item)"
        >
          <view v-if="selectMode" class="item-check">
            <JyCheck
              :model-value="selectedIds.includes(item.id)"
              :disabled="item.status !== 'stored'"
            />
          </view>

          <view class="item-visual">
            <JyStoneVisual
              :tone="item.productCoverTone"
              :seed="item.productId"
              ratio="1"
              radius="6rpx"
              :glyph="item.productName"
            />
          </view>

          <view class="item-info">
            <text class="item-name">{{ item.productName }}</text>
            <view class="item-tags">
              <JyTag :text="item.grade" tone="gold" />
              <JyTag :text="item.seriesName" />
            </view>
            <text class="item-code">编号 {{ item.uniqueCode }}</text>
            <text class="item-time">发现于 {{ formatDate(item.foundAt) }}</text>
          </view>

          <view class="item-right">
            <text class="item-status" :class="`tone-${COLLECTION_STATUS_TONE[item.status]}`">
              {{ COLLECTION_STATUS_TEXT[item.status] }}
            </text>
            <text v-if="!selectMode" class="item-arrow">›</text>
          </view>
        </view>

        <view class="jy-bottom-hold" />
      </JyStateView>
    </view>

    <!-- 底部操作栏 -->
    <view class="bar jy-safe-bottom">
      <template v-if="selectMode">
        <view class="bar-count">
          <text class="bar-count-text">已选 {{ selectedIds.length }} 件</text>
        </view>
        <JyButton text="取消" variant="ghost" @tap="exitSelect" />
        <view class="bar-gap" />
        <JyButton
          text="申请发货"
          variant="gold"
          :disabled="selectedIds.length === 0"
          @tap="applyShipping"
        />
      </template>

      <template v-else>
        <JyButton
          text="申请实体发货"
          variant="gold"
          block
          :disabled="storedCount === 0"
          @tap="enterSelect"
        />
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyCheck from '@/components/JyCheck/JyCheck.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import JyTabs from '@/components/JyTabs/JyTabs.vue'
import JyTag from '@/components/JyTag/JyTag.vue'
import { exploreApi } from '@/api'
import { COLLECTION_STATUS_TONE } from '@/constants/enums'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import { COLLECTION_STATUS_TEXT } from '@/types'
import type { Collection } from '@/types'
import { formatDate } from '@/utils/format'

/**
 * 石头柜（UI-22）
 *
 * 实施文档 4.2 验收要点：「仅展示当前用户藏品」—— 过滤在 Mock 服务端按 userId 完成，
 * 前端不做二次筛选。
 *
 * 发货申请在页面内以「选择模式」呈现，避免为单次选择再开一个页面；
 * 只有「在柜」状态的藏品可被选中，与文档 4.2「仅能选择有实体库存的藏品」一致。
 */

const filter = ref('all')
const selectMode = ref(false)
const selectedIds = ref<string[]>([])

const tabs = [
  { label: '全部', value: 'all' },
  { label: '在柜', value: 'stored' },
  { label: '发货中', value: 'shipping' },
  { label: '已发货', value: 'shipped' },
]

const { loading, error, data, run, retry } = useAsyncPage(() => exploreApi.fetchCollections())

const list = computed<Collection[]>(() => data.value ?? [])

const visible = computed(() =>
  filter.value === 'all' ? list.value : list.value.filter((c) => c.status === filter.value)
)

const storedCount = computed(() => list.value.filter((c) => c.status === 'stored').length)

// 从开石结果返回或发货后返回时刷新，使状态变化即时可见
let entered = false
onShow(() => {
  if (!entered) {
    entered = true
    return
  }
  void run()
})

function onItemTap(item: Collection): void {
  if (selectMode.value) {
    if (item.status !== 'stored') {
      uni.showToast({ title: '该藏品正在发货或已发出', icon: 'none' })
      return
    }
    selectedIds.value = selectedIds.value.includes(item.id)
      ? selectedIds.value.filter((id) => id !== item.id)
      : [...selectedIds.value, item.id]
    return
  }
  uni.navigateTo({ url: `/pagesExplore/collection/detail?id=${item.id}` })
}

function enterSelect(): void {
  selectMode.value = true
  selectedIds.value = []
}

function exitSelect(): void {
  selectMode.value = false
  selectedIds.value = []
}

function applyShipping(): void {
  if (selectedIds.value.length === 0) return
  uni.showModal({
    title: '申请发货',
    content: `将 ${selectedIds.value.length} 件藏品合并寄出，运费由平台承担。确认提交？`,
    confirmText: '提交申请',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await exploreApi.applyShipping({
          collectionIds: selectedIds.value,
          // 一期固定使用默认地址；地址管理页在下一批次开放
          addressId: 'addr_01',
        })
        uni.showToast({ title: result.message, icon: 'none' })
        exitSelect()
        await run()
      } catch {
        // 请求层已提示
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.collection {
  min-height: 100vh;
}

.body {
  padding-top: $sp-4;
}

.select-hint {
  margin-bottom: $sp-3;
  padding: $sp-3;
  border: $hairline dashed rgba(200, 161, 90, 0.32);
  border-radius: $r-sm;
}

.select-hint-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.7;
}

// ---------------------------------------------------------------------------
// 藏品行
// ---------------------------------------------------------------------------
.item {
  display: flex;
  align-items: center;
  padding: $sp-3;
  margin-bottom: $sp-3;
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
  background: var(--c-surface);
}

.item.disabled {
  opacity: 0.5;
}

.item-check {
  flex-shrink: 0;
  padding-right: $sp-3;
}

.item-visual {
  flex-shrink: 0;
  width: 160rpx;
}

.item-info {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.item-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  @include jy-ellipsis(1);
}

.item-tags {
  display: flex;
  margin-top: 8rpx;
}

.item-tags > * {
  margin-right: 8rpx;
}

.item-code {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xxs;
  color: var(--c-accent);
}

.item-time {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.item-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.item-status {
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

.item-arrow {
  margin-top: 8rpx;
  font-size: $fs-h3;
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

.bar-count {
  display: flex;
  align-items: center;
  flex: 1;
}

.bar-count-text {
  font-size: $fs-sm;
  color: var(--c-ink-2);
}

.bar-gap {
  width: $sp-2;
  flex: 0 0 auto;
}
</style>
