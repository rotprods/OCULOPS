import React from 'react'

/**
 * Icon — Consistent Heroicon wrapper
 * 
 * @param {import('@heroicons/react/24/outline').ComponentType} icon - Heroicon component
 * @param {number} size - Icon size in px (default: 20)
 * @param {string} className - Additional CSS class
 */
export default function Icon({ icon: IconComponent, size = 20, className = '', ...props }) {
  if (!IconComponent) return null
  return (
    <IconComponent
      width={size}
      height={size}
      className={className}
      {...props}
    />
  )
}
