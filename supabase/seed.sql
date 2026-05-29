insert into public.color_presets (
  name,
  brightness,
  contrast,
  saturation,
  sharpness,
  temperature,
  auto_white_balance,
  shadow_reduction,
  face_enhancement
) values
  ('Natural', 1.02, 1.04, 1.02, 1.05, 0, true, 0.15, 0.15),
  ('Documento', 1.08, 1.12, 0.96, 1.18, -3, true, 0.22, 0.10),
  ('Cracha Claro', 1.12, 1.08, 1.04, 1.10, 2, true, 0.28, 0.18),
  ('Cracha Forte', 1.06, 1.20, 1.10, 1.22, 0, true, 0.18, 0.22),
  ('Pele Natural', 1.04, 1.03, 1.08, 1.04, 5, true, 0.20, 0.25)
on conflict (name) do nothing;

insert into public.photo_templates (
  name,
  description,
  width,
  height,
  shape,
  background_color,
  transparent_background,
  output_format,
  color_preset_id
)
select *
from (
  values
    (
      'Foto 3x4 vertical',
      'Foto vertical com cabeca e ombros para cracha.',
      600,
      800,
      'rectangular',
      '#ffffff',
      false,
      'PNG',
      (select id from public.color_presets where name = 'Documento')
    ),
    (
      'Foto quadrada',
      'Foto quadrada pronta para sistemas que recortam avatar.',
      1000,
      1000,
      'square',
      '#ffffff',
      false,
      'PNG',
      (select id from public.color_presets where name = 'Natural')
    ),
    (
      'Foto redonda transparente',
      'PNG circular com fundo transparente.',
      500,
      500,
      'circular',
      'transparent',
      true,
      'PNG',
      (select id from public.color_presets where name = 'Natural')
    )
) as seed_templates (
  name,
  description,
  width,
  height,
  shape,
  background_color,
  transparent_background,
  output_format,
  color_preset_id
)
where not exists (select 1 from public.photo_templates);
