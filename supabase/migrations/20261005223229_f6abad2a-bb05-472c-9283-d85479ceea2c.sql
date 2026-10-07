revoke execute on function public.audit_trigger() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
revoke execute on function public.can_edit(uuid) from public, anon;
revoke execute on function public.claim_first_admin() from public, anon;