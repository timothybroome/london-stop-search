import { observer } from 'mobx-react';
import { useRootStore } from '@/stores';

const Filters = observer(() => {
  const { appLayoutStore } = useRootStore();
  const filters = appLayoutStore.activeFilters();
  const has = Object.keys(filters).length > 0;

  if (!has) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="font-semibold mr-2 text-[var(--text-secondary)]">Filters:</span>
      {Object.entries(filters).map(([field, vals]) =>
        vals.map((v) => (
          <button
            key={`${field}-${v}`}
            className="px-3 py-1.5 bg-[var(--accent-primary)] text-[var(--dashboard-bg)] rounded border transition-colors text-sm flex items-center gap-1 hover:opacity-90 font-medium"
            onClick={() => appLayoutStore.removeFilter(field, v)}
          >
            {field}: {v}
            <span className="ml-1">✕</span>
          </button>
        ))
      )}
      <button
        className="ml-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline"
        onClick={() => appLayoutStore.clearFilters()}
      >
        Clear All
      </button>
    </div>
  );
});

export default Filters;
