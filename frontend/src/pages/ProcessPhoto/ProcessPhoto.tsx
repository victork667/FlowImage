import { useEffect, useMemo, useState } from "react";
import { Download, ImageUp, Wand2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { SelectField } from "../../components/ui/Field";
import { api, type BlobResponse } from "../../services/api";
import type { AnalyzeResult, PhotoTemplate } from "../../types";
import { addProcessHistory } from "../../utils/history";

export function ProcessPhoto() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BlobResponse | null>(null);
  const [studioAuto, setStudioAuto] = useState(true);
  const [enhanceQuality, setEnhanceQuality] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const originalPreview = useObjectUrl(file);
  const processedUrl = result?.url ?? null;
  const selectedTemplate = templates.find((template) => template.id === Number(templateId));

  useEffect(() => {
    if (!file) {
      setAnalysis(null);
      return;
    }
    setAnalyzing(true);
    api.process
      .analyze(file)
      .then(setAnalysis)
      .catch(() => setAnalysis(null))
      .finally(() => setAnalyzing(false));
  }, [file]);

  const process = async () => {
    if (!file || !templateId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const processed = await api.process.singleBlob(Number(templateId), file, "", studioAuto, enhanceQuality);
      setResult(processed);
      addProcessHistory({
        source: "single",
        filename: processed.filename,
        templateName: selectedTemplate?.name,
        downloadUrl: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao processar foto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Processar foto</div>
        </div>
        {result ? <a className="text-sm font-black text-action" href={result.url} download={result.filename}>Baixar imagem</a> : null}
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="control-panel lg:sticky lg:top-44 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto">
          <SelectField label="Molde" value={templateId} onChange={(event) => setTemplateId(Number(event.target.value))}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} · {template.width}x{template.height}
              </option>
            ))}
          </SelectField>

          <label className="focus-ring flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/80 bg-gradient-to-br from-white to-violet-50 p-4 text-center text-sm font-bold text-violet-900">
            <ImageUp size={24} />
            <span className="max-w-full truncate">{file ? file.name : "Selecionar foto"}</span>
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
            }} />
          </label>

          <QualityPanel analysis={analysis} analyzing={analyzing} />

          {selectedTemplate ? (
            <div className="rounded-xl bg-gradient-to-br from-violet-950 to-purple-800 p-4 text-white shadow-lg">
              <div className="text-sm font-black">{selectedTemplate.name}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-violet-50/85">
                <span>{selectedTemplate.width}x{selectedTemplate.height}</span>
                <span>{selectedTemplate.output_format}</span>
                <span>{selectedTemplate.shape}</span>
                <span>{selectedTemplate.transparent_background ? "transparente" : "fundo sólido"}</span>
              </div>
            </div>
          ) : null}

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

          <Button disabled={!file || !templateId || loading} onClick={process} icon={<Wand2 size={18} />}>
            {loading ? "Processando..." : "Processar"}
          </Button>

          {result ? (
            <a href={result.url} download={result.filename}>
              <Button type="button" variant="secondary" className="w-full" icon={<Download size={18} />}>Baixar resultado</Button>
            </a>
          ) : null}
        </div>

        <div className="preview-panel lg:sticky lg:top-44">
          <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            {processedUrl ? (
              <BeforeAfter original={originalPreview} processed={processedUrl} />
            ) : (
              <Preview title="Original" src={originalPreview} />
            )}
            <Preview title="Resultado no molde" src={processedUrl} template={selectedTemplate} primary />
          </div>
        </div>
      </section>

      {result ? (
        <section className="quiet-panel p-4">
          <h2 className="text-base font-black">Arquivo final</h2>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <Info label="Status" value="processado em memória" />
            <Info label="Arquivo" value={result.filename} />
            <Info label="Servidor" value="não salvo" />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QualityPanel({ analysis, analyzing }: { analysis: AnalyzeResult | null; analyzing: boolean }) {
  if (analyzing) {
    return <div className="rounded-xl border border-line/70 bg-white/75 p-3 text-sm font-bold text-steel">Analisando qualidade...</div>;
  }
  if (!analysis) return null;
  const quality = analysis.quality;
  const tone = quality.status === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : quality.status === "review" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-900";
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black">Qualidade da foto</div>
        <div className="text-lg font-black">{quality.score}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
        <span>{quality.width}x{quality.height}</span>
        <span>{analysis.detection.face_detected ? "Rosto detectado" : "Sem rosto"}</span>
        <span>Nitidez {Math.round(quality.blur_score)}</span>
        <span>{quality.needs_review ? "Revisar" : "Confiavel"}</span>
      </div>
      {quality.warnings.length ? <div className="mt-2 text-xs font-bold">{quality.warnings.join(" · ")}</div> : null}
      {quality.suggestions[0] ? <div className="mt-1 text-xs font-semibold opacity-80">{quality.suggestions[0]}</div> : null}
    </div>
  );
}

function BeforeAfter({ original, processed }: { original: string | null; processed: string }) {
  const [split, setSplit] = useState(50);
  return (
    <div className="rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-ink">Antes / depois</div>
        <input className="w-28" type="range" min={0} max={100} value={split} onChange={(event) => setSplit(Number(event.target.value))} />
      </div>
      <div className="image-stage relative h-80 overflow-hidden rounded-lg">
        {original ? <img src={original} alt="Antes" className="absolute inset-0 h-full w-full object-contain" /> : null}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <img src={processed} alt="Depois" className="h-full w-full object-contain" />
        </div>
        <div className="absolute top-0 h-full w-0.5 bg-violet-600" style={{ left: `${split}%` }} />
      </div>
    </div>
  );
}

function Preview({ title, src, template, primary = false }: { title: string; src: string | null; template?: PhotoTemplate; primary?: boolean }) {
  const shape = template?.shape === "circular" ? "rounded-full" : template?.shape === "oval" ? "rounded-[50%]" : template?.shape === "rounded" ? "rounded-lg" : "rounded-md";
  return (
    <div className="rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 text-sm font-black text-ink">{title}</div>
      <div className={`image-stage flex w-full items-center justify-center overflow-hidden ${primary ? "h-80" : "h-64"} ${primary ? shape : "rounded-lg"}`}>
        {src ? <img src={src} alt={title} className="h-full w-full object-contain" /> : <span className="text-sm font-bold text-steel">Sem imagem</span>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/75 p-2 shadow-sm">
      <div className="text-xs font-semibold uppercase text-steel">{label}</div>
      <div className="truncate font-semibold">{value}</div>
    </div>
  );
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}
