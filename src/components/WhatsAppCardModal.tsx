import { useEffect, useRef, useState } from 'react';

interface WhatsAppCardProps {
  title: string;
  standfirst?: string;
  category?: string;
  date?: string;
  editionLabel?: string;
  onClose: () => void;
}

export function WhatsAppCardModal({
  title,
  standfirst,
  category = 'Journal',
  date,
  editionLabel,
  onClose,
}: WhatsAppCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1080 x 1350 standard WhatsApp status / portrait card
    canvas.width = 1080;
    canvas.height = 1350;

    // Background white paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1080, 1350);

    // Frame filets (double ink lines)
    ctx.strokeStyle = '#0b0b0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1270);
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, 984, 1254);

    // Header Tagline
    ctx.fillStyle = '#0b0b0b';
    ctx.font = '600 24px "Public Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText("UNION NATIONALE POUR L'UNITÉ", 540, 110);

    // Ink rule
    ctx.strokeStyle = '#0b0b0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 140);
    ctx.lineTo(980, 140);
    ctx.stroke();

    // Load unaltered logo
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}assets/logo-union.jpg`;
    img.onload = () => {
      // Draw logo centered (200x200)
      ctx.drawImage(img, 440, 180, 200, 200);

      // Category / Edition Tag
      ctx.fillStyle = '#328445'; // --green
      ctx.font = '700 28px "Public Sans", sans-serif';
      const meta = [category.toUpperCase(), editionLabel, date].filter(Boolean).join(' · ');
      ctx.fillText(meta, 540, 440);

      // Article Title (Bitter serif, bold, wrapped)
      ctx.fillStyle = '#0b0b0b';
      ctx.font = '800 58px Bitter, Georgia, serif';
      wrapText(ctx, title, 540, 530, 880, 72);

      // Standfirst (Public Sans)
      if (standfirst) {
        ctx.fillStyle = '#2b2b28';
        ctx.font = '400 32px "Public Sans", sans-serif';
        wrapText(ctx, standfirst, 540, 780, 840, 48);
      }

      // Bottom Jonction
      ctx.strokeStyle = '#0b0b0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 1180);
      ctx.lineTo(980, 1180);
      ctx.stroke();

      // Motto
      ctx.fillStyle = '#0b0b0b';
      ctx.font = '700 30px "Public Sans", sans-serif';
      ctx.fillText('« Un Congo uni travaille. Un Congo divisé mendie. »', 540, 1230);

      setDataUrl(canvas.toDataURL('image/png'));
    };
  }, [title, standfirst, category, date, editionLabel]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `union-whatsapp-1080x1350-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="card-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Carte WhatsApp">
      <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="card-modal-header">
          <h2>Carte de partage WhatsApp (1080 × 1350)</h2>
          <button type="button" className="button button--quiet" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="card-modal-preview">
          <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '360px', height: 'auto', border: '1px solid #d9d6cc' }} />
        </div>
        <div className="card-modal-actions">
          <button type="button" className="button button--solid" onClick={download} disabled={!dataUrl}>
            Télécharger l’image pour statut WhatsApp
          </button>
          <button type="button" className="button button--outline" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
