<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // 一期为 Mock 驱动，无后端、无真实登录。
  // 用户态、购物车、探索状态的本地恢复在各 store 内部完成。
})
</script>

<style lang="scss">
@import '@/styles/index.scss';
</style>
