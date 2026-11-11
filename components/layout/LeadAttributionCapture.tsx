"use client";

import { useEffect } from "react";
import { getVisitAttribution } from "@/lib/lead-attribution";

export function LeadAttributionCapture() {
  useEffect(() => { getVisitAttribution(); }, []);
  return null;
}
