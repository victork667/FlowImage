import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download, ImageUp, RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { SelectField } from "../../components/ui/Field";
import { api, type BlobResponse } from "../../services/api";
import type { PhotoTemplate } from "../../types";
import { addProcessHistory } from "../../utils/history";
import { getManualPresets, saveManualPreset, type ManualPreset } from "../../utils/manualPresets";

const defaults: ManualPreset["values"] = {
  studio_auto: true,
  enhance_quality: false,
  zoom: 1,
  offset_x: 0,
  offset_y: 0,
  rotation: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  sharpness: 1,
  temperature: -4,
  auto_white_balance: true,
  shadow_reduction: 0.18,
  highlight_recovery: 0.12,
  gamma: 1,
  clarity: 0.12,
  vibrance: 0.04,
  color_preset_id: null,
};

export function Review() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [values, setValues] = useState(defaults);
  const [result, setResult] = useState<BlobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPresets, setManualPresets] = useState<ManualPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    api.templates
      .list()
      .then((items) => {
        setTemplates(items);
        setTemplateId(items.find((item) => item.status === "active")?.id ?? items[0]?.id ?? "");
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setManualPresets(getManualPresets());
  }, []);

  const originalPreview = useObjectUrl(file);
  const processedUrl = result?.url ?? null;
  const selectedTemplate = templates.find((template) => template.id === Number(templateId));

  const replaceResult = (next: BlobResponse | null) => {
    setResult((previous) => {
      if (previous?.url && previous.url !== next?.url) URL.revokeObjectURL(previous.url);
      return next;
    });
  };

  const processPreview = async () => {
    if (!file || !templateId) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const processed = await api.process.manualBlob(Number(templateId), file, values);
      if (requestId === requestIdRef.current) replaceResult(processed);
    } catch (err) {
      if (requestId === requestIdRef.current) setError(err instanceof Error ? err.message : "Falha no ajuste manual.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!file || !templateId) return;
    const timer = window.setTimeout(() => {
      void processPreview();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [file, templateId, values]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const registerDownload = () => {
    if (!result) return;
    addProcessHistory({
      source: "review",
      filename: result.filename,
      templateName: selectedTemplate?.name,
      downloadUrl: null,
    });
  };

  const savePreset = () => {
    const name = presetName.trim() || `Ajuste ${manualPresets.length + 1}`;
    saveManualPreset(name, values);
    setPresetName("");
    setManualPresets(getManualPresets());
  };

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Revisao manual</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loading ? <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white">Atualizando...</span> : null}
          {result ? (
            <a href={result.url} download={result.filename} onClick={registerDownload}>
              <Button type="button" variant="secondary" icon={<Download size={18} />}>
                Baixar
              </Button>
            </a>
          ) : (
            <Button type="button" variant="secondary" disabled icon={<Download size={18} />}>
              Baixar
            </Button>
          )}
          <Button type="button" disabled={!file || !templateId || loading} icon={<RefreshCw size={18} />} onClick={() => void processPreview()}>
            Atualizar agora
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="glass-panel grid content-start gap-4 overflow-auto p-4 xl:sticky xl:top-44 xl:max-h-[calc(100vh-11rem)]">
          <SelectField label="Molde de saida" value={templateId} onChange={(event) => setTemplateId(Number(event.target.value))}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </SelectField>

          <label className="focus-ring flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/80 bg-gradient-to-br from-white to-violet-50 p-4 text-center text-sm font-bold text-violet-900">
            <ImageUp size={24} />
            <span className="max-w-full truncate">{file ? file.name : "Selecionar foto para revisao"}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                replaceResult(null);
              }}
            />
          </label>

          {selectedTemplate ? <TemplateSummary template={selectedTemplate} /> : null}

          <div className="rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
              <SlidersHorizontal size={17} />
              Ajustes finos
            </div>
            <div className="grid gap-3">
              <Toggle
                label="Studio automatico"
                checked={values.studio_auto}
                onChange={(checked) => setValues({ ...values, studio_auto: checked })}
              />
              <Toggle
                label="Melhorar pixels"
                checked={values.enhance_quality}
                onChange={(checked) => setValues({ ...values, enhance_quality: checked })}
              />

              <ControlGroup title="Enquadramento">
                <Slider label="Zoom" value={values.zoom} min={0.5} max={2.5} step={0.05} onChange={(value) => setValues({ ...values, zoom: value })} />
                <Slider label="Posicao X" value={values.offset_x} min={-1} max={1} step={0.02} onChange={(value) => setValues({ ...values, offset_x: value })} />
                <Slider label="Posicao Y" value={values.offset_y} min={-1} max={1} step={0.02} onChange={(value) => setValues({ ...values, offset_y: value })} />
                <Slider label="Rotacao" value={values.rotation} min={-12} max={12} step={0.5} onChange={(value) => setValues({ ...values, rotation: value })} />
              </ControlGroup>

              <ControlGroup title="Luz e cor">
                <Toggle
                  label="Balanco automatico"
                  checked={values.auto_white_balance}
                  onChange={(checked) => setValues({ ...values, auto_white_balance: checked })}
                />
                <Slider label="Brilho" value={values.brightness} min={0.72} max={1.45} step={0.01} onChange={(value) => setValues({ ...values, brightness: value })} />
                <Slider label="Contraste" value={values.contrast} min={0.75} max={1.45} step={0.01} onChange={(value) => setValues({ ...values, contrast: value })} />
                <Slider label="Saturacao" value={values.saturation} min={0.55} max={1.55} step={0.01} onChange={(value) => setValues({ ...values, saturation: value })} />
                <Slider label="Temperatura" value={values.temperature} min={-60} max={12} step={1} onChange={(value) => setValues({ ...values, temperature: value })} />
                <Slider label="Sombras" value={values.shadow_reduction} min={0} max={1} step={0.01} onChange={(value) => setValues({ ...values, shadow_reduction: value })} />
                <Slider label="Recuperar luz" value={values.highlight_recovery} min={0} max={1} step={0.01} onChange={(value) => setValues({ ...values, highlight_recovery: value })} />
                <Slider label="Gamma" value={values.gamma} min={0.65} max={1.45} step={0.01} onChange={(value) => setValues({ ...values, gamma: value })} />
              </ControlGroup>

              <ControlGroup title="Detalhe">
                <Slider label="Nitidez" value={values.sharpness} min={0.55} max={2.2} step={0.01} onChange={(value) => setValues({ ...values, sharpness: value })} />
                <Slider label="Clareza" value={values.clarity} min={0} max={1} step={0.01} onChange={(value) => setValues({ ...values, clarity: value })} />
                <Slider label="Vibrance" value={values.vibrance} min={-0.5} max={0.8} step={0.01} onChange={(value) => setValues({ ...values, vibrance: value })} />
              </ControlGroup>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-sm">
            <div className="mb-3 text-sm font-black text-ink">Presets manuais</div>
            <div className="grid gap-2">
              <select
                className="focus-ring min-h-10 rounded-lg border border-line/80 bg-white/90 px-3 text-sm font-bold text-ink"
                defaultValue=""
                onChange={(event) => {
                  const preset = manualPresets.find((item) => item.id === event.target.value);
                  if (preset) setValues(normalizeValues(preset.values));
                }}
              >
                <option value="">Aplicar preset salvo</option>
                {manualPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="focus-ring min-h-10 rounded-lg border border-line/80 bg-white/90 px-3 text-sm font-bold text-ink"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Nome do preset"
                />
                <Button type="button" variant="secondary" onClick={savePreset}>Gravar</Button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={() => {
              setValues(defaults);
              replaceResult(null);
            }}
          >
            Reset
          </Button>
        </aside>

        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="preview-panel">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="section-title">Foto original</h2>
              </div>
            </div>
            <OriginalPreview src={originalPreview} template={selectedTemplate} />
          </section>

          <section className="preview-panel">
            <Preview title="Resultado no molde" src={processedUrl} template={selectedTemplate} primary loading={loading} />
          </section>
        </div>
      </section>
    </div>
  );
}

function normalizeValues(values: ManualPreset["values"]): ManualPreset["values"] {
  return { ...defaults, ...values, studio_auto: values.studio_auto ?? true, enhance_quality: values.enhance_quality ?? false };
}

function TemplateSummary({ template }: { template: PhotoTemplate }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-950 to-purple-800 p-4 text-white shadow-lg">
      <div className="text-sm font-black">{template.name}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-violet-50/85">
        <span>{template.width}x{template.height}</span>
        <span>{template.output_format}</span>
        <span>{template.shape}</span>
        <span>{template.transparent_background ? "transparente" : "fundo solido"}</span>
      </div>
    </div>
  );
}

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-xl border border-violet-100/80 bg-violet-50/50 p-3">
      <div className="text-xs font-black uppercase tracking-normal text-violet-950">{title}</div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-violet-200 bg-white/80 p-2">
      <span className="block text-sm font-black text-ink">{label}</span>
      <input
        className="h-5 w-5 accent-violet-700"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <input
          className="focus-ring h-8 w-20 rounded-lg border border-line bg-white px-2 text-right text-sm font-black text-ink"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value.toFixed(2))}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function OriginalPreview({ src, template }: { src: string | null; template?: PhotoTemplate }) {
  return (
    <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-violet-950/90 p-4">
      {src ? (
        <img src={src} alt="Foto original" className="max-h-[620px] max-w-full rounded-lg object-contain shadow-2xl" />
      ) : (
        <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-center text-sm font-bold text-white/80 backdrop-blur">
          Nenhuma foto selecionada
        </div>
      )}
      {src ? (
        <div className="pointer-events-none absolute inset-6 flex items-center justify-center">
          <div className="border-2 border-dashed border-violet-300/90 bg-violet-200/10 shadow-[0_0_0_9999px_rgba(33,19,52,0.26)]" style={overlayStyle(template)} />
        </div>
      ) : null}
    </div>
  );
}

