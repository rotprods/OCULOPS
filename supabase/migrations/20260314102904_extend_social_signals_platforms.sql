-- Extend social_signals platform check to support more platforms
ALTER TABLE public.social_signals DROP CONSTRAINT social_signals_platform_check;

ALTER TABLE public.social_signals ADD CONSTRAINT social_signals_platform_check 
CHECK (platform = ANY (ARRAY[
  'reddit'::text, 'hackernews'::text, 'demo'::text,
  'twitter'::text, 'x'::text, 'linkedin'::text, 'youtube'::text,
  'instagram'::text, 'telegram'::text, 'discord'::text,
  'news'::text, 'rss'::text, 'custom'::text
]));;
