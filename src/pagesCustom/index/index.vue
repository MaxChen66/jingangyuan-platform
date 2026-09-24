<template>
  <view class="custom theme-paper">
    <view class="hero">
      <view class="hero-line">
        <view class="rule" />
        <text class="hero-eyebrow">私人定制</text>
        <view class="rule" />
      </view>
      <text class="hero-title">以石为媒，为你而作</text>
      <text class="hero-sub">从一块原石，到一件只属于你的作品</text>
    </view>

    <view class="jy-pad body">
      <!-- 三类定制 -->
      <view
        v-for="type in customTypes"
        :key="type.key"
        class="type-card"
        @tap="openDetail(type)"
      >
        <view class="type-head">
          <view class="type-glyph">
            <text class="type-glyph-text">{{ type.glyph }}</text>
          </view>
          <view class="type-titles">
            <text class="type-name">{{ type.name }}</text>
            <text class="type-sub">{{ type.sub }}</text>
          </view>
          <JySeal :text="type.seal" size="small" outline />
        </view>

        <view class="type-fields">
          <view v-for="field in type.fields" :key="field" class="field">
            <text class="field-text">{{ field }}</text>
          </view>
        </view>

        <text class="type-desc">{{ type.desc }}</text>
      </view>

      <!-- 定制流程 -->
      <JySectionTitle title="定制流程" subtitle="自需求至交付" />
      <view class="flow">
        <view v-for="(step, index) in flow" :key="step.name" class="flow-step">
          <view class="flow-node">
            <text class="flow-index">{{ index + 1 }}</text>
          </view>
          <text class="flow-name">{{ step.name }}</text>
          <text class="flow-desc">{{ step.desc }}</text>
        </view>
      </view>

      <!-- 说明 -->
      <view class="notice">
        <text class="notice-title">当前版本说明</text>
        <text class="notice-text">
          定制需求表单、设计稿确认与雕刻监工页面将在下一批次随视频监工、一物一码溯源模块一并开放。
          本批次已完成商城主链路与开石探索馆两条完整链路。
        </text>
      </view>

      <view class="jy-pad-block">
        <JyButton text="返回精品商城" variant="ghost" block @tap="goMall" />
      </view>

      <view class="jy-bottom-hold" />
    </view>
  </view>
</template>

<script setup lang="ts">
import JyButton from '@/components/JyButton/JyButton.vue'
import JySeal from '@/components/JySeal/JySeal.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'

/**
 * 私人定制入口（UI-10 的引导页）
 *
 * 本页在批次 1 承担一个明确职责：承接开奖结果页的
 * 「让它成为一件作品」入口（实施文档 3.3 的核心商业联动），
 * 使「开石获客 → 定制高客单变现」这条链路在前端完整可达，不留死链。
 *
 * 完整的三类定制表单、设计稿确认与监工页面属批次 2，
 * 因此此处如实呈现定制类型与流程，而不是放一个点不动的表单。
 */

interface CustomType {
  key: string
  glyph: string
  seal: string
  name: string
  sub: string
  fields: string[]
  desc: string
}

const customTypes: CustomType[] = [
  {
    key: 'wedding',
    glyph: '囍',
    seal: '新婚',
    name: '新婚定制',
    sub: '以石为信，可传家',
    fields: ['双方姓名', '婚期', '寄语', '参考素材'],
    desc: '常以对牌、印章或摆件承载。姓名与婚期可篆刻于石，附手写贺卡与定制锦盒。',
  },
  {
    key: 'business',
    glyph: '商',
    seal: '商务',
    name: '企业商务定制',
    sub: 'LOGO 入石，礼有分量',
    fields: ['企业 LOGO', '定制数量', '用途', '交期要求'],
    desc: '适用于周年礼、客户答谢与高管礼赠。支持批量，可统一包装与证书编号。',
  },
  {
    key: 'private',
    glyph: '私',
    seal: '私藏',
    name: '私人主题定制',
    sub: '你的题材，你的石头',
    fields: ['主题题材', '风格偏好', '尺寸需求', '预算范围'],
    desc: '可为一件有故事的题材单独选料开工。设计师会依原石的石形与石色给出可行方案。',
  },
]

