import { observer } from 'mobx-react-lite';
import { useRootStore } from '@/stores';

interface DataScopedTitleProps {
  className?: string;
}

export const DataScopedTitle = observer(({ className = '' }: DataScopedTitleProps) => {
  const store = useRootStore();
  const formattedDateRange = store.appLayoutStore.formattedDateRange;
  
  return (
    <div className={`${className} w-full`}>
      <h2 className="text-2xl font-semibold text-gray-800">
        Stop and Search Data
      </h2>
      <p className="text-gray-600 text-sm mt-1">
        Showing data from: <span className="font-medium">{formattedDateRange}</span>
      </p>
    </div>
  );
});

export default DataScopedTitle;
