/**
 * 校验脚本运行器
 *
 * flows.ts 依赖 `uni.*` 全局对象（本地存储、toast 等），Node 中没有。
 * 因此这里：
 *   1. 用 esbuild 把 flows.ts 打包为单个 ESM 文件（顺带解析 `@/` 别名）；
 *   2. 注入一个最小 `uni` 垫片（存储用 Map 模拟，其余为 no-op）；
 *   3. 动态 import 并执行。
 *
 * 走的是与页面完全相同的调用路径，因此断言覆盖的是真实业务逻辑，
 * 而不是另写一套测试专用的实现。
 */

import { build } from 'esbuild'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')

// ---------------------------------------------------------------------------
// 1. 打包
// ---------------------------------------------------------------------------
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jgz-verify-'))
const outFile = path.join(outDir, 'flows.mjs')

await build({
  entryPoints: [path.join(here, 'flows.ts')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  logLevel: 'warning',
  alias: {
    '@': path.join(root, 'src'),
  },
})

// ---------------------------------------------------------------------------
// 2. 注入 uni 垫片
// ---------------------------------------------------------------------------
const storage = new Map()

globalThis.uni = {
  getStorageSync: (key) => (storage.has(key) ? storage.get(key) : ''),
  setStorageSync: (key, value) => storage.set(key, value),
  removeStorageSync: (key) => storage.delete(key),
  // 以下在纯数据链路中不会真正触发，但 request.ts 的错误分支会调用，故需存在
  showToast: () => {},
  showLoading: () => {},
  hideLoading: () => {},
  showModal: () => {},
  getSystemInfoSync: () => ({ statusBarHeight: 0 }),
  request: () => {},
  navigateTo: () => {},
  redirectTo: () => {},
  switchTab: () => {},
  setNavigationBarTitle: () => {},
  setClipboardData: () => {},
}

// ---------------------------------------------------------------------------
// 3. 执行
// ---------------------------------------------------------------------------
console.log('金刚之源 · 第 1 期业务链路校验')
console.log('（走 api → request → mock 的真实调用路径）')

await import(pathToFileURL(outFile).href)

fs.rmSync(outDir, { recursive: true, force: true })
