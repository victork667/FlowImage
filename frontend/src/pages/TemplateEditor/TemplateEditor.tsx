import { FormEvent, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { Field, SelectField } from "../../components/ui/Field";
import { api } from "../../services/api";
import type { ColorPreset, PhotoTemplate } from "../../types";

const defaultTemplate: Omit<PhotoTemplate, "id"> = {
  name: "",
  description: "",
  width: 600,
  height: 800,
  shape: "rectangular",
  background_color: "#ffffff",
  transparent_background: false,
  border_radius: 0,
  output_format: "PNG",
  output_quality: 92,
  color_preset_id: null,
  face_expand_x: 2.2,
  face_expand_y: 2.8,
  face_offset_y: -0.15,
  zoom_default: 1,
  offset_x_default: 0,
  offset_y_default: 0,
  head_top_margin: 0.12,
  shoulder_visibility: 0.25,
  crop_mode: "head_shoulders",
  status: "active",
};

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<PhotoTemplate, "id">>(defaultTemplate);
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    api.presets.list().then(setPresets).catch((err) => setError(err.message));
    if (id) {
      api.templates
        .list()
        .then((items) => items.find((item) => item.id === Number(id)))
        .then((template) => {
          if (!template) throw new Error("Molde não encontrado.");
          const { id: _id, ...payload } = template;
          setForm(payload);
        })
        .catch((err) => setError(err.message));
    }
  }, [id]);

  const previewStyle = useMemo(() => {
    const radius = form.shape === "circular" ? "9999px" : form.shape === "oval" ? "50%" : form.shape === "rounded" ? `${Math.max(form.border_radius / 10, 6)}px` : "2px";
    return {
      width: `${Math.min(180, Math.max(80, form.width / 5))}px`,
      height: `${Math.min(220, Math.max(80, form.height / 5))}px`,
      borderRadius: radius,
      backgroundColor: form.transparent_background ? "transparent" : form.background_color,
    };
  }, [form]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (id) await api.templates.update(Number(id), form);
      else await api.templates.create(form);
      navigate("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar molde.");
    }
  };

  const set = (key: keyof typeof form, value: string | number | boolean | null) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">{isEditing ? "Editar molde" : "Novo molde"}</div>
        </div>
        <Button icon={<Save size={18} />}>Salvar</Button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <section className="control-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            <SelectField label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </SelectField>
            <Field label="Descrição" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            <SelectField label="Preset de cor" value={form.color_preset_id ?? ""} onChange={(e) => set("color_preset_id", e.target.value ? Number(e.target.value) : null)}>
              <option value="">Sem preset</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Largura px" type="number" value={form.width} onChange={(e) => set("width", Number(e.target.value))} />
            <Field label="Altura px" type="number" value={form.height} onChange={(e) => set("height", Number(e.target.value))} />
            <SelectField label="Formato" value={form.shape} onChange={(e) => set("shape", e.target.value)}>
              <option value="rectangular">Retangular</option>
              <option value="square">Quadrado</option>
              <option value="circular">Circular</option>
              <option value="oval">Oval</option>
              <option value="rounded">Arredondado</option>
            </SelectField>
            <Field label="Border radius" type="number" value={form.border_radius} onChange={(e) => set("border_radius", Number(e.target.value))} />
            <Field label="Cor de fundo" type="color" value={form.background_color === "transparent" ? "#ffffff" : form.background_color} onChange={(e) => set("background_color", e.target.value)} />
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-line/80 bg-white/80 px-3 text-sm font-bold text-steel">
              <input type="checkbox" checked={form.transparent_background} onChange={(e) => set("transparent_background", e.target.checked)} />
              Transparente
            </label>
            <SelectField label="Saída" value={form.output_format} onChange={(e) => set("output_format", e.target.value)}>
              <option value="PNG">PNG</option>
              <option value="JPG">JPG</option>
            </SelectField>
            <Field label="Qualidade" type="number" min={1} max={100} value={form.output_quality} onChange={(e) => set("output_quality", Number(e.target.value))} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="faceExpandX" type="number" step="0.05" value={form.face_expand_x} onChange={(e) => set("face_expand_x", Number(e.target.value))} />
            <Field label="faceExpandY" type="number" step="0.05" value={form.face_expand_y} onChange={(e) => set("face_expand_y", Number(e.target.value))} />
            <Field label="faceOffsetY" type="number" step="0.01" value={form.face_offset_y} onChange={(e) => set("face_offset_y", Number(e.target.value))} />
            <Field label="zoomDefault" type="number" step="0.05" value={form.zoom_default} onChange={(e) => set("zoom_default", Number(e.target.value))} />
            <Field label="offsetXDefault" type="number" step="0.05" value={form.offset_x_default} onChange={(e) => set("offset_x_default", Number(e.target.value))} />
            <Field label="offsetYDefault" type="number" step="0.05" value={form.offset_y_default} onChange={(e) => set("offset_y_default", Number(e.target.value))} />
            <Field label="headTopMargin" type="number" step="0.01" value={form.head_top_margin} onChange={(e) => set("head_top_margin", Number(e.target.value))} />
            <Field label="shoulderVisibility" type="number" step="0.01" value={form.shoulder_visibility} onChange={(e) => set("shoulder_visibility", Number(e.target.value))} />
            <SelectField label="Modo de crop" value={form.crop_mode} onChange={(e) => set("crop_mode", e.target.value)}>
              <option value="head_shoulders">Cabeça e ombros</option>
              <option value="contain">Conter imagem inteira</option>
              <option value="cover">Preencher molde</option>
            </SelectField>
          </div>
        </section>

        <aside className="preview-panel xl:sticky xl:top-44">
          <h2 className="text-base font-black">Preview</h2>
          <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-violet-300/80 bg-gradient-to-br from-white to-violet-50">
            <div className="border border-white shadow-xl" style={previewStyle} />
          </div>
          <div className="mt-3 rounded-xl bg-gradient-to-br from-violet-950 to-purple-800 p-3 text-sm font-black text-white">
            {form.width}x{form.height} · {form.output_format}
          </div>
        </aside>
      </div>
    </form>
  );
}
