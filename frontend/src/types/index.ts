export type Shape = "rectangular" | "square" | "circular" | "oval" | "rounded";
export type OutputFormat = "PNG" | "JPG" | "JPEG";

export interface ColorPreset {
  id: number;
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  temperature: number;
  auto_white_balance: boolean;
  shadow_reduction: number;
  face_enhancement: number;
}

export type ColorPresetPayload = Omit<ColorPreset, "id">;

export interface PhotoTemplate {
  id: number;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  shape: Shape;
  background_color: string;
  transparent_background: boolean;
  border_radius: number;
  output_format: OutputFormat;
  output_quality: number;
  color_preset_id?: number | null;
  face_expand_x: number;
  face_expand_y: number;
  face_offset_y: number;
  zoom_default: number;
  offset_x_default: number;
  offset_y_default: number;
  head_top_margin: number;
  shoulder_visibility: number;
  crop_mode: string;
  status: "active" | "inactive";
}

export interface DetectionInfo {
  face_detected: boolean;
  face_count: number;
  confidence?: number | null;
  bounding_box?: { x: number; y: number; width: number; height: number } | null;
  center?: { x: number; y: number } | null;
  face_width?: number | null;
  face_height?: number | null;
  detector: string;
}

export interface ProcessResult {
  status: string;
  filename?: string | null;
  download_url?: string | null;
  processed_photo_path?: string | null;
  debug_face_url?: string | null;
  debug_crop_url?: string | null;
  detection: DetectionInfo;
  error_message?: string | null;
}

export interface QualityInfo {
  score: number;
  status: "ok" | "review" | "problem";
  width: number;
  height: number;
  brightness: number;
  blur_score: number;
  face_ratio?: number | null;
  face_mesh_detected: boolean;
  needs_review: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface AnalyzeResult {
  detection: DetectionInfo;
  quality: QualityInfo;
}

export interface PhotoJob {
  id: number;
  template_id: number;
  type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
}

export interface PhotoJobItem {
  id: number;
  job_id: number;
  original_filename: string;
  original_photo_path: string;
  processed_photo_path?: string | null;
  debug_face_path?: string | null;
  debug_crop_path?: string | null;
  face_detected: boolean;
  face_count: number;
  confidence?: number | null;
  manual_adjusted: boolean;
  status: string;
  error_message?: string | null;
  original_url?: string | null;
  download_url?: string | null;
}
