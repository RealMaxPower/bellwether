"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RateAction } from "./scenarios";

interface FedChairState {
  /** scenarioId → choice the user locked in. */
  choices: Record<string, RateAction>;
  recordChoice: (scenarioId: string, action: RateAction) => void;
  reset: () => void;
}

export const useFedChairStore = create<FedChairState>()(
  persist(
    (set) => ({
      choices: {},
      recordChoice: (scenarioId, action) =>
        set((state) => ({ choices: { ...state.choices, [scenarioId]: action } })),
      reset: () => set({ choices: {} }),
    }),
    {
      name: "bellwether.fed-chair.v1",
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : localStorage)),
    },
  ),
);

const noopStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};
