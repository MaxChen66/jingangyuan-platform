import type { MallHomeData, PageResult, Product, ProductCategory, TraceInfo } from '@/types'
import { request } from '@/utils/request'

/**
 * 商城接口
 *
 * 页面只依赖本文件，不感知背后是 Mock 还是真实后端。
 * 查询参数刻意使用 type 别名而非 interface —— TS 只为对象类型别名推断
 * 隐式索引签名，interface 无法赋值给 request 的 data 参数。
 */

export type ProductSort = 'default' | 'price_asc' | 'price_desc' | 'sales'

export type ProductQuery = {
  categoryId?: string
  keyword?: string
  sort?: ProductSort
  page?: number
  pageSize?: number
  /** 价格区间，单位「分」 */
  minPrice?: number
  maxPrice?: number
}

export function fetchMallHome(): Promise<MallHomeData> {
  return request<MallHomeData>({ url: '/api/mall/home' })
}

export function fetchCategories(): Promise<ProductCategory[]> {
  return request<ProductCategory[]>({ url: '/api/mall/categories' })
}

export function fetchProducts(query: ProductQuery = {}): Promise<PageResult<Product>> {
  return request<PageResult<Product>>({ url: '/api/mall/products', data: { ...query } })
}

export function fetchProductDetail(id: string): Promise<Product> {
  return request<Product>({ url: `/api/mall/products/${id}` })
}

export function fetchProductTrace(id: string): Promise<TraceInfo> {
  return request<TraceInfo>({ url: `/api/mall/products/${id}/trace` })
}
