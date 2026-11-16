import type { Metadata } from "next";
import { DocPage, DocSeccion, DocLista } from "@/components/tienda/doc-page";

export const metadata: Metadata = {
  title: "Términos y condiciones — ITADAKIMASU",
  description: "Condiciones de uso y compra en ITADAKIMASU (e-commerce de alimentos importados).",
};

export default function PaginaTerminos() {
  return (
    <DocPage
      titulo="Términos y condiciones"
      subtitulo="Condiciones aplicables a las compras en itadakimasu.pe."
      textoJp="利用規約"
      actualizado="noviembre 2026"
    >
      <DocSeccion titulo="1. Objeto">
        <p>
          Las presentes condiciones regulan el uso del sitio web ITADAKIMASU (en adelante, «la tienda») y las compras
          de productos alimenticios importados de Japón y Corea realizadas por sus clientes. Al crear una cuenta o
          realizar un pedido, el usuario declara haber leído y aceptado estas condiciones.
        </p>
      </DocSeccion>

      <DocSeccion titulo="2. Cuenta de usuario">
        <DocLista
          items={[
            <>El usuario debe proporcionar datos verídicos (nombre, correo, teléfono y dirección de entrega).</>,
            <>La contraseña es de uso personal: el usuario es responsable de su custodia.</>,
            <>Podemos suspender cuentas con información falsa, actividades fraudulentas o reiteradas violaciones de estas condiciones.</>,
            <>Cada persona puede tener una única cuenta para fines de promoción y control de pedidos.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="3. Precios y moneda">
        <p>
          Todos los precios se expresan en <strong>soles peruanos (PEN)</strong> e <strong>incluyen el IGV</strong>. El
          precio aplicable es el mostrado en la ficha del producto al momento de confirmar el pedido. Las ofertas son
          válidas mientras dure el stock promocional y pueden finalizarse sin previo aviso.
        </p>
        <p>El total del pedido, incluyendo descuentos de cupón y costos de envío, se calcula en nuestros servidores antes de la confirmación.</p>
      </DocSeccion>

      <DocSeccion titulo="4. Pedidos">
        <p>
          Un pedido queda formalizado cuando el usuario lo confirma en el checkout y recibe el número de pedido. Nos
          reservamos el derecho de reembolsar y cancelar pedidos cuando:
        </p>
        <DocLista
          items={[
            "El producto esté agotado o con error de inventario.",
            "Se detecte un precio evidentemente incorrecto por error técnico.",
            "No se confirme el pago en un plazo de 48 horas en métodos manuales.",
            "La dirección de entrega no esté cubierta por el método seleccionado.",
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="5. Medios de pago">
        <DocLista
          items={[
            <><strong>Yape:</strong> es nuestro único medio de pago. El pedido queda en estado «pago por verificar» hasta que el cliente envía el comprobante y nuestro equipo lo confirma. Nunca procesamos pagos de forma automática ni solicitamos datos de tarjetas.</>,
            <>El pago debe completarse en su totalidad antes del despacho.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="6. Envíos y entrega">
        <p>
          Los plazos y costos están detallados en la página de{" "}
          <a href="/envios-y-devoluciones" className="font-semibold text-tomate underline">
            envíos y devoluciones
          </a>{" "}
          y se confirman en el checkout según la dirección ingresada. El cliente debe verificar que los datos de
          entrega sean correctos; los reintentos de entrega por datos erróneos generarán costos adicionales.
        </p>
      </DocSeccion>

      <DocSeccion titulo="7. Cambios, devoluciones y reembolsos">
        <p>
          Aplicamos la política de cambios y devoluciones publicada en el sitio, conforme al Código de Protección y
          Defensa del Consumidor (Ley N° 28414) y normativa de Indecopi. Por razones de higiene, no se aceptan
          devoluciones de productos alimenticios abiertos sin defecto comprobable.
        </p>
      </DocSeccion>

      <DocSeccion titulo="8. Propiedad intelectual">
        <p>
          Todo el contenido del sitio (marca, logotipo, textos, fotografías, ilustraciones y diseño) pertenece a
          ITADAKIMASU o a sus licenciantes. Está prohibida su reproducción sin autorización escrita. Los nombres y
          marcas de productos pertenecen a sus respectivos titulares.
        </p>
      </DocSeccion>

      <DocSeccion titulo="9. Limitación de responsabilidad">
        <p>
          Los productos son alimentos importados con sus empaques originales; las imágenes son referenciales. El
          usuario debe revisar la información de alérgenos y caducidad antes del consumo. Nuestra responsabilidad se
          limita al valor del pedido afectado, en la medida permitida por la ley.
        </p>
      </DocSeccion>

      <DocSeccion titulo="10. Protección de datos">
        <p>
          El tratamiento de datos personales se rige por nuestra{" "}
          <a href="/privacidad" className="font-semibold text-tomate underline">
            política de privacidad
          </a>{" "}
          y la Ley N° 29733 de Protección de Datos Personales.
        </p>
      </DocSeccion>

      <DocSeccion titulo="11. Ley aplicable y jurisdicción">
        <p>
          Estas condiciones se rigen por la legislación peruana. Cualquier controversia se someterá a los juzgados y
          tribunales de La Libertad, sin perjuicio de los derechos que la ley otorga al consumidor ante INDECOPI.
        </p>
      </DocSeccion>

      <DocSeccion titulo="12. Cambios de estas condiciones">
        <p>
          Podemos actualizar estas condiciones en cualquier momento; la versión vigente será siempre la publicada en
          esta página con su fecha de actualización. La continuidad del uso del sitio implica la aceptación de los
          cambios.
        </p>
      </DocSeccion>
    </DocPage>
  );
}
