'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ImageUp } from 'lucide-react';
import { cx } from '@/lib/utils';

/**
 * Drag-and-drop image input. A desktop affordance the Android build had no
 * equivalent for - on a phone the only sources are camera and gallery picker.
 */
export function Dropzone({ onFile, className, compact, title, hint, browseLabel, children }: {
  onFile: (dataUrl: string, file: File) => void;
  className?: string;
  compact?: boolean;
  title: string;
  hint: string;
  browseLabel: string;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const read = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string, file);
    reader.readAsDataURL(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) read(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      className={cx(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition',
        compact ? 'gap-2 p-5' : 'gap-3 p-8',
        over ? 'border-brand bg-brand/8' : 'border-line-strong bg-panel-2/40 hover:border-brand/60 hover:bg-brand/5',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = '';
        }}
      />
      {children ?? (
        <>
          <span className={cx('grid place-items-center rounded-xl border border-line bg-panel text-ink-3', compact ? 'h-9 w-9' : 'h-11 w-11')}>
            <ImageUp size={compact ? 17 : 20} />
          </span>
          <div>
            <p className={cx('font-medium text-ink', compact ? 'text-[13px]' : 'text-[14px]')}>{title}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p>
          </div>
          <span className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[12.5px] font-medium text-ink-2">
            {browseLabel}
          </span>
        </>
      )}
    </div>
  );
}
