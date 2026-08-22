import React from 'react';
import { QURAN_STUDY_SLIDES } from '@/data/quran-study-thumbnail-data';

interface QuranStudyThumbnailProps {
  qsNumber: number;
  className?: string;
}

export function QuranStudyThumbnail({ qsNumber, className = '' }: QuranStudyThumbnailProps) {
  const slide = QURAN_STUDY_SLIDES[qsNumber];

  if (!slide) {
    return null;
  }

  return (
    <div
      className={`relative aspect-video w-full h-full select-none overflow-hidden bg-[#026634] flex flex-col items-center justify-center p-3 sm:p-4 text-center text-white [container-type:inline-size] transition-transform duration-500 motion-safe:group-hover:scale-[1.04] ${className}`}
      aria-label={`${slide.header} ${qsNumber}: ${slide.lines.join(' ')}`}
    >
      {/* Subtle authentic vignette/sheen to enhance the high-contrast slide depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-radial from-white/[0.06] via-transparent to-black/25 opacity-80"
        aria-hidden="true"
      />

      {/* Main Slide Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[92%] h-full py-1">
        {/* Slide Title Header: "Quran Study" */}
        <h4
          className="font-serif font-bold text-white tracking-tight leading-tight shrink-0 mb-1 sm:mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          style={{ fontSize: 'clamp(0.85rem, 4.2cqw, 1.65rem)' }}
        >
          {slide.header}
        </h4>

        {/* Slide Body Lines */}
        <div
          className="flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 font-serif font-bold text-white/95 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ fontSize: 'clamp(0.65rem, 2.7cqw, 1.05rem)' }}
        >
          {slide.lines.map((line, idx) => (
            <p key={idx} className="line-clamp-2 max-w-full text-center">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuranStudyThumbnail;
