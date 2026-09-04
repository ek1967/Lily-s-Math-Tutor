import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className = '', ...rest }: Props) {
  return (
    <div className={['card', padded ? 'p-5' : '', className].join(' ')} {...rest}>
      {children}
    </div>
  );
}
