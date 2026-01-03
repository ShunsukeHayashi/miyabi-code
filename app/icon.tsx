import { ImageResponse } from 'next/og';

/**
 * Miyabi Mission Control - Dynamic Favicon Generation
 * Issue #1267: Comprehensive SEO optimization for better discoverability
 */
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '4px',
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    },
  );
}
