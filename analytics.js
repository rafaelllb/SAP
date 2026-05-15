// Google Analytics Enhanced - Bizagi Process Viewer
// Arquivo separado para sobreviver às republicações do Bizagi
// Measurement ID: G-FRFLL5744D
// Versão: 2.0 - Analytics detalhado com 6 tipos de eventos

(function() {
  // Previne carregamento duplo
  if (window.__analyticsLoaded) return;
  window.__analyticsLoaded = true;

  // ===== CONFIGURAÇÃO GA4 =====
  const GA_ID = 'G-FRFLL5744D';

  // Carrega gtag.js dinamicamente
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);

  // ===== SESSION STATE =====
  // Gerencia estado da sessão para tracking detalhado
  const session = {
    id: generateSessionId(),
    startTime: Date.now(),
    diagramsViewed: [],           // Lista de IDs de diagramas visitados
    elementsViewed: [],           // Lista de {diagramId, elementId, type}
    elementTypeCount: {},         // Contagem por tipo BPMN
    currentDiagram: null,         // Diagrama atual
    currentDiagramName: null,
    diagramStartTime: null,       // Quando entrou no diagrama atual
    diagramElementClicks: 0,      // Cliques em elementos no diagrama atual
    zoomInteractions: 0,          // Interações de zoom no diagrama atual
    fullscreenUsed: false,        // Usou fullscreen no diagrama atual
    interactionSequence: 0        // Sequência global de interações
  };

  // ===== HELPERS =====

  // Gera ID único para sessão (fallback se crypto.randomUUID não disponível)
  function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para browsers mais antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Acessa o modelo Bizagi carregado
  function getAppModel() {
    return window.Bizagi?.AppModel || {};
  }

  // Busca diagrama por ID no modelo
  function getDiagramById(id) {
    var pages = getAppModel().pages || [];
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === id) return pages[i];
      // Busca em subpáginas também
      if (pages[i].subPages) {
        for (var j = 0; j < pages[i].subPages.length; j++) {
          if (pages[i].subPages[j].id === id) return pages[i].subPages[j];
        }
      }
    }
    return null;
  }

  // Busca elemento por ID dentro de um diagrama
  function getElementById(diagramId, elementId) {
    var diagram = getDiagramById(diagramId);
    if (!diagram || !diagram.elements) return null;
    for (var i = 0; i < diagram.elements.length; i++) {
      if (diagram.elements[i].id === elementId) return diagram.elements[i];
    }
    return null;
  }

  // Categoriza tipo BPMN em categorias de alto nível
  function categorizeElementType(type) {
    var categories = {
      task: ['AbstractTask', 'ServiceTask', 'CallActivity', 'SubProcess', 'UserTask', 'ManualTask', 'ScriptTask', 'BusinessRuleTask', 'SendTask', 'ReceiveTask'],
      event: ['NoneStart', 'ConditionalStart', 'MessageEnd', 'ErrorIntermediate', 'LinkIntermediate', 'TimerIntermediate', 'NoneEnd', 'MessageStart', 'SignalStart', 'SignalEnd', 'TerminateEnd', 'ErrorEnd', 'CancelEnd', 'CompensationEnd', 'EscalationEnd'],
      gateway: ['ExclusiveGateway', 'ParallelGateway', 'InclusiveGateway', 'EventBasedGateway', 'ComplexGateway'],
      artifact: ['Participant', 'DataObject', 'TextAnnotation', 'Group', 'Lane', 'Pool', 'DataStore']
    };
    for (var cat in categories) {
      if (categories[cat].indexOf(type) !== -1) return cat;
    }
    return 'other';
  }

  // Extrai nomes do DOM atual (mais preciso que dados do link)
  // Estrutura: h1.biz-ex-title-process = processo geral
  //            h2.biz-ex-title-diagram = diagrama específico sendo visualizado
  //            h2.biz-ex-dialog-name = nome do elemento no dialog aberto
  function getDOMContext() {
    var processTitle = document.querySelector('h1.biz-ex-title-process');
    var diagramTitle = document.querySelector('h2.biz-ex-title-diagram');
    var dialogName = document.querySelector('h2.biz-ex-dialog-name');

    return {
      processName: processTitle ? processTitle.textContent.trim() : null,
      diagramName: diagramTitle ? (diagramTitle.getAttribute('title') || diagramTitle.textContent.trim()) : null,
      dialogElementName: dialogName ? dialogName.textContent.trim() : null
    };
  }

  // Obtém nome do diagrama atual do DOM ou fallback para dados do modelo
  function getCurrentDiagramName(fallbackName) {
    var ctx = getDOMContext();
    return ctx.diagramName || ctx.processName || fallbackName || 'unknown';
  }

  // Obtém nome do elemento atual do DOM ou fallback
  function getCurrentElementName(fallbackName) {
    var ctx = getDOMContext();
    return ctx.dialogElementName || fallbackName || 'unknown';
  }

  // Detecta tipo de dispositivo
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Extrai parâmetros UTM da URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || 'direct',
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || ''
    };
  }

  // Calcula profundidade de navegação (quantos diagramas únicos visitados)
  function getNavigationDepth() {
    var unique = [];
    for (var i = 0; i < session.diagramsViewed.length; i++) {
      if (unique.indexOf(session.diagramsViewed[i]) === -1) {
        unique.push(session.diagramsViewed[i]);
      }
    }
    return unique.length;
  }

  // Identifica ponto de entrada baseado no elemento clicado
  function getEntryPoint(link) {
    if (!link) return 'unknown';

    // Verifica classes e contexto do elemento
    var parent = link.parentElement;
    while (parent) {
      if (parent.classList) {
        if (parent.classList.contains('biz-ex-carousel') || parent.classList.contains('owl-carousel')) {
          return 'carousel';
        }
        if (parent.classList.contains('biz-ex-navigation') || parent.classList.contains('biz-ex-sidebar') || parent.id === 'bizNavigation') {
          return 'navigation';
        }
        if (parent.classList.contains('biz-ex-breadcrumb')) {
          return 'breadcrumb';
        }
        if (parent.classList.contains('biz-ex-dialog') || parent.classList.contains('modal')) {
          return 'element_link';
        }
      }
      parent = parent.parentElement;
    }
    return 'direct';
  }

  // ===== EVENTO 1: SESSION_START =====
  // Dispara ao carregar a página
  function trackSessionStart() {
    var model = getAppModel();
    var utm = getUtmParams();

    gtag('event', 'session_start', {
      'session_id': session.id,
      'model_name': model.modelName || 'Unknown',
      'model_publish_date': model.publishDate || '',
      'total_diagrams': (model.pages || []).length,
      'referrer': document.referrer || 'direct',
      'utm_source': utm.source,
      'utm_medium': utm.medium,
      'utm_campaign': utm.campaign,
      'device_type': getDeviceType(),
      'screen_resolution': window.screen.width + 'x' + window.screen.height,
      'viewport_size': window.innerWidth + 'x' + window.innerHeight,
      'language': navigator.language || 'unknown'
    });
  }

  // ===== EVENTO 2: VIEW_DIAGRAM (Aprimorado) =====
  function trackViewDiagram(diagramId, diagramName, link) {
    var diagram = getDiagramById(diagramId);
    var previousDiagram = session.currentDiagram;
    var previousDiagramName = session.currentDiagramName;
    var entryPoint = getEntryPoint(link);

    // Envia engagement do diagrama anterior antes de mudar
    if (previousDiagram && session.diagramStartTime) {
      trackDiagramEngagement(previousDiagram, previousDiagramName);
    }

    // Usa nome do DOM se disponível (mais preciso), senão fallback para link/modelo
    // Aguarda DOM atualizar após navegação (setTimeout 0 para próximo tick)
    var resolvedDiagramName = diagram ? diagram.name : diagramName;

    // Atualiza estado da sessão
    session.diagramsViewed.push(diagramId);
    session.currentDiagram = diagramId;
    session.currentDiagramName = resolvedDiagramName;
    session.diagramStartTime = Date.now();
    session.diagramElementClicks = 0;
    session.zoomInteractions = 0;
    session.fullscreenUsed = false;

    // Captura contexto DOM atual
    var domContext = getDOMContext();

    gtag('event', 'view_diagram', {
      'session_id': session.id,
      'diagram_id': diagramId,
      'diagram_name': resolvedDiagramName,
      'process_name': domContext.processName || 'unknown',
      'diagram_author': diagram ? (diagram.author || 'Unknown') : 'Unknown',
      'diagram_version': diagram ? (diagram.version || '1.0') : '1.0',
      'is_subprocess': diagram ? (diagram.isSubprocessPage || false) : false,
      'is_call_activity': diagram ? (diagram.isCallActivityPage || false) : false,
      'navigation_depth': getNavigationDepth(),
      'previous_diagram': previousDiagram || 'none',
      'previous_diagram_name': previousDiagramName || 'none',
      'entry_point': entryPoint,
      'element_count': diagram && diagram.elements ? diagram.elements.length : 0
    });

    // Também dispara navigation_flow se houver diagrama anterior
    if (previousDiagram) {
      trackNavigationFlow(previousDiagram, diagramId, entryPoint);
    }
  }

  // ===== EVENTO 3: VIEW_ELEMENT (Aprimorado) =====
  function trackViewElement(elementId, elementName, link) {
    var diagramId = session.currentDiagram;
    var element = diagramId ? getElementById(diagramId, elementId) : null;

    // Incrementa contadores
    session.interactionSequence++;
    session.diagramElementClicks++;

    // Registra elemento visualizado
    var elementType = element ? (element.elementType || 'Unknown') : 'Unknown';
    session.elementsViewed.push({
      diagramId: diagramId,
      elementId: elementId,
      type: elementType
    });

    // Conta por tipo
    session.elementTypeCount[elementType] = (session.elementTypeCount[elementType] || 0) + 1;

    // Extrai dados RACI se disponíveis
    var performerRole = '';
    if (element && element.performers && element.performers.length > 0) {
      performerRole = element.performers.map(function(p) { return p.name || p; }).join(', ');
    }

    // Verifica se tem descrição e anexos
    var hasDescription = element && element.description && element.description.trim().length > 0;
    var hasAttachments = element && element.attributes && element.attributes.length > 0;
    var hasProperties = element && element.properties && element.properties.length > 0;

    // Resolve nome do elemento: prioridade DOM > modelo > link
    // O DOM (h2.biz-ex-dialog-name) mostra o nome exato do elemento no dialog
    var resolvedElementName = element ? element.name : elementName;

    // Captura contexto DOM para nomes exibidos na tela
    var domContext = getDOMContext();

    // Aguarda DOM atualizar e captura nome real do dialog se disponível
    setTimeout(function() {
      var updatedContext = getDOMContext();
      var displayedElementName = updatedContext.dialogElementName || resolvedElementName;

      gtag('event', 'view_element', {
        'session_id': session.id,
        'element_id': elementId,
        'element_name': displayedElementName,
        'element_name_from_model': resolvedElementName,
        'element_type': elementType,
        'element_category': categorizeElementType(elementType),
        'diagram_id': diagramId || 'unknown',
        'diagram_name': session.currentDiagramName || 'unknown',
        'process_name': domContext.processName || 'unknown',
        'has_description': hasDescription,
        'has_attachments': hasAttachments,
        'has_properties': hasProperties,
        'performer_role': performerRole || 'none',
        'interaction_sequence': session.interactionSequence,
        'elements_in_session': session.elementsViewed.length
      });
    }, 50); // Pequeno delay para DOM atualizar com dialog
  }

  // ===== EVENTO 4: DIAGRAM_ENGAGEMENT =====
  function trackDiagramEngagement(diagramId, diagramName) {
    if (!diagramId || !session.diagramStartTime) return;

    var timeOnDiagram = Math.round((Date.now() - session.diagramStartTime) / 1000);

    // Só envia se passou mais de 1 segundo (evita eventos vazios)
    if (timeOnDiagram < 1) return;

    gtag('event', 'diagram_engagement', {
      'session_id': session.id,
      'diagram_id': diagramId,
      'diagram_name': diagramName || 'unknown',
      'time_on_diagram_seconds': timeOnDiagram,
      'elements_clicked': session.diagramElementClicks,
      'zoom_interactions': session.zoomInteractions,
      'fullscreen_used': session.fullscreenUsed
    });
  }

  // ===== EVENTO 5: NAVIGATION_FLOW =====
  function trackNavigationFlow(fromDiagramId, toDiagramId, navigationMethod) {
    var fromDiagram = getDiagramById(fromDiagramId);
    var toDiagram = getDiagramById(toDiagramId);

    gtag('event', 'navigation_flow', {
      'session_id': session.id,
      'from_diagram': fromDiagramId,
      'from_diagram_name': fromDiagram ? fromDiagram.name : 'unknown',
      'to_diagram': toDiagramId,
      'to_diagram_name': toDiagram ? toDiagram.name : 'unknown',
      'navigation_method': navigationMethod || 'unknown',
      'session_diagram_count': getNavigationDepth()
    });
  }

  // ===== EVENTO 6: ELEMENT_TYPE_SUMMARY (ao sair) =====
  function trackElementTypeSummary() {
    // Conta elementos únicos
    var uniqueElements = [];
    for (var i = 0; i < session.elementsViewed.length; i++) {
      var id = session.elementsViewed[i].elementId;
      if (uniqueElements.indexOf(id) === -1) {
        uniqueElements.push(id);
      }
    }

    // Prepara dados do evento
    var eventData = {
      'session_id': session.id,
      'session_duration_seconds': Math.round((Date.now() - session.startTime) / 1000),
      'total_element_views': session.elementsViewed.length,
      'unique_elements_viewed': uniqueElements.length,
      'unique_diagrams_viewed': getNavigationDepth()
    };

    // Adiciona contagem por tipo BPMN
    for (var type in session.elementTypeCount) {
      // GA4 não permite caracteres especiais em nomes de parâmetros
      var safeName = type.toLowerCase() + '_views';
      eventData[safeName] = session.elementTypeCount[type];
    }

    gtag('event', 'element_type_summary', eventData);
  }

  // ===== EVENT LISTENERS =====

  document.addEventListener('DOMContentLoaded', function() {
    // Aguarda modelo Bizagi carregar
    var checkModel = setInterval(function() {
      if (window.Bizagi && window.Bizagi.AppModel) {
        clearInterval(checkModel);

        // Dispara session_start após modelo disponível
        trackSessionStart();

        // Identifica diagrama inicial (se já estiver em um)
        var initialDiagram = detectCurrentDiagram();
        if (initialDiagram) {
          session.currentDiagram = initialDiagram.id;
          session.currentDiagramName = initialDiagram.name;
          session.diagramStartTime = Date.now();
          session.diagramsViewed.push(initialDiagram.id);
        }
      }
    }, 100);

    // Timeout de segurança - 5 segundos
    setTimeout(function() {
      clearInterval(checkModel);
      if (!window.Bizagi || !window.Bizagi.AppModel) {
        // Envia session_start mesmo sem modelo
        trackSessionStart();
      }
    }, 5000);

    // ===== CLICK HANDLER PRINCIPAL =====
    document.addEventListener('click', function(e) {
      var link = e.target.closest('.biz-ex-navigate');
      if (link) {
        var href = link.getAttribute('href') || '';

        // Rastreia navegação entre diagramas
        if (href.indexOf('diagram/') !== -1) {
          var diagramId = href.split('diagram/')[1];
          if (diagramId) {
            // Remove possíveis parâmetros ou hash
            diagramId = diagramId.split('?')[0].split('#')[0];
            var diagramName = link.getAttribute('title') || link.textContent.trim();
            trackViewDiagram(diagramId, diagramName, link);
          }
        }

        // Rastreia abertura de propriedades de elementos
        if (href.indexOf('dialog/element') !== -1 || href.indexOf('#element/') !== -1) {
          var elementId = href.split('/').pop();
          if (elementId) {
            elementId = elementId.split('?')[0].split('#')[0];
            var elementName = link.getAttribute('title') || link.textContent.trim();
            trackViewElement(elementId, elementName, link);
          }
        }
      }

      // Detecta clique em zoom controls
      if (e.target.closest('.biz-ex-zoom-in, .biz-ex-zoom-out, .zoom-control')) {
        session.zoomInteractions++;
      }
    });

    // ===== FULLSCREEN DETECTION =====
    document.addEventListener('fullscreenchange', function() {
      if (document.fullscreenElement) {
        session.fullscreenUsed = true;
      }
    });

    // Fallback para webkit
    document.addEventListener('webkitfullscreenchange', function() {
      if (document.webkitFullscreenElement) {
        session.fullscreenUsed = true;
      }
    });
  });

  // ===== TRACKING AO SAIR DA PÁGINA =====
  window.addEventListener('beforeunload', function() {
    // Envia engagement do último diagrama
    if (session.currentDiagram && session.diagramStartTime) {
      trackDiagramEngagement(session.currentDiagram, session.currentDiagramName);
    }

    // Envia resumo por tipo de elemento
    if (session.elementsViewed.length > 0) {
      trackElementTypeSummary();
    }
  });

  // Fallback para pagehide (melhor suporte mobile)
  window.addEventListener('pagehide', function() {
    if (session.currentDiagram && session.diagramStartTime) {
      trackDiagramEngagement(session.currentDiagram, session.currentDiagramName);
    }
    if (session.elementsViewed.length > 0) {
      trackElementTypeSummary();
    }
  });

  // ===== HELPER: DETECTA DIAGRAMA ATUAL =====
  function detectCurrentDiagram() {
    var model = getAppModel();
    if (!model.pages || model.pages.length === 0) return null;

    // Tenta detectar pelo hash da URL
    var hash = window.location.hash;
    if (hash && hash.indexOf('diagram/') !== -1) {
      var id = hash.split('diagram/')[1];
      if (id) {
        id = id.split('?')[0].split('#')[0];
        var diagram = getDiagramById(id);
        if (diagram) return { id: id, name: diagram.name };
      }
    }

    // Fallback: primeiro diagrama (default)
    var defaultPage = model.pages[0];
    return { id: defaultPage.id, name: defaultPage.name };
  }

})();
