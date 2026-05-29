import { useEffect, useState } from "react";
import { Copy, Edit3, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { api } from "../../services/api";
import type { PhotoTemplate } from "../../types";

export function Templates() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.templates
      .list()
      .then(setTemplates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id: number) => {
    await api.templates.remove(id);
    load();
  };

  const duplicate = async (id: number) => {
    await api.templates.duplicate(id);
    load();
  };

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Moldes de foto</div>
        </div>
        <Link to="/templates/new">
          <Button icon={<Plus size={18} />}>Novo molde</Button>
        </Link>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="glass-panel p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(76,29,149,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black">{template.name}</h2>
                {template.description ? <p className="mt-1 line-clamp-2 min-h-10 text-sm font-medium text-steel">{template.description}</p> : null}
              </div>
              <ShapePreview template={template} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <Info label="Tamanho" value={`${template.width}x${template.height}`} />
              <Info label="Formato" value={template.shape} />
              <Info label="Saída" value={`${template.output_format} · ${template.output_quality}%`} />
              <Info label="Status" value={template.status} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/templates/${template.id}`}>
                <Button variant="secondary" icon={<Edit3 size={16} />}>Editar</Button>
              </Link>
              <Button variant="secondary" icon={<Copy size={16} />} onClick={() => duplicate(template.id)}>Duplicar</Button>
              <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => remove(template.id)}>Excluir</Button>
            </div>
          </article>
        ))}
      </section>

      {!loading && templates.length === 0 ? (
        <div className="glass-panel border-dashed p-8 text-center text-sm font-semibold text-steel">Nenhum molde cadastrado.</div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-100/70 bg-white/80 p-2.5 shadow-sm">
      <div className="text-xs font-black uppercase text-violet-950/65">{label}</div>
      <div className="truncate font-black">{value}</div>
    </div>
  );
}

function ShapePreview({ template }: { template: PhotoTemplate }) {
  const rounded = template.shape === "circular" ? "rounded-full" : template.shape === "oval" ? "rounded-[50%]" : template.shape === "rounded" ? "rounded-lg" : "rounded-sm";
  return (
    <div
      className={`h-16 w-12 shrink-0 border border-white/90 shadow-[0_18px_34px_rgba(76,29,149,0.16)] ${rounded}`}
      style={{ backgroundColor: template.transparent_background ? "transparent" : template.background_color }}
    />
  );
}
