import { useEffect, useState } from "react";
import { store } from "./store";
import type { Group } from "./types";

export function useGroups(): Group[] {
  const [groups, setGroups] = useState<Group[]>(() => store.getAll());
  useEffect(() => {
    const handler = () => setGroups(store.getAll());
    window.addEventListener("splitsmart:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("splitsmart:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return groups;
}

export function useGroup(id: string | undefined): Group | undefined {
  const groups = useGroups();
  return id ? groups.find((g) => g.id === id) : undefined;
}
