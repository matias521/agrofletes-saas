'use client'
import React from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  style?: React.CSSProperties
  weight?: number
  fill?: number
}

export function Icon({ name, size, color, style = {}, weight, fill = 1 }: IconProps) {
  return (
    <span
      className="material-symbols-rounded"
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight || 500}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
