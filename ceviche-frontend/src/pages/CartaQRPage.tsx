import React, { useMemo } from 'react';

// Generador QR embebido usando 'api.qrserver.com' (solo genera imagen, sin dependencias)
function getQrPngUrl(text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
}

export default function CartaQRPage() {
  // Usar hostname local actual (incluye IP o dominio) para que el QR funcione en otros dispositivos
  const cartaUrl = `${window.location.protocol}//${window.location.host}/carta`;
  const qrUrl = useMemo(() => getQrPngUrl(cartaUrl), [cartaUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Carta del Restaurante</h1>
        <p className="text-slate-500 mb-6">Escanee este código para ver el menú</p>

        <a href={cartaUrl} target="_blank" rel="noreferrer">
          <img src={qrUrl} alt="QR Carta" className="w-60 h-60 mx-auto" />
        </a>

        <div className="mt-4 text-sm text-slate-500 break-all">
          {cartaUrl}
        </div>

        <div className="mt-6">
          <a
            href={qrUrl}
            download={"carta_qr.png"}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Descargar QR
          </a>
        </div>
      </div>
    </div>
  );
}


