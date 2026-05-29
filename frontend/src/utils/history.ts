import type { ProcessResult } from "../types";

export interface ProcessHistoryItem {
  id: string;
  source: "single" | "review" | "batch";
  filename: string;
  templateName?: string;
  downloadUrl?: string | null;
  createdAt: string;
}

const KEY = "flowimage.processHistory";

export function addProcessHistory(item: Omit<ProcessHistoryItem, "id" | "createdAt">) {
  const history = getProcessHistory();
  const next: ProcessHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([next, ...history].slice(0, 30)));
}

export function addResultToHistory(source: ProcessHistoryItem["source"], result: ProcessResult, templateName?: string) {
  if (result.status !== "processed") return;
  addProcessHistory({
    source,
    filename: result.filename ?? "imagem_processada",
    templateName,
    downloadUrl: result.download_url,
  });
}

export function getProcessHistory(): ProcessHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ProcessHistoryItem[];
  } catch {
    return [];
  }
}
