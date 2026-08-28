-- The brand's app or product link, for the call to action in a caption.
--
-- Stored per brand rather than per post: it is a stable fact about the brand,
-- and a caption that invents or misremembers a URL is worse than one with no
-- link at all. When this is null the generator is told to write the caption
-- without a link rather than making one up.
--
-- The scheme check is a security boundary, not tidiness. This value is written
-- by a user and ends up in published copy, so `javascript:` and `data:` must
-- never survive to a caption.

alter table public.brands
  add column app_url text
  check (app_url is null or app_url ~* '^https?://[^\s]+$');

comment on column public.brands.app_url is
  'Public app or product URL offered in generated captions. Null means captions are written without a link.';
