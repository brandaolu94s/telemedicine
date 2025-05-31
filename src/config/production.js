// 📁 /src/config/production.js
export const PRODUCTION_CONFIG = {
  // CONFIGURAÇÕES DE VIDEOCHAMADA PARA PRODUÇÃO
  webrtc: {
    // Timeout agressivo para falha rápida
    connectionTimeout: 15000, // 15 segundos
    
    // Máximo de tentativas de reconexão
    maxReconnectAttempts: 2,
    
    // Configurações de mídia otimizadas para estabilidade
    mediaConstraints: {
      video: {
        width: { ideal: 640, max: 1280 },    // Resolução menor = mais estável
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 15, max: 30 },   // FPS menor = menos banda
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    },
    
    // Servidores TURN/STUN enterprise
    iceServers: [
      // STUN servers (gratuitos, backup)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      
      // TURN servers públicos (garantem conectividade)
      { 
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject', 
        credential: 'openrelayproject'
      },
      { 
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      
      // TURN adicional para máxima confiabilidade
      {
        urls: 'turn:relay.backups.cz',
        username: 'webrtc',
        credential: 'webrtc'
      }
    ],
    
    // Configurações de peer otimizadas
    peerConfig: {
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    }
  },
  
  // MONITORAMENTO E ALERTAS
  monitoring: {
    // Log de problemas para análise
    enableErrorLogging: true,
    
    // Estatísticas de conexão
    enableStats: true,
    
    // Alertas automáticos
    enableAlerts: true,
    
    // Métricas críticas
    criticalMetrics: {
      connectionFailureRate: 0.05, // Máximo 5% de falhas
      averageConnectionTime: 10000, // Máximo 10s para conectar
      reconnectionSuccess: 0.80     // Mínimo 80% de sucesso na reconexão
    }
  },
  
  // MENSAGENS PARA O USUÁRIO
  messages: {
    errors: {
      connectionTimeout: 'A conexão está demorando mais que o normal. Isso pode ser devido à sua conexão de internet ou firewall.',
      permissionDenied: 'Precisamos de acesso à sua câmera e microfone. Clique no ícone de cadeado na barra de endereço e permita o acesso.',
      deviceNotFound: 'Câmera ou microfone não encontrados. Verifique se estão conectados e funcionando.',
      networkError: 'Problema de conectividade detectado. Verifique sua conexão com a internet.',
      browserNotSupported: 'Seu navegador não suporta videochamadas. Use Chrome, Firefox ou Safari atualizado.',
      maxReconnectReached: 'Não foi possível estabelecer uma conexão estável. Entre em contato com o suporte técnico.'
    },
    
    success: {
      connected: 'Conectado com sucesso!',
      mediaInitialized: 'Câmera e microfone configurados',
      reconnected: 'Reconexão bem-sucedida'
    },
    
    progress: {
      testing: 'Verificando sistema...',
      initializingMedia: 'Inicializando câmera e microfone...',
      connecting: 'Estabelecendo conexão...',
      exchangingSignals: 'Trocando informações de conexão...',
      finalizing: 'Finalizando conexão...'
    }
  },
  
  // CONFIGURAÇÕES ESPECÍFICAS POR TIPO DE USUÁRIO
  userTypes: {
    medico: {
      // Médicos precisam de conexão mais estável
      priority: 'high',
      requiresStableConnection: true,
      
      // Configurações mais rigorosas
      mediaConstraints: {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      },
      
      // Timeout menor para médicos
      connectionTimeout: 10000
    },
    
    paciente: {
      // Pacientes podem ter conexões variadas
      priority: 'normal',
      requiresStableConnection: false,
      
      // Configurações mais flexíveis
      mediaConstraints: {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      },
      
      // Timeout mais tolerante
      connectionTimeout: 20000
    }
  },
  
  // FALLBACKS E CONTINGÊNCIAS
  fallbacks: {
    // Se WebRTC falhar, opções alternativas
    enableAudioOnly: true,        // Permitir chamada só de áudio
    enableLowQuality: true,       // Reduzir qualidade automaticamente
    enableReconnection: true,     // Reconexão automática
    
    // Mensagens para situações de fallback
    messages: {
      audioOnly: 'Problema com vídeo. Continuando com áudio apenas.',
      lowQuality: 'Reduzindo qualidade para melhorar estabilidade.',
      reconnecting: 'Problema de conexão. Tentando reconectar...'
    }
  },
  
  // SUPORTE TÉCNICO
  support: {
    // Informações de contato para problemas críticos
    email: 'suporte@teleatendimento.com',
    phone: '0800-123-4567',
    whatsapp: '5511999999999',
    
    // Links úteis
    troubleshootingGuide: '/ajuda/problemas-video',
    systemRequirements: '/ajuda/requisitos',
    
    // Horário de atendimento
    hours: '24/7 para emergências médicas',
    
    // Escalação automática
    autoEscalation: {
      enabled: true,
      afterFailures: 3,
      criticalUserTypes: ['medico'] // Médicos têm prioridade
    }
  },
  
  // ANALYTICS E MÉTRICAS
  analytics: {
    // Eventos importantes para tracking
    events: {
      connectionStart: 'video_call_start',
      connectionSuccess: 'video_call_connected',
      connectionFailure: 'video_call_failed',
      reconnectionAttempt: 'video_call_reconnect',
      callEnd: 'video_call_end'
    },
    
    // Propriedades para análise
    properties: {
      userType: true,
      connectionTime: true,
      failureReason: true,
      networkType: true,
      deviceType: true,
      browserVersion: true
    }
  },
  
  // AMBIENTE DE PRODUÇÃO
  environment: {
    // URLs dos serviços
    websocketUrl: process.env.REACT_APP_WS_URL || 'wss://api.teleatendimento.com/ws',
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.teleatendimento.com',
    
    // Configurações de segurança
    enableLogging: process.env.NODE_ENV !== 'production',
    enableDebug: false,
    
    // Feature flags
    features: {
      screenSharing: false,      // Não implementado ainda
      recording: false,          // Não implementado ainda
      chatDuringCall: false,     // Não implementado ainda
      multipleParticipants: false // Sempre 1:1
    }
  }
}

// Função para obter configuração baseada no tipo de usuário
export const getConfigForUser = (userType) => {
  const baseConfig = PRODUCTION_CONFIG.webrtc
  const userConfig = PRODUCTION_CONFIG.userTypes[userType] || PRODUCTION_CONFIG.userTypes.paciente
  
  return {
    ...baseConfig,
    ...userConfig,
    mediaConstraints: {
      ...baseConfig.mediaConstraints,
      ...userConfig.mediaConstraints
    }
  }
}

// Função para obter mensagem de erro amigável
export const getErrorMessage = (errorCode, context = {}) => {
  const messages = PRODUCTION_CONFIG.messages.errors
  
  // Mapeamento de códigos para mensagens
  const errorMap = {
    'NotAllowedError': messages.permissionDenied,
    'NotFoundError': messages.deviceNotFound,
    'NotSupportedError': messages.browserNotSupported,
    'timeout': messages.connectionTimeout,
    'network': messages.networkError,
    'maxReconnect': messages.maxReconnectReached
  }
  
  return errorMap[errorCode] || `Erro técnico: ${errorCode}`
}

// Validação de ambiente para produção
export const validateProductionEnvironment = () => {
  const issues = []
  
  // Verificar HTTPS em produção
  if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
    issues.push('HTTPS é obrigatório em produção para WebRTC')
  }
  
  // Verificar variáveis de ambiente
  if (!process.env.REACT_APP_WS_URL) {
    issues.push('REACT_APP_WS_URL não configurado')
  }
  
  // Verificar suporte do navegador
  if (!navigator.mediaDevices || !window.RTCPeerConnection) {
    issues.push('Navegador não suporta WebRTC')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}
