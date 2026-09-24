import type { Amount } from './common'

/** 会员等级。文档 11.1：等级不改变开石结果概率 */
export type MemberLevel = 'stone' | 'jade' | 'gold'

export interface UserProfile {
  id: string
  nickname: string
  avatar: string
  phone: string
  level: MemberLevel
  levelName: string
  /** 成长值 */
  growth: number
  /** 距下一等级所需成长值，最高等级为 0 */
  growthToNext: number
  points: number
}

export interface PointsRecord {
  id: string
  title: string
  /** 正数为获得，负数为消耗 */
  points: number
  createdAt: string
}

export const MEMBER_LEVEL_TEXT: Record<MemberLevel, string> = {
  stone: '原石会员',
  jade: '美玉会员',
  gold: '金石会员',
}

/** 会员权益，用于「我的」与会员页展示 */
export interface MemberBenefit {
  id: string
  name: string
  desc: string
  /** 当前等级是否已解锁 */
  unlocked: boolean
}

export interface MemberSummary {
  profile: UserProfile
  benefits: MemberBenefit[]
  /** 累计消费 */
  totalSpent: Amount
  orderCount: number
  collectionCount: number
}
