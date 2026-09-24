# 金刚之源 · 一体化平台

微信小程序商城 + 开石探索馆 + 私人定制 + 雕刻监工 + 一物一码溯源

当前进度：**第 1 期（V0.1）UI 设计 + 前端工程骨架** 已完成。

---

## 一、本期交付内容

按《研发实施计划（开发执行版）》第 6 期定义的范围，本期为「前端先行、Mock 驱动、
无真实支付、无真实开奖」，目标是「先把整个项目做成一个能点击的完整产品」。

已完成 **20 个页面**，两条验收链路端到端可点通。

### 商城链路

| 编号 | 页面 | 路径 |
|---|---|---|
| UI-01 | 首页 | `src/pages/index/index.vue` |
| UI-02 | 商城首页 | `src/pagesMall/home/index.vue` |
| UI-03 | 商品列表（搜索 / 分类 / 排序 / 分页） | `src/pagesMall/list/index.vue` |
| UI-04 | 商品详情（原石档案 / 溯源弹层） | `src/pagesMall/detail/index.vue` |
| UI-05 | 购物车 | `src/pagesMall/cart/index.vue` |
| UI-06 | 确认订单 | `src/pagesMall/checkout/index.vue` |
| UI-07 | 订单列表 | `src/pagesMall/order/list.vue` |
| UI-08 | 订单详情 | `src/pagesMall/order/detail.vue` |

### 开石链路

| 编号 | 页面 | 路径 |
|---|---|---|
| UI-18 | 开石馆首页 | `src/pagesExplore/home/index.vue` |
| UI-19 | 矿区详情（**概率公示**） | `src/pagesExplore/series/index.vue` |
| EXP-03 | 购买确认（**主动勾选规则**） | `src/pagesExplore/purchase/index.vue` |
| UI-20 | 开石（2D 动效，可跳过） | `src/pagesExplore/draw/index.vue` |
| UI-21 | 开奖结果 | `src/pagesExplore/result/index.vue` |
| UI-22 | 石头柜 | `src/pagesExplore/collection/index.vue` |
| UI-23 | 藏品详情 | `src/pagesExplore/collection/detail.vue` |
| UI-24 | 矿物图鉴 | `src/pagesExplore/bestiary/index.vue` |
| UI-25 | 探索记录 | `src/pagesExplore/records/index.vue` |

### 其余 Tab 落点

| 编号 | 页面 | 路径 |
|---|---|---|
| UI-10 | 私人定制引导页 | `src/pagesCustom/index/index.vue` |
| UI-16 | 雕刻工坊 | `src/pagesWorkshop/index/index.vue` |
| UI-26 | 我的 | `src/pagesUser/index/index.vue` |

---

## 二、快速开始

```bash
npm install

npm run dev:h5           # 浏览器预览（推荐用于视觉验收）
npm run dev:mp-weixin    # 微信小程序，产物在 dist/dev/mp-weixin
npm run build:mp-weixin  # 小程序生产构建
npm run type-check       # TypeScript 类型检查
npm run verify           # 业务链路与规则校验（66 项断言）
```

微信小程序预览：用微信开发者工具导入 `dist/dev/mp-weixin`（或 build 后的
`dist/build/mp-weixin`）。首次需在工具中填入自己的测试 AppID。

---

## 三、⚠️ 技术栈版本存在硬性天花板

uni-app 的 Vue3 通道明显落后于主线，以下版本**不可升级**，升级会导致依赖解析失败或运行异常：

| 包 | 锁定版本 | 原因 |
|---|---|---|
| `vite` | `5.2.8`（精确） | `@dcloudio/vite-plugin-uni` 的 peerDependency 精确锁定该版本。当前最新为 Vite 8.x |
| `vue` | `3.4.21`（精确） | 与 `@dcloudio/*` 内部依赖的 `@vue/shared@3.4.21` 对齐 |
| `pinia` | `2.1.7`（精确） | pinia ≥ 2.2.6 的 peer 收紧为 `vue: ^3.5.11`，与 vue 3.4.21 冲突会导致 `ERESOLVE` |
| `@dcloudio/types` | `3.4.31`（精确） | `@dcloudio/uni-app` 的 peer 精确要求该版本 |
| `@dcloudio/*` | `3.0.0-alpha-5020720260921001` | 走 `vue3` dist-tag |

**注意**：`npm view @dcloudio/vite-plugin-uni` 返回的 `latest` 标签是一个 2021 年的陈旧
alpha，安装时必须显式指定 `vue3` 标签。

升级 uni-app 版本时，以上约束需整体重新核验，不能单独升级其中一项。

---

## 四、架构约定

### 4.1 Mock 边界（重要）

**业务页面只允许依赖 `src/api/`，禁止直接引用 `src/mock/`。**

Mock 的判定完全收敛在 `src/utils/request.ts` 内部。第 2 期接入 Spring Boot 后端时，
只需把 `src/constants/config.ts` 中的 `USE_MOCK` 置为 `false`，**页面代码零改动**。

```
页面 → src/api/*.ts → src/utils/request.ts ─┬─ USE_MOCK=true  → src/mock/
                                            └─ USE_MOCK=false → 真实后端
```

接口的传输结构（DTO）定义在 `src/types/`，mock 模块反向引用它们，
因此切换后端时接口契约只需实现同一组 DTO。

