import { STORAGE_KEYS } from '@/constants/config'
import type { DrawRecord } from '@/types'
import { getStorage, setStorage } from '@/utils/storage'

/**
 * 开奖记录持久化
 *
 * 对应文档 6 节的 draw_record 表，是合规审计的核心凭证：
 * 「每一次支付都能追溯到唯一结果，每一个结果都能追溯到真实库存」。
 *
 * 一期的关键行为：记录以 orderId 为唯一键，重复请求开奖接口只返回同一条记录，
 * 从而实现文档 7.2 要求的幂等 —— 用户重复点击只能产生一个结果。
 */

export function loadDrawRecords(): DrawRecord[] {
  return getStorage<DrawRecord[]>(STORAGE_KEYS.drawRecords, [])
}

export function saveDrawRecords(list: DrawRecord[]): void {
  setStorage(STORAGE_KEYS.drawRecords, list)
}

/** 按订单查开奖结果。命中即代表该订单已开奖，用于幂等判定 */
export function findDrawByOrder(orderId: string): DrawRecord | undefined {
  return loadDrawRecords().find((r) => r.orderId === orderId)
}

export function appendDrawRecord(record: DrawRecord): void {
  const list = loadDrawRecords()
  list.unshift(record)
  saveDrawRecords(list)
}

/** 算法版本号，写入每条开奖记录，供日后审计追溯规则变更 */
export const DRAW_ALGORITHM_VERSION = 'batch-weighted-v1'
