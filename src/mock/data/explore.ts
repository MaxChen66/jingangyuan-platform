import { STORAGE_KEYS } from '@/constants/config'
import type { BestiaryEntry, Collection, ExploreBatchItem, ExploreSeries } from '@/types'
import { getStorage, setStorage } from '@/utils/storage'

/**
 * 开石探索馆 Mock 数据
 *
 * 数据构造严格遵守实施文档 6.1 的数据一致性要求：
 *   1. 同一批次内 probability 之和必须等于 100%
 *   2. 批次剩余库存不得小于 0
 *
 * 为使规则可被用户核对（也便于日后测试断言），本文件的概率与数量满足
 *     probability = initialQty / totalStock × 100
 * 即概率由批次商品分布真实推导而来，而非另配的一套数字。
 *
 * 价格梯度设计遵循文档 9.1「同一套系商品成本差距及盲盒价格与相同非盲盒
 * 商品价格不应过大」「避免高价值商品作为巨大价差诱因」，因此最高价值商品
 * 相对价格保持在合理倍数内，且单个高价值品类的概率被压到极低。
 */

/** 批次内单个商品的概率与数量必须自洽，此函数用于断言 */
function assertProbabilitySum(items: ExploreBatchItem[]): void {
  const sum = items.reduce((acc, item) => acc + item.probability, 0)
  if (Math.abs(sum - 100) > 1e-6) {
    throw new Error(`批次概率之和必须为 100%，当前为 ${sum}%`)
  }
}

/** 从商品池取字段，避免在下面重复书写资料 */
interface SeedItem {
  productId: string
  productName: string
  productCoverTone: ExploreBatchItem['productCoverTone']
  grade: string
  probability: number
  initialQty: number
  value: number
  material: string
  size: string
}

function toBatchItems(seed: SeedItem[], soldMap: Record<string, number> = {}): ExploreBatchItem[] {
  return seed.map((s) => ({
    productId: s.productId,
    productName: s.productName,
    productCover: '',
    productCoverTone: s.productCoverTone,
    grade: s.grade,
    probability: s.probability,
    initialQty: s.initialQty,
    remainingQty: Math.max(0, s.initialQty - (soldMap[s.productId] ?? 0)),
    value: s.value,
    material: s.material,
    size: s.size,
  }))
}

// ---------------------------------------------------------------------------
// 矿区一：初雪矿脉（入门）
// 批次总量 1000
// ---------------------------------------------------------------------------
const seed1: SeedItem[] = [
  { productId: 'p_1009', productName: '事事如意 · 挂坠', productCoverTone: 'amber', grade: '雅品', probability: 30, initialQty: 300, value: 88000, material: '金伯利岩', size: '32 × 24 × 12 mm' },
  { productId: 'p_1004', productName: '平安无事牌 · 挂件', productCoverTone: 'paper', grade: '雅品', probability: 35, initialQty: 350, value: 168000, material: '金伯利岩', size: '46 × 28 × 9 mm' },
  { productId: 'p_1006', productName: '禅意山水 · 茶宠', productCoverTone: 'jade', grade: '上品', probability: 20, initialQty: 200, value: 96000, material: '金伯利岩', size: '58 × 34 × 30 mm' },
  { productId: 'p_1008', productName: '竹报平安 · 笔搁', productCoverTone: 'jade', grade: '上品', probability: 10, initialQty: 100, value: 128000, material: '金伯利岩', size: '112 × 30 × 26 mm' },
  { productId: 'p_1005', productName: '招财貔貅 · 手把件', productCoverTone: 'amber', grade: '珍品', probability: 4.5, initialQty: 45, value: 328000, material: '金伯利岩', size: '72 × 40 × 36 mm' },
  { productId: 'p_1003', productName: '云龙纹 · 金石印章', productCoverTone: 'crimson', grade: '典藏', probability: 0.5, initialQty: 5, value: 680000, material: '金伯利岩', size: '42 × 42 × 76 mm' },
]