const flow = [
  { name: '提交需求', desc: '填写题材与预算' },
  { name: '沟通确认', desc: '设计师对接选料' },
  { name: '设计出稿', desc: '效果图与报价' },
  { name: '支付定金', desc: '锁定原石开工' },
  { name: '监工制作', desc: '实时观看工序' },
  { name: '质检尾款', desc: '验收后付尾款' },
  { name: '发货溯源', desc: '一物一码交付' },
]

function openDetail(type: CustomType): void {
  uni.showModal({
    title: type.name,
    content: `${type.desc}\n\n需求表单将在下一批次开放。当前可先联系客服登记需求。`,
    showCancel: false,
    confirmText: '知道了',
  })
}

function goMall(): void {
  uni.switchTab({ url: '/pagesMall/home/index' })
}
</script>

<style lang="scss" scoped>
.custom {
  min-height: 100vh;
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-6 $sp-4 $sp-5;
  background: radial-gradient(ellipse at 50% 0%, rgba(28, 27, 25, 0.05) 0%, rgba(28, 27, 25, 0) 62%);
}

.hero-line {
  display: flex;
  align-items: center;
}

.rule {
  width: 48rpx;
  height: $hairline;
  background: var(--c-line-strong);
}

.hero-eyebrow {
  margin: 0 $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  letter-spacing: 6rpx;
}

.hero-title {
  margin-top: $sp-4;
  font-family: $ff-serif;
  font-size: $fs-h1;
  color: var(--c-ink);
  letter-spacing: 8rpx;
}

.hero-sub {
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

.body {
  padding-top: $sp-2;
}

// ---------------------------------------------------------------------------
// 定制类型
// ---------------------------------------------------------------------------
.type-card {
  padding: $sp-4;
  margin-bottom: $sp-3;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.type-head {
  display: flex;
  align-items: center;
}

.type-glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-sm;
}

.type-glyph-text {
  font-family: $ff-serif;
  font-size: 40rpx;
  color: var(--c-accent);
  line-height: 1;
}

.type-titles {
  flex: 1;
  min-width: 0;
  padding: 0 $sp-3;
}

.type-name {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.type-sub {
  display: block;
  margin-top: 6rpx;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.type-fields {
  display: flex;
  flex-wrap: wrap;
  margin-top: $sp-3;
}

.field {
  padding: 6rpx 16rpx;
  margin: 0 $sp-2 $sp-2 0;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
}

.field-text {
  font-size: $fs-xxs;
  color: var(--c-ink-2);
}

.type-desc {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.8;
  text-align: justify;
}

// ---------------------------------------------------------------------------
// 流程
// ---------------------------------------------------------------------------
.flow {
  display: flex;
  flex-wrap: wrap;
  padding: $sp-4;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.flow-step {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $sp-4;
}

.flow-node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: 50%;
}

.flow-index {
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-accent);
}

.flow-name {
  margin-top: 10rpx;
  font-family: $ff-serif;
  font-size: $fs-xxs;
  color: var(--c-ink);
  letter-spacing: 1rpx;
}

.flow-desc {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: var(--c-ink-3);
  text-align: center;
}

// ---------------------------------------------------------------------------
// 说明
// ---------------------------------------------------------------------------
.notice {
  margin-top: $sp-5;
  padding: $sp-3;
  border: $hairline dashed var(--c-line-strong);
  border-radius: $r-sm;
}

.notice-title {
  display: block;
  margin-bottom: 8rpx;
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-accent);
  letter-spacing: 2rpx;
}

.notice-text {
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}

.jy-pad-block {
  margin-top: $sp-4;
}
</style>
