import React from 'react';
import OrnateFancyButton from './OrnateFancyButton';

const ButtonDemo: React.FC = () => {
  const handleBoostAura = () => {
    console.log('Watch Ad: Boost Aura clicked!');
    alert('Watch Ad: Boost Aura clicked!');
  };

  const handleGetDewDrops = () => {
    console.log('Watch Ad: Get Dew Drops clicked!');
    alert('Watch Ad: Get Dew Drops clicked!');
  };

  const handleGenericAction = (action: string) => {
    console.log(`${action} clicked!`);
    alert(`${action} clicked!`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        color: '#ffd700',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '2rem',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        fontFamily: '"Cinzel", "Times New Roman", serif'
      }}>
        Ornate Fantasy Buttons
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        width: '100%'
      }}>
        
        {/* Original buttons from the image */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Original Buttons</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="teal" 
              size="medium"
              onClick={handleBoostAura}
            >
              Watch Ad:<br/>
              Boost Aura
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="purple" 
              size="medium"
              onClick={handleGetDewDrops}
            >
              Watch Ad:<br/>
              Get Dew Drops
            </OrnateFancyButton>
          </div>
        </div>

        {/* Gold variant buttons */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Gold Variants</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="gold" 
              size="medium"
              onClick={() => handleGenericAction('Golden Power')}
            >
              Golden<br/>
              Power
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="gold" 
              size="large"
              onClick={() => handleGenericAction('Legendary Reward')}
            >
              Legendary<br/>
              Reward
            </OrnateFancyButton>
          </div>
        </div>

        {/* Silver variant buttons */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Silver Variants</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="silver" 
              size="small"
              onClick={() => handleGenericAction('Silver Shield')}
            >
              Silver<br/>
              Shield
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="silver" 
              size="medium"
              onClick={() => handleGenericAction('Mystic Armor')}
            >
              Mystic<br/>
              Armor
            </OrnateFancyButton>
          </div>
        </div>

        {/* Different sizes showcase */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Size Variants</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="teal" 
              size="small"
              onClick={() => handleGenericAction('Small Button')}
            >
              Small
            </OrnateFancyButton>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="purple" 
              size="medium"
              onClick={() => handleGenericAction('Medium Button')}
            >
              Medium
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="gold" 
              size="large"
              onClick={() => handleGenericAction('Large Button')}
            >
              Large
            </OrnateFancyButton>
          </div>
        </div>

        {/* Disabled state */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Disabled State</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="teal" 
              size="medium"
              disabled={true}
            >
              Disabled<br/>
              Button
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="purple" 
              size="medium"
              disabled={true}
            >
              Coming<br/>
              Soon
            </OrnateFancyButton>
          </div>
        </div>

        {/* Gaming themed buttons */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Gaming Themed</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="teal" 
              size="medium"
              onClick={() => handleGenericAction('Quest Start')}
            >
              Start<br/>
              Quest
            </OrnateFancyButton>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <OrnateFancyButton 
              variant="purple" 
              size="medium"
              onClick={() => handleGenericAction('Cast Spell')}
            >
              Cast<br/>
              Spell
            </OrnateFancyButton>
          </div>
          
          <div>
            <OrnateFancyButton 
              variant="gold" 
              size="medium"
              onClick={() => handleGenericAction('Claim Treasure')}
            >
              Claim<br/>
              Treasure
            </OrnateFancyButton>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '3rem',
        padding: '2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '15px',
        border: '2px solid #ffd700',
        maxWidth: '800px'
      }}>
        <h3 style={{ color: '#ffd700', textAlign: 'center', marginBottom: '1rem' }}>
          Features
        </h3>
        <ul style={{ color: '#ffffff', lineHeight: '1.8' }}>
          <li>🎨 <strong>4 Variants:</strong> Teal, Purple, Gold, and Silver themes</li>
          <li>📏 <strong>3 Sizes:</strong> Small, Medium, and Large options</li>
          <li>✨ <strong>Ornate Design:</strong> Golden corner decorations and center ornament</li>
          <li>🎮 <strong>Interactive:</strong> Hover, click, and disabled states</li>
          <li>🌟 <strong>Glowing Effects:</strong> Subtle lighting and shadow effects</li>
          <li>🎭 <strong>Fantasy Theme:</strong> Medieval/RPG game aesthetic</li>
          <li>📱 <strong>Responsive:</strong> Works on all screen sizes</li>
        </ul>
      </div>
    </div>
  );
};

export default ButtonDemo;