// ---------------------------------------------------------------------------
// 矿区二：玄青矿脉（进阶）
// 批次总量 600
// ---------------------------------------------------------------------------
const seed2: SeedItem[] = [
  { productId: 'p_1006', productName: '禅意山水 · 茶宠', productCoverTone: 'jade', grade: '上品', probability: 28, initialQty: 168, value: 96000, material: '金伯利岩', size: '58 × 34 × 30 mm' },
  { productId: 'p_1008', productName: '竹报平安 · 笔搁', productCoverTone: 'jade', grade: '上品', probability: 30, initialQty: 180, value: 128000, material: '金伯利岩', size: '112 × 30 × 26 mm' },
  { productId: 'p_1004', productName: '平安无事牌 · 挂件', productCoverTone: 'paper', grade: '雅品', probability: 18, initialQty: 108, value: 168000, material: '金伯利岩', size: '46 × 28 × 9 mm' },
  { productId: 'p_1010', productName: '观音坐莲 · 挂件', productCoverTone: 'paper', grade: '珍品', probability: 15, initialQty: 90, value: 528000, material: '金伯利岩', size: '54 × 32 × 18 mm' },
  { productId: 'p_1003', productName: '云龙纹 · 金石印章', productCoverTone: 'crimson', grade: '典藏', probability: 6, initialQty: 36, value: 680000, material: '金伯利岩', size: '42 × 42 × 76 mm' },
  { productId: 'p_1012', productName: '麒麟送子 · 摆件', productCoverTone: 'amber', grade: '珍品', probability: 2.5, initialQty: 15, value: 1580000, material: '金伯利岩', size: '148 × 78 × 62 mm' },
  { productId: 'p_1001', productName: '松鹤延年 · 随形摆件', productCoverTone: 'jade', grade: '典藏', probability: 0.5, initialQty: 3, value: 2680000, material: '金伯利岩', size: '186 × 112 × 74 mm' },
]

// ---------------------------------------------------------------------------
// 矿区三：鎏金矿脉（高阶）
// 批次总量 300
// ---------------------------------------------------------------------------
const seed3: SeedItem[] = [
  { productId: 'p_1005', productName: '招财貔貅 · 手把件', productCoverTone: 'amber', grade: '珍品', probability: 26, initialQty: 78, value: 328000, material: '金伯利岩', size: '72 × 40 × 36 mm' },
  { productId: 'p_1010', productName: '观音坐莲 · 挂件', productCoverTone: 'paper', grade: '珍品', probability: 30, initialQty: 90, value: 528000, material: '金伯利岩', size: '54 × 32 × 18 mm' },
  { productId: 'p_1003', productName: '云龙纹 · 金石印章', productCoverTone: 'crimson', grade: '典藏', probability: 20, initialQty: 60, value: 680000, material: '金伯利岩', size: '42 × 42 × 76 mm' },
  { productId: 'p_1012', productName: '麒麟送子 · 摆件', productCoverTone: 'amber', grade: '珍品', probability: 15, initialQty: 45, value: 1580000, material: '金伯利岩', size: '148 × 78 × 62 mm' },
  { productId: 'p_1001', productName: '松鹤延年 · 随形摆件', productCoverTone: 'jade', grade: '典藏', probability: 6, initialQty: 18, value: 2680000, material: '金伯利岩', size: '186 × 112 × 74 mm' },
  { productId: 'p_1007', productName: '岁寒三友 · 案头组雕', productCoverTone: 'ink', grade: '孤品', probability: 3, initialQty: 9, value: 4680000, material: '金伯利岩', size: '240 × 96 × 68 mm' },
]

/** 开售以来的累计售出，用于推导真实剩余量 */
const soldMap1: Record<string, number> = { p_1009: 62, p_1004: 71, p_1006: 33, p_1008: 12, p_1005: 7, p_1003: 1 }
const soldMap2: Record<string, number> = { p_1006: 21, p_1008: 26, p_1004: 14, p_1010: 9, p_1003: 3, p_1012: 1, p_1001: 0 }
const soldMap3: Record<string, number> = { p_1005: 9, p_1010: 11, p_1003: 6, p_1012: 4, p_1001: 1, p_1007: 0 }

