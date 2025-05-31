import React from 'react'

const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    online: {
      color: 'bg-green-100 text-green-800 border-green-200',
      dot: 'bg-green-500',
      label: 'Online'
    },
    ocupado: {
      color: 'bg-red-100 text-red-800 border-red-200',
      dot: 'bg-red-500',
      label: 'Ocupado'
    },
    pausa: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Em Pausa'
    },
    offline: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      dot: 'bg-gray-500',
      label: 'Offline'
    }
  }

  const config = statusConfig[status] || statusConfig.offline
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  )
}

export default StatusBadge