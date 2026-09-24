/**
 * 展示层格式化工具
 *
 * 全站金额以「分」存整数，在展示层统一转换，避免浮点误差。
 */

/** 千分位分隔。不依赖 toLocaleString —— 小程序 JS 引擎的 locale 支持不一致 */
function withThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function splitFen(fen: number): { sign: string; int: string; dec: string } {
  const abs = Math.abs(Math.round(fen))
  const sign = fen < 0 ? '-' : ''
  const int = String(Math.floor(abs / 100))
  const dec = String(abs % 100).padStart(2, '0')
  return { sign, int, dec }
}

/** 分 → 元字符串，固定两位小数。用于金额明细、结算栏 */
export function fen2yuan(fen: number): string {
  const { sign, int, dec } = splitFen(fen)
  return `${sign}${withThousands(int)}.${dec}`
}

/** 分 → 带货币符号的完整价格，例如 ¥1,280.00 */
export function formatPrice(fen: number): string {
  return `¥${fen2yuan(fen)}`
}

/**
 * 分 → 带符号的紧凑价格：整数金额省略小数位。
 * 商品卡、价格标签等空间紧张处使用。
 * 例如 128000 → ¥1,280，128050 → ¥1,280.50
 */
export function formatPriceCompact(fen: number): string {
  const { sign, int, dec } = splitFen(fen)
  const tail = dec === '00' ? '' : `.${dec}`
  return `${sign === '-' ? '-' : ''}¥${withThousands(int)}${tail}`
}

/** 概率数值格式化：整数不带小数，小数最多一位。例如 12 → 12%，0.5 → 0.5% */
export function formatProbability(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`
}

/** ISO 时间 → YYYY-MM-DD */
export function formatDate(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

/** ISO 时间 → YYYY-MM-DD HH:mm */
export function formatDateTime(iso: string): string {
  if (!iso) return ''
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`
}

/** ISO 时间 → MM-DD HH:mm，用于时间轴 */
export function formatShortDateTime(iso: string): string {
  if (!iso) return ''
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`
}

/** 手机号脱敏：138****8000 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

/** 数量收敛到 [min, max]，用于步进器 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 生成订单号：JGZ + yyyyMMddHHmmss + 4 位随机 */
export function genOrderNo(prefix = 'JGZ'): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}${stamp}${rand}`
}
