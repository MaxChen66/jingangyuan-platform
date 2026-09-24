<template>
  <view class="draw theme-ink">
    <view class="stage">
      <!-- 矿物辉光，随阶段增强 -->
      <view class="glow" :class="`glow-${phase}`" />

      <view class="stage-head">
        <text class="series-name">{{ seriesName }}</text>
        <text class="phase-text">{{ phaseText }}</text>
      </view>

      <!-- 原石与动效 -->
      <view class="stone-wrap" :class="`stage-${phase}`">
        <view class="stone-box">
          <JyStoneVisual
            :tone="stoneTone"
            :seed="seed"
            ratio="1"
            radius="10rpx"
            :glyph="phase === 'done' ? '' : '石'"
          />
          <!-- 裂纹：三道路径，随 cracking 阶段依次展开 -->
          <view class="cracks" :class="{ visible: crackVisible }">
            <view class="crack crack-1" />
            <view class="crack crack-2" />
            <view class="crack crack-3" />
          </view>
        </view>

        <!-- 敲击冲击环 -->
        <view v-if="phase === 'striking'" class="impact" />
      </view>

      <!-- 阶段进度 -->
      <view class="phases">
        <view
          v-for="(item, index) in phaseList"
          :key="item.key"
          class="phase-item"
          :class="{ active: item.key === phase, passed: phaseIndex > index }"
        >
          <view class="phase-dot" />
          <text class="phase-label">{{ item.label }}</text>
        </view>
      </view>

      <!-- 操作区 -->
      <view class="actions jy-safe-bottom">
        <template v-if="errorMessage">
          <text class="error-text">{{ errorMessage }}</text>
          <JyButton text="重新开石" variant="gold" size="large" block @tap="startDraw" />
        </template>

        <template v-else-if="phase === 'done'">
          <JyButton
            :text="record ? '查看结果' : '正在揭晓…'"
            variant="gold"
            size="large"
            block
            :loading="!record"
            @tap="goResult"
          />
        </template>

        <template v-else>
          <view class="skip" @tap="skip">
            <text class="skip-text">跳过动画</text>
          </view>
          <text class="hint">结果由服务端生成，动画仅为呈现</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import JyButton from '@/components/JyButton/JyButton.vue'
import JyStoneVisual from '@/components/JyStoneVisual/JyStoneVisual.vue'
import { exploreApi } from '@/api'
import { useExploreStore } from '@/store/explore'
import type { DrawPhase, DrawRecord, StoneTone } from '@/types'

/**
 * 开石（UI-20）
 *
 * 关键架构决定：**先请求服务端判定结果，再播放动画**。
 *
 * 实施文档 7.4 要求「结果不可被前端伪造」，P5-07 要求「抓包无法伪造开奖结果」。
 * 若按「先播动画、后取结果」实现，动画期间前端就掌握了尚未确认的状态，
 * 一旦请求失败会出现「演完了却没结果」的尴尬，且给了中间态被干预的空间。
 * 因此本页在进入时立即发起开奖请求，动画只负责把已经确定的结果呈现出来。
 *
 * 幂等由服务端保证（Mock 模块亦实现），因此本页的防重复点击是体验优化而非唯一防线。
 */

const exploreStore = useExploreStore()

const orderId = ref('')
const phase = ref<DrawPhase>('observe')
const record = ref<DrawRecord | null>(null)
const errorMessage = ref('')
/** 防重复点击：请求进行中不再发起第二次 */
const drawing = ref(false)

const phaseList = [
  { key: 'observe' as DrawPhase, label: '观察' },
  { key: 'striking' as DrawPhase, label: '敲击' },
  { key: 'cracking' as DrawPhase, label: '裂纹' },
  { key: 'revealing' as DrawPhase, label: '揭晓' },
]

const phaseIndex = computed(() => phaseList.findIndex((p) => p.key === phase.value))

const phaseText = computed(() => {
  switch (phase.value) {
    case 'observe':
      return '凝神观石，寻其纹路'
    case 'striking':
      return '落锤'
    case 'cracking':
      return '石开'
    case 'revealing':
      return '见其内里'
    default:
      return '已成'
  }
})

