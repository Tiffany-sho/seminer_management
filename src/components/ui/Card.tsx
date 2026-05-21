interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-[18px] border border-[#e0e0e0] p-6 ${className}`}>
      {children}
    </div>
  )
}
