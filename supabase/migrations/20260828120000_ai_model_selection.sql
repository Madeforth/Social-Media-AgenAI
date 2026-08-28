-- Let an organization choose which Gemini models it runs on.
--
-- Pinned model ids are a liability: `gemini-2.5-pro` and `gemini-2.5-flash`
-- were both retired mid-flight with "no longer available to new users", which
-- broke generation with a 404 until the constants were changed and the
-- functions redeployed. Storing the choice per organization means the owner can
-- move to a working model without a deploy.
--
-- Null means "use the code default", so an organization that never touches this
-- keeps working exactly as before.

alter table public.ai_provider_keys
  add column text_model text check (text_model is null or length(trim(text_model)) > 0),
  add column image_model text check (image_model is null or length(trim(image_model)) > 0);

comment on column public.ai_provider_keys.text_model is
  'Gemini model for strategy and copy generation. Null falls back to GEMINI_TEXT_MODEL in code.';
comment on column public.ai_provider_keys.image_model is
  'Gemini model for image generation. Null falls back to GEMINI_IMAGE_MODEL in code.';

-- The existing select policy already covers the new columns: members read, and
-- there is deliberately no client write policy. A model change goes through the
-- `gemini-models` Edge Function, which verifies the model with a real call
-- before storing it — the same verify-before-store shape as connecting a key.
