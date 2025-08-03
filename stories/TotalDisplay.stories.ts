import type { Meta, StoryObj } from "@storybook/nextjs";
import { TotalDisplay } from "../components/TotalDisplay";
import { RootStoreContext, createStore } from "../stores";
import React from "react";

const mockApiResponses = {
  stats: {
    totalRecords: 125000,
    recordsByMonth: {
      "2022-06": 5000,
      "2022-07": 5200,
      "2023-01": 4800,
      "2024-04": 6100,
    },
  },
  total: 45000,
};

const withStore = (Story: React.ComponentType) => {
  const store = createStore();

  const originalFetch = global.fetch;
  global.fetch = ((url: string) => {
    if (url.includes("/api/data/stats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.stats),
      } as Response);
    }
    if (url.includes("/api/data/total")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ total: mockApiResponses.total }),
      } as Response);
    }
    return originalFetch(url);
  }) as typeof fetch;

  return React.createElement(
    RootStoreContext.Provider,
    { value: store },
    React.createElement(Story),
  );
};

const meta: Meta<typeof TotalDisplay> = {
  title: "Components/TotalDisplay",
  component: TotalDisplay,
  decorators: [withStore],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A component that displays the total number of stop and search records within the current date range from AppLayoutStore. It automatically loads data from the DataStore and shows loading/error states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the component",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Default state shows the total records for the current date range. The component will automatically load data when mounted.",
      },
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    className: "border-2 border-blue-200",
  },
};

// Story with loading state simulation
export const LoadingState: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();

      store.dataStore.setLoading(true);

      global.fetch = (() => new Promise(() => {})) as typeof fetch;

      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Shows the loading state with skeleton animation while data is being fetched.",
      },
    },
  },
};

// Story with error state simulation
export const ErrorState: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();

      global.fetch = (() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Internal server error" }),
        } as Response)) as typeof fetch;

      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Shows the error state when data loading fails.",
      },
    },
  },
};

// Story with specific date range
export const WithSpecificDateRange: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Set a specific date range (April 2024)
      store.appLayoutStore.setDateRange({
        start: new Date(2024, 3, 1).toISOString(),
        end: new Date(2024, 3, 30, 23, 59, 59).toISOString(),
      });

      global.fetch = ((url: string) => {
        if (url.includes("/api/data/stats")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiResponses.stats),
          } as Response);
        }
        if (url.includes("/api/data/total")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ total: 6100 }), // April 2024 specific total
          } as Response);
        }
        return Promise.reject(new Error("Not found"));
      }) as typeof fetch;

      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Shows the component with a specific date range (April 2024) selected. The total will reflect only records within this period.",
      },
    },
  },
};

// Story with year selection
export const WithYearSelection: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Set date range to 2023
      store.appLayoutStore.setDateRange({
        start: new Date(2023, 0, 1).toISOString(),
        end: new Date(2023, 11, 31, 23, 59, 59).toISOString(),
      });

      global.fetch = ((url: string) => {
        if (url.includes("/api/data/stats")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiResponses.stats),
          } as Response);
        }
        if (url.includes("/api/data/total")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ total: 58000 }), // 2023 year total
          } as Response);
        }
        return Promise.reject(new Error("Not found"));
      }) as typeof fetch;

      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Shows the component with a full year (2023) selected. Demonstrates how the total updates based on the selected time period.",
      },
    },
  },
};
