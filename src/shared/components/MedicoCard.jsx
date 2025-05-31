import React from 'react'
import StatusBadge from './StatusBadge'

const MedicoCard = ({ medico, size = 'md' }) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div className={`bg-white border rounded-lg hover:shadow-md transition-shadow ${sizeClasses[size]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">Dr(a). {medico.nome}</h3>
          <p className="text-sm text-gray-600 mt-1">{medico.especialidade}</p>
        </div>
        <StatusBadge status={medico.status} size="sm" />
      </div>
    </div>
  )
}

export default MedicoCard