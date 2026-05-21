import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[14px] text-[#1d1d1f]">
        {label}
      </label>
      <input
        id={id}
        className={`h-[44px] px-5 rounded-full border border-[#e0e0e0] text-[17px] text-[#1d1d1f] outline-none focus:border-[#0066cc] ${className}`}
        {...props}
      />
    </div>
  )
}
