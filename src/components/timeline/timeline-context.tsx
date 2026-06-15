"use client";

import * as React from "react";
import { scaleLinear, scaleTime, type ScaleLinear, type ScaleTime } from "d3-scale";

export interface TimelineDimensions {
  width: number;
  /** Total SVG viewBox height — includes the chart area plus reserved policy-lane space below. */
  height: number;
  /** Height of just the PMI chart area. The policy lane sits between chartHeight and height. */
  chartHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
}

export interface TimelineContextValue {
  /** d3 time scale mapping date → x pixel inside the chart inner area. */
  xScale: ScaleTime<number, number>;
  /** d3 linear scale mapping PMI value → y pixel. */
  yScale: ScaleLinear<number, number>;
  dims: TimelineDimensions;
  /** First-of-month ISO of the currently selected month, or null. */
  hoveredDate: string | null;
  setHoveredDate: (iso: string | null) => void;
}

export const TimelineContext = React.createContext<TimelineContextValue | null>(null);

export function useTimeline(): TimelineContextValue {
  const ctx = React.useContext(TimelineContext);
  if (!ctx) {
    throw new Error("useTimeline must be used inside a <TimelineProvider />");
  }
  return ctx;
}

export interface TimelineProviderProps {
  children: React.ReactNode;
  /** Date range of the chart. */
  domainStart: Date;
  domainEnd: Date;
  /** PMI value range. Default 28-72 — covers all observed historical values. */
  yDomain?: [number, number];
  dims: TimelineDimensions;
}

export function TimelineProvider({
  children,
  domainStart,
  domainEnd,
  yDomain = [28, 72],
  dims,
}: TimelineProviderProps) {
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

  const xScale = React.useMemo(
    () =>
      scaleTime()
        .domain([domainStart, domainEnd])
        .range([dims.marginLeft, dims.width - dims.marginRight]),
    [domainStart, domainEnd, dims.marginLeft, dims.width, dims.marginRight],
  );

  const yScale = React.useMemo(
    () =>
      scaleLinear()
        .domain(yDomain)
        .range([dims.chartHeight - dims.marginBottom, dims.marginTop]),
    [yDomain, dims.chartHeight, dims.marginBottom, dims.marginTop],
  );

  const value = React.useMemo<TimelineContextValue>(
    () => ({ xScale, yScale, dims, hoveredDate, setHoveredDate }),
    [xScale, yScale, dims, hoveredDate],
  );

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}
