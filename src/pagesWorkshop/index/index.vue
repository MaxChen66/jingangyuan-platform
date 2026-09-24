<template>
  <view class="workshop theme-paper">
    <!-- 品牌区 -->
    <view class="hero">
      <view class="hero-line">
        <view class="rule" />
        <text class="hero-eyebrow">雕刻工坊</text>
        <view class="rule" />
      </view>
      <text class="hero-title">七道工序，一器乃成</text>
      <text class="hero-sub">从原石到作品，每一步都可查看</text>
    </view>

    <view class="jy-pad body">
      <!-- 工序 -->
      <JySectionTitle title="工艺流程" subtitle="自开料至抛光" />
      <view class="stages">
        <view v-for="(stage, index) in stages" :key="stage.name" class="stage">
          <view class="stage-head">
            <view class="stage-index">
              <text class="stage-index-text">{{ String(index + 1).padStart(2, '0') }}</text>
            </view>
            <view class="stage-line" />
            <text class="stage-name">{{ stage.name }}</text>
          </view>
          <text class="stage-desc">{{ stage.desc }}</text>
          <view class="stage-tags">
            <JyTag v-for="tag in stage.tags" :key="tag" :text="tag" />
          </view>
        </view>
      </view>

      <!-- 监工 -->
      <JySectionTitle title="雕刻监工" subtitle="定制订单专属" />
      <view class="monitor" @tap="goMonitor">
        <view class="monitor-visual">
          <view class="monitor-frame">
            <text class="monitor-glyph">监</text>
          </view>
        </view>
        <view class="monitor-info">
          <text class="monitor-title">实时观看你的作品被打磨</text>
          <text class="monitor-desc">
            定制订单支付定金后，服务端会为该订单生成专属的摄像头观看权限。
            实时画面、关键节点抓拍与录像回放均需通过服务端鉴权，前端不暴露长期播放密钥。
          </text>
          <view class="monitor-status">
            <text class="monitor-status-text">需先完成一笔定制订单</text>
          </view>
        </view>
      </view>

      <!-- 能力说明 -->
      <JySectionTitle title="工坊能力" />
      <view class="abilities">
        <view v-for="item in abilities" :key="item.title" class="ability">
          <text class="ability-title">{{ item.title }}</text>
          <text class="ability-desc">{{ item.desc }}</text>
        </view>
      </view>

      <JyDivider spaced text="金刚之源 · 自有工坊" />
      <view class="jy-bottom-hold" />
    </view>
  </view>
</template>

<script setup lang="ts">
import JyDivider from '@/components/JyDivider/JyDivider.vue'
import JySectionTitle from '@/components/JySectionTitle/JySectionTitle.vue'
import JyTag from '@/components/JyTag/JyTag.vue'

/**
 * 雕刻工坊（UI-16）
 *
 * 实施文档 2.2 把「工坊」定义为「品牌信任与能力展示」的 Tab。
 * 本批次做到内容可用：完整呈现七道工序与监工机制说明。
 *
 * 监工页（UI-15）与实时视频需要商用 IoT 视频云接入，属第 4 期范围，
 * 因此此处如实说明前置条件，而不是放一个点不动的假播放器。
 */

const stages = [
  {
    name: '开料',
    desc: '依原石的石形、石色与巾纹走向确定题材。开料一旦落刀便不可逆，是全流程中唯一「一次定生死」的环节。',
    tags: ['读石', '定题'],
  },
  {
    name: '粗雕',
    desc: '去多余石料，定下作品的大势与体量关系。此阶段决定作品的气韵是否立得住。',
    tags: ['定形', '取势'],
  },
  {
    name: '精修',
    desc: '开脸、理纹、走线。人物的神态、山水的层次都在这一步见分晓。',
    tags: ['开脸', '走刀'],
  },
  {
    name: '细刻',
    desc: '处理衣纹、鳞甲、竹节等细节，刀口需干净利落，避免反复修补。',
    tags: ['细节', '刀口'],
  },
  {
    name: '打磨',
    desc: '由粗砂至细砂逐级推进，将刀痕收平，露出石材本身的质地。',
    tags: ['去刀痕'],
  },
  {
    name: '抛光',
    desc: '七道抛光工序，使石面呈现温润的亚光或玻璃光泽。抛光程度直接影响作品的手感与观感。',
    tags: ['亚光', '玻光'],
  },
  {
    name: '质检出证',
    desc: '核验尺寸、重量、瑕疵与工艺完成度，录入一物一码档案并出具鉴定证书。',
    tags: ['质检', '出证'],
  },
]

