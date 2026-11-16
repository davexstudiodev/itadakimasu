/* RLS de Neon para el rol de ejecución. El usuario itadakimasu_runtime debe
 * existir como LOGIN NOBYPASSRLS y ser distinto del dueño de las tablas. */

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'itadakimasu_runtime' AND rolcanlogin AND NOT rolbypassrls
  ) THEN
    RAISE EXCEPTION 'itadakimasu_runtime debe existir como LOGIN NOBYPASSRLS';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ita_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $$
  SELECT COALESCE(
    (SELECT p.id FROM public.perfiles p
      WHERE lower(p.email) = lower(NULLIF(current_setting('app.user_email', true), ''))
        AND p.activo
      LIMIT 1),
    NULLIF(current_setting('app.user_id', true), '')
  )
$$;

CREATE OR REPLACE FUNCTION public.ita_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles p
    WHERE p.id = public.ita_user_id()
      AND p.activo
      AND p.rol = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.ita_owns_order(pedido text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido AND p.usuario_id = public.ita_user_id()
  )
$$;

REVOKE ALL ON FUNCTION public.ita_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ita_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ita_owns_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ita_user_id() TO itadakimasu_runtime;
GRANT EXECUTE ON FUNCTION public.ita_is_admin() TO itadakimasu_runtime;
GRANT EXECUTE ON FUNCTION public.ita_owns_order(text) TO itadakimasu_runtime;

GRANT USAGE ON SCHEMA public TO itadakimasu_runtime;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO itadakimasu_runtime;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO itadakimasu_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO itadakimasu_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO itadakimasu_runtime;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'perfiles','categorias','marcas','productos','cupones','cupones_usos',
    'direcciones','pedidos','pedido_items','contadores','resenas',
    'movimientos_inventario','carrito_items','favoritos','configuracion',
    'newsletter','auditoria'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.ita_proteger_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.ita_is_admin() AND (
    OLD.id IS DISTINCT FROM NEW.id OR OLD.email IS DISTINCT FROM NEW.email OR
    OLD.rol IS DISTINCT FROM NEW.rol OR OLD.activo IS DISTINCT FROM NEW.activo OR
    OLD.password_hash IS DISTINCT FROM NEW.password_hash OR
    OLD.reset_token IS DISTINCT FROM NEW.reset_token OR
    OLD.reset_expires IS DISTINCT FROM NEW.reset_expires OR
    OLD.creado_en IS DISTINCT FROM NEW.creado_en
  ) THEN
    RAISE EXCEPTION 'No autorizado para modificar campos protegidos del perfil'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS ita_proteger_perfil ON public.perfiles;
CREATE TRIGGER ita_proteger_perfil BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.ita_proteger_perfil();

DROP POLICY IF EXISTS perfiles_select ON public.perfiles;
DROP POLICY IF EXISTS perfiles_insert ON public.perfiles;
DROP POLICY IF EXISTS perfiles_update ON public.perfiles;
DROP POLICY IF EXISTS perfiles_delete ON public.perfiles;
DROP POLICY IF EXISTS categorias_public_read ON public.categorias;
DROP POLICY IF EXISTS categorias_admin_write ON public.categorias;
DROP POLICY IF EXISTS marcas_public_read ON public.marcas;
DROP POLICY IF EXISTS marcas_admin_write ON public.marcas;
DROP POLICY IF EXISTS productos_public_read ON public.productos;
DROP POLICY IF EXISTS productos_admin_write ON public.productos;
DROP POLICY IF EXISTS productos_operacion_update ON public.productos;
DROP POLICY IF EXISTS cupones_public_read ON public.cupones;
DROP POLICY IF EXISTS cupones_admin_write ON public.cupones;
DROP POLICY IF EXISTS cupones_checkout_update ON public.cupones;
DROP POLICY IF EXISTS cupones_usos_owner ON public.cupones_usos;
DROP POLICY IF EXISTS cupones_usos_read ON public.cupones_usos;
DROP POLICY IF EXISTS cupones_usos_insert ON public.cupones_usos;
DROP POLICY IF EXISTS cupones_usos_admin_change ON public.cupones_usos;
DROP POLICY IF EXISTS cupones_usos_admin_delete ON public.cupones_usos;
DROP POLICY IF EXISTS direcciones_owner ON public.direcciones;
DROP POLICY IF EXISTS pedidos_owner_read ON public.pedidos;
DROP POLICY IF EXISTS pedidos_owner_insert ON public.pedidos;
DROP POLICY IF EXISTS pedidos_admin_change ON public.pedidos;
DROP POLICY IF EXISTS pedidos_admin_delete ON public.pedidos;
DROP POLICY IF EXISTS pedido_items_owner ON public.pedido_items;
DROP POLICY IF EXISTS pedido_items_insert ON public.pedido_items;
DROP POLICY IF EXISTS pedido_items_admin_change ON public.pedido_items;
DROP POLICY IF EXISTS pedido_items_admin_delete ON public.pedido_items;
DROP POLICY IF EXISTS contadores_authenticated ON public.contadores;
DROP POLICY IF EXISTS resenas_public_read ON public.resenas;
DROP POLICY IF EXISTS resenas_owner_write ON public.resenas;
DROP POLICY IF EXISTS resenas_owner_change ON public.resenas;
DROP POLICY IF EXISTS resenas_owner_delete ON public.resenas;
DROP POLICY IF EXISTS movimientos_admin ON public.movimientos_inventario;
DROP POLICY IF EXISTS movimientos_checkout_insert ON public.movimientos_inventario;
DROP POLICY IF EXISTS carrito_owner ON public.carrito_items;
DROP POLICY IF EXISTS favoritos_owner ON public.favoritos;
DROP POLICY IF EXISTS configuracion_public_read ON public.configuracion;
DROP POLICY IF EXISTS configuracion_admin_write ON public.configuracion;
DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter;
DROP POLICY IF EXISTS newsletter_admin_read ON public.newsletter;
DROP POLICY IF EXISTS newsletter_admin_change ON public.newsletter;
DROP POLICY IF EXISTS newsletter_admin_delete ON public.newsletter;
DROP POLICY IF EXISTS auditoria_admin_read ON public.auditoria;
DROP POLICY IF EXISTS auditoria_authenticated_insert ON public.auditoria;
DROP POLICY IF EXISTS auditoria_signup_insert ON public.auditoria;

