import type { AnalyzeResult, ColorPreset, ColorPresetPayload, PhotoJob, PhotoJobItem, PhotoTemplate, ProcessResult } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const API = `${API_BASE}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: options?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "Falha na requisição.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  templates: {
    list: () => request<PhotoTemplate[]>("/photo-templates"),
    create: (payload: Omit<PhotoTemplate, "id">) =>
      request<PhotoTemplate>("/photo-templates", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: Omit<PhotoTemplate, "id">) =>
      request<PhotoTemplate>(`/photo-templates/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: number) => request<{ message: string }>(`/photo-templates/${id}`, { method: "DELETE" }),
    duplicate: (id: number) => request<PhotoTemplate>(`/photo-templates/${id}/duplicate`, { method: "POST" }),
  },
  presets: {
    list: () => request<ColorPreset[]>("/color-presets"),
    create: (payload: ColorPresetPayload) =>
      request<ColorPreset>("/color-presets", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: ColorPresetPayload) =>
      request<ColorPreset>(`/color-presets/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: number) => request<{ message: string }>(`/color-presets/${id}`, { method: "DELETE" }),
  },
  process: {
    analyze: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<AnalyzeResult>("/process/analyze-file", { method: "POST", body: form });
    },
    single: (templateId: number, file: File, suffix = "_cracha") => {
      const form = new FormData();
      form.append("template_id", String(templateId));
      form.append("filename_suffix", suffix);
      form.append("file", file);
      return request<ProcessResult>("/process/single", { method: "POST", body: form });
    },
    singleBlob: (templateId: number, file: File, suffix = "", studioAuto = true, enhanceQuality = false) => {
      const form = new FormData();
      form.append("template_id", String(templateId));
      form.append("filename_suffix", suffix);
      form.append("smart_studio", String(studioAuto));
      form.append("enhance_quality", String(enhanceQuality));
      form.append("file", file);
      return blobRequest("/process/single-file", form, file.name);
    },
    manualBlob: (templateId: number, file: File, adjustments: Record<string, number | boolean | null>) => {
      const form = new FormData();
      form.append("template_id", String(templateId));
      form.append("adjustments", JSON.stringify(adjustments));
      form.append("file", file);
      return blobRequest("/process/manual-adjust-file", form, file.name);
    },
    manual: (templateId: number, file: File, adjustments: Record<string, number | boolean | null>) => {
      const form = new FormData();
      form.append("template_id", String(templateId));
      form.append("adjustments", JSON.stringify(adjustments));
      form.append("file", file);
      return request<ProcessResult>("/process/manual-adjust", { method: "POST", body: form });
    },
  },
  jobs: {
    create: (templateId: number) => request<PhotoJob>("/jobs", { method: "POST", body: JSON.stringify({ template_id: templateId }) }),
    upload: (jobId: number, files: File[], manifest?: File | null) => {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      if (manifest) form.append("manifest", manifest);
      return request<PhotoJobItem[]>(`/jobs/${jobId}/upload`, { method: "POST", body: form });
    },
    process: (jobId: number) => request<PhotoJob>(`/jobs/${jobId}/process`, { method: "POST" }),
    items: (jobId: number) => request<PhotoJobItem[]>(`/jobs/${jobId}/items`),
    reprocessItem: (jobId: number, itemId: number) =>
      request<PhotoJobItem>(`/jobs/${jobId}/items/${itemId}/reprocess`, { method: "POST" }),
    processItem: (jobId: number, itemId: number) =>
      request<PhotoJobItem>(`/jobs/${jobId}/items/${itemId}/process`, { method: "POST" }),
    exportZipUrl: (jobId: number) => `${API}/jobs/${jobId}/export-zip`,
  },
};

export interface BlobResponse {
  blob: Blob;
  filename: string;
  url: string;
}

export function processFileWithProgress(
  templateId: number,
  file: File,
  adjustments: Record<string, number | boolean | null> | null,
  onUploadProgress: (progress: number) => void,
  studioAuto = true,
  enhanceQuality = false,
): Promise<BlobResponse> {
  const form = new FormData();
  form.append("template_id", String(templateId));
  if (adjustments) form.append("adjustments", JSON.stringify(adjustments));
  else {
    form.append("filename_suffix", "");
    form.append("smart_studio", String(studioAuto));
    form.append("enhance_quality", String(enhanceQuality));
  }
  form.append("file", file);
  const path = adjustments ? "/process/manual-adjust-file" : "/process/single-file";
  return xhrBlobRequest(`${API}${path}`, form, onUploadProgress, file.name);
}

async function blobRequest(path: string, body: FormData, originalFilename?: string): Promise<BlobResponse> {
  const response = await fetch(`${API}${path}`, { method: "POST", body });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? "Falha no processamento.");
  }
  const blob = await response.blob();
  const filename = outputFilename(originalFilename, blob.type, response.headers.get("X-Filename"));
  return { blob, filename, url: URL.createObjectURL(blob) };
}

function xhrBlobRequest(
  url: string,
  body: FormData,
  onProgress: (progress: number) => void,
  originalFilename?: string,
): Promise<BlobResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "blob";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        const blob = xhr.response as Blob;
        const filename = outputFilename(originalFilename, blob.type, xhr.getResponseHeader("X-Filename"));
        resolve({ blob, filename, url: URL.createObjectURL(blob) });
        return;
      }
      reject(new Error("Falha no processamento."));
    };
    xhr.onerror = () => reject(new Error("Falha de rede durante processamento."));
    xhr.send(body);
  });
}

function outputFilename(originalFilename: string | undefined, mediaType: string, headerFilename: string | null): string {
  if (originalFilename) {
    const stem = originalFilename.replace(/\.[^/.\\]+$/, "").trim() || "foto";
    return `${sanitizeDownloadStem(stem)}${extensionFromMediaType(mediaType)}`;
  }
  return headerFilename || `foto${extensionFromMediaType(mediaType)}`;
}

function sanitizeDownloadStem(stem: string): string {
  return stem.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "") || "foto";
}

function extensionFromMediaType(mediaType: string): string {
  return mediaType.includes("jpeg") || mediaType.includes("jpg") ? ".jpg" : ".png";
}

export function uploadJobFilesWithProgress(
  jobId: number,
  files: File[],
  manifest: File | null | undefined,
  onProgress: (progress: number) => void,
): Promise<PhotoJobItem[]> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  if (manifest) form.append("manifest", manifest);
  return xhrRequest<PhotoJobItem[]>(`${API}/jobs/${jobId}/upload`, form, onProgress);
}

function xhrRequest<T>(url: string, body: FormData, onProgress: (progress: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(JSON.parse(xhr.responseText) as T);
        return;
      }
      try {
        const payload = JSON.parse(xhr.responseText);
        reject(new Error(payload.detail ?? "Falha na requisição."));
      } catch {
        reject(new Error("Falha na requisição."));
      }
    };
    xhr.onerror = () => reject(new Error("Falha de rede durante upload."));
    xhr.send(body);
  });
}

export function fileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/files")) return `${API_BASE}${path}`;
  const normalized = path.replace(/\\/g, "/");
  const name = normalized.split("/").pop();
  if (!name) return null;
  if (normalized.includes("/debug/")) return `${API_BASE}/files/debug/${name}`;
  if (normalized.includes("/input/")) return `${API_BASE}/files/input/${name}`;
  return `${API_BASE}/files/output/${name}`;
}