function Preview({
  title,
  src,
  template,
  primary = false,
  loading = false,
}: {
  title: string;
  src: string | null;
  template?: PhotoTemplate;
  primary?: boolean;
  loading?: boolean;
}) {
  const shape = template?.shape === "circular" ? "rounded-full" : template?.shape === "oval" ? "rounded-[50%]" : template?.shape === "rounded" ? "rounded-xl" : "rounded-lg";
  return (
    <div className="rounded-xl border border-white/80 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm font-black text-ink">
        <span>{title}</span>
        {loading ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] text-violet-900">auto</span> : null}
      </div>
      <div className={`image-stage relative flex w-full items-center justify-center overflow-hidden ${primary ? "h-80" : "h-36"} ${primary ? shape : "rounded-lg"}`}>
        {src ? <img src={src} alt={title} className="h-full w-full object-contain" /> : <span className="text-sm font-bold text-steel">Sem imagem</span>}
        {loading ? <div className="absolute inset-0 grid place-items-center bg-white/45 text-xs font-black text-violet-950 backdrop-blur-[1px]">Atualizando</div> : null}
      </div>
    </div>
  );
}

function overlayStyle(template: PhotoTemplate | undefined) {
  const aspect = template ? template.width / template.height : 600 / 800;
  let width = 48;
  let height = width / aspect;
  if (height > 78) {
    height = 78;
    width = height * aspect;
  }
  const borderRadius = template?.shape === "circular" ? "9999px" : template?.shape === "oval" ? "50%" : template?.shape === "rounded" ? "18px" : "10px";
  return { width: `${width}%`, height: `${height}%`, borderRadius };
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
