import { ImageResponse } from 'next/og';

/**
 * Miyabi Mission Control - Apple Touch Icon
 * Issue #1267: Comprehensive SEO optimization for better discoverability
 */
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '20px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 72, marginBottom: '-10px' }}>M</div>
          <div style={{ fontSize: 24, fontWeight: 300 }}>雅</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
