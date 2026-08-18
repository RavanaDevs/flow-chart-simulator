import { useEffect, useRef } from "react";
import { useGraphStore } from "@/stores/graph-store";
import { exportDocument, importDocument } from "@/lib/persistence/document";

const AUTOSAVE_KEY = "flowchart-sim:doc:v1";

export function useAutosave() {
  const { nodes, edges, loadDocument } = useGraphStore();
  const isInitialMountRef = useRef(true);

  // Load saved document on initial client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      const res = importDocument(saved);
      if (res.ok) {
        loadDocument(res.doc.nodes, res.doc.edges);
      }
    }
  }, [loadDocument]);

  // Debounced save to localStorage on document graph change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const timerId = setTimeout(() => {
      const json = exportDocument(nodes, edges);
      localStorage.setItem(AUTOSAVE_KEY, json);
    }, 500);

    return () => clearTimeout(timerId);
  }, [nodes, edges]);
}
