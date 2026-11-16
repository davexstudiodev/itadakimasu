"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  Heart,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buscarSugerencias } from "@/server/actions/productos";
import { cerrarSesion } from "@/server/actions/auth";
import { unidadesDe, useCarrito } from "@/store/carrito";
import type { Producto } from "@/types";
import { formatPEN } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface Props {
  usuario: { nombre: string; rol: "customer" | "admin" } | null;
  categorias: { slug: string; nombre: string }[];
  mensaje: string;
}

export function Navbar({ usuario, categorias, mensaje }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [sugerencias, setSugerencias] = useState<Producto[]>([]);
  const [focus, setFocus] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cargandoSalida, setCargandoSalida] = useState(false);
  const items = useCarrito((s) => s.items);
  const unidades = unidadesDe(items);
  const router = useRouter();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const buscar = (texto: string) => {
    setQuery(texto);
    if (temporizador.current) clearTimeout(temporizador.current);
    if (texto.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    temporizador.current = setTimeout(async () => {
      try {
        setSugerencias(await buscarSugerencias(texto));
      } catch {
        setSugerencias([]);
      }
    }, 220);
  };

  const enviarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = query.trim();
    if (!texto) return;
    setFocus(false);
    setAbierto(false);
    router.push(`/productos?q=${encodeURIComponent(texto)}`);
  };

  const salir = async () => {
    setCargandoSalida(true);
    try {
      await cerrarSesion();
    } finally {
      setCargandoSalida(false);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Cinta superior */}
      <div className="bg-marron text-crema">
        <div className="contenedor flex h-8 items-center justify-between gap-4 text-[11px] font-medium tracking-wide sm:text-xs">
          <p className="truncate">{mensaje}</p>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <span className="text-crema/70">Delivery en Puerto Malabrigo</span>
            <span aria-hidden className="text-crema/40">
              |
            </span>
            <span className="texto-jp text-crema/90">味を楽しもう</span>
          </div>
        </div>
      </div>

      {/* Barra principal */}
      <div
        className={cn(
          "border-b border-beige-dark/70 bg-crema/90 backdrop-blur-md transition-shadow",
          scrolled && "shadow-[0_10px_30px_-24px_rgba(56,40,32,0.7)]"
        )}
      >
        <div className="contenedor flex h-16 items-center gap-3 sm:h-20 sm:gap-6">
          {/* Menú móvil */}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-marron hover:bg-beige lg:hidden"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ITADAKIMASU — Inicio">
            <span className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-tomate/20 bg-white sm:h-12 sm:w-12">
              <Image src="/logo.png" alt="" fill sizes="48px" className="object-cover" priority />
            </span>
            <span className="flex flex-col leading-none">
              <span className="texto-marca text-lg font-black tracking-tight text-marron sm:text-xl">
                Itadakimasu
              </span>
              <span className="text-[10px] font-medium tracking-[0.2em] text-tomate sm:text-[11px]">
                いただきます
              </span>
            </span>
          </Link>

          {/* Buscador (desktop) */}
          <form onSubmit={enviarBusqueda} className="relative hidden flex-1 md:block" role="search">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/40"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => buscar(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              placeholder="Busca buldak, ramen, pocky, ramune…"
              className="campo h-11 rounded-full pl-11 pr-4"
              aria-label="Buscar productos"
              autoComplete="off"
            />
            <AnimatePresence>
              {focus && sugerencias.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-x-0 top-12 overflow-hidden rounded-2xl border border-beige-dark bg-white shadow-[0_24px_50px_-24px_rgba(56,40,32,0.5)]"
                >
                  {sugerencias.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/producto/${p.slug}`}
                        onClick={() => setFocus(false)}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-crema"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imagenes[0] ?? "/logo.png"}
                          alt=""
                          className="h-9 w-9 rounded-lg border border-beige-dark object-cover"
                        />
                        <span className="flex-1 truncate text-sm font-medium text-marron">{p.nombre}</span>
                        <span className="text-sm font-semibold text-tomate">{formatPEN(p.precio)}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setFocus(false);
                        router.push(`/productos?q=${encodeURIComponent(query)}`);
                      }}
                      className="w-full border-t border-beige-dark bg-crema px-4 py-2.5 text-left text-xs font-semibold text-tomate hover:bg-beige"
                    >
                      Ver todos los resultados para “{query}”
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </form>

          {/* Acciones */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-marron transition-colors hover:bg-beige md:hidden"
              onClick={() => setAbierto(true)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cuenta */}
            <div className="group relative hidden sm:block">
              <Link
                href={usuario ? (usuario.rol === "admin" ? "/admin" : "/cuenta") : "/auth/login"}
                className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-marron transition-colors hover:bg-beige"
              >
                <User className="h-4.5 w-4.5" aria-hidden />
                <span className="hidden lg:inline">{usuario ? usuario.nombre : "Ingresar"}</span>
                {usuario && <ChevronDown className="hidden h-3.5 w-3.5 text-marron/50 lg:block" />}
              </Link>
              {usuario && (
                <div className="invisible absolute right-0 top-11 w-52 translate-y-1 rounded-2xl border border-beige-dark bg-white p-1.5 opacity-0 shadow-[0_24px_50px_-24px_rgba(56,40,32,0.5)] transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <Link href="/cuenta" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-crema">
                    <User className="h-4 w-4" /> Mi cuenta
                  </Link>
                  <Link href="/cuenta/pedidos" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-crema">
                    <Package className="h-4 w-4" /> Mis pedidos
                  </Link>
                  <Link href="/cuenta/favoritos" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-crema">
                    <Heart className="h-4 w-4" /> Favoritos
                  </Link>
                  {usuario.rol === "admin" && (
                    <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-tomate hover:bg-crema">
                      <LayoutDashboard className="h-4 w-4" /> Panel admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={salir}
                    disabled={cargandoSalida}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-crema"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Carrito */}
            <Link
              href="/carrito"
              className="relative grid h-10 w-10 place-items-center rounded-full text-marron transition-colors hover:bg-beige sm:h-11 sm:w-11"
              aria-label={`Carrito con ${unidades} productos`}
            >
              <ShoppingBag className="h-5 w-5" />
              {unidades > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-tomate px-1 text-[10px] font-bold text-crema ring-2 ring-crema">
                  {unidades > 99 ? "99+" : unidades}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Navegación de categorías */}
        <nav className="contenedor hidden items-center gap-1 overflow-x-auto pb-2 lg:flex" aria-label="Categorías">
          {categorias.map((c) => (
            <Link
              key={c.slug}
              href={`/productos?categoria=${c.slug}`}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-marron/80 transition-colors hover:bg-beige hover:text-marron"
            >
              {c.nombre}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-4 w-px bg-beige-dark" />
          <Link
            href="/productos?ofertas=1"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-tomate transition-colors hover:bg-tomate/10"
          >
            Ofertas
          </Link>
          <Link
            href="/productos?nuevos=1"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-marron/80 transition-colors hover:bg-beige hover:text-marron"
          >
            Novedades
          </Link>
          <Link
            href="/productos?pais=corea"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-marron/80 transition-colors hover:bg-beige hover:text-marron"
          >
            Corea 🇰🇷
          </Link>
          <Link
            href="/productos?pais=japon"
            className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-marron/80 transition-colors hover:bg-beige hover:text-marron"
          >
            Japón 🇯🇵
          </Link>
        </nav>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-marron/50"
              onClick={() => setAbierto(false)}
              aria-hidden
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-crema shadow-2xl"
              role="dialog"
              aria-label="Menú principal"
            >
              <div className="flex items-center justify-between border-b border-beige-dark px-5 py-4">
                <span className="texto-marca text-lg font-black text-marron">Itadakimasu</span>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-beige"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-5 py-4">
                <form onSubmit={enviarBusqueda} role="search" className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/40" />
                  <input
                    value={query}
                    onChange={(e) => buscar(e.target.value)}
                    placeholder="Buscar productos…"
                    className="campo rounded-full pl-11"
                    aria-label="Buscar productos"
                  />
                </form>
                {sugerencias.length > 0 && (
                  <ul className="mt-2 max-h-48 overflow-y-auto overflow-x-hidden rounded-2xl border border-beige-dark bg-white">
                    {sugerencias.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/producto/${p.slug}`}
                          onClick={() => setAbierto(false)}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-crema"
                        >
                          <span className="truncate font-medium">{p.nombre}</span>
                          <span className="shrink-0 font-semibold text-tomate">{formatPEN(p.precio)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <nav className="flex-1 overflow-y-auto px-3 pb-4 sm:pb-6" aria-label="Menú móvil">
                <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-marron/50">
                  Categorías
                </p>
                {categorias.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/productos?categoria=${c.slug}`}
                    onClick={() => setAbierto(false)}
                    className="block rounded-xl px-3 py-2.5 font-medium text-marron hover:bg-beige"
                  >
                    {c.nombre}
                  </Link>
                ))}
                <span className="my-2 block h-px bg-beige-dark" />
                <Link href="/productos?ofertas=1" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-semibold text-tomate hover:bg-beige">
                  Ofertas
                </Link>
                <Link href="/productos?nuevos=1" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  Novedades
                </Link>
                <Link href="/productos?pais=corea" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  Corea del Sur
                </Link>
                <Link href="/productos?pais=japon" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  Japón
                </Link>
                <span className="my-2 block h-px bg-beige-dark" />
                <Link href={usuario ? "/cuenta" : "/auth/login"} onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  {usuario ? "Mi cuenta" : "Iniciar sesión / Registrarme"}
                </Link>
                <Link href="/cuenta/pedidos" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  Mis pedidos
                </Link>
                <Link href="/cuenta/favoritos" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-beige">
                  Favoritos
                </Link>
                {usuario?.rol === "admin" && (
                  <Link href="/admin" onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-2.5 font-semibold text-tomate hover:bg-beige">
                    Panel administrativo
                  </Link>
                )}
                {usuario && (
                  <button
                    type="button"
                    onClick={salir}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-medium hover:bg-beige"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                )}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
