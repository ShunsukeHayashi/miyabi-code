import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

// TCG Card Component
interface TCGCardProps {
  id: string;
  nameJa: string;
  nameEn: string;
  role: string;
  type: string;
  cost: number;
  atk: number;
  def: number;
  hp: number;
  rarity: 'R' | 'SR' | 'SSR';
  element: string;
  ability: string;
  cardNumber: string;
  color: string;
  imageUrl?: string;
}

const TCGCard: React.FC<TCGCardProps> = ({
  nameJa,
  nameEn,
  role,
  type,
  cost,
  atk,
  def,
  hp,
  rarity,
  element,
  ability,
  cardNumber,
  color,
  imageUrl
}) => {
  return (
    <div className="tcg-card" style={{
      width: '744px',
      height: '1039px',
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `8px solid ${color}`,
      borderRadius: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      fontFamily: "'Noto Sans JP', sans-serif"
    }}>
      {/* Holographic overlay effect */}
      <div className="holographic-overlay" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.05) 10px,
            rgba(255,255,255,0.05) 20px
          )
        `,
        pointerEvents: 'none'
      }} />
      
      {/* Top section with name and cost */}
      <div className="card-header" style={{
        padding: '20px',
        background: `linear-gradient(to bottom, ${color}, ${color}dd)`,
        color: 'white',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              margin: 0,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '2px'
            }}>{nameEn}</h1>
            <h2 style={{
              fontSize: '32px',
              margin: 0,
              opacity: 0.9,
              marginTop: '-8px'
            }}>{nameJa}</h2>
          </div>
          <div className="energy-cost" style={{
            display: 'flex',
            gap: '8px'
          }}>
            {Array.from({ length: cost }, (_, i) => (
              <div key={i} style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fff, #ffd700)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main art area */}
      <div className="card-art" style={{
        height: '520px',
        margin: '20px',
        background: imageUrl ? `url(${imageUrl})` : `linear-gradient(135deg, ${color}33, white)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '16px',
        border: `4px solid ${color}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!imageUrl && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: color
          }}>
            <div style={{ fontSize: '120px' }}>🎴</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{nameEn}</div>
            <div style={{ fontSize: '18px' }}>{role}</div>
          </div>
        )}
        
        {/* Sparkle effects */}
        <div className="sparkles" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)
          `
        }} />
      </div>
      
      {/* Type banner */}
      <div className="type-banner" style={{
        margin: '0 20px',
        padding: '12px 20px',
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        color: 'white',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <span>{type}</span>
        <span className={`rarity rarity-${rarity}`} style={{
          background: rarity === 'SSR' ? 'linear-gradient(45deg, #ffd700, #ffed4e)' : 
                     rarity === 'SR' ? 'linear-gradient(45deg, #c0c0c0, #e8e8e8)' :
                     'linear-gradient(45deg, #cd7f32, #daa520)',
          padding: '4px 12px',
          borderRadius: '16px',
          color: '#333',
          fontSize: '20px'
        }}>{rarity}</span>
      </div>
      
      {/* Stats box */}
      <div className="stats-box" style={{
        margin: '20px',
        padding: '16px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '12px',
        border: `3px solid ${color}`,
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: '28px',
        fontWeight: 'bold'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ff4444' }}>ATK</div>
          <div style={{ fontSize: '36px' }}>{atk}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#4444ff' }}>DEF</div>
          <div style={{ fontSize: '36px' }}>{def}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#44ff44' }}>HP</div>
          <div style={{ fontSize: '36px' }}>{hp}</div>
        </div>
      </div>
      
      {/* Ability box */}
      <div className="ability-box" style={{
        margin: '20px',
        marginTop: '10px',
        padding: '16px',
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        borderRadius: '12px',
        border: `2px solid ${color}`,
        minHeight: '80px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: color,
          marginBottom: '8px'
        }}>{element} • Special Ability</div>
        <div style={{
          fontSize: '18px',
          lineHeight: '1.4'
        }}>{ability}</div>
      </div>
      
      {/* Bottom section */}
      <div className="card-footer" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '16px',
        opacity: 0.8
      }}>
        <span>{cardNumber}</span>
        <span>© 2025 Miyabi TCG</span>
        <span>{element}</span>
      </div>
    </div>
  );
};

