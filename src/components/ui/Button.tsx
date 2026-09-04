import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'soft' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'hero';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-[rgb(var(--c-primary-ink))] hover:bg-primary-strong shadow-soft',
  soft: 'bg-primary-tint text-primary-strong hover:brightness-[.97]',
  ghost: 'bg-surface border border-line text-ink hover:bg-surface-2',
  quiet: 'text-ink-soft hover:text-ink hover:bg-surface-2',
};

const SIZES: Record<Size, string> = {
  sm: 'text-base px-4 py-2 rounded-md',
  md: 'text-base px-5 py-3 rounded-lg',
  // The one giant call to action on the home screen.
  hero: 'text-xl px-6 py-6 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', block = false, className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        'tap inline-flex items-center justify-center gap-2 font-medium',
        'transition active:scale-[.985] disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    />
  );
});
