import { ErrorCode } from '@/types'
import type { HomeBanner, MallHomeData, PageResult, Product, TraceInfo } from '@/types'
import { ApiError } from '@/utils/error'
import { defineMock } from '../registry'
import { findProduct, mockCategories, mockProducts } from '../data/goods'

const banners: HomeBanner[] = [
  {
    id: 'bn_home_01',
    title: '一石一世界',
    subtitle: '金伯利岩雕刻工艺品 · 老坑料 · 附证书',
    tone: 'ink',
    link: '/pagesMall/list/index?categoryId=c_sc',
  },
  {
    id: 'bn_home_02',
    title: '开石探索馆',
    subtitle: '听一次石开之声 · 三条矿脉正在开售',
    tone: 'amber',
    link: '/pagesExplore/home/index',
  },
  {
    id: 'bn_home_03',
    title: '私人定制',
    subtitle: '新婚 · 企业商务 · 私人主题',
    tone: 'crimson',
    link: '/pagesCustom/index/index',
  },
]

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

defineMock('GET', '/api/mall/home', (): MallHomeData => {
  const onSale = mockProducts.filter((p) => p.status === 'on')
  return {
    banners,
    categories: mockCategories,
    recommend: onSale.filter((p) => p.tags.includes('热门') || p.tags.includes('重器')).slice(0, 4),
    newArrivals: [...onSale].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
  }
})

defineMock('GET', '/api/mall/categories', () => mockCategories)

defineMock('GET', '/api/mall/products', (ctx): PageResult<Product> => {
  const keyword = str(ctx.data.keyword).trim()
  const categoryId = str(ctx.data.categoryId)
  const sort = str(ctx.data.sort, 'default')
  const page = Math.max(1, num(ctx.data.page, 1))
  const pageSize = Math.max(1, num(ctx.data.pageSize, 10))
  // 价格区间以「分」传入
  const minPrice = num(ctx.data.minPrice, 0)
  const maxPrice = num(ctx.data.maxPrice, Number.MAX_SAFE_INTEGER)

  let list = mockProducts.filter((p) => p.status === 'on')

  if (categoryId) list = list.filter((p) => p.categoryId === categoryId)
  if (keyword) {
    list = list.filter(
      (p) =>
        p.name.includes(keyword) ||
        p.subtitle.includes(keyword) ||
        p.material.includes(keyword) ||
        p.meaning.includes(keyword)
    )
  }
  list = list.filter((p) => p.price >= minPrice && p.price <= maxPrice)

  switch (sort) {
    case 'price_asc':
      list = [...list].sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      list = [...list].sort((a, b) => b.price - a.price)
      break
    case 'sales':
      list = [...list].sort((a, b) => b.sales - a.sales)
      break
    default:
      break
  }

  const total = list.length
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  }
})

defineMock('GET', '/api/mall/products/:id', (ctx): Product => {
  const product = findProduct(ctx.params.id)
  if (!product) throw new ApiError(ErrorCode.NOT_FOUND, '商品不存在或已下架')
  return product
})

/** 商品详情页的溯源预览信息 */
defineMock('GET', '/api/mall/products/:id/trace', (ctx): TraceInfo => {
  const product = findProduct(ctx.params.id)
  if (!product) throw new ApiError(ErrorCode.NOT_FOUND, '商品不存在或已下架')
  return {
    traceCode: product.traceCode,
    certificate: product.certificate,
    material: product.material,
    origin: product.origin,
    size: product.size,
    weight: product.weight,
    craft: product.craft,
    records: [
      { time: '2026-06-18', title: '原石入库', desc: `${product.origin} · 完成原石建档与称重` },
      { time: '2026-07-02', title: '开料定形', desc: '依石形确定题材，进入粗雕' },
      { time: '2026-07-25', title: '精修抛光', desc: '七道抛光工序完成' },
      { time: '2026-08-05', title: '质检出证', desc: `出具鉴定证书 ${product.certificate}` },
    ],
  }
})
