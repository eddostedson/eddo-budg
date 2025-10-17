'use client'

interface ModernLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ModernLoading({ message = "Chargement...", size = 'md' }: ModernLoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* Spinner animé */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-yellow-400 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Message */}
      <div className="text-center">
        <p className="text-gray-700 font-medium text-lg">{message}</p>
        <div className="flex items-center justify-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

export function ModernSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl h-80 shadow-lg">
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-300 rounded-2xl w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded-xl w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded-xl w-full"></div>
            <div className="h-4 bg-gray-300 rounded-xl w-2/3"></div>
            <div className="h-4 bg-gray-300 rounded-xl w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

