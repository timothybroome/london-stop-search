import type { Meta, StoryObj } from "@storybook/nextjs";
import { DateRangeExplorer } from "../components/DateRangeExplorer";
import { RootStoreContext, createStore } from "../stores";
import React from "react";

// Create a decorator to provide the store context
const withStore = (Story: React.ComponentType) => {
  const store = createStore();
  return React.createElement(
    RootStoreContext.Provider,
    { value: store },
    React.createElement(Story),
  );
};

const meta: Meta<typeof DateRangeExplorer> = {
  title: "Components/DateRangeExplorer",
  component: DateRangeExplorer,
  decorators: [withStore],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A date range explorer component that allows users to select time periods (all time, year, month, or day) and updates the AppLayoutStore dateRange field.",
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
};

export const WithCustomClass: Story = {
  args: {
    className: "border-2 border-blue-200",
  },
};

// Story with pre-selected year
export const YearSelected: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Set date range to 2025
      store.appLayoutStore.setDateRange({
        start: new Date(2025, 0, 1).toISOString(),
        end: new Date(2025, 11, 31, 23, 59, 59).toISOString(),
      });
      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
};

// Story with pre-selected month
export const MonthSelected: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Set date range to April 2025
      store.appLayoutStore.setDateRange({
        start: new Date(2025, 3, 1).toISOString(),
        end: new Date(2025, 3, 30, 23, 59, 59).toISOString(),
      });
      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
};

// Story with pre-selected day
export const DaySelected: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Set date range to April 22, 2025
      store.appLayoutStore.setDateRange({
        start: new Date(2025, 3, 22).toISOString(),
        end: new Date(2025, 3, 22, 23, 59, 59).toISOString(),
      });
      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
};

// Story with all time selected (no date range)
export const AllTimeSelected: Story = {
  decorators: [
    (Story: React.ComponentType) => {
      const store = createStore();
      // Clear date range for "all time"
      store.appLayoutStore.setDateRange({
        start: undefined,
        end: undefined,
      });
      return React.createElement(
        RootStoreContext.Provider,
        { value: store },
        React.createElement(Story),
      );
    },
  ],
  args: {},
};
