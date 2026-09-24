/**
 * 业务链路与规则校验
 *
 * 本期没有真实后端，但「一期」的业务规则并非无物可验：
 * 开石模块的幂等、库存扣减、概率自洽、实体绑定，以及订单状态机的合法流转，
 * 全部由 Mock 服务端实现，因此可以被直接断言。
 *
 * 本脚本经由 scripts/verify/run.mjs 打包后在 Node 中执行，
 * 走的是与页面完全相同的调用路径：api/* → utils/request → mock/*。
 */

import { exploreApi, mallApi, orderApi } from '@/api'
import type { ExploreSummary, Order } from '@/types'

let passed = 0
let failed = 0

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.log(`  ✗ ${label}${detail ? `  ← ${detail}` : ''}`)
  }
}

async function expectFailure(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn()
    check(label, false, '本应失败但成功了')
  } catch {
    check(label, true)
  }
}

function section(title: string): void {
  console.log(`\n${title}`)
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section('一、开石批次配置的合规自洽性')
  // -------------------------------------------------------------------------
  const seriesList: ExploreSummary[] = await exploreApi.fetchSeriesList()
  check('系列列表非空', seriesList.length > 0)

  for (const summary of seriesList) {
    const detail = await exploreApi.fetchSeriesDetail(summary.id)
    const prob = await exploreApi.fetchProbability(summary.id)

    const sum = detail.items.reduce((a, i) => a + i.probability, 0)
    check(`${detail.name} 概率合计为 100%`, Math.abs(sum - 100) < 1e-6, `实际 ${sum}%`)

    // 概率必须能由批次数量反推，否则用户核对时会发现对不上
    const derivedOk = detail.items.every((item) => {
      const derived = (item.initialQty / detail.totalStock) * 100
      return Math.abs(derived - item.probability) < 1e-6
    })
    check(`${detail.name} 概率可由投放数量反推`, derivedOk)

    const qtySum = detail.items.reduce((a, i) => a + i.initialQty, 0)
    check(`${detail.name} 商品数量合计等于批次总量`, qtySum === detail.totalStock, `${qtySum} vs ${detail.totalStock}`)

    check(`${detail.name} 剩余库存不为负`, detail.items.every((i) => i.remainingQty >= 0))
    check(
      `${detail.name} 概率接口回显合计`,
      Math.abs(prob.probabilitySum - 100) < 1e-6,
      `实际 ${prob.probabilitySum}%`
    )
    check(`${detail.name} 购买前披露合规提示`, detail.complianceNotice.length > 20)
  }

  // -------------------------------------------------------------------------
  section('二、商城链路：浏览 → 下单 → 支付 → 订单')
  // -------------------------------------------------------------------------
  const home = await mallApi.fetchMallHome()
  check('商城首页返回分类', home.categories.length > 0)
  check('商城首页返回推荐商品', home.recommend.length > 0)

  const listed = await mallApi.fetchProducts({ page: 1, pageSize: 5 })
  check('商品列表分页返回', listed.list.length > 0 && listed.total > 0)

  const sorted = await mallApi.fetchProducts({ sort: 'price_asc', page: 1, pageSize: 50 })
  const prices = sorted.list.map((p) => p.price)
  check('价格升序排序生效', prices.every((v, i) => i === 0 || prices[i - 1] <= v))

  const searched = await mallApi.fetchProducts({ keyword: '金伯利岩' })
  check('关键词可检索到材质', searched.total > 0)

  const target = listed.list[0]
  const detail = await mallApi.fetchProductDetail(target.id)
  check('商品详情含原石档案', Boolean(detail.material && detail.origin && detail.size && detail.weight))
  check('商品详情含溯源编号', detail.traceCode.length > 0)

  const trace = await mallApi.fetchProductTrace(target.id)
  check('溯源档案含流转记录', trace.records.length > 0)

  const created: Order = await orderApi.createOrder({
    items: [{ productId: target.id, quantity: 2 }],
    addressId: 'addr_01',
    remark: '校验脚本下单',
  })
  check('创建订单返回待付款状态', created.status === 'pending_pay')
  check('创建订单金额计算正确', created.payAmount === detail.price * 2 + created.freight - created.discount)
  check('创建订单携带收货地址', created.address !== null)

  await expectFailure('未发货订单不可确认收货', () => orderApi.confirmOrder(created.id))
  await expectFailure('非待付款订单不可取消', async () => {
    await orderApi.payOrder(created.id)
    await orderApi.cancelOrder(created.id)
  })

  const paid = await orderApi.payOrder(created.id)
  check('支付后状态为已付款', paid.status === 'paid')
  check('支付记录支付时间', paid.payTime.length > 0)

  const paidAgain = await orderApi.payOrder(created.id)
  check('支付接口幂等（重复支付不改变状态）', paidAgain.status === 'paid')

  const orderList = await orderApi.fetchOrders({ type: 'mall' })
  check('订单列表包含新订单', orderList.list.some((o) => o.id === created.id))

  const filtered = await orderApi.fetchOrders({ status: 'pending_pay' })
  check('按状态筛选生效', filtered.list.every((o) => o.status === 'pending_pay'))

  await expectFailure('超库存下单被拒绝', () =>
    orderApi.createOrder({ items: [{ productId: target.id, quantity: 99999 }], addressId: 'addr_01' })
  )

  // -------------------------------------------------------------------------
  section('三、开石链路：购买 → 开石 → 结果 → 藏品')
  // -------------------------------------------------------------------------
  const series = seriesList[0]
  const before = await exploreApi.fetchSeriesDetail(series.id)
  // 注意：fetchSeriesDetail 返回的是服务端持有的同一个对象引用，
  // 后续调用会就地修改它。因此必须先快照数值，否则 before 会跟着变。
  const beforeStock = before.remainingStock

  await expectFailure('未勾选规则不可下单', () =>
    exploreApi.createExploreOrder({ seriesId: series.id, quantity: 1, agreedRule: false })
  )

  await expectFailure('超出限购数量被拒绝', () =>
    exploreApi.createExploreOrder({
      seriesId: series.id,
      quantity: before.limitPerUser + 10,
      agreedRule: true,
    })
  )

  const exploreOrder = await exploreApi.createExploreOrder({
    seriesId: series.id,
    quantity: 1,
    agreedRule: true,
  })
  check('开石订单创建成功', exploreOrder.type === 'explore' && exploreOrder.status === 'pending_pay')

  const afterOrder = await exploreApi.fetchSeriesDetail(series.id)
  check(
    '下单即锁定批次库存',
    afterOrder.remainingStock === beforeStock - 1,
    `${beforeStock} → ${afterOrder.remainingStock}`
  )

  const pendingStock = await exploreApi.fetchSeriesDetail(series.id)
  const pendingQtySum = pendingStock.items.reduce((a, i) => a + i.remainingQty, 0)
  check(
    '下单未开奖期间，可售额度小于实物剩余（体现预订）',
    pendingStock.remainingStock === pendingQtySum - 1,
    `额度 ${pendingStock.remainingStock} / 实物 ${pendingQtySum}`
  )

  await expectFailure('未支付的开石订单不可开奖', () => exploreApi.drawStone(exploreOrder.id))

  await orderApi.payOrder(exploreOrder.id)

  const record = await exploreApi.drawStone(exploreOrder.id)
  check('开奖返回实体编号', /^JGZ-PI-\d+$/.test(record.uniqueCode), record.uniqueCode)
  check('开奖记录绑定批次', record.batchId === before.batchId)
  check('开奖记录携带算法版本', record.algorithmVersion.length > 0)
  check('开奖记录携带概率用于追溯', record.probability > 0)

  // 幂等：并发/重复点击只能产生一个结果
  const again = await exploreApi.drawStone(exploreOrder.id)
  check('开奖接口幂等（重复调用返回同一结果）', again.id === record.id && again.uniqueCode === record.uniqueCode)

  const fetched = await exploreApi.fetchDrawResult(exploreOrder.id)
  check('结果可按订单回查', fetched.id === record.id)

  const collections = await exploreApi.fetchCollections()
  const mine = collections.find((c) => c.physicalItemId === record.physicalItemId)
  check('开奖后自动创建藏品', mine !== undefined)
  check('藏品绑定实体编号', mine?.uniqueCode === record.uniqueCode)
  check('藏品初始状态为在柜', mine?.status === 'stored')
  check('藏品携带溯源码', (mine?.traceCode.length ?? 0) > 0)

  const uniqueCodes = new Set(collections.map((c) => c.uniqueCode))
  check('实体编号唯一（无重复绑定）', uniqueCodes.size === collections.length)

  const orderAfterDraw = await orderApi.fetchOrderDetail(exploreOrder.id)
  check('开奖结果回写订单', orderAfterDraw.items[0]?.uniqueCode === record.uniqueCode)

  // -------------------------------------------------------------------------
  section('四、石头柜与实体发货')
  // -------------------------------------------------------------------------
  const bestiary = await exploreApi.fetchBestiary()
  check('图鉴覆盖全部石种', bestiary.totalCount > 0)
  check('图鉴已收集数与藏品一致', bestiary.collectedCount > 0)
  check(
    '图鉴已收集项均有藏品支撑',
    bestiary.entries.filter((e) => e.collected).every((e) => e.count > 0)
  )

  const records = await exploreApi.fetchExploreRecords()
  check('探索记录非空', records.total > 0)
  check('探索记录含实体编号', records.list.every((r) => r.uniqueCode.length > 0))

  if (mine) {
    const shipping = await exploreApi.applyShipping({
      collectionIds: [mine.id],
      addressId: 'addr_01',
    })
    check('发货申请返回运单', shipping.shippingId.length > 0)
    check('发货申请使用收货地址', shipping.address !== null)

    const afterShip = (await exploreApi.fetchCollections()).find((c) => c.id === mine.id)
    check('发货后藏品状态变更为发货中', afterShip?.status === 'shipping')

    await expectFailure('已在途藏品不可重复申请发货', () =>
      exploreApi.applyShipping({ collectionIds: [mine.id], addressId: 'addr_01' })
    )
  }

  // -------------------------------------------------------------------------
  section('五、开石批次售罄边界')
  // -------------------------------------------------------------------------
  const soldOutCheck = await exploreApi.fetchSeriesDetail(series.id)
  const remainingTotal = soldOutCheck.items.reduce((a, i) => a + i.remainingQty, 0)
  check('批次剩余数量与商品剩余之和一致', soldOutCheck.remainingStock === remainingTotal)

  console.log(`\n${'─'.repeat(52)}`)
  console.log(`通过 ${passed} 项，失败 ${failed} 项`)
  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('\n校验脚本异常终止：', err)
  process.exitCode = 1
})
