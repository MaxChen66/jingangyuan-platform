<template>
  <view class="mall-home theme-paper">
    <JyStateView
      :loading="loading"
      :error="error"
      :empty="!homeData"
      empty-title="商城内容准备中"
      @retry="retry"
    >
      <template v-if="homeData">
        <!-- 搜索入口：一期跳转到列表页执行搜索 -->
        <view class="search jy-pad" @tap="goSearch">
          <view class="search-box">
            <text class="search-icon">⌕</text>
            <text class="search-placeholder">搜索作品、材质或寓意</text>
          </view>
        </view>

        <!-- 主推轮播 -->
        <scroll-view class="banner-scroll" scroll-x :show-scrollbar="false">
          <view class="banner-track">
            <view
              v-for="banner in homeData.banners"
              :key="banner.id"
              class="banner"
              :class="`tone-${banner.tone}`"
              @tap="goLink(banner.link)"
            >
              <text class="banner-title">{{ banner.title }}</text>
              <text class="banner-sub">{{ banner.subtitle }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="jy-pad">
          <!-- 分类 -->
          <JySectionTitle title="按类寻石" subtitle="六类，各有所宜" />
          <view class="cat-grid">
            <view
              v-for="category in homeData.categories"
              :key="category.id"
              class="cat-item"
              @tap="goCategory(category.id, category.name)"
            >
              <text class="cat-name">{{ category.name }}</text>
              <text class="cat-desc">{{ category.desc }}</text>
            </view>
          </view>

          <!-- 推荐 -->
          <JySectionTitle title="荐于案头" subtitle="编辑精选" more @more="goAll" />
          <view class="goods-grid">
            <JyGoodsCard
              v-for="product in homeData.recommend"
              :key="product.id"
              :product="product"
              variant="grid"
              @tap="goDetail"
            />
          </view>

          <!-- 上新 -->
          <JySectionTitle title="新入石斋" subtitle="近期入库" more @more="goAll" />
          <view class="new-list">
            <JyGoodsCard
              v-for="product in homeData.newArrivals"
              :key="product.id"
              :product="product"
              variant="row"
              :max-tags="3"
              @tap="goDetail"
            />
          </view>
          <view class="new-list-gap" />

          <JyDivider spaced text="以上作品均附鉴定证书" />
          <view class="jy-bottom-hold" />
        </view>
      </template>
    </JyStateView>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JyGoodsCard from '@/components/JyGoodsCard/JyGoodsCard.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JyStateView from '@/components/JyStateView/JyStateView.vue'
import { mallApi } from '@/api'
import { useAsyncPage } from '@/hooks/useAsyncPage'
import type { Product } from '@/types'

/** 商城首页（UI-02）：分类、搜索、推荐 */

const { loading, error, data, retry } = useAsyncPage(() => mallApi.fetchMallHome())

const homeData = computed(() => data.value)

function goSearch(): void {
  uni.navigateTo({ url: '/pagesMall/list/index?focus=1' })
}

function goCategory(categoryId: string, name: string): void {
  uni.navigateTo({
    url: `/pagesMall/list/index?categoryId=${categoryId}&title=${encodeURIComponent(name)}`,
  })
}

function goAll(): void {
  uni.navigateTo({ url: '/pagesMall/list/index' })
}

function goDetail(product: Product): void {
  uni.navigateTo({ url: `/pagesMall/detail/index?id=${product.id}` })
}

/** Banner 的去向由后台配置，这里统一走一次字符串判断即可 */
function goLink(link: string): void {
  if (!link) return
  if (link.includes('pagesExplore')) {
    uni.switchTab({ url: '/pagesExplore/home/index' })
    return
  }
  uni.navigateTo({ url: link })
}
</script>

<style lang="scss" scoped>
.mall-home {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 搜索
// ---------------------------------------------------------------------------
.search {
  padding-top: $sp-3;
  padding-bottom: $sp-3;
}

.search-box {
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

.search-placeholder {
  font-size: $fs-sm;
  color: var(--c-ink-3);
}

// ---------------------------------------------------------------------------
// 轮播
// ---------------------------------------------------------------------------
.banner-scroll {
  width: 100%;
  white-space: nowrap;
}

.banner-track {
  display: inline-flex;
  padding: 0 $sp-4;
}

.banner {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 520rpx;
  height: 240rpx;
  margin-right: $sp-3;
  padding: $sp-5;
  border-radius: $r-md;
  overflow: hidden;
}

.banner-title {
  font-family: $ff-serif;
  font-size: $fs-h1;
  letter-spacing: 8rpx;
  margin-left: 8rpx;
}

.banner-sub {
  margin-top: $sp-2;
  font-size: $fs-xs;
  opacity: 0.75;
}

// 三种轮播基调，与矿物色系呼应
.tone-ink {
  background: linear-gradient(126deg, #1a1815 0%, #332c22 100%);
  color: #ede6d8;
}

.tone-amber {
  background: linear-gradient(126deg, #4a3620 0%, #7a5730 100%);
  color: #f0e2cb;
}

.tone-crimson {
  background: linear-gradient(126deg, #4a1e1b 0%, #7d2a24 100%);
  color: #f0dad6;
}

.tone-jade {
  background: linear-gradient(126deg, #2e4a45 0%, #46695f 100%);
  color: #d8e8e2;
}

.tone-paper,
.tone-amethyst {
  background: linear-gradient(126deg, #3a3050 0%, #57466f 100%);
  color: #e2d9ec;
}

// ---------------------------------------------------------------------------
// 分类
// ---------------------------------------------------------------------------
.cat-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.cat-item {
  width: 31.5%;
  margin-bottom: $sp-2;
  padding: $sp-3 $sp-2;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-sm;
}

.cat-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.cat-desc {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  @include jy-ellipsis(1);
}

// ---------------------------------------------------------------------------
// 商品
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

.new-list > * {
  margin-bottom: $sp-3;
}

.new-list-gap {
  height: $sp-2;
}
</style>
