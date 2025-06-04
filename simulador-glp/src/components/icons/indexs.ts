// src/components/icons/index.ts
import L from 'leaflet';

export const createCustomIcon = (type: 'truck' | 'delivery' | 'cistern' | 'transfer', color?: string) => {
  const iconSize: [number, number] = [32, 32];
  const iconAnchor: [number, number] = [16, 16];

  const truckIcon = `
    <svg viewBox="0 0 24 24" fill="${color || '#000'}" width="32" height="32">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  `;

  const deliveryIcon = `
    <svg viewBox="0 0 24 24" fill="${color || '#FF0000'}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  const cisternIcon = `
    <svg viewBox="0 0 24 24" fill="${color || '#0000FF'}" width="32" height="32">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
  `;

  const transferIcon = `
    <svg viewBox="0 0 24 24" fill="${color || '#00FF00'}" width="32" height="32">
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"/>
    </svg>
  `;

  const iconHtml = type === 'truck' ? truckIcon :
                  type === 'delivery' ? deliveryIcon :
                  type === 'cistern' ? cisternIcon :
                  transferIcon;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-icon',
    iconSize,
    iconAnchor,
  });
};