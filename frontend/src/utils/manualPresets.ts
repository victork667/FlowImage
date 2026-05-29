export interface ManualPreset {
  id: string;
  name: string;
  values: {
    zoom: number;
    offset_x: number;
    offset_y: number;
    rotation: number;
    brightness: number;
    contrast: number;
    saturation: number;
    sharpness: number;
    temperature: number;
    auto_white_balance: boolean;
    shadow_reduction: number;
    highlight_recovery: number;
    gamma: number;
    clarity: number;
    vibrance: number;
    color_preset_id: number | null;
    studio_auto: boolean;
    enhance_quality: boolean;
  };
}

const KEY = "flowimage.manualPresets";

export function getManualPresets(): ManualPreset[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ManualPreset[];
  } catch {
    return [];
  }
}

export function saveManualPreset(name: string, values: ManualPreset["values"]) {
  const presets = getManualPresets();
  const next: ManualPreset = { id: crypto.randomUUID(), name, values };
  localStorage.setItem(KEY, JSON.stringify([next, ...presets].slice(0, 20)));
  return next;
}