export const mockSeries: ExploreSeries[] = [
  {
    id: 's_01',
    name: '初雪矿脉',
    subtitle: '入门之选 · 一探石中天地',
    cover: '',
    coverTone: 'paper',
    story:
      '瓦房店矿区的浅层矿脉，石质温润，多出小品。当地匠人称之为「初雪」——石皮薄如初雪落瓦，一敲即见内里。此脉宜作入门之选，出石以随身挂件、茶席小品为主，偶有印章级料子，是新手第一次听见「石开之声」的地方。',
    price: 16800,
    originalPrice: 19800,
    status: 'on',
    batchId: 'b_2026090101',
    batchNo: 'KQ-20260901-A',
    totalStock: 1000,
    remainingStock: 1000 - Object.values(soldMap1).reduce((a, b) => a + b, 0),
    soldCount: Object.values(soldMap1).reduce((a, b) => a + b, 0),
    limitPerUser: 20,
    saleStart: '2026-09-01T10:00:00',
    saleEnd: '2026-10-31T23:59:59',
    valueRange: '¥ 880 ~ ¥ 6,800',
    shippingRule: '开石后藏品自动存入石头柜，可随时申请实体发货，单次发货可多选藏品合并寄出。',
    complianceNotice:
      '本商品为矿石实物盲盒，购买前请完整阅读商品范围、分布数量与抽取概率。抽取结果在服务端随机产生，与用户等级、充值金额无关，平台不提供现金回购、提现或用户间交易。未成年人请在监护人陪同下购买。',
    items: toBatchItems(seed1, soldMap1),
  },
  {
    id: 's_02',
    name: '玄青矿脉',
    subtitle: '进阶之选 · 可见石中云纹',
    cover: '',
    coverTone: 'ink',
    story:
      '蒙阴矿区的深层矿脉，石色偏玄，巾纹细密，是金伯利岩中最见「云气」的一脉。匠人说此脉的石有脾气——走刀时能听见料子的松紧，顺其势者得佳构。出石以文房清供与人物件为主，另有极低比例的典藏级摆件。',
    price: 39800,
    originalPrice: 46800,
    status: 'on',
    batchId: 'b_2026090501',
    batchNo: 'KQ-20260905-B',
    totalStock: 600,
    remainingStock: 600 - Object.values(soldMap2).reduce((a, b) => a + b, 0),
    soldCount: Object.values(soldMap2).reduce((a, b) => a + b, 0),
    limitPerUser: 10,
    saleStart: '2026-09-05T10:00:00',
    saleEnd: '2026-10-31T23:59:59',
    valueRange: '¥ 960 ~ ¥ 26,800',
    shippingRule: '开石后藏品自动存入石头柜，可随时申请实体发货，单次发货可多选藏品合并寄出。',
    complianceNotice:
      '本商品为矿石实物盲盒，购买前请完整阅读商品范围、分布数量与抽取概率。抽取结果在服务端随机产生，与用户等级、充值金额无关，平台不提供现金回购、提现或用户间交易。未成年人请在监护人陪同下购买。',
    items: toBatchItems(seed2, soldMap2),
  },
  {
    id: 's_03',
    name: '鎏金矿脉',
    subtitle: '高阶之选 · 老坑深料',
    cover: '',
    coverTone: 'amber',
    story:
      '瓦房店老坑最深处的矿脉，石质致密，打磨后泛鎏金光泽，故得此名。此脉出料少而精，多为可承重工的大料，是匠人愿意为之耗上百余工时的料子。此脉每批数量有限，售完即止。',
    price: 128000,
    originalPrice: 148000,
    status: 'on',
    batchId: 'b_2026091001',
    batchNo: 'KQ-20260910-C',
    totalStock: 300,
    remainingStock: 300 - Object.values(soldMap3).reduce((a, b) => a + b, 0),
    soldCount: Object.values(soldMap3).reduce((a, b) => a + b, 0),
    limitPerUser: 5,
    saleStart: '2026-09-10T10:00:00',
    saleEnd: '2026-10-31T23:59:59',
    valueRange: '¥ 3,280 ~ ¥ 46,800',
    shippingRule: '开石后藏品自动存入石头柜，可随时申请实体发货。高阶藏品建议单独发货并保价。',
    complianceNotice:
      '本商品为矿石实物盲盒，购买前请完整阅读商品范围、分布数量与抽取概率。抽取结果在服务端随机产生，与用户等级、充值金额无关，平台不提供现金回购、提现或用户间交易。未成年人请在监护人陪同下购买。',
    items: toBatchItems(seed3, soldMap3),
  },
]

// 启动即校验概率配置，配置错误应当在开发期立刻暴露
mockSeries.forEach((series) => assertProbabilitySum(series.items))

export function findSeries(id: string): ExploreSeries | undefined {
  return mockSeries.find((s) => s.id === id)
}

export function findSeriesByBatch(batchId: string): ExploreSeries | undefined {
  return mockSeries.find((s) => s.batchId === batchId)
}

// ---------------------------------------------------------------------------
// 用户藏品（石头柜）
// 持久化到本地存储，使「开石 → 石头柜」在刷新后依然连贯
// ---------------------------------------------------------------------------

