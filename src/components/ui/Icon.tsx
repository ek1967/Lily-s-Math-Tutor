/**
 * A handful of hand-drawn icons instead of an icon package. Six glyphs do not
 * justify a dependency, and every kilobyte here competes with the maths.
 */
export type IconName =
  | 'home' | 'book' | 'camera' | 'settings' | 'spark' | 'flame'
  | 'check' | 'arrow-back' | 'sun' | 'moon';

const PATHS: Record<IconName, string> = {
  home: 'M3.5 10.8 12 3.5l8.5 7.3M5.8 9.7V20h12.4V9.7M10 20v-5h4v5',
  book: 'M12 6.5C10.5 5.2 8.4 4.5 5 4.5v13c3.4 0 5.5.7 7 2 1.5-1.3 3.6-2 7-2v-13c-3.4 0-5.5.7-7 2Zm0 0v13',
  camera: 'M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3ZM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.15-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14.5 2h-5l-.35 2.5a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4 12a8 8 0 0 0 .15 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5L9.5 22h5l.35-2.5a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5A8 8 0 0 0 20 12Z',
  spark: 'M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z',
  flame: 'M12.5 3c.4 3 2 4 3.4 5.7A6.6 6.6 0 0 1 17.5 13a5.5 5.5 0 1 1-11 0c0-2 .8-3.4 1.7-4.4.1 1 .6 1.8 1.4 2.2.3-3.4 1.4-5.9 2.9-7.8Z',
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
