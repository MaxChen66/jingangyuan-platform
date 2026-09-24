import type { Address } from '@/types'
import { defineMock } from '../registry'
import {
  mockAddresses,
  mockBenefits,
  mockMemberSummary,
  mockPointsRecords,
  mockProfile,
} from '../data/user'

/** 用户中心 Mock 接口 */

defineMock('GET', '/api/user/profile', () => mockProfile)

defineMock('GET', '/api/user/member', () => mockMemberSummary)

defineMock('GET', '/api/user/address', (): Address[] => mockAddresses)

defineMock('GET', '/api/user/points', () => ({
  points: mockProfile.points,
  list: mockPointsRecords,
}))

defineMock('GET', '/api/user/benefits', () => mockBenefits)