### 4.2 双主题体系

对应实施文档第 17 节「开石独立视觉，避免品牌稀释」：

- **宋式雅致**（默认）：宣纸米白 + 墨 + 朱砂 + 大留白 + 细线框。用于首页、商城、定制、工坊、我的、溯源
- **幽玄矿物**：玄墨底 + 月白 + 鎏金 + 矿物结晶色。用于开石馆全部页面

切换只需在页面根节点加 `class="theme-ink"`。两套主题共用全部组件与布局，
主题以 CSS 自定义属性下发，因此**无需为深色体系复制任何样式**。

设计令牌：
- `src/uni.scss` —— SCSS 变量与中式 mixin（由 uni-app 全局注入，组件内免 import）
- `src/styles/_theme-paper.scss` / `_theme-ink.scss` —— 两套主题的 CSS 变量
- `src/styles/_base.scss` —— 全局基础样式与工具类

### 4.3 图片占位方案

项目当前**没有任何图片素材**，且微信小程序对外链图片有域名白名单限制。
因此全部商品与藏品视觉由 `src/components/JyStoneVisual/` 承担：
以「矿物色调 + 由商品 ID 派生的渐变石纹」渲染，同一商品纹理稳定，不同商品彼此可辨。

这不是缺图占位，而是刻意的设计语言。第 2 期接入 OSS 后，
在调用处判断 `cover` 是否为空即可切换为 `<image>`，组件本身无需改动。

### 4.4 组件库

`src/components/` 下 20 个 `Jy` 前缀组件，全部接受主题变量，在两套体系下自动适配。

三态（加载 / 空 / 失败重试）由 `JyStateView` 统一承载，
配合 `src/hooks/useAsyncPage.ts` 与 `usePagedList.ts`，页面不重复实现状态逻辑。

### 4.5 目录结构

```
src/
├── api/            # 接口层（页面唯一允许依赖的入口）
├── components/     # Jy 前缀公共组件
├── constants/      # 配置、枚举映射、运费规则
├── hooks/          # useAsyncPage / usePagedList
├── mock/           # Mock 服务端（data/ 数据，modules/ 接口实现）
├── pages/          # 首页
├── pagesMall/      # 商城
├── pagesCustom/    # 私人定制
├── pagesExplore/   # 开石探索馆
├── pagesWorkshop/  # 雕刻工坊
├── pagesUser/      # 用户中心
├── static/tabbar/  # tabBar 图标（由脚本生成）
├── store/          # Pinia：user / cart / order / explore
├── styles/         # 主题与基础样式
├── types/          # 领域模型与 DTO
└── utils/          # request / format / storage / error
```

---

## 五、业务规则实现要点

开石模块的业务规则由 Mock 服务端真实实现（而非返回假数据），可被直接断言：

- **概率自洽**：批次内概率之和恒为 100%，且严格满足 `概率 = 投放数量 ÷ 批次总量 × 100`，
  用户可自行核对；数据构造时即断言，配置错误会在开发期立刻暴露
- **开奖算法**：按批次剩余实物数量加权抽取。因概率由数量推导，
  加权抽取的结果与公示概率完全一致 —— 概率是库存分布的真实投影
- **幂等**：同一订单重复调用开奖接口只返回同一结果，不会重复扣库存或重复创建藏品
- **库存预订模型**：下单扣批次可售额度（防超卖），开奖扣具体石种实物。
  不变量见 `src/mock/modules/explore.ts` 中 `draw` 处理器上方的注释
- **实体绑定**：每件藏品绑定唯一实体编号，编号全局不重复
- **合规**：购买规则必须用户主动勾选，且服务端二次校验；概率公示不做折叠、不做分页

`npm run verify` 会对以上规则执行 66 项断言，走的是与页面完全相同的调用路径
（`api → request → mock`），而非另写一套测试专用实现。

---

## 六、批次 2 待补清单

本期待补的页面（文档 6.3 清单中的剩余部分）：

| 编号 | 页面 | 说明 |
|---|---|---|
| UI-09 | 售后申请 | 当前在订单详情与「我的」中以明确提示承接 |
| UI-11~13 | 三类定制表单 | 新婚 / 企业商务 / 私人主题 |
| UI-14 | 设计确认 | 效果图确认与修改意见 |
| UI-15 | 监工 | 需接入商用 IoT 视频云（文档第 4 期范围） |
| UI-17 | 溯源查询页 | 当前商品详情已有溯源弹层，可复用 |
| UI-27 | 会员 / 积分 | 积分明细与权益 |
| UI-28 | 地址管理 | 当前结算页使用 Mock 固定地址 |
| UI-29 | 物流查询 | 订单详情已展示物流轨迹，独立页待补 |
| UI-30 | 设置 / 协议 | 隐私政策与用户协议 |

---

## 七、脚本

| 脚本 | 用途 |
|---|---|
| `npm run verify` | 业务链路与规则校验（66 项断言） |
| `npm run gen:icons` | 重新生成 tabBar 图标（纯 Python，无需 Pillow） |

`scripts/gen-tabbar-icons.py` 以标准库 `zlib` + `struct` 直接编码 PNG，
因此图标可复现、可微调（改线宽、圆角、颜色后重跑即可），而不是来历不明的二进制文件。
