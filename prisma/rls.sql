-- Row Level Security policies for Dad AI (Supabase Postgres).
--
-- Apply AFTER running the Prisma migration, e.g. via the Supabase SQL editor
-- or `psql $DATABASE_URL -f prisma/rls.sql`.
--
-- Model: the Supabase JWT carries a custom `tenant_id` claim (set at login).
-- Policies compare each row's "tenantId" against that claim. The API layer
-- additionally scopes every Prisma query via tenantClient() (packages/db) —
-- defense in depth, since the API's direct Postgres connection uses a role
-- that BYPASSES RLS. RLS is the hard floor for anything using Supabase
-- client libraries (PostgREST, Realtime, Storage rules).

create or replace function public.jwt_tenant_id() returns uuid
language sql stable as $$
  select nullif(coalesce(auth.jwt() ->> 'tenant_id', ''), '')::uuid
$$;

-- ---- Tenant table: a user may read only their own tenant row ----
alter table "Tenant" enable row level security;
drop policy if exists tenant_isolation on "Tenant";
create policy tenant_isolation on "Tenant"
  using (id = public.jwt_tenant_id());

-- ---- All tenant-scoped tables ----
do $$
declare
  t text;
begin
  foreach t in array array[
    'User', 'Contact', 'Pipeline', 'Stage', 'Deal', 'Activity', 'Task',
    'Document', 'DocumentChunk', 'Agent', 'Conversation', 'AiUsage',
    'ConnectorInstall', 'Workflow', 'WorkflowRun', 'Subscription'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using ("tenantId" = public.jwt_tenant_id()) with check ("tenantId" = public.jwt_tenant_id())',
      t
    );
  end loop;
end $$;

-- ---- Message: scoped through its Conversation ----
alter table "Message" enable row level security;
drop policy if exists tenant_isolation on "Message";
create policy tenant_isolation on "Message"
  using (
    exists (
      select 1 from "Conversation" c
      where c.id = "Message"."conversationId"
        and c."tenantId" = public.jwt_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from "Conversation" c
      where c.id = "Message"."conversationId"
        and c."tenantId" = public.jwt_tenant_id()
    )
  );
