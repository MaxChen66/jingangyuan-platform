<template>
  <view class="list-page theme-paper">
    <!-- 搜索 -->
    <view class="search jy-pad">
      <view class="search-box">
        <text class="search-icon">⌕</text>
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="搜索作品、材质或寓意"
          placeholder-class="search-ph"
          confirm-type="search"
          :focus="autoFocus"
          @confirm="applySearch"
        />
        <text v-if="keyword" class="clear" @tap="clearKeyword">✕</text>
      </view>
      <view class="search-action" @tap="applySearch">
        <text class="search-action-text">搜索</text>
      </view>
    </view>

    <!-- 分类筛选 -->
    <scroll-view class="chips-scroll" scroll-x :show-scrollbar="false">
      <view class="chips">
        <view
          class="chip"
          :class="{ active: !categoryId }"
          @tap="selectCategory('')"
        >
          <text class="chip-text">全部</text>
        </view>
        <view
          v-for="category in categories"
          :key="category.id"
          class="chip"
          :class="{ active: categoryId === category.id }"
          @tap="selectCategory(category.id)"
        >
          <text class="chip-text">{{ category.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 排序 -->
    <view class="sorts jy-pad">
      <view
        v-for="option in SORT_OPTIONS"
        :key="option.value"
        class="sort"
        :class="{ active: sort === option.value }"
        @tap="selectSort(option.value)"
      >
        <text class="sort-text">{{ option.label }}</text>
      </view>
      <view class="count">
        <text class="count-text">共 {{ total }} 件</text>
      </view>
    </view>

    <view class="jy-pad">
      <JyStateView
        :loading="loading"
        :error="error"
        :empty="isEmpty"
        empty-title="未寻得相符之石"
        empty-desc="换个关键词，或放宽筛选条件再试"
        empty-glyph="寻"
        @retry="retry"
      >
        <view class="goods-grid">
          <JyGoodsCard
            v-for="product in list"
            :key="product.id"
            :product="product"
            variant="grid"
            @tap="goDetail"
          />
        </view>

        <view class="foot">
          <JyLoading v-if="loadingMore" text="继续取石" height="120rpx" />
          <JyDivider v-else-if="finished && list.length > 0" spaced text="已至石斋尽头" />
        </view>
        <view class="jy-bottom-hold" />
      </JyStateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyGoodsCard from '@/components/JyGoodsCard/JyGoodsCard.vue'
import JyLoading from '@/components/JyLoading/JyLoading.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import { mallApi } from '@/api'
import type { ProductSort } from '@/api/mall'
import { SORT_OPTIONS } from '@/constants/enums'
import { usePagedList } from '@/hooks/usePagedList'
import type { Product } from '@/types'

/**
 * 商品列表（UI-03）
 *
 * 支持关键词搜索、分类筛选、四种排序与触底分页。
 * 三态与分页逻辑全部来自通用 Hook，页面本身只处理交互与参数。
 */

const keyword = ref('')
const categoryId = ref('')
const sort = ref<ProductSort>('default')
const autoFocus = ref(false)

/** 分类仅用于顶部筛选条，与商品列表相互独立，故不纳入分页 Hook */
const categories = ref<{ id: string; name: string }[]>([])

const paged = usePagedList<Product>((page, pageSize) =>
  mallApi.fetchProducts({
    categoryId: categoryId.value || undefined,
    keyword: keyword.value || undefined,
    sort: sort.value,
    page,
    pageSize,
  })
)

const { list, total, loading, loadingMore, error, finished, isEmpty, load, loadMore, retry } = paged

onLoad(async (query) => {
  if (query?.categoryId) categoryId.value = String(query.categoryId)
  if (query?.keyword) keyword.value = String(query.keyword)
  if (query?.focus) autoFocus.value = true
  if (query?.title) {
    uni.setNavigationBarTitle({ title: String(query.title) })
  }

  // 筛选条失败不应阻断商品列表，故此处单独捕获
  try {
    categories.value = await mallApi.fetchCategories()
  } catch {
    categories.value = []
  }

  await load(true)
})

// 触底加载下一页，已到底或加载中时 Hook 内部会忽略
onReachBottom(() => {
  void loadMore()
})

function applySearch(): void {
  autoFocus.value = false
  void load(true)
}

function clearKeyword(): void {
  keyword.value = ''
  void load(true)
}

function selectCategory(id: string): void {
  categoryId.value = id
  void load(true)
}

function selectSort(value: ProductSort): void {
  sort.value = value
  void load(true)
}

function goDetail(product: Product): void {
  uni.navigateTo({ url: `/pagesMall/detail/index?id=${product.id}` })
}
</script>

<style lang="scss" scoped>
.list-page {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 搜索
// ---------------------------------------------------------------------------
.search {
  display: flex;
  align-items: center;
  padding-top: $sp-3;
  padding-bottom: $sp-3;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 $sp-3;
  border: $hairline solid var(--c-line);
  border-radius: $r-sm;
  background: var(--c-surface);
}

.search-icon {
  margin-right: 10rpx;
  font-size: $fs-body;
  color: var(--c-ink-3);
}

.search-input {
  flex: 1;
  min-width: 0;
  font-size: $fs-sm;
  color: var(--c-ink);
}

.search-ph {
  color: var(--c-ink-3);
}

.clear {
  padding: 0 4rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.search-action {
  flex-shrink: 0;
  padding-left: $sp-3;
}

.search-action-text {
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

// ---------------------------------------------------------------------------
// 分类筛选
// ---------------------------------------------------------------------------
.chips-scroll {
  width: 100%;
  white-space: nowrap;
}

.chips {
  display: inline-flex;
  padding: 0 $sp-4;
}

.chip {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  margin-right: $sp-2;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
  background: var(--c-surface);
}

.chip.active {
  border-color: var(--c-accent);
  background: var(--c-accent-soft);
}

.chip-text {
  font-size: $fs-xs;
  color: var(--c-ink-2);
}

.chip.active .chip-text {
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 排序
// ---------------------------------------------------------------------------
.sorts {
  display: flex;
  align-items: center;
  padding-top: $sp-3;
  padding-bottom: $sp-2;
}

.sort {
  margin-right: $sp-4;
}

.sort-text {
  font-size: $fs-xs;
  color: var(--c-ink-3);
}

.sort.active .sort-text {
  color: var(--c-ink);
  font-weight: 500;
}

.count {
  flex: 1;
  text-align: right;
}

.count-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 列表
// ---------------------------------------------------------------------------
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-grid > * {
  width: 48.5%;
  margin-bottom: $sp-3;
}

.foot {
  padding-top: $sp-2;
}
</style>
