// Google Analytics + Eventos Customizados para Bizagi Viewer
// Arquivo separado para sobreviver às republicações do Bizagi
// Measurement ID: G-FRFLL5744D

// Carrega gtag.js dinamicamente
(function() {
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-FRFLL5744D';
  document.head.appendChild(script);
})();

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FRFLL5744D');

// Eventos customizados para rastrear interações no Bizagi Viewer
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.biz-ex-navigate');
    if (link) {
      var href = link.getAttribute('href') || '';

      // Rastreia navegação entre diagramas
      if (href.indexOf('diagram/') !== -1) {
        var diagramId = href.split('diagram/')[1];
        var diagramName = link.getAttribute('title') || link.textContent.trim();
        gtag('event', 'view_diagram', {
          'event_category': 'navigation',
          'event_label': diagramId,
          'diagram_name': diagramName
        });
      }

      // Rastreia abertura de propriedades de elementos
      if (href.indexOf('dialog/element') !== -1) {
        var elementId = href.split('/').pop();
        var elementName = link.getAttribute('title') || link.textContent.trim();
        gtag('event', 'view_element_properties', {
          'event_category': 'interaction',
          'event_label': elementId,
          'element_name': elementName
        });
      }
    }
  });
});
