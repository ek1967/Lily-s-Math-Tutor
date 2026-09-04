interface Props {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
    </header>
  );
}
