CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'client');
CREATE TYPE public.member_status AS ENUM ('invited', 'active', 'suspended');

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  plan text NOT NULL DEFAULT 'trial',
  timezone text NOT NULL DEFAULT 'America/Fortaleza',
  currency text NOT NULL DEFAULT 'BRL',
  onboarding_step integer NOT NULL DEFAULT 0 CHECK (onboarding_step BETWEEN 0 AND 8),
  onboarding_completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  phone text,
  job_title text,
  locale text NOT NULL DEFAULT 'pt-BR',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  client_id uuid,
  status public.member_status NOT NULL DEFAULT 'active',
  department_scope uuid[] NOT NULL DEFAULT '{}'::uuid[],
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by uuid,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  description text,
  manager_user_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (position('@' in email) > 1),
  role public.app_role NOT NULL,
  client_id uuid,
  department_scope uuid[] NOT NULL DEFAULT '{}'::uuid[],
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  invited_by uuid NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email, status)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX workspace_members_user_idx ON public.workspace_members(user_id, status);
CREATE INDEX workspace_members_workspace_idx ON public.workspace_members(workspace_id, status);
CREATE INDEX user_roles_user_workspace_idx ON public.user_roles(user_id, workspace_id);
CREATE INDEX user_roles_workspace_role_idx ON public.user_roles(workspace_id, role);
CREATE INDEX departments_workspace_active_idx ON public.departments(workspace_id, active);
CREATE INDEX invitations_workspace_status_idx ON public.invitations(workspace_id, status, expires_at);
CREATE INDEX audit_logs_workspace_created_idx ON public.audit_logs(workspace_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs(workspace_id, entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_workspace_members_updated_at BEFORE UPDATE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(_workspace_id uuid, _roles public.app_role[], _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.shares_workspace(_other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members mine
    JOIN public.workspace_members theirs ON theirs.workspace_id = mine.workspace_id
    WHERE mine.user_id = auth.uid() AND mine.status = 'active'
      AND theirs.user_id = _other_user_id AND theirs.status = 'active'
  )
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_workspace_role(uuid, public.app_role[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shares_workspace(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, public.app_role[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_workspace(uuid) TO authenticated;

CREATE POLICY workspaces_read ON public.workspaces FOR SELECT TO authenticated USING (public.is_workspace_member(id));
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE TO authenticated USING (public.has_workspace_role(id, ARRAY['owner','admin']::public.app_role[])) WITH CHECK (public.has_workspace_role(id, ARRAY['owner','admin']::public.app_role[]));

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.shares_workspace(id));
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY members_read ON public.workspace_members FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY members_insert_admin ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY members_update_admin ON public.workspace_members FOR UPDATE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[])) WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY members_delete_owner ON public.workspace_members FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]));

CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id));
CREATE POLICY roles_insert_owner ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]) AND role <> 'owner');
CREATE POLICY roles_update_owner ON public.user_roles FOR UPDATE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]) AND role <> 'owner') WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]) AND role <> 'owner');
CREATE POLICY roles_delete_owner ON public.user_roles FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]) AND role <> 'owner');

CREATE POLICY departments_read ON public.departments FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY departments_insert_admin ON public.departments FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY departments_update_admin ON public.departments FOR UPDATE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[])) WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY departments_delete_owner ON public.departments FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]));

CREATE POLICY invitations_read ON public.invitations FOR SELECT TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));
CREATE POLICY invitations_insert_admin ON public.invitations FOR INSERT TO authenticated WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]) AND invited_by = auth.uid() AND role <> 'owner');
CREATE POLICY invitations_update_admin ON public.invitations FOR UPDATE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[])) WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]) AND role <> 'owner');
CREATE POLICY invitations_delete_owner ON public.invitations FOR DELETE TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner']::public.app_role[]));

CREATE POLICY audit_read_privileged ON public.audit_logs FOR SELECT TO authenticated USING (public.has_workspace_role(workspace_id, ARRAY['owner','admin']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.bootstrap_workspace(_workspace_name text, _full_name text)
RETURNS TABLE(workspace_id uuid, onboarding_step integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _workspace_id uuid;
  _slug_base text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF char_length(trim(_workspace_name)) < 2 OR char_length(trim(_workspace_name)) > 120 THEN
    RAISE EXCEPTION 'Workspace name must have between 2 and 120 characters';
  END IF;
  IF char_length(trim(_full_name)) < 2 OR char_length(trim(_full_name)) > 120 THEN
    RAISE EXCEPTION 'Full name must have between 2 and 120 characters';
  END IF;

  SELECT wm.workspace_id INTO _workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = _user_id AND wm.status = 'active'
  ORDER BY wm.created_at
  LIMIT 1;

  IF _workspace_id IS NULL THEN
    _slug_base := trim(both '-' from regexp_replace(lower(unaccent(trim(_workspace_name))), '[^a-z0-9]+', '-', 'g'));
    IF _slug_base = '' THEN _slug_base := 'escritorio'; END IF;

    INSERT INTO public.workspaces(name, slug, created_by)
    VALUES (trim(_workspace_name), _slug_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), _user_id)
    RETURNING id INTO _workspace_id;

    INSERT INTO public.profiles(id, full_name)
    VALUES (_user_id, trim(_full_name))
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.workspace_members(workspace_id, user_id, status, joined_at)
    VALUES (_workspace_id, _user_id, 'active', now());

    INSERT INTO public.user_roles(workspace_id, user_id, role, created_by)
    VALUES (_workspace_id, _user_id, 'owner', _user_id);

    INSERT INTO public.audit_logs(workspace_id, actor_id, action, entity_type, entity_id, new_value)
    VALUES (_workspace_id, _user_id, 'workspace.created', 'workspace', _workspace_id::text, jsonb_build_object('name', trim(_workspace_name)));
  ELSE
    INSERT INTO public.profiles(id, full_name)
    VALUES (_user_id, trim(_full_name))
    ON CONFLICT (id) DO UPDATE SET full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  END IF;

  RETURN QUERY SELECT _workspace_id, w.onboarding_step FROM public.workspaces w WHERE w.id = _workspace_id;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_workspace(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_workspace(text, text) TO authenticated;