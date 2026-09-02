export function PageHeader({ title, description, actions, }) {
    return (<div className="relative flex flex-col gap-3 border-b border-white/5 px-6 py-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (<p className="mt-1.5 text-sm text-muted-foreground">{description}</p>)}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>);
}