-- Perfiles: self-service fields are further limited by the trigger below.
CREATE POLICY perfiles_select ON public.perfiles FOR SELECT TO itadakimasu_runtime
  USING (id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY perfiles_insert ON public.perfiles FOR INSERT TO itadakimasu_runtime
  WITH CHECK ((id = public.ita_user_id() AND lower(email) = lower(NULLIF(current_setting('app.user_email', true), ''))) OR public.ita_is_admin());
CREATE POLICY perfiles_update ON public.perfiles FOR UPDATE TO itadakimasu_runtime
  USING (id = public.ita_user_id() OR public.ita_is_admin())
  WITH CHECK (id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY perfiles_delete ON public.perfiles FOR DELETE TO itadakimasu_runtime
  USING (public.ita_is_admin());

-- Public catalog read; only admins can change catalog data.
CREATE POLICY categorias_public_read ON public.categorias FOR SELECT TO itadakimasu_runtime USING (true);
CREATE POLICY categorias_admin_write ON public.categorias FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY marcas_public_read ON public.marcas FOR SELECT TO itadakimasu_runtime USING (true);
CREATE POLICY marcas_admin_write ON public.marcas FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY productos_public_read ON public.productos FOR SELECT TO itadakimasu_runtime
  USING (activo OR public.ita_is_admin());
CREATE POLICY productos_admin_write ON public.productos FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY productos_operacion_update ON public.productos FOR UPDATE TO itadakimasu_runtime
  USING (current_setting('app.operation', true) IN ('checkout', 'review'))
  WITH CHECK (current_setting('app.operation', true) IN ('checkout', 'review'));
CREATE OR REPLACE FUNCTION public.ita_proteger_producto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE operacion text := current_setting('app.operation', true);
BEGIN
  IF public.ita_is_admin() THEN RETURN NEW; END IF;
  IF operacion = 'checkout' AND
    (to_jsonb(OLD) - ARRAY['stock','vendidos','actualizado_en']) IS NOT DISTINCT FROM
    (to_jsonb(NEW) - ARRAY['stock','vendidos','actualizado_en']) AND
    NEW.stock = OLD.stock - (NEW.vendidos - OLD.vendidos) AND
    NEW.vendidos > OLD.vendidos THEN
    RETURN NEW;
  END IF;
  IF operacion = 'review' AND
    (to_jsonb(OLD) - ARRAY['valoracion','num_valoraciones','actualizado_en']) IS NOT DISTINCT FROM
    (to_jsonb(NEW) - ARRAY['valoracion','num_valoraciones','actualizado_en']) AND
    NEW.num_valoraciones >= OLD.num_valoraciones THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'No autorizado para modificar el producto'
    USING ERRCODE = '42501';
END
$$;
DROP TRIGGER IF EXISTS ita_proteger_producto ON public.productos;
CREATE TRIGGER ita_proteger_producto BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.ita_proteger_producto();

CREATE POLICY cupones_public_read ON public.cupones FOR SELECT TO itadakimasu_runtime
  USING (activo OR public.ita_is_admin());
CREATE POLICY cupones_admin_write ON public.cupones FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY cupones_checkout_update ON public.cupones FOR UPDATE TO itadakimasu_runtime
  USING (activo AND current_setting('app.operation', true) = 'checkout')
  WITH CHECK (activo AND current_setting('app.operation', true) = 'checkout');
CREATE OR REPLACE FUNCTION public.ita_proteger_uso_cupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.ita_is_admin() AND (
    current_setting('app.operation', true) <> 'checkout' OR
    (to_jsonb(OLD) - 'usos_actuales') IS DISTINCT FROM (to_jsonb(NEW) - 'usos_actuales') OR
    NEW.usos_actuales <> OLD.usos_actuales + 1
  ) THEN
    RAISE EXCEPTION 'No autorizado para modificar este cupón'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS ita_proteger_uso_cupon ON public.cupones;
CREATE TRIGGER ita_proteger_uso_cupon BEFORE UPDATE ON public.cupones
  FOR EACH ROW EXECUTE FUNCTION public.ita_proteger_uso_cupon();
CREATE POLICY cupones_usos_read ON public.cupones_usos FOR SELECT TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY cupones_usos_insert ON public.cupones_usos FOR INSERT TO itadakimasu_runtime
  WITH CHECK (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY cupones_usos_admin_change ON public.cupones_usos FOR UPDATE TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY cupones_usos_admin_delete ON public.cupones_usos FOR DELETE TO itadakimasu_runtime
  USING (public.ita_is_admin());

CREATE POLICY direcciones_owner ON public.direcciones FOR ALL TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id() OR public.ita_is_admin())
  WITH CHECK (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY pedidos_owner_read ON public.pedidos FOR SELECT TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY pedidos_owner_insert ON public.pedidos FOR INSERT TO itadakimasu_runtime
  WITH CHECK (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY pedidos_admin_change ON public.pedidos FOR UPDATE TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY pedidos_admin_delete ON public.pedidos FOR DELETE TO itadakimasu_runtime
  USING (public.ita_is_admin());

CREATE POLICY pedido_items_owner ON public.pedido_items FOR SELECT TO itadakimasu_runtime
  USING (public.ita_owns_order(pedido_id) OR public.ita_is_admin());
CREATE POLICY pedido_items_insert ON public.pedido_items FOR INSERT TO itadakimasu_runtime
  WITH CHECK (public.ita_owns_order(pedido_id) OR public.ita_is_admin());
CREATE POLICY pedido_items_admin_change ON public.pedido_items FOR UPDATE TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY pedido_items_admin_delete ON public.pedido_items FOR DELETE TO itadakimasu_runtime
  USING (public.ita_is_admin());

CREATE POLICY contadores_authenticated ON public.contadores FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin() OR
    (current_setting('app.operation', true) = 'checkout' AND public.ita_user_id() IS NOT NULL))
  WITH CHECK (public.ita_is_admin() OR
    (current_setting('app.operation', true) = 'checkout' AND public.ita_user_id() IS NOT NULL));
CREATE POLICY resenas_public_read ON public.resenas FOR SELECT TO itadakimasu_runtime USING (true);
CREATE POLICY resenas_owner_write ON public.resenas FOR INSERT TO itadakimasu_runtime
  WITH CHECK (usuario_id = public.ita_user_id());
CREATE POLICY resenas_owner_change ON public.resenas FOR UPDATE TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id() OR public.ita_is_admin())
  WITH CHECK (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY resenas_owner_delete ON public.resenas FOR DELETE TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id() OR public.ita_is_admin());
CREATE POLICY movimientos_admin ON public.movimientos_inventario FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY movimientos_checkout_insert ON public.movimientos_inventario FOR INSERT TO itadakimasu_runtime
  WITH CHECK (current_setting('app.operation', true) = 'checkout' AND tipo = 'venta' AND autor = 'sistema');

CREATE POLICY carrito_owner ON public.carrito_items FOR ALL TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id()) WITH CHECK (usuario_id = public.ita_user_id());
CREATE POLICY favoritos_owner ON public.favoritos FOR ALL TO itadakimasu_runtime
  USING (usuario_id = public.ita_user_id()) WITH CHECK (usuario_id = public.ita_user_id());
CREATE POLICY configuracion_public_read ON public.configuracion FOR SELECT TO itadakimasu_runtime USING (true);
CREATE POLICY configuracion_admin_write ON public.configuracion FOR ALL TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY newsletter_public_insert ON public.newsletter FOR INSERT TO itadakimasu_runtime
  WITH CHECK (position('@' in email) > 1);
CREATE POLICY newsletter_admin_read ON public.newsletter FOR SELECT TO itadakimasu_runtime
  USING (public.ita_is_admin());
CREATE POLICY newsletter_admin_change ON public.newsletter FOR UPDATE TO itadakimasu_runtime
  USING (public.ita_is_admin()) WITH CHECK (public.ita_is_admin());
CREATE POLICY newsletter_admin_delete ON public.newsletter FOR DELETE TO itadakimasu_runtime
  USING (public.ita_is_admin());
CREATE POLICY auditoria_admin_read ON public.auditoria FOR SELECT TO itadakimasu_runtime
  USING (public.ita_is_admin());
CREATE POLICY auditoria_authenticated_insert ON public.auditoria FOR INSERT TO itadakimasu_runtime
  WITH CHECK (public.ita_is_admin() OR (
    public.ita_user_id() IS NOT NULL AND
    (actor = public.ita_user_id() OR
      lower(actor) = lower(NULLIF(current_setting('app.user_email', true), ''))) AND
    accion IN ('registro','login','logout','pedido')
  ));