const SEED_COLLECTIONS: Collection[] = [
  {
    id: 'col_seed_01',
    userId: 'u_10086',
    physicalItemId: 'pi_8001',
    uniqueCode: 'JGZ-PI-8001',
    productId: 'p_1008',
    productName: '竹报平安 · 笔搁',
    productCover: '',
    productCoverTone: 'jade',
    seriesId: 's_01',
    seriesName: '初雪矿脉',
    grade: '上品',
    material: '金伯利岩（橄榄岩）',
    texture: '巾纹细密，竹节处石色转深，有天然水线一道',
    size: '112 × 30 × 26 mm',
    weight: '108 g',
    foundAt: '2026-09-08T21:14:00',
    status: 'stored',
    traceCode: 'JGZ.TR.20260828.0880',
  },
  {
    id: 'col_seed_02',
    userId: 'u_10086',
    physicalItemId: 'pi_8002',
    uniqueCode: 'JGZ-PI-8002',
    productId: 'p_1006',
    productName: '禅意山水 · 茶宠',
    productCover: '',
    productCoverTone: 'jade',
    seriesId: 's_01',
    seriesName: '初雪矿脉',
    grade: '上品',
    material: '金伯利岩（橄榄岩）',
    texture: '浅浮雕山势，砂面均匀，热水浇淋后石色渐沉',
    size: '58 × 34 × 30 mm',
    weight: '92 g',
    foundAt: '2026-09-12T19:02:00',
    status: 'stored',
    traceCode: 'JGZ.TR.20260830.0888',
  },
  {
    id: 'col_seed_03',
    userId: 'u_10086',
    physicalItemId: 'pi_8003',
    uniqueCode: 'JGZ-PI-8003',
    productId: 'p_1004',
    productName: '平安无事牌 · 挂件',
    productCover: '',
    productCoverTone: 'paper',
    seriesId: 's_01',
    seriesName: '初雪矿脉',
    grade: '雅品',
    material: '金伯利岩（橄榄岩）',
    texture: '素面，背面留天然石皮一片，色如晨雾',
    size: '46 × 28 × 9 mm',
    weight: '38 g',
    foundAt: '2026-09-15T20:37:00',
    status: 'shipped',
    traceCode: 'JGZ.TR.20260903.0902',
  },
  {
    id: 'col_seed_04',
    userId: 'u_10086',
    physicalItemId: 'pi_8004',
    uniqueCode: 'JGZ-PI-8004',
    productId: 'p_1005',
    productName: '招财貔貅 · 手把件',
    productCover: '',
    productCoverTone: 'amber',
    seriesId: 's_02',
    seriesName: '玄青矿脉',
    grade: '珍品',
    material: '金伯利岩（橄榄岩）',
    texture: '圆雕，背部石色偏琥珀，已见包浆',
    size: '72 × 40 × 36 mm',
    weight: '156 g',
    foundAt: '2026-09-18T22:10:00',
    status: 'stored',
    traceCode: 'JGZ.TR.20260901.0895',
  },
]

export function loadCollections(): Collection[] {
  return getStorage<Collection[]>(STORAGE_KEYS.collection, SEED_COLLECTIONS)
}

export function saveCollections(list: Collection[]): void {
  setStorage(STORAGE_KEYS.collection, list)
}

export function appendCollection(item: Collection): void {
  const list = loadCollections()
  list.unshift(item)
  saveCollections(list)
}

/** 更新单个藏品状态，用于发货申请 */
export function patchCollection(id: string, patch: Partial<Collection>): Collection | undefined {
  const list = loadCollections()
  const target = list.find((c) => c.id === id)
  if (!target) return undefined
  Object.assign(target, patch)
  saveCollections(list)
  return target
}

// ---------------------------------------------------------------------------
// 矿物图鉴
// 图鉴覆盖全部矿区出现过的石种，按用户藏品推导「已发现 / 未发现」
// ---------------------------------------------------------------------------

export function buildBestiary(userId: string): BestiaryEntry[] {
  const collections = loadCollections().filter((c) => c.userId === userId)
  const countMap = new Map<string, number>()
  collections.forEach((c) => countMap.set(c.productId, (countMap.get(c.productId) ?? 0) + 1))

  const entries = new Map<string, BestiaryEntry>()
  mockSeries.forEach((series) => {
    series.items.forEach((item) => {
      if (entries.has(item.productId)) {
        const existing = entries.get(item.productId) as BestiaryEntry
        existing.count = countMap.get(item.productId) ?? 0
        existing.collected = existing.count > 0
        return
      }
      const count = countMap.get(item.productId) ?? 0
      entries.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        productCover: item.productCover,
        productCoverTone: item.productCoverTone,
        grade: item.grade,
        material: item.material,
        seriesId: series.id,
        seriesName: series.name,
        collected: count > 0,
        count,
      })
    })
  })
  return Array.from(entries.values())
}

/** 生成实体唯一编号。一期以时间戳 + 随机数模拟，第 5 期由服务端序列生成 */
export function nextPhysicalCode(): string {
  return `JGZ-PI-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`
}