const seriesName = computed(() => exploreStore.currentSeries?.name ?? '开石探索')

const stoneTone = computed<StoneTone>(() => {
  // 揭晓后优先呈现真实所得的石种，使「原石即结果」的叙事成立。
  // 从订单列表直接进入时没有 currentSeries，此处正好补上。
  if ((phase.value === 'revealing' || phase.value === 'done') && record.value) {
    return record.value.productCoverTone
  }
  return exploreStore.currentSeries?.coverTone ?? 'jade'
})

const seed = computed(() => exploreStore.currentSeries?.id ?? 'explore')

const crackVisible = computed(
  () => phase.value === 'cracking' || phase.value === 'revealing' || phase.value === 'done'
)

// ---------------------------------------------------------------------------
// 阶段推进
// ---------------------------------------------------------------------------
const timers: number[] = []

function clearTimers(): void {
  timers.forEach((t) => clearTimeout(t))
  timers.length = 0
}

/** 动画时间轴。可被 skip() 直接跳到终点 */
function runAnimation(): void {
  clearTimers()
  phase.value = 'observe'
  const at = (ms: number, next: DrawPhase) => {
    timers.push(setTimeout(() => {
      phase.value = next
    }, ms) as unknown as number)
  }
  at(1200, 'striking')
  at(2100, 'cracking')
  at(3000, 'revealing')
  at(3900, 'done')
}

/** 跳过动画：直接进入揭晓态。结果若尚未返回，按钮会进入 loading 等待 */
function skip(): void {
  clearTimers()
  phase.value = 'done'
}

// ---------------------------------------------------------------------------
// 开奖
// ---------------------------------------------------------------------------
async function startDraw(): Promise<void> {
  // 防重复点击。服务端仍是最终防线，此处只是避免无谓请求
  if (drawing.value) return
  drawing.value = true
  errorMessage.value = ''
  record.value = null

  exploreStore.beginDraw(orderId.value, exploreStore.currentSeries)
  runAnimation()

  try {
    record.value = await exploreApi.drawStone(orderId.value)
    exploreStore.setRecord(record.value)
  } catch (err) {
    clearTimers()
    // 已有结果的订单重复进入时，服务端幂等返回同一结果；
    // 若这里拿到的是「已完成开石」类错误，说明结果已存在，直接取回即可
    try {
      record.value = await exploreApi.fetchDrawResult(orderId.value)
      exploreStore.setRecord(record.value)
      phase.value = 'done'
    } catch {
      errorMessage.value = err instanceof Error ? err.message : '开石失败，请重试'
      phase.value = 'observe'
    }
  } finally {
    drawing.value = false
  }
}

function goResult(): void {
  if (!record.value) return
  uni.redirectTo({ url: `/pagesExplore/result/index?orderId=${orderId.value}` })
}

onLoad((query) => {
  orderId.value = String(query?.orderId ?? '')
  if (!orderId.value) {
    errorMessage.value = '缺少订单信息'
    return
  }
  void startDraw()
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style lang="scss" scoped>
.draw {
  min-height: 100vh;
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 0 $sp-5;
  overflow: hidden;
}

// ---------------------------------------------------------------------------
// 辉光
// ---------------------------------------------------------------------------
.glow {
  position: absolute;
  top: 22%;
  left: 50%;
  width: 560rpx;
  height: 560rpx;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(62, 107, 99, 0.3) 0%, rgba(62, 107, 99, 0) 70%);
  transition: opacity $dur-slow $ease-cn;
}

.glow-cracking {
  background: radial-gradient(circle, rgba(200, 161, 90, 0.34) 0%, rgba(200, 161, 90, 0) 70%);
}

.glow-revealing,
.glow-done {
  background: radial-gradient(circle, rgba(200, 161, 90, 0.5) 0%, rgba(200, 161, 90, 0) 72%);
}

// ---------------------------------------------------------------------------
// 头部
// ---------------------------------------------------------------------------
.stage-head {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $sp-6 0 $sp-5;
}

.series-name {
  font-family: $ff-serif;
  font-size: $fs-h2;
  color: var(--c-ink);
  letter-spacing: 8rpx;
}

.phase-text {
  margin-top: $sp-3;
  font-family: $ff-serif;
  font-size: $fs-body;
  color: var(--c-accent);
  letter-spacing: 6rpx;
}

// ---------------------------------------------------------------------------
// 原石
// ---------------------------------------------------------------------------
.stone-wrap {
  position: relative;
  width: 460rpx;
  height: 460rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stone-box {
  position: relative;
  width: 420rpx;
  transition: transform $dur-base $ease-cn;
}

// 观察：轻微呼吸，暗示尚未落锤
.stage-observe .stone-box {
  animation: jy-breathe 2.4s $ease-cn infinite;
}

// 敲击：短促震动
.stage-striking .stone-box {
  animation: jy-shake 0.34s $ease-cn 2;
}

// 裂纹：略微下沉
.stage-cracking .stone-box {
  transform: scale(0.97);
}

// 揭晓：微微上浮并放大，配合辉光
.stage-revealing .stone-box,
.stage-done .stone-box {
  transform: scale(1.04);
}

@keyframes jy-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes jy-shake {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-8rpx) rotate(-0.8deg);
  }
  75% {
    transform: translateX(8rpx) rotate(0.8deg);
  }
}

