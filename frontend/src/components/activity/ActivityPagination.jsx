import { ChevronLeft, ChevronRight } from 'lucide-react'

function ActivityPagination({ pagination, isFetching, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null

  return (
    <nav
      className="mt-7 flex items-center justify-center gap-3"
      aria-label="Activity pages"
    >
      <button
        type="button"
        disabled={!pagination.hasPreviousPage || isFetching}
        onClick={() => onPageChange(pagination.currentPage - 1)}
        className="focus-ring flex cursor-pointer items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-extrabold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={15} /> Previous
      </button>
      <span className="text-xs font-bold text-stone-500">
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <button
        type="button"
        disabled={!pagination.hasNextPage || isFetching}
        onClick={() => onPageChange(pagination.currentPage + 1)}
        className="focus-ring flex cursor-pointer items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-extrabold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight size={15} />
      </button>
    </nav>
  )
}

export default ActivityPagination
