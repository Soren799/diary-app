/** className 合并：过滤掉假值后用空格拼接 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
