import { useSyncExternalStore } from "react";
import { getLoadProgress, loadProgressVersion, subscribeLoadProgress } from "@/lib/models/progress";

/** How far the models of these cars have downloaded, while any of them is loading: 0–1 (the mean of those still
    loading), NaN if a size is unknown, or null once none is loading. */
export function useLoadProgress(ids: string[]) {
  useSyncExternalStore(subscribeLoadProgress, loadProgressVersion, () => 0);
  const loading = ids.map(getLoadProgress).filter((p): p is number => p !== null);
  if (!loading.length) return null;
  return loading.reduce((sum, p) => sum + p, 0) / loading.length;
}
