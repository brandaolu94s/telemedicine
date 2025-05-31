import React from 'react'

const Paginacao = ({ paginaAtual, totalPaginas, onChange }) => {
  if (totalPaginas <= 1) return null

  const gerarPaginas = () => {
    const paginas = []
    const maxPaginas = 5
    
    let inicio = Math.max(1, paginaAtual - Math.floor(maxPaginas / 2))
    let fim = Math.min(totalPaginas, inicio + maxPaginas - 1)
    
    if (fim - inicio + 1 < maxPaginas) {
      inicio = Math.max(1, fim - maxPaginas + 1)
    }

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i)
    }

    return paginas
  }

  const paginas = gerarPaginas()

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Página {paginaAtual} de {totalPaginas}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onChange(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        
        {paginas.map(pagina => (
          <button
            key={pagina}
            onClick={() => onChange(pagina)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              pagina === paginaAtual
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {pagina}
          </button>
        ))}
        
        <button
          onClick={() => onChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}

export default Paginacao