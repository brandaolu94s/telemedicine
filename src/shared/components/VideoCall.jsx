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
    progresso,
    tentativasReconexao,
    localVideoRef,
    remoteVideoRef,
    iniciarChamada,
    tentarReconexao,
    alternarMicrofone,
    alternarVideo,
    encerrarAtendimento,
    podeReconectar,
    problemaRede,
    status
  } = useVideoCall(atendimentoId, isInitiator)

  const handleEncerrar = async () => {
    await encerrarAtendimento()
    if (onClose) onClose()
  }

  // Detectar tipo de erro para mostrar soluções específicas
  const getTipoErro = () => {
    if (!erro) return null
    
    const erroLower = erro.toLowerCase()
    
    if (erroLower.includes('permission') || erroLower.includes('notallowed')) {
      return 'permissao'
    }
    if (erroLower.includes('network') || erroLower.includes('ice') || problemaRede) {
      return 'rede'
    }
    if (erroLower.includes('notfound') || erroLower.includes('device')) {
      return 'dispositivo'
    }
    if (erroLower.includes('browser') || erroLower.includes('webrtc')) {
      return 'navegador'
    }
    
    return 'generico'
  }

  const getSolucoesPorTipo = (tipo) => {
    const solucoes = {
      permissao: {
        titulo: '🔒 Problema de Permissões',
        icone: '🔐',
        cor: 'bg-orange-100 border-orange-200 text-orange-800',
        items: [
          'Clique no ícone da câmera na barra do navegador',
          'Escolha "Sempre permitir" para este site',
          'Verifique se outros programas não estão usando a câmera',
          'Reinicie o navegador se necessário'
        ]
      },
      rede: {
        titulo: '🌐 Problema de Conexão',
        icone: '📶',
        cor: 'bg-red-100 border-red-200 text-red-800',
        items: [
          'Verifique sua conexão com a internet',
          'Feche downloads ou streams que consomem banda',
          'Tente mudar de WiFi para dados móveis (ou vice-versa)',
          'Use uma rede mais estável se possível'
        ]
      },
      dispositivo: {
        titulo: '📹 Problema com Dispositivos',
        icone: '🔧',
        cor: 'bg-yellow-100 border-yellow-200 text-yellow-800',
        items: [
          'Verifique se câmera e microfone estão conectados',
          'Teste os dispositivos em outras aplicações',
          'Reinicie os dispositivos USB se necessário',
          'Verifique os drivers de áudio/vídeo'
        ]
      },
      navegador: {
        titulo: '🌐 Problema do Navegador',
        icone: '🔄',
        cor: 'bg-blue-100 border-blue-200 text-blue-800',
        items: [
          'Use Chrome, Firefox ou Safari atualizados',
          'Limpe o cache e cookies do site',
          'Desative extensões que podem interferir',
          'Recarregue a página completamente'
        ]
      },
      generico: {
        titulo: '⚠️ Erro Técnico',
        icone: '🛠️',
        cor: 'bg-gray-100 border-gray-200 text-gray-800',
        items: [
          'Recarregue a página e tente novamente',
          'Verifique se o sistema está atualizado',
          'Entre em contato com o suporte técnico',
          'Tente usar outro dispositivo se possível'
        ]
      }
    }
    
    return solucoes[tipo] || solucoes.generico
  }

  // Tela de erro melhorada
  if (status === 'error' || (erro && !chamadaAtiva)) {
    const tipoErro = getTipoErro()
    const solucoes = getSolucoesPorTipo(tipoErro)
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">{solucoes.icone}</span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Problema na Videochamada
            </h3>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-red-800 mb-2">💬 Detalhes do erro:</h4>
              <p className="text-red-700 text-sm leading-relaxed">{erro}</p>
              
              {tentativasReconexao > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-red-600 text-xs font-medium">
                    🔄 Tentativas de reconexão: {tentativasReconexao}/2
                  </p>
                </div>
              )}
            </div>

            <div className={`${solucoes.cor} border rounded-xl p-4 mb-6 text-left`}>
              <h4 className="font-semibold mb-3">{solucoes.titulo}</h4>
              <ul className="space-y-2">
                {solucoes.items.map((item, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-3">
              {podeReconectar && (
                <button
                  onClick={tentarReconexao}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg transform hover:scale-105"
                >
                  🔄 Tentar Reconectar ({2 - tentativasReconexao} tentativas restantes)
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="py-2 px-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  🔄 Recarregar
                </button>
                
                <button
                  onClick={onClose}
                  className="py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  ❌ Voltar
                </button>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-xs">
                💡 <strong>Dica:</strong> Para melhor experiência, use uma conexão estável e navegador atualizado
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de inicialização melhorada
  if (!chamadaAtiva) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              🎥 Videochamada Médica
            </h3>
            
            <p className="text-gray-600 text-lg mb-6">
              {isInitiator 
                ? `Iniciar consulta com ${nomeRemoto}` 
                : `Conectar com ${nomeRemoto}`
              }
            </p>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-5 mb-6 text-left border border-green-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-green-600 mr-2">🔒</span>
                Sistema Seguro e Profissional
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  Conexão criptografada ponta-a-ponta
                </div>
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  Qualidade HD para diagnósticos precisos
                </div>
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  Dados médicos protegidos (LGPD)
                </div>
                <div className="flex items-center text-gray-700 text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  Gravação apenas com consentimento
                </div>
              </div>
            </div>
            
            {progresso && carregando && (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-blue-600 font-medium">{progresso}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full animate-pulse w-3/4 transition-all duration-500"></div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={iniciarChamada}
                disabled={carregando}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white rounded-xl hover:from-green-600 hover:via-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl transform hover:scale-105 focus:ring-4 focus:ring-blue-300"
              >
                {carregando ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Conectando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Iniciar Videochamada</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={onClose}
                disabled={carregando}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>💡 <strong>Dica:</strong> Verifique se câmera e microfone estão funcionando</p>
              <p>🌐 Compatível com Chrome, Firefox e Safari</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Interface da videochamada ativa
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header informativo melhorado */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white p-4 shadow-2xl border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full shadow-lg ${
              conectado ? 'bg-green-400 animate-pulse' : 
              carregando ? 'bg-yellow-400 animate-ping' : 'bg-red-400 animate-pulse'
            }`}></div>
            
            <div className="flex flex-col">
              <span className="font-bold text-lg">
                {conectado ? `🟢 Conectado com ${nomeRemoto}` : 
                 carregando ? `🟡 ${progresso || 'Conectando...'}` : 
                 `🔴 Aguardando conexão`}
              </span>
              {progresso && carregando && (
                <span className="text-sm text-gray-300 animate-pulse">{progresso}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-green-400">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-400">Horário da consulta</div>
            </div>
            
            {isInitiator && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                👨‍⚕️ MÉDICO
              </div>
            )}
          </div>
        </div>
        
        {/* Barra de progresso durante conexão */}
        {carregando && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div className="bg-gradient-to-r from-blue-400 to-green-400 h-1 rounded-full animate-pulse w-3/4 transition-all"></div>
            </div>
          </div>
        )}
      </div>

      {/* Área de vídeo principal */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden">
        {/* Vídeo remoto (tela principal) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Placeholder melhorado quando não conectado */}
        {!conectado && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <div className="text-center text-white max-w-lg p-8">
              <div className="w-40 h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-gray-600">
                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-gray-100">{nomeRemoto}</h3>
              
              <div className="mb-6">
                <p className="text-gray-300 text-lg mb-2">
                  {carregando ? progresso || 'Estabelecendo conexão segura...' : 'Aguardando conexão'}
                </p>
                {carregando && (
                  <p className="text-gray-400 text-sm">
                    Isso pode levar alguns segundos
                  </p>
                )}
              </div>
              
              {carregando && (
                <div className="space-y-4">
                  <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full animate-pulse w-3/4 transition-all duration-1000"></div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Vídeo local (Picture-in-Picture) melhorado */}
        <div className="absolute top-6 right-6 w-64 h-48 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-3 border-white/30 backdrop-blur">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {!videoAtivo && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-xs text-gray-400">Câmera desligada</p>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-3 py-1 rounded-full">
            <span className="text-white text-sm font-medium">Você</span>
          </div>
          
          {/* Indicadores de status no vídeo local */}
          <div className="absolute top-3 right-3 flex space-x-1">
            <div className={`w-2 h-2 rounded-full ${microfoneAtivo ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <div className={`w-2 h-2 rounded-full ${videoAtivo ? 'bg-green-400' : 'bg-red-400'}`}></div>
          </div>
        </div>

        {/* Alert de erro durante chamada melhorado */}
        {erro && chamadaAtiva && (
          <div className="absolute top-6 left-6 right-6 md:right-80 bg-red-600/95 backdrop-blur-sm text-white p-5 rounded-2xl shadow-2xl border border-red-500">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">⚠️ Problema de Conexão</h4>
                <p className="text-sm opacity-90 mb-3">{erro}</p>
                <div className="flex space-x-3">
                  {podeReconectar && (
                    <button
                      onClick={tentarReconexao}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur"
                    >
                      🔄 Reconectar
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur"
                  >
                    🔄 Recarregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles de mídia melhorados */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black p-8 shadow-2xl border-t border-gray-700">
        <div className="flex justify-center items-center space-x-12">
          {/* Controle de Microfone */}
          <div className="text-center group">
            <button
              onClick={alternarMicrofone}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl transform group-hover:scale-110 ${
                microfoneAtivo 
                  ? 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white' 
                  : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white animate-pulse'
              }`}
              title={microfoneAtivo ? 'Silenciar microfone' : 'Ativar microfone'}
            >
              {microfoneAtivo ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h1m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v1M4 15l2.586-2.586M20 15l-2.586-2.586" />
                </svg>
              )}
            </button>
            <div className="text-sm text-gray-300 mt-3 font-medium">
              {microfoneAtivo ? '🎤 Microfone' : '🔇 Silenciado'}
            </div>
          </div>

          {/* Controle de Vídeo */}
          <div className="text-center group">
            <button
              onClick={alternarVideo}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl transform group-hover:scale-110 ${
                videoAtivo 
                  ? 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white' 
                  : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white animate-pulse'
              }`}
              title={videoAtivo ? 'Desligar câmera' : 'Ligar câmera'}
            >
              {videoAtivo ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>
            <div className="text-sm text-gray-300 mt-3 font-medium">
              {videoAtivo ? '📹 Câmera' : '📵 Desligada'}
            </div>
          </div>

          {/* Botão Encerrar */}
          <div className="text-center group">
            <button
              onClick={handleEncerrar}
              disabled={carregando}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 flex items-center justify-center text-white transition-all disabled:opacity-50 shadow-2xl transform group-hover:scale-110 focus:ring-4 focus:ring-red-300"
              title="Encerrar videochamada"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 18l4-4m0 0l4-4m-4 4l4 4m-4-4H3" />
              </svg>
            </button>
            <div className="text-sm text-gray-300 mt-3 font-medium">
              ☎️ Encerrar
            </div>
          </div>
        </div>
        
        {/* Status detalhado da conexão */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur px-6 py-3 rounded-full border border-gray-700">
            {conectado ? (
              <>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">🟢 Chamada Ativa</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-300 text-sm">Conexão Estável</span>
              </>
            ) : carregando ? (
              <>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                <span className="text-yellow-400 font-semibold">🟡 Conectando</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-300 text-sm">{progresso || 'Estabelecendo conexão...'}</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-semibold">🔴 Verificando</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-300 text-sm">Aguardando conexão</span>
              </>
            )}
          </div>
          
          {/* Informações técnicas (apenas para debug em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 text-xs text-gray-500">
              <div className="inline-flex items-center space-x-4 bg-gray-800/50 px-4 py-2 rounded-lg">
                <span>ID: {atendimentoId?.slice(-8)}</span>
                <span>•</span>
                <span>Iniciador: {isInitiator ? 'Sim' : 'Não'}</span>
                <span>•</span>
                <span>Tentativas: {tentativasReconexao}/2</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoCall
