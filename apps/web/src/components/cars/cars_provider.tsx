"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface Car {
  id: string;
  license_plate: string;
  car_model: string | null;
  car_year: string | null;
  car_color: string | null;
  car_vin: string | null;
  created_at: Date;
  approval_status?: "PENDING" | "APPROVED" | "REJECTED";
  approved_at?: Date | null;
  last_service?: {
    date: Date;
    branch: string;
    odometer_km: number;
  } | null;
  has_tire_changes?: boolean;
  has_oil_changes?: boolean;
}

interface CarsContextType {
  cars: Car[];
  is_loading: boolean;
  refetch: () => void;
  selected_car: Car | null;
  select_car: (car: Car | null) => void;
  clear_selection: () => void;
  update_selected_car: (updated_car: Car) => void;
}

const CarsContext = createContext<CarsContextType | null>(null);

/**
 * Cars provider component
 * Provides shared car data and selection state across all car-related pages
 * Uses tRPC with stale-while-revalidate caching
 * @param props - Children components
 * @returns Provider wrapper
 */
export function CarsProvider({ children }: { children: ReactNode }) {
  console.log("[CarsProvider] Initializing");

  const [selected_car, set_selected_car] = useState<Car | null>(null);

  const { data, isLoading, refetch } = trpc.car.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  /**
   * Select a car to view its service history
   * @param car - Car to select or null to clear
   */
  const select_car = useCallback((car: Car | null) => {
    console.log("[CarsProvider] Selecting car:", car?.license_plate ?? "none");
    set_selected_car(car);
  }, []);

  /**
   * Clear the current car selection
   */
  const clear_selection = useCallback(() => {
    console.log("[CarsProvider] Clearing selection");
    set_selected_car(null);
  }, []);

  /**
   * Update the selected car with new data
   * @param updated_car - Updated car data
   */
  const update_selected_car = useCallback((updated_car: Car) => {
    console.log("[CarsProvider] Updating selected car:", updated_car.license_plate);
    set_selected_car(updated_car);
  }, []);

  const value: CarsContextType = {
    cars: (data as Car[]) || [],
    is_loading: isLoading,
    refetch: () => refetch(),
    selected_car,
    select_car,
    clear_selection,
    update_selected_car,
  };

  return (
    <CarsContext.Provider value={value}>
      {children}
    </CarsContext.Provider>
  );
}

/**
 * Hook to access cars context
 * @returns Cars context value
 * @throws Error if used outside provider
 */
export function useCars(): CarsContextType {
  const context = useContext(CarsContext);
  if (!context) {
    throw new Error("useCars must be used within CarsProvider");
  }
  return context;
}
