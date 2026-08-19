export default function Loading() {
  return (
    <div className="min-h-screen bg-ed-bg text-ed-fg animate-pulse">
      <div className="lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div>
          <div className="aspect-video bg-ed-surface-strong w-full border-b border-ed-rule" />
          <div className="px-4 sm:px-6 py-6 space-y-4">
            <div className="h-6 bg-ed-surface-strong rounded w-3/4" />
            <div className="h-4 bg-ed-surface-strong rounded w-1/3" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-ed-surface-strong rounded-full w-24" />
              <div className="h-8 bg-ed-surface-strong rounded-full w-24" />
            </div>
          </div>
        </div>
        <div className="border-l border-ed-rule h-screen hidden lg:block bg-ed-surface/40">
          <div className="p-4 border-b border-ed-rule">
            <div className="h-8 bg-ed-surface-strong rounded-full w-full" />
          </div>
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-ed-surface-strong rounded w-1/4" />
                <div className="h-4 bg-ed-surface-strong rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}