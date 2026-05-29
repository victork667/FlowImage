import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { api } from "../../services/api";
import type { ColorPreset, ColorPresetPayload } from "../../types";

const emptyPreset: ColorPresetPayload = {
  name: "",
  brightness: 1,
  contrast: 1,
  saturation: 1,
  sharpness: 1,
  temperature: 0,
  auto_white_balance: true,
  shadow_reduction: 0,
  face_enhancement: 0,
};

export function ColorPresets() {
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [editing, setEditing] = useState<ColorPreset | null>(null);
  const [form, setForm] = useState<ColorPresetPayload>(emptyPreset);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.presets.list().then(setPresets).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (editing) await api.presets.update(editing.id, form);
      else await api.presets.create(form);
      setEditing(null);
      setForm(emptyPreset);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar preset.");
    }
  };

  const edit = (preset: ColorPreset) => {
    setEditing(preset);
    const { id: _id, ...payload } = preset;
    setForm(payload);
  };

  const remove = async (id: number) => {
    await api.presets.remove(id);
    await load();
  };

  const set = (key: keyof ColorPresetPayload, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Presets de cor</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<Plus size={18} />}
            onClick={() => {
              setEditing(null);
              setForm(emptyPreset);
            }}
          >
            Novo
          </Button>
          <Button form="color-preset-form" icon={<Save size={18} />}>{editing ? "Atualizar" : "Salvar"}</Button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form id="color-preset-form" onSubmit={submit} className="control-panel">
          <Field label="Nome" value={form.name} onChange={(event) => set("name", event.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brilho" type="number" step="0.02" min={0.2} max={2.5} value={form.brightness} onChange={(event) => set("brightness", Number(event.target.value))} />
            <Field label="Contraste" type="number" step="0.02" min={0.2} max={2.5} value={form.contrast} onChange={(event) => set("contrast", Number(event.target.value))} />
            <Field label="Saturação" type="number" step="0.02" min={0} max={2.5} value={form.saturation} onChange={(event) => set("saturation", Number(event.target.value))} />
            <Field label="Nitidez" type="number" step="0.02" min={0} max={3} value={form.sharpness} onChange={(event) => set("sharpness", Number(event.target.value))} />
            <Field label="Temperatura" type="number" step="1" min={-100} max={100} value={form.temperature} onChange={(event) => set("temperature", Number(event.target.value))} />
            <Field label="Sombras" type="number" step="0.02" min={0} max={1} value={form.shadow_reduction} onChange={(event) => set("shadow_reduction", Number(event.target.value))} />
            <Field label="Realce rosto" type="number" step="0.02" min={0} max={1} value={form.face_enhancement} onChange={(event) => set("face_enhancement", Number(event.target.value))} />
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-line/80 bg-white/80 px-3 text-sm font-bold text-steel">
              <input type="checkbox" checked={form.auto_white_balance} onChange={(event) => set("auto_white_balance", event.target.checked)} />
              White balance
            </label>
          </div>
        </form>

        <div className="grid content-start gap-3 md:grid-cols-2">
          {presets.map((preset) => (
            <article key={preset.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black">{preset.name}</h2>
                  <p className="mt-1 text-sm font-medium text-steel">
                    B {preset.brightness} · C {preset.contrast} · S {preset.saturation} · N {preset.sharpness}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-200 via-white to-fuchsia-200 shadow-inner" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => edit(preset)}>Editar</Button>
                <Button type="button" variant="danger" icon={<Trash2 size={16} />} onClick={() => remove(preset.id)}>Excluir</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
