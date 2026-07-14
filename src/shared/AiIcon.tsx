import React from 'react';

type AiIconProps = {
  size?: number;
  className?: string;
  insight?: boolean;
};

type AiTileProps = {
  size?: number;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** Selected Spark Duotone mark and its agent-derived insight companion. */
export function AiIcon({ size = 16, className = '', insight = false }: AiIconProps) {
  if (insight) {
    return (
      <svg className={`ki ${className}`} style={{ width: size, height: size }} viewBox="0 0 32 32" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" d="M16 3.5a9 9 0 0 1 5.3 16.3c-1.1.8-1.8 1.9-2 3.2h-6.6c-.2-1.3-.9-2.4-2-3.2A9 9 0 0 1 16 3.5Z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12.5 26.5h7M13.8 29.5h4.4" />
        <path fill="var(--ai-icon-accent, #FF462D)" d="M16 7c.4 3.2 2.5 5.3 5.7 5.7-3.2.4-5.3 2.5-5.7 5.7-.4-3.2-2.5-5.3-5.7-5.7 3.2-.4 5.3-2.5 5.7-5.7Z" />
      </svg>
    );
  }

  return (
    <svg className={`ki ${className}`} style={{ width: size, height: size }} viewBox="0 0 32 32" aria-hidden="true">
      <path fill="var(--ai-icon-base, #29707A)" d="M14 6c.9 6.9 5.6 11.6 12.5 12.5C19.6 19.4 14.9 24.1 14 31c-.9-6.9-5.6-11.6-12.5-12.5C8.4 17.6 13.1 12.9 14 6Z" />
      <path fill="var(--ai-icon-accent, #FF462D)" d="M24.5 1c.4 3.1 2.5 5.2 5.6 5.6-3.1.4-5.2 2.5-5.6 5.6-.4-3.1-2.5-5.2-5.6-5.6 3.1-.4 5.2-2.5 5.6-5.6Z" />
    </svg>
  );
}

/** Compact Spruce application tile used below 20px and for synthetic AI identities. */
export function AiTile({ size = 32, radius = Math.max(6, Math.round(size * 0.22)), className = '', style }: AiTileProps) {
  return (
    <span
      className={`ai-icon-tile ${className}`}
      aria-hidden="true"
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: radius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        background: '#29707A',
        color: '#fff',
        ['--ai-icon-base' as any]: '#fff',
      }}
    >
      <AiIcon size={Math.max(12, Math.round(size * 0.68))} />
    </span>
  );
}
