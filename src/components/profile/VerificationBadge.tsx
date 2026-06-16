import { ShieldCheck, AlertCircle } from 'lucide-react'

interface VerificationBadgeProps {
  isVerified: boolean
  method?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function VerificationBadge({ isVerified, method, size = 'sm', showLabel = true }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full" title={`Verified via ${method || 'DCI'}`}>
        <ShieldCheck className={`${sizeClasses[size]} text-emerald-600`} />
        {showLabel && <span className="text-xs font-medium text-emerald-700">Verified Professional</span>}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full" title="Not verified">
      <AlertCircle className={`${sizeClasses[size]} text-gray-400`} />
      {showLabel && <span className="text-xs font-medium text-gray-500">Unverified</span>}
    </span>
  )
}