// ---------------------------------------------------------------------------
// 裂纹
// ---------------------------------------------------------------------------
.cracks {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0;
  transition: opacity $dur-base $ease-cn;
  pointer-events: none;
}

.cracks.visible {
  opacity: 1;
}

.crack {
  position: absolute;
  background: linear-gradient(180deg, rgba(255, 253, 248, 0) 0%, rgba(255, 253, 248, 0.9) 50%, rgba(255, 253, 248, 0) 100%);
  transform-origin: top center;
}

// 三道裂纹从中心向外以不同角度、不同时长展开
.crack-1 {
  top: 6%;
  left: 48%;
  width: 2rpx;
  height: 46%;
  transform: rotate(14deg);
  transition: height $dur-base $ease-cn;
}

.crack-2 {
  top: 34%;
  left: 22%;
  width: 2rpx;
  height: 40%;
  transform: rotate(-52deg);
}

.crack-3 {
  top: 40%;
  left: 68%;
  width: 2rpx;
  height: 36%;
  transform: rotate(58deg);
}

// ---------------------------------------------------------------------------
// 冲击环
// ---------------------------------------------------------------------------
.impact {
  position: absolute;
  width: 200rpx;
  height: 200rpx;
  border: 2rpx solid rgba(200, 161, 90, 0.8);
  border-radius: 50%;
  animation: jy-impact 0.68s $ease-cn forwards;
}

@keyframes jy-impact {
  0% {
    transform: scale(0.4);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

// ---------------------------------------------------------------------------
// 阶段指示
// ---------------------------------------------------------------------------
.phases {
  display: flex;
  align-items: center;
  margin-top: $sp-6;
}

.phase-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120rpx;
}

.phase-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--c-line);
  transition: background $dur-base $ease-cn, transform $dur-base $ease-cn;
}

.phase-label {
  margin-top: 12rpx;
  font-family: $ff-serif;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
  transition: color $dur-base $ease-cn;
}

.phase-item.passed .phase-dot {
  background: var(--c-glow-jade);
}

.phase-item.active .phase-dot {
  background: var(--c-accent);
  transform: scale(1.6);
}

.phase-item.active .phase-label {
  color: var(--c-accent);
}

// ---------------------------------------------------------------------------
// 操作区
// ---------------------------------------------------------------------------
.actions {
  width: 100%;
  margin-top: auto;
  padding-top: $sp-6;
  padding-bottom: $sp-6;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skip {
  padding: 12rpx 32rpx;
  border: $hairline solid var(--c-line);
  border-radius: $r-xs;
}

.skip-text {
  font-size: $fs-xs;
  color: var(--c-ink-2);
  letter-spacing: 2rpx;
}

.hint {
  margin-top: $sp-3;
  font-size: $fs-xxs;
  color: var(--c-ink-3);
}

.error-text {
  margin-bottom: $sp-3;
  font-size: $fs-sm;
  color: var(--c-danger);
  text-align: center;
}
</style>
