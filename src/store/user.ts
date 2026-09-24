import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { userApi } from '@/api'
import type { Address, MemberSummary, UserProfile } from '@/types'

/**
 * 用户态
 *
 * 一期无真实登录，通过 Mock 接口取演示用户。
 * 第 2 期接入微信登录后，login() 替换为 code2session 流程，页面无需改动。
 */
export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const member = ref<MemberSummary | null>(null)
  const addresses = ref<Address[]>([])
  const loading = ref(false)

  const isLoaded = computed(() => profile.value !== null)

  /** 默认收货地址，结算页直接取用 */
  const defaultAddress = computed(
    () => addresses.value.find((a) => a.isDefault) ?? addresses.value[0] ?? null
  )

  async function loadProfile(): Promise<UserProfile> {
    if (profile.value) return profile.value
    loading.value = true
    try {
      profile.value = await userApi.fetchProfile()
      return profile.value
    } finally {
      loading.value = false
    }
  }

  async function loadMember(): Promise<MemberSummary> {
    if (member.value) return member.value
    member.value = await userApi.fetchMemberSummary()
    return member.value
  }

  async function loadAddresses(): Promise<Address[]> {
    addresses.value = await userApi.fetchAddresses()
    return addresses.value
  }

  return {
    profile,
    member,
    addresses,
    loading,
    isLoaded,
    defaultAddress,
    loadProfile,
    loadMember,
    loadAddresses,
  }
})
