import type { Meta, StoryObj } from "@storybook/react";
import { SearchTotals } from "../components/SearchTotals";
import { RootStoreContext, createStore } from "../stores";
import { action } from "@storybook/addon-actions";

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  const urlObj = new URL(url, "http://localhost");
  const dateStart = urlObj.searchParams.get("dateStart");
  const dateEnd = urlObj.searchParams.get("dateEnd");

  // Mock different responses based on date range
  if (dateStart && dateEnd) {
    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    // Single day
    if (start.toDateString() === end.toDateString()) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            aggregationType: "total",
            data: [{ label: "Total", value: 1250 }],
            totalRecords: 1250,
            dateRange: { start: dateStart, end: dateEnd },
          }),
      });
    }

    // Single month
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      const daysInMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
      ).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({
        label: (i + 1).toString(),
        value: Math.floor(Math.random() * 200) + 50,
        date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
      }));

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            aggregationType: "day",
            data,
            totalRecords: data.reduce((sum, d) => sum + d.value, 0),
            dateRange: { start: dateStart, end: dateEnd },
          }),
      });
    }

    // Single year
    if (start.getFullYear() === end.getFullYear()) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const data = months.map((month, i) => ({
        label: month,
        value: Math.floor(Math.random() * 5000) + 1000,
        date: `${start.getFullYear()}-${String(i + 1).padStart(2, "0")}`,
      }));

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            aggregationType: "month",
            data,
            totalRecords: data.reduce((sum, d) => sum + d.value, 0),
            dateRange: { start: dateStart, end: dateEnd },
          }),
      });
    }

    // Multi-year
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const data = [];
    for (let year = startYear; year <= endYear; year++) {
      data.push({
        label: year.toString(),
        value: Math.floor(Math.random() * 20000) + 5000,
        date: year.toString(),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          aggregationType: "year",
          data,
          totalRecords: data.reduce((sum, d) => sum + d.value, 0),
          dateRange: { start: dateStart, end: dateEnd },
        }),
    });
  }

  return Promise.reject(new Error("Invalid request"));
};

// Setup global fetch mock
if (typeof window !== "undefined") {
  (window as any).fetch = mockFetch;
} else {
  (global as any).fetch = mockFetch;
}

const meta: Meta<typeof SearchTotals> = {
  title: "Components/SearchTotals",
  component: SearchTotals,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story, context) => {
      const storeConfig = context.args.storeConfig || {};
      const store = createStore(storeConfig);

      return (
        <RootStoreContext.Provider value={store}>
          <div className="max-w-6xl mx-auto">
            <Story />
          </div>
        </RootStoreContext.Provider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SearchTotals>;

export const AllTime: Story = {
  args: {
    storeConfig: {
      dateRange: {
        start: "2022-01-01T00:00:00.000Z",
        end: "2024-12-31T23:59:59.999Z",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows aggregated data by year when the date range spans multiple years (All time view).",
      },
    },
  },
};

export const SingleYear: Story = {
  args: {
    storeConfig: {
      dateRange: {
        start: "2023-01-01T00:00:00.000Z",
        end: "2023-12-31T23:59:59.999Z",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows aggregated data by month when the date range is a single year.",
      },
    },
  },
};

export const SingleMonth: Story = {
  args: {
    storeConfig: {
      dateRange: {
        start: "2023-06-01T00:00:00.000Z",
        end: "2023-06-30T23:59:59.999Z",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows aggregated data by day when the date range is a single month.",
      },
    },
  },
};

export const SingleDay: Story = {
  args: {
    storeConfig: {
      dateRange: {
        start: "2023-06-15T00:00:00.000Z",
        end: "2023-06-15T23:59:59.999Z",
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a total count when the date range is a single day.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    storeConfig: {
      dateRange: {
        start: null,
        end: null,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows loading state when no date range is selected.",
      },
    },
  },
};