// Export component and card data
export default TCGCard;

// Card data for all 24 characters
export const cardData: TCGCardProps[] = [
  {
    id: 'shikiroon',
    nameJa: 'しきるん',
    nameEn: 'Shikiroon',
    role: 'Orchestrator',
    type: 'Master Agent',
    cost: 8,
    atk: 3000,
    def: 3500,
    hp: 4000,
    rarity: 'SSR',
    element: 'Light',
    ability: 'Orchestra Command: When played, activate up to 3 other Agent cards',
    cardNumber: 'MI-001',
    color: '#FFD700'
  },
  {
    id: 'tsukuroon',
    nameJa: 'つくるん',
    nameEn: 'Tsukuroon',
    role: 'CodeGen Agent',
    type: 'Creator Agent',
    cost: 5,
    atk: 2500,
    def: 2000,
    hp: 3000,
    rarity: 'SR',
    element: 'Tech',
    ability: 'Code Generation: Create a Support card token each turn',
    cardNumber: 'MI-002',
    color: '#4169E1'
  },
  {
    id: 'medaman',
    nameJa: 'めだまん',
    nameEn: 'Medaman',
    role: 'Review Agent',
    type: 'Guardian Agent',
    cost: 4,
    atk: 1800,
    def: 3000,
    hp: 3200,
    rarity: 'SR',
    element: 'Mind',
    ability: 'All-Seeing Eye: Reveal opponent\'s hand when deployed',
    cardNumber: 'MI-003',
    color: '#9370DB'
  },
  {
    id: 'mitsukeroon',
    nameJa: 'みつけるん',
    nameEn: 'Mitsukeroon',
    role: 'Issue Agent',
    type: 'Scout Agent',
    cost: 3,
    atk: 2200,
    def: 1500,
    hp: 2500,
    rarity: 'R',
    element: 'Wind',
    ability: 'Issue Hunter: Draw 2 cards when finding a bug token',
    cardNumber: 'MI-004',
    color: '#32CD32'
  },
  {
    id: 'matomeroon',
    nameJa: 'まとめるん',
    nameEn: 'Matomeroon',
    role: 'PR Agent',
    type: 'Support Agent',
    cost: 4,
    atk: 2000,
    def: 2500,
    hp: 2800,
    rarity: 'R',
    element: 'Order',
    ability: 'PR Master: Merge 2 Code tokens into a Release token',
    cardNumber: 'MI-005',
    color: '#FF8C00'
  },
  {
    id: 'hakoboon',
    nameJa: 'はこぶん',
    nameEn: 'Hakoboon',
    role: 'Deployment Agent',
    type: 'Transport Agent',
    cost: 6,
    atk: 2800,
    def: 2200,
    hp: 3500,
    rarity: 'SR',
    element: 'Speed',
    ability: 'Swift Deploy: Deploy cards directly to production zone',
    cardNumber: 'MI-006',
    color: '#DC143C'
  },
  {
    id: 'tsunagun',
    nameJa: 'つなぐん',
    nameEn: 'Tsunagun',
    role: 'Refresher Agent',
    type: 'Link Agent',
    cost: 3,
    atk: 1500,
    def: 2000,
    hp: 2500,
    rarity: 'R',
    element: 'Flow',
    ability: 'Refresh Link: Restore 1000 HP to all friendly Agents',
    cardNumber: 'MI-007',
    color: '#00CED1'
  },
  {
    id: 'kikakuron',
    nameJa: 'きかくろん',
    nameEn: 'Kikakuron',
    role: 'AI Entrepreneur',
    type: 'Business Agent',
    cost: 7,
    atk: 3200,
    def: 2800,
    hp: 4000,
    rarity: 'SSR',
    element: 'Innovation',
    ability: 'Business Vision: Generate 2 revenue tokens per turn',
    cardNumber: 'MI-008',
    color: '#FF1493'
  },
  {
    id: 'jibunkun',
    nameJa: 'じぶんくん',
    nameEn: 'Jibunkun',
    role: 'Self Analysis',
    type: 'Insight Agent',
    cost: 2,
    atk: 1200,
    def: 1800,
    hp: 2000,
    rarity: 'R',
    element: 'Mind',
    ability: 'Self Reflection: Copy target Agent\'s ability',
    cardNumber: 'MI-009',
    color: '#9932CC'
  },
  {
    id: 'shiraberu',
    nameJa: 'しらべる',
    nameEn: 'Shiraberu',
    role: 'Market Research',
    type: 'Research Agent',
    cost: 3,
    atk: 1600,
    def: 2200,
    hp: 2500,
    rarity: 'R',
    element: 'Data',
    ability: 'Market Scan: Look at top 5 cards of deck',
    cardNumber: 'MI-010',
    color: '#4682B4'
  },
  {
    id: 'perusona',
    nameJa: 'ぺるそな',
    nameEn: 'Perusona',
    role: 'Persona Designer',
    type: 'Creator Agent',
    cost: 4,
    atk: 2000,
    def: 2000,
    hp: 2800,
    rarity: 'R',
    element: 'Identity',
    ability: 'Persona Craft: Transform Agent into any type',
    cardNumber: 'MI-011',
    color: '#FF69B4'
  },
  {
    id: 'konseputan',
    nameJa: 'こんせぷたん',
    nameEn: 'Konseputan',
    role: 'Product Concept',
    type: 'Design Agent',
    cost: 3,
    atk: 1800,
    def: 1600,
    hp: 2400,
    rarity: 'R',
    element: 'Idea',
    ability: 'Concept Birth: Create a Product token',
    cardNumber: 'MI-012',
    color: '#DA70D6'
  },
  {
    id: 'dezainyan',
    nameJa: 'でざいにゃん',
    nameEn: 'Dezainyan',
    role: 'Product Designer',
    type: 'Art Agent',
    cost: 5,
    atk: 2400,
    def: 2600,
    hp: 3200,
    rarity: 'SR',
    element: 'Beauty',
    ability: 'Design Magic: Double ATK of Product tokens',
    cardNumber: 'MI-013',
    color: '#FF1493'
  },
  {
    id: 'kakuchan',
    nameJa: 'かくちゃん',
    nameEn: 'Kakuchan',
    role: 'Content Creator',
    type: 'Media Agent',
    cost: 4,
    atk: 2200,
    def: 1800,
    hp: 2600,
    rarity: 'R',
    element: 'Story',
    ability: 'Content Stream: Draw a card for each Content token',
    cardNumber: 'MI-014',
    color: '#FFB6C1'
  },
  {
    id: 'notesan',
    nameJa: 'のーとさん',
    nameEn: 'Notesan',
    role: 'Note Blogger',
    type: 'Writer Agent',
    cost: 3,
    atk: 1600,
    def: 2000,
    hp: 2400,
    rarity: 'R',
    element: 'Words',
    ability: 'Blog Power: Create Article token each turn',
    cardNumber: 'MI-015',
    color: '#20B2AA'
  },
  {
    id: 'janelkun',
    nameJa: 'じゃねるくん',
    nameEn: 'Janelkun',
    role: 'Funnel Designer',
    type: 'Flow Agent',
    cost: 5,
    atk: 2300,
    def: 2100,
    hp: 3000,
    rarity: 'SR',
    element: 'Conversion',
    ability: 'Funnel Master: Convert 3 tokens into Victory points',
    cardNumber: 'MI-016',
    color: '#FF8C00'
  },
  {
    id: 'snssun',
    nameJa: 'すんすさん',
    nameEn: 'SNSsun',
    role: 'SNS Strategist',
    type: 'Social Agent',
    cost: 4,
    atk: 2000,
    def: 2200,
    hp: 2800,
    rarity: 'R',
    element: 'Network',
    ability: 'Viral Spread: Copy ability to all friendly Agents',
    cardNumber: 'MI-017',
    color: '#1DA1F2'
  },
  {
    id: 'makettosama',
    nameJa: 'まけっとさま',
    nameEn: 'Makettosama',
    role: 'Marketing Master',
    type: 'Master Agent',
    cost: 7,
    atk: 3500,
    def: 2500,
    hp: 4000,
    rarity: 'SSR',
    element: 'Strategy',
    ability: 'Market Domination: All Business Agents gain +1000 ATK',
    cardNumber: 'MI-018',
    color: '#FFD700'
  },
  {
    id: 'saerusu',
    nameJa: 'せーるすせんせい',
    nameEn: 'Saerusu Sensei',
    role: 'Sales Teacher',
    type: 'Mentor Agent',
    cost: 6,
    atk: 2800,
    def: 2400,
    hp: 3500,
    rarity: 'SR',
    element: 'Persuasion',
    ability: 'Sales Lesson: Convert opponent\'s token to your side',
    cardNumber: 'MI-019',
    color: '#228B22'
  },
  {
    id: 'cusrelo',
    nameJa: 'かすれろちゃん',
    nameEn: 'Cusrelo-chan',
    role: 'CRM Manager',
    type: 'Support Agent',
    cost: 4,
    atk: 1800,
    def: 2600,
    hp: 3000,
    rarity: 'R',
    element: 'Relations',
    ability: 'Customer Care: Heal 500 HP per Customer token',
    cardNumber: 'MI-020',
    color: '#FFA07A'
  },
  {
    id: 'bunsekyking',
    nameJa: 'ぶんせききんぐ',
    nameEn: 'Bunseki King',
    role: 'Analysis King',
    type: 'Royal Agent',
    cost: 6,
    atk: 2600,
    def: 3000,
    hp: 3800,
    rarity: 'SR',
    element: 'Logic',
    ability: 'Royal Analysis: Reveal all hidden information',
    cardNumber: 'MI-021',
    color: '#4169E1'
  },
  {
    id: 'yuchubeler',
    nameJa: 'ゆーちゅーべらー',
    nameEn: 'Yuchubeler',
    role: 'YouTuber',
    type: 'Star Agent',
    cost: 5,
    atk: 2500,
    def: 2000,
    hp: 3000,
    rarity: 'SR',
    element: 'Fame',
    ability: 'Channel Power: Gain +500 ATK per View token',
    cardNumber: 'MI-022',
    color: '#FF0000'
  },
  {
    id: 'imargesan',
    nameJa: 'いまーじゅさん',
    nameEn: 'Imargesan',
    role: 'Image Creator',
    type: 'Visual Agent',
    cost: 4,
    atk: 2200,
    def: 2000,
    hp: 2800,
    rarity: 'R',
    element: 'Art',
    ability: 'Image Magic: Create illusion copy of any Agent',
    cardNumber: 'MI-023',
    color: '#FF69B4'
  },
  {
    id: 'gasladen',
    nameJa: 'すらいどん',
    nameEn: 'Gasladen',
    role: 'Slide Presenter',
    type: 'Presenter Agent',
    cost: 5,
    atk: 2400,
    def: 2200,
    hp: 3200,
    rarity: 'SR',
    element: 'Presentation',
    ability: 'Perfect Pitch: Skip opponent\'s next turn',
    cardNumber: 'MI-024',
    color: '#FF4500'
  }
];