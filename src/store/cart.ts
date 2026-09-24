import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/constants/config'
import type { Product, StoneTone } from '@/types'
import { clamp } from '@/utils/format'
import { getStorage, setStorage } from '@/utils/storage'

/**
 * 购物车
 *
 * 购物车本属客户端状态，因此直接持久化到本地存储，不经过 Mock 接口。
 * 第 3 期接入后端购物车后可改为接口同步，此处的组件调用方式不变。
 */

export interface CartItem {
  productId: string
  name: string
  cover: string
  coverTone: StoneTone
  price: number
  spec: string
  quantity: number
  /** 是否勾选结算 */
  checked: boolean
  /** 商品库存上限，用于步进器限位 */
  stock: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(getStorage<CartItem[]>(STORAGE_KEYS.cart, []))

  // 任何改动都落盘，保证刷新后购物车仍在
  watch(
    items,
    (value) => {
      setStorage(STORAGE_KEYS.cart, value)
    },
    { deep: true }
  )

  /** 商品种类数 */
  const kindCount = computed(() => items.value.length)

  /** 商品总件数 */
  const totalCount = computed(() => items.value.reduce((acc, item) => acc + item.quantity, 0))

  const checkedItems = computed(() => items.value.filter((item) => item.checked))

  const checkedCount = computed(() =>
    checkedItems.value.reduce((acc, item) => acc + item.quantity, 0)
  )

  /** 已勾选商品的合计金额 */
  const totalAmount = computed(() =>
    checkedItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const allChecked = computed(
    () => items.value.length > 0 && items.value.every((item) => item.checked)
  )

  function find(productId: string): CartItem | undefined {
    return items.value.find((item) => item.productId === productId)
  }

  /** 加入购物车。已存在则累加数量，并受库存上限约束 */
  function add(product: Product, quantity = 1): void {
    const existing = find(product.id)
    if (existing) {
      existing.quantity = clamp(existing.quantity + quantity, 1, Math.max(1, product.stock))
      existing.checked = true
      return
    }
    items.value.unshift({
      productId: product.id,
      name: product.name,
      cover: product.cover,
      coverTone: product.coverTone,
      price: product.price,
      spec: `${product.origin} · ${product.size}`,
      quantity: clamp(quantity, 1, Math.max(1, product.stock)),
      checked: true,
      stock: product.stock,
    })
  }

  function updateQuantity(productId: string, quantity: number): void {
    const target = find(productId)
    if (!target) return
    target.quantity = clamp(quantity, 1, Math.max(1, target.stock))
  }

  function remove(productId: string): void {
    items.value = items.value.filter((item) => item.productId !== productId)
  }

  function toggleCheck(productId: string): void {
    const target = find(productId)
    if (target) target.checked = !target.checked
  }

  function toggleAll(checked: boolean): void {
    items.value.forEach((item) => {
      item.checked = checked
    })
  }

  /** 下单成功后移除已勾选的商品 */
  function removeChecked(): void {
    items.value = items.value.filter((item) => !item.checked)
  }

  return {
    items,
    kindCount,
    totalCount,
    checkedItems,
    checkedCount,
    totalAmount,
    allChecked,
    add,
    updateQuantity,
    remove,
    toggleCheck,
    toggleAll,
    removeChecked,
  }
})
