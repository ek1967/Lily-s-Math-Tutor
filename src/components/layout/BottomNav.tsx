import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui';
import { paths } from '@/router';

/** Four items. The parent dashboard is deliberately absent — it is not hers. */
const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: paths.home(), label: 'היום', icon: 'home' },
  { to: paths.learn(), label: 'ללמוד', icon: 'book' },
  { to: paths.homework(), label: 'שיעורי בית', icon: 'camera' },
  { to: paths.settings(), label: 'הגדרות', icon: 'settings' },
];

export function BottomNav() {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="sticky bottom-0 z-20 border-t border-line bg-surface/90 backdrop-blur"
      style={{ paddingBlockEnd: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-[var(--shell-max)] items-stretch justify-around">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === paths.home()}
              className={({ isActive }) =>
                [
                  'tap flex flex-col items-center justify-center gap-1 py-2 text-sm transition',
                  isActive ? 'text-primary font-medium' : 'text-ink-soft hover:text-ink',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} className="h-6 w-6" filled={isActive} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
