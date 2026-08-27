-- Private storage buckets. Image binaries live here; PostgreSQL keeps only paths.
-- Object keys are always `<brand_id>/<...>`, so the first path segment is the
-- authorisation subject.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'brand-assets',
    'brand-assets',
    false,
    26214400,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'generated-images',
    'generated-images',
    false,
    26214400,
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do nothing;

-- Resolves the brand id from an object key, returning null when the key does not
-- start with a UUID segment rather than raising.
create or replace function public.storage_object_brand_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when (storage.foldername(p_name))[1] ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(p_name))[1])::uuid
  end;
$$;

revoke execute on function public.storage_object_brand_id(text) from public, anon;
grant execute on function public.storage_object_brand_id(text) to authenticated;

create policy brand_assets_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'brand-assets'
    and public.can_read_brand(public.storage_object_brand_id(name))
  );

create policy brand_assets_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'brand-assets'
    and public.can_write_brand(public.storage_object_brand_id(name))
  );

create policy brand_assets_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'brand-assets'
    and public.can_write_brand(public.storage_object_brand_id(name))
  )
  with check (
    bucket_id = 'brand-assets'
    and public.can_write_brand(public.storage_object_brand_id(name))
  );

create policy brand_assets_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'brand-assets'
    and public.can_administer_brand(public.storage_object_brand_id(name))
  );

-- Generated creative is produced by Edge Functions with the service role.
-- Clients read it for review but never write into this bucket.
create policy generated_images_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'generated-images'
    and public.can_read_brand(public.storage_object_brand_id(name))
  );
