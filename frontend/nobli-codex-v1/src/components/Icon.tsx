interface IconProps {
  name:
    | 'mic'
    | 'upload'
    | 'plus'
    | 'send'
    | 'phone'
    | 'pdf'
    | 'overleaf'
    | 'spark'
    | 'detail'
    | 'drag';
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'mic':
      return (
        <svg className={className} {...common}>
          <path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      );
    case 'upload':
      return (
        <svg className={className} {...common}>
          <path d="M12 16V5" />
          <path d="m8 9 4-4 4 4" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={className} {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'send':
      return (
        <svg className={className} {...common}>
          <path d="M4 12 20 4l-5 16-3-6-8-2Z" />
        </svg>
      );
    case 'phone':
      return (
        <svg className={className} {...common}>
          <rect x="8" y="3" width="8" height="18" rx="2" />
          <path d="M11 17h2" />
        </svg>
      );
    case 'pdf':
      return (
        <svg className={className} {...common}>
          <path d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v4h4" />
          <path d="M9 15h2.5a1.5 1.5 0 0 0 0-3H9v5" />
          <path d="M14 12h1a1.5 1.5 0 0 1 0 3h-1v-3Z" />
        </svg>
      );
    case 'overleaf':
      return (
        <svg className={className} {...common}>
          <path d="M5 16c2.5-5 6-8 10-8 2 0 4 1 4 4 0 4-4 8-9 8-3 0-5-1.5-5-4Z" />
          <path d="M10 18c0-5 2-9 5-11" />
        </svg>
      );
    case 'spark':
      return (
        <svg className={className} {...common}>
          <path d="M12 3v4" />
          <path d="M12 17v4" />
          <path d="M3 12h4" />
          <path d="M17 12h4" />
          <path d="m6 6 2.5 2.5" />
          <path d="m15.5 15.5 2.5 2.5" />
          <path d="m18 6-2.5 2.5" />
          <path d="M8.5 15.5 6 18" />
        </svg>
      );
    case 'detail':
      return (
        <svg className={className} {...common}>
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'drag':
      return (
        <svg className={className} {...common}>
          <path d="M12 5v14" />
          <path d="m8 9 4-4 4 4" />
          <path d="M5 15c0 2 1.5 4 4 4h6c2.5 0 4-2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}
