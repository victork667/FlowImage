import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Layers3, Loader2 } from "lucide-react";

import { api } from "../../services/api";
import type { PhotoTemplate } from "../../types";
import { fileUrl } from "../../services/api";
import { getProcessHistory, type ProcessHistoryItem } from "../../utils/history";

export function Dashboard() {
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ProcessHistoryItem[]>([]);

  useEffect(() => {
    api.templates
      .list()
      .then(setTemplates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setHistory(getProcessHistory());
  }, []);

  const activeCount = useMemo(() => templates.filter((item) => item.status === "active").length, [templates]);

  return (
    <div className="grid gap-6">
      <div className="page-toolbar">
        <div>
          <div className="toolbar-title">Dashboard</div>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Layers3 size={20} />} label="Moldes" value={loading ? "..." : String(templates.length)} />
        <Metric icon={<CheckCircle2 size={20} />} label="Ativos" value={loading ? "..." : String(activeCount)} />
        <Metric icon={<Loader2 size={20} />} label="Jobs" value="MVP" />
        <Metric icon={<AlertTriangle size={20} />} label="Revisões" value="Manual" />
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-violet-100/70 px-5 py-4">
          <h2 className="text-base font-black">Moldes recentes</h2>
        </div>
        <div className="divide-y divide-line/70">
          {templates.slice(0, 6).map((template) => (
            <div key={template.id} className="grid gap-2 px-5 py-3.5 transition hover:bg-violet-50/50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="min-w-0">
                <div className="truncate font-bold">{template.name}</div>
                <div className="text-sm font-medium text-steel">
                  {template.width}x{template.height} · {template.shape}
                </div>
              </div>
              <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-black text-steel shadow-sm">{template.output_format}</span>
              <span className={`rounded-lg px-2 py-1 text-xs font-black ${template.status === "active" ? "bg-emerald-50 text-action" : "bg-zinc-100 text-zinc-600"}`}>
                {template.status}
              </span>
            </div>
          ))}
          {!loading && templates.length === 0 ? <div className="px-4 py-8 text-center text-sm font-semibold text-steel">Nenhum molde cadastrado.</div> : null}
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-violet-100/70 px-5 py-4">
          <h2 className="text-base font-black">Últimos processamentos</h2>
        </div>
        <div className="divide-y divide-line/70">
          {history.slice(0, 8).map((item) => (
            <div key={item.id} className="grid gap-2 px-5 py-3.5 transition hover:bg-violet-50/50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="min-w-0">
                <div className="truncate font-bold">{item.filename}</div>
                <div className="text-sm font-medium text-steel">{item.templateName ?? item.source}</div>
              </div>
              <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-black text-steel shadow-sm">
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </span>
              {item.downloadUrl ? (
                <a className="font-bold text-action" href={fileUrl(item.downloadUrl) ?? "#"} download>baixar</a>
              ) : null}
            </div>
          ))}
          {history.length === 0 ? <div className="px-4 py-8 text-center text-sm font-semibold text-steel">Nenhum processamento recente.</div> : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between text-steel">
        <span className="text-xs font-black uppercase text-violet-950/70">{label}</span>
        <span className="rounded-2xl bg-gradient-to-br from-violet-950 via-purple-700 to-fuchsia-500 p-2.5 text-white shadow-[0_14px_28px_rgba(124,58,237,0.24)]">{icon}</span>
      </div>
      <div className="mt-4 bg-gradient-to-r from-violet-950 to-fuchsia-700 bg-clip-text text-4xl font-black text-transparent">{value}</div>
    </div>
  );
}
