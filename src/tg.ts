// Обёртка над Telegram WebApp: вне Telegram всё просто молча не работает
const tg = (window as any).Telegram?.WebApp

export function initTg() {
  try {
    tg?.ready?.()
    tg?.expand?.()
    tg?.setHeaderColor?.('#0d0e10')
    tg?.setBackgroundColor?.('#0d0e10')
    tg?.disableVerticalSwipes?.()
  } catch { /* старый клиент Telegram */ }
  try {
    // Полный экран — только на телефоне: на компьютере он занял бы весь монитор
    const phone = tg?.platform === 'ios' || tg?.platform === 'android'
    if (phone && tg?.isVersionAtLeast?.('8.0') && !tg.isFullscreen) tg.requestFullscreen()
  } catch { /* клиент не умеет полноэкранный режим — остаёмся в обычном */ }
}

export const tgName: string = tg?.initDataUnsafe?.user?.first_name ?? ''

export function haptic(kind: 'light' | 'medium' | 'success' = 'light') {
  try {
    if (kind === 'success') tg?.HapticFeedback?.notificationOccurred?.('success')
    else tg?.HapticFeedback?.impactOccurred?.(kind)
  } catch { /* ignore */ }
}

export function openLink(url: string) {
  if (tg?.openLink && tg?.initData) tg.openLink(url)
  else window.open(url, '_blank', 'noopener')
}
