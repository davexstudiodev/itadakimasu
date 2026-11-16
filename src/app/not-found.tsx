import Link from "next/link";
import Image from "next/image";
import { Search, House, ShoppingBag, Mail } from "lucide-react";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-crema px-6 py-14 text-center">
      <Image src="/logo.png" alt="ITADAKIMASU" width={76} height={76} className="rounded-2xl" priority />

      <p className="texto-jp mt-6 text-sm text-tomate">ページが見つかりません</p>
      <h1 className="mt-1 font-display text-6xl font-black tracking-tight text-marron sm:text-7xl">404</h1>
      <p className="mt-2 font-display text-xl font-bold text-marron">Este plato no existe en el menú</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-marron/65">
        La página que buscas fue movida, eliminada o nunca estuvo en la carta. Prueba con una búsqueda o vuelve al
        inicio.
      </p>

      <form method="get" action="/productos" className="mt-7 flex w-full max-w-sm gap-2">
        <input
          name="q"
          placeholder="Busca ramen, snacks, bebidas…"
          aria-label="Buscar productos"
          className="campo flex-1"
        />
        <button type="submit" className="btn-primary px-5 py-2.5">
          <Search className="h-4 w-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Buscar</span>
        </button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-outline px-5 py-2.5">
          <House className="h-4 w-4" aria-hidden /> Inicio
        </Link>
        <Link href="/productos" className="btn-outline px-5 py-2.5">
          <ShoppingBag className="h-4 w-4" aria-hidden /> Productos
        </Link>
        <Link href="/contacto" className="btn-ghost px-5 py-2.5">
          <Mail className="h-4 w-4" aria-hidden /> Ayuda
        </Link>
      </div>
    </div>
  );
}
