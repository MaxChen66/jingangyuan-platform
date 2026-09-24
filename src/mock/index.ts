/**
 * Mock 层入口
 *
 * 各业务模块在导入时通过 defineMock 完成接口注册，顺序无先后依赖。
 *
 * 架构约定：业务页面只允许依赖 api/ 下的函数，不得直接引用本目录。
 * 这样第 2 期接入真实后端时，只需把 constants/config.ts 中的 USE_MOCK
 * 置为 false，页面代码零改动（P1-FE-04 的验收标准）。
 */

import './modules/mall'
import './modules/explore'
import './modules/order'
import './modules/user'

export { runMock } from './registry'
export type { MockContext, MockHandler } from './registry'
