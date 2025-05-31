import React from 'react'
import { useVideoCall } from '../../domains/atendimento/useVideoCall'

const VideoCall = ({ 
  atendimentoId, 
  isInitiator = false, 
  nomeRemoto = 'Participante',
  onClose 
}) => {
  const {
    chamadaAtiva,
    conectado,
    microfoneAtivo,
    videoAtivo,
    carregando,
    erro,
    localVideoRef,
    remoteVideoRef,
    iniciarChamada,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento
  } = useVideoCall(atendimentoId, isInitiator)

  const handleEncerrar = async () => {
    await encerrarAtendimento()
    if (onClose) onClose()
  }

  if (!chamadaAtiva) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Iniciar Videochamada
            </h3>
            <p className="text-gray-600 mb-6">
              Conectar com {nomeRemoto} via vídeo
            </p>
            
            {erro && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={iniciarChamada}
                disabled={carregando}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Conectando...' : 'Iniciar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="font-medium">
            {conectado ? `Conectado com ${nomeRemoto}` : 'Conectando...'}
          </span>
        </div>
        <div className="text-sm text-gray-300">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Videos */}
      <div className="flex-1 relative">
        {/* Vídeo remoto (principal) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-900"
        />
        
        {/* Vídeo local (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoAtivo && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Overlay de carregamento */}
        {carregando && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Conectando...</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="absolute top-20 left-4 right-4 p-4 bg-red-600 text-white rounded-lg">
            {erro}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-gray-900 p-6">
        <div className="flex justify-center space-x-6">
          {/* Microfone */}
          <button
            onClick={alternarMicrofone}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              microfoneAtivo 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {microfoneAtivo ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h1m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v1M4 15l2.586-2.586M20 15l-2.586-2.586M4 15l2.586-2.586m0 0L9 10.414m11.414 4.586L18 12.828m2.586 2.586L18 12.828m0 0l-1.414 1.414M9 10.414l1.414-1.414M9 10.414L7.586 9M20 15L18 12.828m0 0L16.586 11.414M9 10.414L7.586 9m1.414 1.414L7.586 9" />
              </svg>
            )}
          </button>

          {/* Vídeo */}
          <button
            onClick={alternarVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              videoAtivo 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {videoAtivo ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
              </svg>
            )}
          </button>

          {/* Encerrar */}
          <button
            onClick={handleEncerrar}
            disabled={carregando}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 18l4-4m0 0l4-4m-4 4l4 4m-4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall