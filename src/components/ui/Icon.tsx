/**
 * A handful of hand-drawn icons instead of an icon package. Six glyphs do not
 * justify a dependency, and every kilobyte here competes with the maths.
 */
export type IconName =
  | 'home' | 'book' | 'camera' | 'settings' | 'spark' | 'flame'
  | 'check' | 'arrow-back' | 'sun' | 'moon';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
  book: 'M4 4.5h9a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H4Zm16 0h-1.5a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H20Z',
  camera: 'M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3ZM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.15-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14.5 2h-5l-.35 2.5a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4 12a8 8 0 0 0 .15 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5L9.5 22h5l.35-2.5a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5A8 8 0 0 0 20 12Z',
  spark: 'M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z',
  flame: 'M12 21c3.6 0 6-2.3 6-5.4 0-3.6-3-5-4-8.6-2 1.4-2.6 3.2-2.4 4.8-1-.6-1.6-1.8-1.6-3C8 10 6 12 6 15.6 6 18.7 8.4 21 12 21Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  'arrow-back': 'M14 5l7 7-7 7M21 12H4',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
};

interface Props {
  name: IconName;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className = 'w-6 h-6', filled = false }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
