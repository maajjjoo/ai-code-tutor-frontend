interface CharCounterProps {
  current: number
  max: number
  showAt?: number
}

export function CharCounter({ current, max, showAt = 0 }: CharCounterProps) {
  if (current < showAt) return null

  const color = current >= max
    ? 'text-[#DC2626]'
    : current >= max * 0.85
    ? 'text-[#F59E0B]'
    : 'text-[#9CA3AF]'

  return (
    <span className={`text-[11px] ${color} text-right block mt-[2px]`}>
      {current} / {max}
    </span>
  )
}
