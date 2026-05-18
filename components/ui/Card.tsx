import { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md'
}

const paddingClasses = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
const shadowClasses  = { none: '', sm: 'shadow-sm', md: 'shadow-md' }

export function Card({ padding = 'md', shadow = 'sm', children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 pb-4 border-b border-gray-100 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold text-[#1B3A6B] ${className}`}>{children}</h2>
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-lg text-gray-700 ${className}`}>{children}</div>
}
