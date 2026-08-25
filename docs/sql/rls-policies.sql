-- RLS policy templates for Supabase / Postgres
-- Apply per table. Adjust owner column names as needed.
-- Assumes a security-definer function public.has_role(user_id uuid, role text).

-- profiles: users read all, write own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_all ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_write_own ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- portfolio_items: public read only if is_public, owner full access, admins full
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY portfolio_public_read ON public.portfolio_items FOR SELECT TO anon, authenticated
  USING (is_public OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY portfolio_owner_write ON public.portfolio_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- messages: only conversation participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_participants_only ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  ));
CREATE POLICY messages_send_own ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- notifications: owner only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_owner_rw ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reports: authenticated create; admin read/update
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_create ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY reports_admin_read ON public.reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- sessions: owner only (tokens hashed at rest)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_owner_rw ON public.sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
