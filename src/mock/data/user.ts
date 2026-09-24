import type { Address, MemberBenefit, MemberSummary, PointsRecord, UserProfile } from '@/types'
import { MOCK_USER_ID } from '../session'

/**
 * 用户 Mock 数据
 *
 * 一期无真实登录，返回固定的演示用户，使会员、积分、地址等页面可完整展示。
 */

export const mockProfile: UserProfile = {
  id: MOCK_USER_ID,
  nickname: '听石人',
  avatar: '',
  phone: '13800138000',
  level: 'jade',
  levelName: '美玉会员',
  growth: 2680,
  growthToNext: 320,
  points: 4860,
}

export const mockAddresses: Address[] = [
  {
    id: 'addr_01',
    name: '陈砚舟',
    phone: '13800138000',
    region: '浙江省 杭州市 西湖区',
    detail: '文三路 199 号 云谷大厦 A 座 1201 室',
    isDefault: true,
  },
  {
    id: 'addr_02',
    name: '陈砚舟',
    phone: '13900139000',
    region: '辽宁省 大连市 瓦房店市',
    detail: '新华街道 建设路 88 号 3 单元 502',
    isDefault: false,
  },
]

export const mockPointsRecords: PointsRecord[] = [
  { id: 'pt_01', title: '开石消费返积分', points: 398, createdAt: '2026-09-18T22:10:00' },
  { id: 'pt_02', title: '精品商城消费返积分', points: 528, createdAt: '2026-09-15T20:37:00' },
  { id: 'pt_03', title: '每日签到', points: 10, createdAt: '2026-09-15T08:02:00' },
  { id: 'pt_04', title: '兑换「刻字服务」权益', points: -800, createdAt: '2026-09-12T15:20:00' },
  { id: 'pt_05', title: '开石消费返积分', points: 168, createdAt: '2026-09-08T21:14:00' },
  { id: 'pt_06', title: '晒单奖励', points: 200, createdAt: '2026-09-05T11:40:00' },
]

export const mockBenefits: MemberBenefit[] = [
  { id: 'bn_01', name: '专属客服', desc: '一对一顾问接待', unlocked: true },
  { id: 'bn_02', name: '免费刻字', desc: '每年 3 次免费篆刻', unlocked: true },
  { id: 'bn_03', name: '专属包装', desc: '定制锦盒与手写卡', unlocked: true },
  { id: 'bn_04', name: '免运费', desc: '全场包邮不限次', unlocked: true },
  { id: 'bn_05', name: '养护服务', desc: '每年 1 次免费养护', unlocked: false },
  { id: 'bn_06', name: '优先选料', desc: '新矿脉开售优先购', unlocked: false },
]

export const mockMemberSummary: MemberSummary = {
  profile: mockProfile,
  benefits: mockBenefits,
  totalSpent: 12864000,
  orderCount: 14,
  collectionCount: 4,
}
