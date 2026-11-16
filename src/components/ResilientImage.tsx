import React, { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { probeStaticAsset } from '../utils/assetProbe';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
  /** Optional drop-in static path (e.g. /assets/dishes/<slug>.jpg) checked when src is empty */
  dropPhotoPath?: string;
  compactPlaceholder?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  dropPhotoPath,
  compactPlaceholder = false,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);
  const [resolvedDropUrl, setResolvedDropUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    if (src || !dropPhotoPath) {
      setResolvedDropUrl(null);
      return;
    }

    probeStaticAsset(dropPhotoPath, 'image').then((exists) => {
      if (!cancelled) {
        setResolvedDropUrl(exists ? dropPhotoPath : null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src, dropPhotoPath]);

  const effectiveSrc = src || resolvedDropUrl || '';

  if (failed || !effectiveSrc) {
    const labelText = fallbackLabel || (alt ? `Add photo: ${alt}` : 'Add photo');

    if (compactPlaceholder) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--willow-subtle)] text-[var(--willow-amber)] border border-[var(--willow-border)] select-none ${className}`}
          role="img"
          aria-label={labelText}
          title={labelText}
        >
          <ImagePlus className="w-4 h-4 shrink-0" strokeWidth={1.6} />
        </div>
      );
    }

    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--willow-subtle)] text-[var(--willow-text)] border border-dashed border-[var(--willow-border-strong)] p-4 text-center select-none ${className}`}
        role="img"
        aria-label={labelText}
      >
        <ImagePlus className="w-6 h-6 mb-2 text-[var(--willow-amber)] shrink-0" strokeWidth={1.5} />
        <span className="font-serif text-sm sm:text-base font-medium leading-snug">
          {labelText}
        </span>
        {dropPhotoPath && (
          <span className="mt-1 font-mono text-[10px] text-[var(--willow-text-muted)] break-all">
            /public{dropPhotoPath}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt || 'The Willow Café'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};
