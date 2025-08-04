import { observer } from 'mobx-react';
import { useRootStore } from '@/stores';

const Filters = observer(() => {
  const { appLayoutStore } = useRootStore();
  const filters = appLayoutStore.activeFilters();
  const has = Object.keys(filters).length > 0;

  if (!has) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="font-semibold mr-2">Filters:</span>
      {Object.entries(filters).map(([field, vals]) =>
        vals.map((v) => (
          <button
            key={`${field}-${v}`}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
            onClick={() => appLayoutStore.removeFilter(field, v)}
          >
            {field}: {v}
            <span className="ml-1">✕</span>
          </button>
        ))
      )}
      <button
        className="ml-2 text-sm underline"
        onClick={() => appLayoutStore.clearFilters()}
      >
        Clear All
      </button>
    </div>
  );
});

export default Filters;
