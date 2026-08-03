import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}

export function Button({ children, variant = 'secondary', icon, onClick, className, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-50',
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
