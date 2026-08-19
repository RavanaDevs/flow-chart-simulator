import { EditorShell } from "@/components/editor/editor-shell";

export const metadata = {
  title: "Flowchart Simulator",
  description: "Interactive visual flowchart simulator and interpreter for pseudocode logic",
};

export default function Page() {
  return <EditorShell />;
}
