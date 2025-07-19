import React from 'react';

interface OrnateFancyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'teal' | 'purple' | 'gold' | 'silver';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

const OrnateFancyButton: React.FC<OrnateFancyButtonProps> = ({
  children,
  onClick,
  variant = 'teal',
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'teal':
        return {
          background: 'linear-gradient(145deg, #0d7377 0%, #14a085 50%, #0d7377 100%)',
          border: '3px solid #ffd700',
          shadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)'
        };
      case 'purple':
        return {
          background: 'linear-gradient(145deg, #4a154b 0%, #8b5cf6 50%, #4a154b 100%)',
          border: '3px solid #ffd700',
          shadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)'
        };
      case 'gold':
        return {
          background: 'linear-gradient(145deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)',
          border: '3px solid #8b4513',
          shadow: '0 0 20px rgba(139, 69, 19, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
        };
      case 'silver':
        return {
          background: 'linear-gradient(145deg, #708090 0%, #c0c0c0 50%, #708090 100%)',
          border: '3px solid #4682b4',
          shadow: '0 0 20px rgba(70, 130, 180, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
        };
      default:
        return {
          background: 'linear-gradient(145deg, #0d7377 0%, #14a085 50%, #0d7377 100%)',
          border: '3px solid #ffd700',
          shadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          minWidth: '120px',
          height: '40px'
        };
      case 'medium':
        return {
          padding: '12px 24px',
          fontSize: '16px',
          minWidth: '160px',
          height: '50px'
        };
      case 'large':
        return {
          padding: '16px 32px',
          fontSize: '18px',
          minWidth: '200px',
          height: '60px'
        };
      default:
        return {
          padding: '12px 24px',
          fontSize: '16px',
          minWidth: '160px',
          height: '50px'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle = {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Cinzel", "Times New Roman", serif',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    background: variantStyles.background,
    border: variantStyles.border,
    borderRadius: '25px',
    boxShadow: variantStyles.shadow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    overflow: 'hidden' as const,
    ...sizeStyles,
    opacity: disabled ? 0.6 : 1
  };

  const decorativeCorners = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none' as const
  };

  return (
    <button
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      className={`ornate-fancy-button ${className}`}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'brightness(1)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
    >
      {/* Decorative corners */}
      <div style={decorativeCorners}>
        {/* Top-left ornament */}
        <div style={{
          position: 'absolute',
          top: '-1px',
          left: '-1px',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))'
        }} />
        
        {/* Top-right ornament */}
        <div style={{
          position: 'absolute',
          top: '-1px',
          right: '-1px',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))'
        }} />
        
        {/* Bottom-left ornament */}
        <div style={{
          position: 'absolute',
          bottom: '-1px',
          left: '-1px',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(-45deg, #ffd700, #ffed4e)',
          clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
          filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))'
        }} />
        
        {/* Bottom-right ornament */}
        <div style={{
          position: 'absolute',
          bottom: '-1px',
          right: '-1px',
          width: '20px',
          height: '20px',
          background: 'linear-gradient(-135deg, #ffd700, #ffed4e)',
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))'
        }} />
        
        {/* Center ornamental diamond */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '12px',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          borderRadius: '50%',
          border: '2px solid #8b4513',
          filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.9))'
        }} />
      </div>
      
      {/* Button content */}
      <span style={{ 
        position: 'relative', 
        zIndex: 1,
        textAlign: 'center' 
      }}>
        {children}
      </span>
      
      {/* Glowing effect overlay */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        right: '10%',
        height: '30%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
        borderRadius: '50%',
        filter: 'blur(8px)',
        pointerEvents: 'none'
      }} />
    </button>
  );
};

export default OrnateFancyButton;