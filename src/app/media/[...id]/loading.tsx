export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <div className="lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div>
          <div className="aspect-video bg-muted w-full" />
          <div className="px-4 sm:px-6 py-4 space-y-3">
            <div className="h-7 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="flex gap-2 pt-1">
              <div className="h-9 bg-muted rounded-full w-24" />
              <div className="h-9 bg-muted rounded-full w-24" />
            </div>
          </div>
        </div>
        <div className="border-l border-border/40 h-screen hidden lg:block">
          <div className="p-4 border-b border-border/40">
            <div className="h-9 bg-muted rounded-full w-full" />
          </div>
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
