import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function Pagination({ page, count, perPage, onPageChange, loading = false }) {
  const hasNext = count === perPage;
  const hasPrev = page > 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
      <span className="flex items-center gap-2 text-sm text-muted">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-accent" />
        ) : null}
        Page {page} &middot; {count} result{count !== 1 ? "s" : ""}
      </span>
      <div className="flex gap-2">
        <button
          disabled={!hasPrev || loading}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          disabled={!hasNext || loading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
