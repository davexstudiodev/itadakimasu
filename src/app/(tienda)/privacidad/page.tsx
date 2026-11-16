import type { Metadata } from "next";
import { DocPage, DocSeccion, DocLista } from "@/components/tienda/doc-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Política de privacidad — ITADAKIMASU",
  description: "Cómo recopilamos, usamos y protegemos tus datos personales (Ley 29733).",
};

export default function PaginaPrivacidad() {
  return (
    <DocPage
      titulo="Política de privacidad"
      subtitulo="Tus datos, con el mismo cuidado que tus antojos."
      textoJp="プライバシーポリシー"
      actualizado="noviembre 2026"
    >
      <DocSeccion titulo="1. Responsable del tratamiento">
        <p>
          <strong>ITADAKIMASU</strong>, con dirección en {siteConfig.direccion} y correo{" "}
          {siteConfig.email}, es responsable del tratamiento de los datos personales que nos entregas al navegar,
          crear una cuenta o comprar.
        </p>
      </DocSeccion>

      <DocSeccion titulo="2. Datos que recopilamos">
        <DocLista
          items={[
            <><strong>Datos de identificación y contacto:</strong> nombre, apellidos, correo electrónico y teléfono.</>,
            <><strong>Datos de entrega:</strong> departamento, provincia, distrito, dirección, referencia e indicaciones para el repartidor.</>,
            <><strong>Datos de compra:</strong> historial de pedidos, montos, método de pago y estado de entrega.</>,
            <><strong>Datos técnicos:</strong> información básica de navegación y la cookie de sesión («ita_session») necesaria para mantenerte autenticado.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="3. Para qué usamos tus datos">
        <DocLista
          items={[
            "Procesar tus pedidos, cobrar (cu corresponda) y entregarte los productos.",
            "Emitir boletas de venta y cumplir obligaciones tributarias.",
            "Darte seguimiento por WhatsApp o correo sobre el estado de tu pedido.",
            "Atender consultas, cambios y devoluciones.",
            "Mejorar el catálogo y las promociones, siempre de forma agregada.",
            "Prevención de fraude y seguridad de la cuenta.",
          ]}
        />
        <p>
          La base de tu tratamiento es tu <strong>consentimiento</strong> (al crear cuenta o comprar) y la{" "}
          <strong>ejecución del contrato</strong> de compraventa.
        </p>
      </DocSeccion>

      <DocSeccion titulo="4. Con quién compartimos tus datos">
        <DocLista
          items={[
            <><strong>Proveedores tecnológicos:</strong> almacenamiento de base de datos (Supabase) y envío de correos (Resend), que actúan como encargados bajo contrato.</>,
            <><strong>Transportistas:</strong> solo los datos necesarios para entregar tu pedido.</>,
            <><strong>Medios de pago:</strong> según el método elegido, para verificar transferencias.</>,
            <>Nunca vendemos tus datos personales a terceros.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="5. Conservación y seguridad">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa y, después, el tiempo que exija la normativa tributaria
          y de consumo. Aplicamos medidas de seguridad: contraseñas cifradas (scrypt), cookies firmadas httpOnly,
          validación en el servidor y buenas prácticas de desarrollo seguro.
        </p>
      </DocSeccion>

      <DocSeccion titulo="6. Tus derechos (ARCO)">
        <p>
          De acuerdo con la Ley N° 29733 y su Reglamento, puedes ejercer en cualquier momento tus derechos de{" "}
          <strong>Acceso</strong>, <strong>Rectificación</strong>, <strong>Cancelación</strong> y{" "}
          <strong>Oposición</strong> escribiendo a {siteConfig.email} con el asunto «Derechos ARCO» y tu correo
          registrado. Respondemos en un plazo máximo de 10 días hábiles.
        </p>
      </DocSeccion>

      <DocSeccion titulo="7. Cookies">
        <DocLista
          items={[
            <>Utilizamos una <strong>cookie de sesión</strong> imprescindible para mantenerte autenticado (httpOnly, firmada, expira en 30 días).</>,
            <>Usamos almacenamiento local del navegador para conservar tu carrito mientras navegas.</>,
            <>No usamos cookies publicitarias ni de terceros para rastrearte.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="8. Menores de edad">
        <p>
          Nuestros productos se venden a mayores de 18 años. Si detectamos que un menor ha creado una cuenta sin
          autorización de sus tutores, eliminaremos sus datos al solicitarlo.
        </p>
      </DocSeccion>

      <DocSeccion titulo="9. Cambios en esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios legales o del servicio. Publicaremos siempre la fecha
          de última actualización en esta página.
        </p>
      </DocSeccion>
    </DocPage>
  );
}
