import type { Address, MemberBenefit, MemberSummary, PointsRecord, UserProfile } from '@/types'
import { request } from '@/utils/request'

/** 用户中心接口 */

export function fetchProfile(): Promise<UserProfile> {
  return request<UserProfile>({ url: '/api/user/profile' })
}

export function fetchMemberSummary(): Promise<MemberSummary> {
  return request<MemberSummary>({ url: '/api/user/member' })
}

export function fetchAddresses(): Promise<Address[]> {
  return request<Address[]>({ url: '/api/user/address' })
}

export function fetchPoints(): Promise<{ points: number; list: PointsRecord[] }> {
  return request<{ points: number; list: PointsRecord[] }>({ url: '/api/user/points' })
}

export function fetchBenefits(): Promise<MemberBenefit[]> {
  return request<MemberBenefit[]>({ url: '/api/user/benefits' })
}