const abilities = [
  {
    title: '自有工坊 · 非转包',
    desc: '作品在自有工坊完成，工序节点由工坊直接录入，不经过第三方转述。',
  },
  {
    title: '节点抓拍 · 可回溯',
    desc: '开料、精修、抛光等关键节点留档，定制订单可查看本单的工序记录。',
  },
  {
    title: '一物一码 · 全链可查',
    desc: '每件作品拥有唯一编号，扫码可查看原石来源、加工节点、质检结果与证书。',
  },
]

function goMonitor(): void {
  uni.showModal({
    title: '雕刻监工',
    content: '监工页需要接入商用 IoT 视频云，属第 4 期范围。当前可先提交定制需求。',
    showCancel: false,
    confirmText: '知道了',
  })
}
</script>

<style lang="scss" scoped>
.workshop {
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
// 工序
// ---------------------------------------------------------------------------
.stage {
  padding: $sp-4;
  margin-bottom: $sp-3;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.stage-head {
  display: flex;
  align-items: center;
}

.stage-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-xs;
}

.stage-index-text {
  font-family: $ff-serif;
  font-size: $fs-xs;
  color: var(--c-accent);
  letter-spacing: 1rpx;
}

.stage-line {
  width: 24rpx;
  height: $hairline;
  margin: 0 $sp-3;
  background: var(--c-line-strong);
}

.stage-name {
  font-family: $ff-serif;
  font-size: $fs-h3;
  color: var(--c-ink);
  letter-spacing: 4rpx;
}

.stage-desc {
  display: block;
  margin-top: $sp-3;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.85;
  text-align: justify;
}

.stage-tags {
  display: flex;
  margin-top: $sp-3;
}

.stage-tags > * {
  margin-right: 8rpx;
}

// ---------------------------------------------------------------------------
// 监工
// ---------------------------------------------------------------------------
.monitor {
  display: flex;
  padding: $sp-4;
  background: var(--c-surface);
  border: $hairline solid var(--c-line);
  border-radius: $r-md;
}

.monitor-visual {
  flex-shrink: 0;
  margin-right: $sp-4;
}

.monitor-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 130rpx;
  height: 130rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-sm;
  background: var(--c-bg-deep);
}

.monitor-glyph {
  font-family: $ff-serif;
  font-size: 48rpx;
  color: var(--c-ink-3);
}

.monitor-info {
  flex: 1;
  min-width: 0;
}

.monitor-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.monitor-desc {
  display: block;
  margin-top: $sp-2;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  line-height: 1.8;
}

.monitor-status {
  display: inline-flex;
  margin-top: $sp-3;
  padding: 4rpx 12rpx;
  border: $hairline solid var(--c-line-strong);
  border-radius: $r-xs;
}

.monitor-status-text {
  font-size: $fs-xxs;
  color: var(--c-ink-2);
}

// ---------------------------------------------------------------------------
// 能力
// ---------------------------------------------------------------------------
.ability {
  padding: $sp-3 0;
  border-bottom: $hairline solid var(--c-line);
}

.ability:last-child {
  border-bottom: none;
}

.ability-title {
  display: block;
  font-family: $ff-serif;
  font-size: $fs-sm;
  color: var(--c-ink);
  letter-spacing: 2rpx;
}

.ability-desc {
  display: block;
  margin-top: 8rpx;
  font-size: $fs-xs;
  color: var(--c-ink-3);
  line-height: 1.8;
}
</style>
