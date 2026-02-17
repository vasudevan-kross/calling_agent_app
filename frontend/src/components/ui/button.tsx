import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glass' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95',
          {
            'bg-primary text-white dark:text-white hover:bg-primary/90 shadow-lg shadow-primary/20':
              variant === 'default',
            'border border-gray-300 dark:border-white/20 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 backdrop-blur-sm':
              variant === 'outline',
            'hover:bg-gray-100 dark:hover:bg-white/5': variant === 'ghost',
            'glass-card hover:bg-gray-100 dark:hover:bg-white/10': variant === 'glass',
            'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20':
              variant === 'danger',
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-6 text-base': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
