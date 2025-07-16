import React, { useState } from 'react';
import './CustomTooltip.css';

const CustomTooltip = ({ children, content, type }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [arrowPosition, setArrowPosition] = useState('left'); // 'left', 'right', 'top', 'bottom'

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    const tooltipWidth = 240; // Exactamente igual al CSS reducido
    const tooltipHeight = 150; // Altura máxima reducida
    const margin = 15; // Margen mínimo desde los bordes
    
    let x, y, arrow;
    
    // Calcular el centro horizontal del elemento
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;
    
    // Prioridad 1: Arriba del elemento
    if (rect.top - tooltipHeight - margin > 0) {
      x = elementCenterX - tooltipWidth / 2;
      y = rect.top - tooltipHeight - 10;
      arrow = 'bottom';
    }
    // Prioridad 2: Abajo del elemento
    else if (rect.bottom + tooltipHeight + margin < window.innerHeight) {
      x = elementCenterX - tooltipWidth / 2;
      y = rect.bottom + 10;
      arrow = 'top';
    }
    // Prioridad 3: A la derecha del elemento
    else if (rect.right + tooltipWidth + margin < window.innerWidth) {
      x = rect.right + 10;
      y = elementCenterY - tooltipHeight / 2;
      arrow = 'left';
    }
    // Prioridad 4: A la izquierda del elemento
    else if (rect.left - tooltipWidth - margin > 0) {
      x = rect.left - tooltipWidth - 10;
      y = elementCenterY - tooltipHeight / 2;
      arrow = 'right';
    }
    // Último recurso: Forzar posición arriba con ajustes
    else {
      x = elementCenterX - tooltipWidth / 2;
      y = rect.top - tooltipHeight - 10;
      arrow = 'bottom';
      
      // Si se sale por arriba, ponerlo abajo
      if (y < margin) {
        y = rect.bottom + 10;
        arrow = 'top';
        
        // Si también se sale por abajo, centrarlo en pantalla
        if (y + tooltipHeight > window.innerHeight - margin) {
          y = Math.max(margin, (window.innerHeight - tooltipHeight) / 2);
        }
      }
    }
    
    // Ajustar horizontalmente para que no se salga NUNCA
    if (x < margin) {
      x = margin;
    } else if (x + tooltipWidth > window.innerWidth - margin) {
      x = window.innerWidth - tooltipWidth - margin;
    }
    
    // Ajustar verticalmente para que no se salga NUNCA
    if (y < margin) {
      y = margin;
    } else if (y + tooltipHeight > window.innerHeight - margin) {
      y = window.innerHeight - tooltipHeight - margin;
    }
    
    setPosition({ x, y });
    setArrowPosition(arrow);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const renderTooltipContent = () => {
    if (!content) return null;

    switch (type) {
      case 'truck':
        return (
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-title">Camión {content.codigo}</span>
              <span className="tooltip-type">{content.placa}</span>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-section">
                <div className="tooltip-row">
                  <span className="tooltip-label">Combustible:</span>
                  <span className="tooltip-value">{content.combustibleActual}L / {content.combustibleMax}L</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">GLP:</span>
                  <span className="tooltip-value">{content.glpActual}L / {content.glpMax}L</span>
                </div>
                {content.estadoActual && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">Estado:</span>
                    <span className="tooltip-value tooltip-status">{content.estadoActual}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'cisterna':
        return (
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-title">{content.tipo}</span>
              <span className="tooltip-type">{content.porcentaje}%</span>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-section">
                <div className="tooltip-row">
                  <span className="tooltip-label">GLP:</span>
                  <span className="tooltip-value">{content.glpActual}L / {content.capacidadTotal}L</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Abastecimiento:</span>
                  <span className="tooltip-value">{content.horaAbastecimiento}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pedido':
        return (
          <div className="tooltip-content">
            <div className="tooltip-header">
              <span className="tooltip-title">Pedido {content.numeroPedido}</span>
              <span className={`tooltip-type status-${content.estado.toLowerCase()}`}>
                {content.estado}
              </span>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-section">
                <div className="tooltip-row">
                  <span className="tooltip-label">Volumen GLP:</span>
                  <span className="tooltip-value">{content.volumenGLP}L</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Entrega máxima:</span>
                  <span className="tooltip-value">{content.fechaMaxEntrega}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="tooltip-content">
            <div className="tooltip-simple">{content}</div>
          </div>
        );
    }
  };

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick: (e) => {
          if (children.props.onClick) {
            children.props.onClick(e);
          }
        },
        onContextMenu: (e) => {
          if (children.props.onContextMenu) {
            children.props.onContextMenu(e);
          }
        }
      })}
      
      {isVisible && (
        <div
          className="custom-tooltip"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          <div className={`tooltip-arrow arrow-${arrowPosition}`}></div>
          {renderTooltipContent()}
        </div>
      )}
    </>
  );
};

export default CustomTooltip;
