import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'px-[22px] py-[11px] rounded-full text-[17px] font-normal transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#0066cc] text-white',
    secondary: 'bg-white text-[#0066cc] border border-[#0066cc]',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
}
