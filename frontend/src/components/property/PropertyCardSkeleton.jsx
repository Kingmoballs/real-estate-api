function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white">
      <div className="aspect-[4/3] bg-stone-200" />
      <div className="space-y-4 p-5">
        <div className="h-3 w-2/5 rounded bg-stone-200" />
        <div className="h-6 w-4/5 rounded bg-stone-200" />
        <div className="h-10 rounded bg-stone-100" />
        <div className="h-5 w-1/2 rounded bg-stone-200" />
      </div>
    </div>
  )
}

export default PropertyCardSkeleton
