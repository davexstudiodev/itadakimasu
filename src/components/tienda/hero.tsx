"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-crema patron-olas">
      {/* Círculo decorativo */}
      <div
        aria-hidden
        className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-tomate/10 blur-[2px] sm:-right-16 sm:h-[520px] sm:w-[520px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-naranja/15"
      />

      <div className="contenedor relative grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-20">
        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-tomate/25 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-tomate">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Envío gratis
          </span>

          <p className="texto-jp mt-5 text-lg font-bold tracking-wide text-tomate sm:text-xl">
            「アジアの味を楽しもう」
          </p>

          <h1 className="texto-marca mt-2 text-4xl font-black leading-[1.05] text-marron sm:text-5xl lg:text-6xl">
            Descubre los sabores
            <span className="block text-tomate">de Asia</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-marron/70 sm:text-lg lg:mx-0">
            Buldak, ramen, mochis, pocky y bebidas de Japón y Corea del Sur.
            <strong className="font-semibold text-marron"> Tu antojo asiático comienza aquí.</strong>
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/productos" className="btn-primary px-7 py-3.5 text-base">
              Ver catálogo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/productos?ofertas=1" className="btn-outline px-7 py-3.5 text-base">
              Ofertas de la semana
            </Link>
          </div>

          <dl className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm lg:justify-start">
            <div>
              <dt className="text-marron/55">Productos</dt>
              <dd className="font-black text-marron">+28 originales</dd>
            </div>
            <span aria-hidden className="hidden h-8 w-px bg-beige-dark sm:block" />
            <div>
              <dt className="text-marron/55">Clientes felices</dt>
              <dd className="font-black text-marron">+2.500 pedidos</dd>
            </div>
            <span aria-hidden className="hidden h-8 w-px bg-beige-dark sm:block" />
            <div>
              <dt className="text-marron/55">Entrega</dt>
              <dd className="font-black text-marron">Puerto Malabrigo</dd>
            </div>
          </dl>
        </motion.div>

        {/* Logo / collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-lg"
        >
          <div className="relative mx-auto aspect-square w-full">
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-gradient-to-br from-tomate to-naranja shadow-[0_40px_80px_-40px_rgba(217,75,56,0.8)]"
            />
            <Image
              src="/1wbg.png"
              alt="Itadakimasu — gato comiendo ramen"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="relative z-10 object-contain p-4 drop-shadow-[0_20px_40px_rgba(56,40,32,0.25)]"
              priority
            />
          </div>

          {/* Chips flotantes */}
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-6 rounded-2xl border border-beige-dark bg-white px-3.5 py-2 text-xs font-bold text-marron shadow-card sm:left-2"
          >
            🇰🇷 불닭 <span className="text-tomate">· Buldak</span>
          </motion.span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute bottom-10 right-0 rounded-2xl border border-beige-dark bg-white px-3.5 py-2 text-xs font-bold text-marron shadow-card sm:right-2"
          >
            🇯🇵 ラーメン <span className="text-tomate">· Ramen</span>
          </motion.span>
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            className="absolute bottom-2 left-6 rounded-2xl border border-beige-dark bg-white px-3.5 py-2 text-xs font-bold text-marron shadow-card"
          >
            맛있다 <span className="text-tomate">· Delicioso</span>
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
