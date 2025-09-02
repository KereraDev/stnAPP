import React, { useState } from 'react';

/**
 * Componente de documentación UX/UI que muestra mejores prácticas
 * y permite comparar diferentes enfoques de interfaz
 */
export function UXGuideComponent() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = {
    overview: '📋 Resumen',
    accessibility: '♿ Accesibilidad',
    performance: '⚡ Rendimiento',
    mobile: '📱 Móvil',
    testing: '🧪 Testing'
  };

  const bestPractices = {
    overview: {
      title: 'Mejores Prácticas UX/UI Implementadas',
      content: [
        {
          practice: 'Navegación por Teclado',
          description: 'Todos los componentes son completamente navegables con teclado',
          implementation: 'Arrow keys, Tab, Enter, Escape, Space',
          benefit: 'Accesibilidad para usuarios con discapacidades motoras'
        },
        {
          practice: 'Feedback Visual Inmediato',
          description: 'Estados visuales claros para interacciones',
          implementation: 'Hover, focus, active, loading states',
          benefit: 'Usuario siempre sabe el estado del sistema'
        },
        {
          practice: 'Búsqueda Inteligente',
          description: 'Autocompletado con filtros por categoría',
          implementation: 'Fuzzy matching, categorización automática',
          benefit: 'Encuentra opciones más rápido'
        },
        {
          practice: 'Diseño Progresivo',
          description: 'Múltiples niveles de complejidad según necesidad',
          implementation: 'Simple → Autocomplete → Stepper → Modal',
          benefit: 'Adapta la complejidad al contexto de uso'
        }
      ]
    },
    accessibility: {
      title: 'Características de Accesibilidad (WCAG 2.1)',
      content: [
        {
          practice: 'ARIA Labels Completos',
          description: 'Etiquetas descriptivas para lectores de pantalla',
          implementation: 'aria-label, aria-expanded, aria-describedby, role',
          benefit: 'Compatible con tecnologías asistivas'
        },
        {
          practice: 'Contraste Adecuado',
          description: 'Ratio de contraste mínimo 4.5:1',
          implementation: 'Colores probados con herramientas de contraste',
          benefit: 'Legible para usuarios con baja visión'
        },
        {
          practice: 'Tamaños de Toque',
          description: 'Elementos interactivos mínimo 44px',
          implementation: 'min-height y padding adecuados en móviles',
          benefit: 'Fácil uso en pantallas táctiles'
        },
        {
          practice: 'Indicadores de Foco',
          description: 'Bordes y sombras visibles al navegar por teclado',
          implementation: 'focus-visible, outline, box-shadow',
          benefit: 'Navegación clara sin mouse'
        }
      ]
    },
    performance: {
      title: 'Optimizaciones de Rendimiento',
      content: [
        {
          practice: 'Debounced Search',
          description: 'Búsqueda optimizada con retraso',
          implementation: 'useMemo para filtros complejos',
          benefit: 'Reduce carga computacional en búsquedas rápidas'
        },
        {
          practice: 'Virtual Scrolling (Ready)',
          description: 'Preparado para listas muy grandes',
          implementation: 'maxResults y paginación',
          benefit: 'Mantiene rendimiento con miles de opciones'
        },
        {
          practice: 'Lazy Loading',
          description: 'Carga diferida de componentes pesados',
          implementation: 'Modal solo monta cuando se abre',
          benefit: 'Tiempo de carga inicial más rápido'
        },
        {
          practice: 'Memoización Inteligente',
          description: 'Cache de cálculos costosos',
          implementation: 'useMemo para filtros y ordenamientos',
          benefit: 'Evita recálculos innecesarios'
        }
      ]
    },
    mobile: {
      title: 'Optimización Móvil',
      content: [
        {
          practice: 'Touch-First Design',
          description: 'Diseñado primero para pantallas táctiles',
          implementation: 'Gestos intuitivos, áreas de toque amplias',
          benefit: 'Experiencia natural en móviles'
        },
        {
          practice: 'Modal vs Dropdown Inteligente',
          description: 'Diferentes UI según tamaño de pantalla',
          implementation: 'CSS media queries y detección de dispositivo',
          benefit: 'UI adaptativa al contexto'
        },
        {
          practice: 'Viewport Optimization',
          description: 'Uso eficiente del espacio disponible',
          implementation: 'max-height dinámico, scroll inteligente',
          benefit: 'Aprovecha toda la pantalla disponible'
        },
        {
          practice: 'Offline Ready',
          description: 'Funciona sin conexión con datos cacheados',
          implementation: 'localStorage para opciones frecuentes',
          benefit: 'Usabilidad incluso sin internet'
        }
      ]
    },
    testing: {
      title: 'Estrategias de Testing UX',
      content: [
        {
          practice: 'A/B Testing Ready',
          description: 'Fácil intercambio entre versiones',
          implementation: 'Selector de modo UX en desarrollo',
          benefit: 'Datos reales sobre preferencias de usuario'
        },
        {
          practice: 'Accessibility Testing',
          description: 'Pruebas automatizadas de accesibilidad',
          implementation: 'axe-core, react-testing-library',
          benefit: 'Garantiza cumplimiento WCAG'
        },
        {
          practice: 'Performance Monitoring',
          description: 'Métricas de rendimiento en tiempo real',
          implementation: 'React DevTools Profiler',
          benefit: 'Identificación proactiva de problemas'
        },
        {
          practice: 'User Journey Testing',
          description: 'Flujos completos de interacción',
          implementation: 'Cypress, Playwright end-to-end',
          benefit: 'Valida experiencia completa del usuario'
        }
      ]
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            🎨 Guía UX/UI - Componentes Mejorados
          </h2>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Implementaciones siguiendo las mejores prácticas de usabilidad y accesibilidad
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          {Object.entries(tabs).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === key ? '#ffffff' : 'transparent',
                color: activeTab === key ? '#3b82f6' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeTab === key ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {bestPractices[activeTab].title}
          </h3>

          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {bestPractices[activeTab].content.map((item, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {item.practice}
                    </h4>
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.5'
                    }}>
                      {item.description}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '12px'
                    }}>
                      <div>
                        <strong style={{ 
                          fontSize: '12px', 
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Implementación:
                        </strong>
                        <div style={{
                          marginTop: '4px',
                          padding: '8px',
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '13px',
                          color: '#1f2937',
                          fontFamily: 'monospace'
                        }}>
                          {item.implementation}
                        </div>
                      </div>
                      <div>
                        <strong style={{ 
                          fontSize: '12px', 
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Beneficio:
                        </strong>
                        <div style={{
                          marginTop: '4px',
                          padding: '8px',
                          backgroundColor: '#ecfdf5',
                          borderRadius: '4px',
                          fontSize: '13px',
                          color: '#065f46',
                          border: '1px solid #a7f3d0'
                        }}>
                          {item.benefit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>✨</span>
            <span>Implementado siguiendo WCAG 2.1 y Material Design</span>
          </div>
          <button
            onClick={() => {
              // Esta función sería pasada como prop para cerrar el modal
              console.log('Cerrar guía UX');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default UXGuideComponent;
