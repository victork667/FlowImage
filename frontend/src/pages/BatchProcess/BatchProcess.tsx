import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Archive, Clock3, ImagePlus, Plus, RefreshCcw, Trash2, UploadCloud, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Field, SelectField } from "../../components/ui/Field";
import { processFileWithProgress } from "../../services/api";
import { api } from "../../services/api";
import type { BlobResponse } from "../../services/api";
import type { AnalyzeResult, PhotoTemplate } from "../../types";

type QueueStatus = "selected" | "uploading" | "processing" | "processed" | "error";
type GroupStatus = "draft" | "queued" | "processing" | "processed" | "error";

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

interface BatchGroup {
  id: string;
  name: string;
  templateId: number | "";
  items: QueueItem[];
  status: GroupStatus;
  startedAt?: number | null;
  finishedAt?: number | null;
}

interface GroupStats {
  total: number;
  processed: number;
  failed: number;
  uploadAverage: number;
  processAverage: number;
  overallProgress: number;
  elapsedSeconds: number | null;
  etaSeconds: number | null;
  uploadEtaSeconds: number | null;
  processEtaSeconds: number | null;
}

export function BatchProcess() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<number | "">("");
  const [draftTemplateId, setDraftTemplateId] = useState<number | "">("");
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [draftGroupName, setDraftGroupName] = useState("DHL");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [groups, setGroups] = useState<BatchGroup[]>([]);
  const [batchName, setBatchName] = useState("flowimage_resultados");
  const [concurrency, setConcurrency] = useState(3);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studioAuto = true;
  const enhanceQuality = false;

  useEffect(() => {
    api.templates
      .list()
      .then((items) => {
        const nextDefault = items.find((item) => item.status === "active")?.id ?? items[0]?.id ?? "";
        setTemplates(items);
        setDefaultTemplateId(nextDefault);
        setDraftTemplateId(nextDefault);
      })
      .catch((err) => setError(err.message))
      .finally(() => setTemplatesLoading(false));
  }, []);

  const allItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const processedCount = useMemo(() => allItems.filter((item) => item.status === "processed").length, [allItems]);
  const failedCount = useMemo(() => allItems.filter((item) => item.status === "error").length, [allItems]);
  const globalStats = useMemo(() => summarizeGroups(groups), [groups]);

  const addGroup = () => {
    if (!draftTemplateId && !defaultTemplateId) {
      setError("Selecione um molde antes de criar o grupo.");
      return;
    }
    if (draftFiles.length === 0) {
      setError("Selecione ao menos uma imagem para o grupo.");
      return;
    }

    const groupId = createId();
    const groupName = draftGroupName.trim() || `Lote ${groups.length + 1}`;
    const nextGroup: BatchGroup = {
      id: groupId,
      name: groupName,
      templateId: draftTemplateId || defaultTemplateId,
      status: "draft",
      startedAt: null,
      finishedAt: null,
      items: draftFiles.map((file, index) => ({
        key: `${groupId}-${index}-${file.name}-${file.size}-${file.lastModified}`,
        file,
        filename: file.name,
        uploadProgress: 0,
        processProgress: 0,
        status: "selected",
        error: null,
      })),
    };

    setGroups((current) => [...current, nextGroup]);
    setDraftFiles([]);
    setDraftGroupName(`Lote ${groups.length + 2}`);
    setError(null);
  };

  const processAllGroups = async () => {
    const targetGroups = groups.filter((group) => group.items.length > 0 && group.templateId);
    if (targetGroups.length === 0) {
      setError("Crie ao menos um grupo com molde e imagens antes de processar.");
      return;
    }

    setProcessing(true);
    setError(null);
    setGroups((current) =>
      current.map((group) =>
        targetGroups.some((target) => target.id === group.id)
          ? { ...group, status: "queued", startedAt: null, finishedAt: null }
          : group,
      ),
    );

    try {
      let cursor = 0;
      const workers = Array.from({ length: Math.min(Math.max(concurrency, 1), targetGroups.length) }, async () => {
        while (cursor < targetGroups.length) {
          const group = targetGroups[cursor];
          cursor += 1;
          await processGroup(group);
        }
      });
      await Promise.all(workers);
    } finally {
      setProcessing(false);
    }
  };

  const processOneGroup = async (group: BatchGroup) => {
    if (!group.templateId) {
      setError("Selecione um molde para o grupo antes de processar.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await processGroup(group);
    } finally {
      setProcessing(false);
    }
  };

  const processGroup = async (group: BatchGroup) => {
    const templateId = Number(group.templateId);
    const targetItems = group.items.filter((item) => item.status !== "processed");
    const recoveryItems: QueueItem[] = [];
    const failedKeys = new Set<string>();

    setGroupPatch(group.id, { status: "processing", startedAt: Date.now(), finishedAt: null });

    for (const [index, item] of targetItems.entries()) {
      setGroupItemStatus(group.id, item.key, {
        status: "uploading",
        uploadProgress: 1,
        processProgress: 0,
        error: null,
        result: undefined,
      });
      try {
        const result = await processWithRetry(item, templateId, studioAuto, enhanceQuality, (key, patch) =>
          setGroupItemStatus(group.id, key, patch),
        );
        setGroupItemStatus(group.id, item.key, {
          status: "processed",
          uploadProgress: 100,
          processProgress: 100,
          filename: result.filename,
          result,
          analysis: result.analysis,
          error: null,
        });
      } catch (err) {
        failedKeys.add(item.key);
        setGroupItemStatus(group.id, item.key, {
          status: "error",
          uploadProgress: 100,
          processProgress: 100,
          error: err instanceof Error ? err.message : "Falha ao processar.",
        });
        if (isNetworkFailure(err)) recoveryItems.push(item);
      }
      if (index < targetItems.length - 1) await delay((index + 1) % 15 === 0 ? 9000 : 1200);
    }

    if (recoveryItems.length > 0) {
      await delay(12000);
      for (const item of recoveryItems) {
        setGroupItemStatus(group.id, item.key, {
          status: "uploading",
          uploadProgress: 0,
          processProgress: 0,
          error: "Rodada final de recuperacao...",
          result: undefined,
        });
        try {
          const result = await processWithRetry(item, templateId, studioAuto, enhanceQuality, (key, patch) =>
            setGroupItemStatus(group.id, key, patch),
          );
          setGroupItemStatus(group.id, item.key, {
            status: "processed",
            uploadProgress: 100,
            processProgress: 100,
            filename: result.filename,
            result,
            analysis: result.analysis,
            error: null,
          });
          failedKeys.delete(item.key);
        } catch (err) {
          failedKeys.add(item.key);
          setGroupItemStatus(group.id, item.key, {
            status: "error",
            uploadProgress: 100,
            processProgress: 100,
            error: err instanceof Error ? err.message : "Falha ao processar.",
          });
        }
        await delay(2500);
      }
    }

    setGroupPatch(group.id, { status: failedKeys.size > 0 ? "error" : "processed", finishedAt: Date.now() });
  };

  const reprocessItem = async (group: BatchGroup, item: QueueItem) => {
    if (!group.templateId) {
      setError("Selecione um molde para o grupo antes de reprocessar.");
      return;
    }
    setProcessing(true);
    setError(null);
    setGroupPatch(group.id, { status: "processing", startedAt: Date.now(), finishedAt: null });
    setGroupItemStatus(group.id, item.key, {
      status: "uploading",
      uploadProgress: 1,
      processProgress: 0,
      error: null,
      result: undefined,
    });
    try {
      const result = await processWithRetry(item, Number(group.templateId), studioAuto, enhanceQuality, (key, patch) =>
        setGroupItemStatus(group.id, key, patch),
      );
      setGroupItemStatus(group.id, item.key, {
        status: "processed",
        uploadProgress: 100,
        processProgress: 100,
        filename: result.filename,
        result,
        analysis: result.analysis,
        error: null,
      });
      setGroupPatch(group.id, { status: "processed", finishedAt: Date.now() });
    } catch (err) {
      setGroupItemStatus(group.id, item.key, {
        status: "error",
        uploadProgress: 100,
        processProgress: 100,
        error: err instanceof Error ? err.message : "Falha ao processar.",
      });
      setGroupPatch(group.id, { status: "error", finishedAt: Date.now() });
    } finally {
      setProcessing(false);
    }
  };

  const exportZip = async () => {
    const zip = new JSZip();
    const usedFolders = new Set<string>();

    groups.forEach((group) => {
      const exportItems = group.items.filter((item) => item.result);
      if (exportItems.length === 0) return;

      const folderName = uniqueArchiveName(sanitizeZipName(group.name), usedFolders);
      const folder = zip.folder(folderName);
      const usedNames = new Set<string>();
      exportItems.forEach((item) => {
        folder?.file(uniqueArchiveName(item.result!.filename, usedNames), item.result!.blob);
      });
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeZipName(batchName)}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const setGroupPatch = (groupId: string, patch: Partial<BatchGroup>) => {
    setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
  };

  const setGroupItemStatus = (groupId: string, key: string, patch: Partial<QueueItem>) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.map((item) => (item.key === key ? { ...item, ...patch } : item)) }
          : group,
      ),
    );
  };

  const removeGroup = (groupId: string) => {
    setGroups((current) => current.filter((group) => group.id !== groupId));
  };

  const removeItem = (groupId: string, key: string) => {
    setGroups((current) =>
      current
        .map((group) =>
          group.id === groupId ? { ...group, items: group.items.filter((item) => item.key !== key) } : group,
        )
        .filter((group) => group.items.length > 0),
    );
  };

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Processamento em lote</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            {processedCount}/{allItems.length} processadas
          </div>
          {failedCount > 0 ? (
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{failedCount} falhas</div>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="control-panel">
        <div className="grid gap-4 xl:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1fr)_150px_minmax(240px,1fr)_auto] xl:items-end">
          <Field
            label="Grupo"
            value={draftGroupName}
            disabled={processing}
            onChange={(event) => setDraftGroupName(event.target.value)}
          />

          <SelectField
            label="Molde"
            value={draftTemplateId}
            disabled={templatesLoading || processing}
            onChange={(event) => setDraftTemplateId(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">{templatesLoading ? "Carregando moldes..." : "Selecione um molde"}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Paralelo"
            value={concurrency}
            disabled={processing}
            onChange={(event) => setConcurrency(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} por vez
              </option>
            ))}
          </SelectField>

          <label className="focus-ring flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-2 text-center text-sm font-medium text-violet-700 transition hover:bg-violet-100">
            <ImagePlus size={20} />
            <span>{draftFiles.length ? `${draftFiles.length} imagens` : "Selecionar imagens"}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              disabled={processing}
              onChange={(event) => {
                setDraftFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button disabled={draftFiles.length === 0 || processing} onClick={addGroup} icon={<Plus size={18} />}>
              Adicionar grupo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_auto_auto] lg:items-end">
          <SummaryBar stats={globalStats} />
          <Field label="Nome do ZIP" value={batchName} disabled={processing} onChange={(event) => setBatchName(event.target.value)} />

          <Button disabled={groups.length === 0 || processing} onClick={processAllGroups} icon={<UploadCloud size={18} />}>
            {processing ? "Processando..." : "Processar grupos"}
          </Button>
          <Button disabled={processedCount === 0 || processing} onClick={exportZip} variant="secondary" icon={<Archive size={18} />}>
            Exportar ZIP
          </Button>
        </div>
      </section>

      <section className="grid gap-4">
        {groups.map((group) => {
          const stats = getGroupStats(group);
          const template = templates.find((item) => item.id === Number(group.templateId));
          return (
            <article key={group.id} className="glass-panel overflow-hidden">
              <div className="grid gap-4 border-b border-line bg-white px-4 py-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-black text-gray-950">{group.name}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-black uppercase text-steel">
                      {groupStatusLabel(group.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-steel">
                    <span>{stats.total} imagens</span>
                    <span>{stats.processed} concluidas</span>
                    {stats.failed > 0 ? <span className="text-danger">{stats.failed} falhas</span> : null}
                  </div>
                </div>

                <div className="grid gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-steel">
                  <span>{template?.name ?? "Sem molde"}</span>
                  <span>ETA {formatDuration(stats.etaSeconds)}</span>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Button disabled={processing || !group.templateId} onClick={() => processOneGroup(group)} variant="secondary">
                    Processar grupo
                  </Button>
                  <button
                    className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-gray-600 transition hover:bg-gray-50"
                    type="button"
                    title="Remover grupo"
                    disabled={processing}
                    onClick={() => removeGroup(group.id)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3">
                <MiniProgress label="Progresso do grupo" value={stats.overallProgress} />
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[660px] grid-cols-[minmax(0,1fr)_150px_130px] gap-3 bg-gray-900 px-3 py-2 text-xs font-bold uppercase text-white">
                  <span>Imagem</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>
                <div className="min-w-[660px] divide-y divide-line/70 bg-white">
                  {group.items.map((item) => (
                    <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_150px_130px] items-center gap-3 px-3 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-bold">{item.filename}</div>
                        {item.error ? <div className="mt-1 truncate text-xs font-semibold text-danger">{item.error}</div> : null}
                        <MiniProgress label="Progresso" value={itemOverallProgress(item)} />
                      </div>
                      <div className="text-xs font-bold text-steel">
                        {statusLabel(item.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.result ? (
                          <a className="text-xs font-bold text-action" href={item.result.url} download={item.result.filename}>
                            baixar
                          </a>
                        ) : null}
                        <button
                          className="rounded-md border border-line bg-white p-1 text-steel"
                          type="button"
                          title="Reprocessar"
                          disabled={processing}
                          onClick={() => reprocessItem(group, item)}
                        >
                          <RefreshCcw size={15} />
                        </button>
                        <button
                          className="rounded-md border border-red-200 bg-white p-1 text-danger"
                          type="button"
                          title="Remover"
                          disabled={processing}
                          onClick={() => removeItem(group.id, item.key)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
        {groups.length === 0 ? (
          <div className="glass-panel p-8 text-center text-sm font-semibold text-steel">
            Nenhum grupo criado. Selecione imagens, defina o grupo e clique em Adicionar grupo.
          </div>
        ) : null}
      </section>
    </div>
  );
}

async function processWithRetry(
  item: QueueItem,
  templateId: number,
  studioAuto: boolean,
  enhanceQuality: boolean,
  setItemStatus: (key: string, patch: Partial<QueueItem>) => void,
) {
  const delays = [0, 1500, 3500, 6500];
  let lastError: unknown;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt] > 0) {
      setItemStatus(item.key, {
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
          setItemStatus(item.key, {
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

function summarizeGroups(groups: BatchGroup[]): GroupStats {
  const allItems = groups.flatMap((group) => group.items);
  const startedAt = groups
    .map((group) => group.startedAt)
    .filter((value): value is number => Boolean(value))
    .sort((a, b) => a - b)[0];
  const activeGroups = groups.filter((group) => group.status === "processing" || group.status === "queued");
  const finishedAt = activeGroups.length > 0 ? null : Math.max(0, ...groups.map((group) => group.finishedAt ?? 0));
  return getStats(allItems, startedAt ?? null, finishedAt || null);
}

function getGroupStats(group: BatchGroup): GroupStats {
  return getStats(group.items, group.startedAt ?? null, group.finishedAt ?? null);
}

function getStats(items: QueueItem[], startedAt: number | null, finishedAt: number | null): GroupStats {
  const total = items.length;
  const processed = items.filter((item) => item.status === "processed").length;
  const failed = items.filter((item) => item.status === "error").length;
  const uploadAverage = average(items.map((item) => item.uploadProgress));
  const processAverage = average(items.map((item) => item.processProgress));
  const overallProgress = average(items.map(itemOverallProgress));
  const elapsedSeconds = startedAt ? Math.max(0, Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000)) : null;
  return {
    total,
    processed,
    failed,
    uploadAverage,
    processAverage,
    overallProgress,
    elapsedSeconds,
    etaSeconds: estimateSeconds(overallProgress, elapsedSeconds),
    uploadEtaSeconds: estimateSeconds(uploadAverage, elapsedSeconds),
    processEtaSeconds: estimateSeconds(processAverage, elapsedSeconds),
  };
}

function itemOverallProgress(item: QueueItem) {
  if (item.status === "processed" || item.status === "error") return 100;
  if (item.status === "processing") return 50 + Math.round(item.processProgress * 0.5);
  if (item.status === "uploading") return Math.round(item.uploadProgress * 0.5);
  return 0;
}

function estimateSeconds(progress: number, elapsedSeconds: number | null) {
  if (!elapsedSeconds || progress <= 0 || progress >= 100) return null;
  return Math.max(1, Math.round((elapsedSeconds * (100 - progress)) / progress));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
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

function formatDuration(seconds: number | null) {
  if (!seconds) return "--";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const minuteRest = minutes % 60;
  return minuteRest ? `${hours}h ${minuteRest}m` : `${hours}h`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SummaryBar({ stats }: { stats: GroupStats }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase text-steel">
        <span>Andamento geral</span>
        <span>{stats.overallProgress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-500" style={{ width: `${stats.overallProgress}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-steel">
        <span className="flex items-center gap-1">
          <Clock3 size={12} />
          Total {formatDuration(stats.etaSeconds)}
        </span>
        <span>Upload {stats.uploadAverage}%</span>
        <span>Processo {stats.processAverage}%</span>
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
    processed: "Processada em memoria",
    error: "Erro",
  };
  return labels[status];
}

function groupStatusLabel(status: GroupStatus) {
  const labels: Record<GroupStatus, string> = {
    draft: "Preparado",
    queued: "Na fila",
    processing: "Processando",
    processed: "Concluido",
    error: "Com falhas",
  };
  return labels[status];
}
