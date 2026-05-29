import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Archive, ImagePlus, RefreshCcw, Trash2, UploadCloud } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Field, SelectField } from "../../components/ui/Field";
import { processFileWithProgress } from "../../services/api";
import { api } from "../../services/api";
import type { BlobResponse } from "../../services/api";
import type { AnalyzeResult, PhotoTemplate } from "../../types";

type QueueStatus = "selected" | "uploading" | "processing" | "processed" | "error";

interface QueueItem {
  key: string;
  file: File;
  filename: string;
  uploadProgress: number;
  processProgress: number;
  status: QueueStatus;
  analysis?: AnalyzeResult | null;
  result?: BlobResponse;
  error?: string | null;
}

export function BatchProcess() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | "">("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [studioAuto, setStudioAuto] = useState(true);
  const [enhanceQuality, setEnhanceQuality] = useState(false);
  const [batchName, setBatchName] = useState("flowimage_resultados");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.templates
      .list()
      .then((items) => {
        setTemplates(items);
        setTemplateId(items.find((item) => item.status === "active")?.id ?? items[0]?.id ?? "");
      })
      .catch((err) => setError(err.message));
  }, []);

  const processedCount = useMemo(() => queue.filter((item) => item.status === "processed").length, [queue]);
  const uploadAverage = useAverage(queue.map((item) => item.uploadProgress));
  const processAverage = useAverage(queue.map((item) => item.processProgress));

  const selectFiles = (files: File[]) => {
    setQueue(files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      filename: file.name,
      uploadProgress: 0,
      processProgress: 0,
      status: "selected",
      error: null,
    })));
  };

  const process = async (onlyKey?: string) => {
    if (!templateId || queue.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const targetItems = onlyKey ? queue.filter((item) => item.key === onlyKey) : queue;
      const recoveryItems: QueueItem[] = [];
      for (const [index, item] of targetItems.entries()) {
        setQueueStatus(item.key, { status: "uploading", uploadProgress: 1, processProgress: 0, error: null, result: undefined });
        try {
          const result = await processWithRetry(item, Number(templateId), studioAuto, enhanceQuality, setQueueStatus);
          setQueueStatus(item.key, {
            status: "processed",
            uploadProgress: 100,
            processProgress: 100,
            filename: result.filename,
            result,
            analysis: result.analysis,
          });
        } catch (err) {
          setQueueStatus(item.key, {
            status: "error",
            uploadProgress: 100,
            processProgress: 100,
            error: err instanceof Error ? err.message : "Falha ao processar.",
          });
          if (!onlyKey && isNetworkFailure(err)) recoveryItems.push(item);
        }
        if (index < targetItems.length - 1) await delay((index + 1) % 15 === 0 ? 9000 : 1200);
      }
      if (!onlyKey && recoveryItems.length > 0) {
        await delay(12000);
        for (const item of recoveryItems) {
          setQueueStatus(item.key, {
            status: "uploading",
            uploadProgress: 0,
            processProgress: 0,
            error: "Rodada final de recuperacao...",
            result: undefined,
          });
          try {
            const result = await processWithRetry(item, Number(templateId), studioAuto, enhanceQuality, setQueueStatus);
            setQueueStatus(item.key, {
              status: "processed",
              uploadProgress: 100,
              processProgress: 100,
              filename: result.filename,
              result,
              analysis: result.analysis,
              error: null,
            });
          } catch (err) {
            setQueueStatus(item.key, {
              status: "error",
              uploadProgress: 100,
              processProgress: 100,
              error: err instanceof Error ? err.message : "Falha ao processar.",
            });
          }
          await delay(2500);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const exportZip = async () => {
    const zip = new JSZip();
    const usedNames = new Set<string>();
    const exportItems = queue.filter((item) => item.result);
    exportItems.forEach((item) => {
      zip.file(uniqueArchiveName(item.result!.filename, usedNames), item.result!.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeZipName(batchName)}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const setQueueStatus = (key: string, patch: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };
  const removeItem = (key: string) => setQueue((current) => current.filter((item) => item.key !== key));

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Processamento em lote</div>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-violet-950 shadow-sm">{processedCount}/{queue.length} processadas</div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="control-panel overflow-auto lg:sticky lg:top-44 lg:max-h-[calc(100vh-11rem)]">
          <SelectField label="Molde" value={templateId} onChange={(event) => setTemplateId(Number(event.target.value))}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </SelectField>

          <Field label="Nome do lote" value={batchName} onChange={(event) => setBatchName(event.target.value)} />

          <label className="focus-ring flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/80 bg-gradient-to-br from-white to-violet-50 p-4 text-center text-sm font-bold text-violet-900">
            <ImagePlus size={24} />
            <span>{queue.length ? `${queue.length} imagens selecionadas` : "Selecionar imagens"}</span>
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => selectFiles(Array.from(event.target.files ?? []))} />
          </label>

          <ProgressBlock label="Upload geral" value={uploadAverage} />
          <ProgressBlock label="Processamento geral" value={processAverage} />

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white/80 p-3">
            <span>
              <span className="block text-sm font-black text-ink">Studio automatico</span>
            </span>
            <input
              className="h-5 w-5 accent-violet-700"
              type="checkbox"
              checked={studioAuto}
              onChange={(event) => setStudioAuto(event.target.checked)}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-purple-200 bg-white/80 p-3">
            <span>
              <span className="block text-sm font-black text-ink">Melhorar pixels</span>
            </span>
            <input
              className="h-5 w-5 accent-purple-700"
              type="checkbox"
              checked={enhanceQuality}
              onChange={(event) => setEnhanceQuality(event.target.checked)}
            />
          </label>

          <Button disabled={!templateId || queue.length === 0 || processing} onClick={() => process()} icon={<UploadCloud size={18} />}>
            {processing ? "Processando..." : "Enviar e processar"}
          </Button>
          <Button disabled={processedCount === 0 || processing} onClick={exportZip} variant="secondary" icon={<Archive size={18} />}>
            Exportar ZIP
          </Button>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_170px_150px] gap-3 bg-violet-950 px-3 py-2 text-xs font-black uppercase text-white">
            <span>Imagem</span>
            <span>Qualidade</span>
            <span>Acoes</span>
          </div>
          <div className="divide-y divide-line/70 bg-white/75">
            {queue.map((item) => (
              <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_170px_150px] items-center gap-3 px-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.filename}</div>
                  <div className="mt-1 text-xs font-semibold text-steel">{statusLabel(item.status)}</div>
                  {item.error ? <div className="mt-1 truncate text-xs font-semibold text-danger">{item.error}</div> : null}
                  <MiniProgress label="Upload" value={item.uploadProgress} />
                  <MiniProgress label="Processo" value={item.processProgress} />
                </div>
                <QualityCell item={item} />
                <div className="flex flex-wrap items-center gap-2">
                  {item.result ? <a className="text-xs font-bold text-action" href={item.result.url} download={item.result.filename}>baixar</a> : null}
                  <button className="rounded-md border border-line bg-white p-1 text-steel" type="button" title="Reprocessar" disabled={processing} onClick={() => process(item.key)}>
                    <RefreshCcw size={15} />
                  </button>
                  <button className="rounded-md border border-red-200 bg-white p-1 text-danger" type="button" title="Remover" disabled={processing} onClick={() => removeItem(item.key)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {queue.length === 0 ? <div className="p-8 text-center text-sm font-semibold text-steel">Nenhuma imagem selecionada.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function QualityCell({ item }: { item: QueueItem }) {
  const quality = item.analysis?.quality;
  if (!quality) return <div className="text-xs font-semibold text-steel">Sem analise</div>;
  const color = quality.status === "ok" ? "text-action" : quality.status === "review" ? "text-amber-700" : "text-danger";
  return (
    <div className="min-w-0 text-xs">
      <div className={`font-black ${color}`}>Score {quality.score}</div>
      <div className="mt-1 truncate font-semibold text-steel">{quality.warnings.length ? quality.warnings.join(" · ") : "Sem alertas"}</div>
    </div>
  );
}

async function processWithRetry(
  item: QueueItem,
  templateId: number,
  studioAuto: boolean,
  enhanceQuality: boolean,
  setQueueStatus: (key: string, patch: Partial<QueueItem>) => void,
) {
  const delays = [0, 1500, 3500, 6500];
  let lastError: unknown;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      setQueueStatus(item.key, {
        status: "uploading",
        uploadProgress: 0,
        processProgress: 0,
        error: `Falha de rede. Nova tentativa ${attempt + 1}/${delays.length}...`,
      });
      await delay(delays[attempt]);
    }
    try {
      return await processFileWithProgress(
        templateId,
        item.file,
        null,
        (progress) => {
          setQueueStatus(item.key, {
            uploadProgress: progress,
            status: progress < 100 ? "uploading" : "processing",
            processProgress: progress >= 100 ? 35 : 0,
          });
        },
        studioAuto,
        enhanceQuality,
        true,
      );
    } catch (error) {
      lastError = error;
      if (!isNetworkFailure(error)) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha de rede durante processamento.");
}

function isNetworkFailure(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("rede") || message.includes("network") || message.includes("fetch");
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function uniqueArchiveName(filename: string, usedNames: Set<string>) {
  if (!usedNames.has(filename)) {
    usedNames.add(filename);
    return filename;
  }
  const dotIndex = filename.lastIndexOf(".");
  const stem = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  const extension = dotIndex > 0 ? filename.slice(dotIndex) : "";
  let index = 2;
  let candidate = `${stem} (${index})${extension}`;
  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${stem} (${index})${extension}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function sanitizeZipName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "") || "flowimage_resultados";
}

function useAverage(values: number[]) {
  return useMemo(() => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  }, [values]);
}

function ProgressBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/75 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-steel">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniProgress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-black uppercase text-steel">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-violet-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function statusLabel(status: QueueStatus) {
  const labels: Record<QueueStatus, string> = {
    selected: "Aguardando",
    uploading: "Enviando",
    processing: "Processando",
    processed: "Processada em memória",
    error: "Erro",
  };
  return labels[status];
}
