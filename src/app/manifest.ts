import type { MetadataRoute } from 'next';

/**
 * Web App Manifest สำหรับ ICE POS Progressive Web App
 * กำหนดค่าการติดตั้งแอป (Add to Homescreen / Desktop App)
 * โครงการ ice-pos-web
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ICE POS - ระบบขายหน้าร้านและจัดการคลังสินค้า',
    short_name: 'ICE POS',
    description: 'ระบบจัดการขายหน้าร้าน (Point of Sale) และคลังสินค้า ICE POS',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

