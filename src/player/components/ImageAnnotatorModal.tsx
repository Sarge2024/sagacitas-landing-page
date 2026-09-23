import React, { useEffect, useRef, useState } from 'react';
import { LessonEditorService } from '../services/LessonEditorService';

type Tool = 'highlight' | 'rect' | 'arrow' | 'text';

interface ShapeBase {
  id: string;
  tool: Tool;
  color: string;
}
interface RectShape extends ShapeBase {
  tool: 'highlight' | 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}
interface ArrowShape extends ShapeBase {
  tool: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface TextShape extends ShapeBase {
  tool: 'text';
  x: number;
  y: number;
  text: string;
}
type Shape = RectShape | ArrowShape | TextShape;

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: 'highlight', label: 'Grifo', icon: 'border_color' },
  { id: 'rect', label: 'Retângulo', icon: 'crop_free' },
  { id: 'arrow', label: 'Seta', icon: 'north_east' },
  { id: 'text', label: 'Texto', icon: 'text_fields' },
];

const PALETTE = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff'];
const RECT_RADIUS = 10;

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;

  if (shape.tool === 'highlight') {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
  } else if (shape.tool === 'rect') {
    ctx.lineWidth = 4;
    drawRoundedRectPath(ctx, shape.x, shape.y, shape.w, shape.h, RECT_RADIUS);
    ctx.stroke();
  } else if (shape.tool === 'arrow') {
    const { x1, y1, x2, y2 } = shape;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 18;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  } else if (shape.tool === 'text') {
    ctx.font = 'bold 22px Inter, sans-serif';
    const metrics = ctx.measureText(shape.text);
    const paddingX = 8;
    const paddingY = 6;
    const boxW = metrics.width + paddingX * 2;
    const boxH = 22 + paddingY * 2;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(shape.x, shape.y - boxH + paddingY, boxW, boxH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = shape.color === '#ffffff' ? '#0b1c30' : '#ffffff';
    ctx.fillText(shape.text, shape.x + paddingX, shape.y);
  }
  ctx.restore();
}

interface ImageAnnotatorModalProps {
  imageUrl: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

export const ImageAnnotatorModal: React.FC<ImageAnnotatorModalProps> = ({ imageUrl, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>('highlight');
  const [color, setColor] = useState(PALETTE[0]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(null);
  const [liveShape, setLiveShape] = useState<Shape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redraw = (extra?: Shape | null) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const shape of shapes) drawShape(ctx, shape);
    if (extra) drawShape(ctx, extra);
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setIsLoading(false);
      redraw();
    };
    img.onerror = () => {
      setErrorMsg('Falha ao carregar a imagem para anotação.');
      setIsLoading(false);
    };
    img.src = imageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLoading) return;
    const { x, y } = getCanvasCoords(e);

    if (tool === 'text') {
      const text = window.prompt('Texto da legenda:');
      if (text && text.trim()) {
        setShapes(prev => [...prev, { id: crypto.randomUUID(), tool: 'text', x, y, text: text.trim(), color }]);
      }
      return;
    }

    setDrawing({ startX: x, startY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const { x, y } = getCanvasCoords(e);
    const id = 'preview';

    let preview: Shape;
    if (tool === 'arrow') {
      preview = { id, tool: 'arrow', x1: drawing.startX, y1: drawing.startY, x2: x, y2: y, color };
    } else {
      preview = {
        id,
        tool: tool === 'highlight' ? 'highlight' : 'rect',
        x: Math.min(drawing.startX, x),
        y: Math.min(drawing.startY, y),
        w: Math.abs(x - drawing.startX),
        h: Math.abs(y - drawing.startY),
        color,
      };
    }
    setLiveShape(preview);
    redraw(preview);
  };

  const handleMouseUp = () => {
    if (!drawing || !liveShape) {
      setDrawing(null);
      setLiveShape(null);
      return;
    }
    const finalized = { ...liveShape, id: crypto.randomUUID() };
    setShapes(prev => [...prev, finalized]);
    setDrawing(null);
    setLiveShape(null);
  };

  const handleUndo = () => setShapes(prev => prev.slice(0, -1));
  const handleClear = () => setShapes([]);

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem anotada.'))), 'image/png');
      });
      const file = new File([blob], 'anotada.png', { type: 'image/png' });
      const newUrl = await LessonEditorService.uploadImage(file);
      onSave(newUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">draw</span>
            Anotar Imagem
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-1">
            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tool === t.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-blue-600' : 'border-slate-200'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleUndo}
              disabled={shapes.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              Desfazer
            </button>
            <button
              onClick={handleClear}
              disabled={shapes.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Limpar
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
          {isLoading ? (
            <p className="text-sm text-slate-500">Carregando imagem…</p>
          ) : errorMsg ? (
            <p className="text-sm text-red-600">{errorMsg}</p>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[60vh] border border-slate-300 rounded-md shadow-sm cursor-crosshair bg-white"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          {errorMsg && !isLoading && <span className="text-xs text-red-600">{errorMsg}</span>}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">save</span>
              {isSaving ? 'Salvando…' : 'Salvar como nova imagem'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
