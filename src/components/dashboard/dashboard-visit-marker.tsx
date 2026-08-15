"use client";

import * as React from "react";
import { markDashboardVisited } from "@/server/actions/dashboard";

export function DashboardVisitMarker() {
  React.useEffect(() => {
    void markDashboardVisited();
  }, []);
  return null;
}
