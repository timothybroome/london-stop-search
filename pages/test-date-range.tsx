import React from "react";
import { DateRangeExplorer } from "../components/DateRangeExplorer";
import { RootStoreContext, createStore } from "../stores";

const TestDateRangePage: React.FC = () => {
  const store = createStore();

  return (
    <RootStoreContext.Provider value={store}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            DateRangeExplorer Test Page
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Current Date Range
            </h2>
            <p className="text-gray-600">
              {store.appLayoutStore.formattedDateRange}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <p>Start: {store.appLayoutStore.dateRange.start || "Not set"}</p>
              <p>End: {store.appLayoutStore.dateRange.end || "Not set"}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Date Range Explorer
              </h2>
              <p className="text-gray-600 mt-2">
                Click on different time periods to see the date range update
                above.
              </p>
            </div>
            <div className="p-6">
              <DateRangeExplorer />
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              How to test:
            </h3>
            <ul className="list-disc list-inside text-blue-800 space-y-2">
              <li>Click &quot;All time&quot; to clear the date range</li>
              <li>
                Click a year (2023, 2024, 2025) to select that entire year
              </li>
              <li>
                When a year is selected, click a month to select that month
                within the year
              </li>
              <li>
                When a month is selected, click a day to select that specific
                day
              </li>
              <li>
                Click a selected period again to deselect it and go back to the
                parent level
              </li>
              <li>
                Watch the &quot;Current Date Range&quot; section above update as
                you make selections
              </li>
            </ul>
          </div>
        </div>
      </div>
    </RootStoreContext.Provider>
  );
};

export default TestDateRangePage;
