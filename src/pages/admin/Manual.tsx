import type { ReactNode } from 'react'
import { Screen } from '../../components/common.tsx'

function Topic({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="manual-topic">
      <summary>{title}</summary>
      <div className="legal">{children}</div>
    </details>
  )
}

export function Manual() {
  return (
    <Screen title="Manual de uso" back>
      <p className="muted">Toca cada tema para ver los pasos.</p>

      <Topic title="Instalar la app en tu celular">
        <ol>
          <li>Abre la dirección de la app en Chrome (Android) o Safari (iPhone).</li>
          <li>En Android toca el menú y elige <b>Agregar a pantalla principal</b>. En iPhone toca el botón de compartir y elige <b>Agregar a inicio</b>.</li>
          <li>Desde ahora ábrela con el ícono verde, como cualquier otra app.</li>
        </ol>
      </Topic>

      <Topic title="Qué ves en Inicio">
        <ul>
          <li><b>Te deben en total</b>: la suma de lo que deben todos tus clientes, con comisiones incluidas.</li>
          <li><b>Atrasado</b>: lo que ya debió pagarse y no se ha pagado.</li>
          <li>Los recuadros de color cuentan cuántos clientes están al corriente, atrasados o con solicitudes por revisar.</li>
          <li><b>Requieren atención</b> lista a quién conviene llamar primero.</li>
        </ul>
      </Topic>

      <Topic title="Registrar un cliente nuevo">
        <ol>
          <li>En Inicio toca <b>Nuevo cliente</b>.</li>
          <li>Escribe su nombre completo, su teléfono a 10 dígitos y su dirección.</li>
          <li>Inventa un PIN de 4 a 6 números y compártelo con tu cliente. Con su teléfono y ese PIN puede entrar a ver su saldo, y después puede cambiar el PIN.</li>
          <li>Toca <b>Registrar cliente</b>.</li>
        </ol>
        <p>Tus clientes también pueden registrarse solos desde la app con <b>Crea tu cuenta</b>.</p>
      </Topic>

      <Topic title="Dar un préstamo y firmar el pagaré">
        <ol>
          <li>Entra a <b>Clientes</b>, elige al cliente y toca <b>Nuevo préstamo</b>.</li>
          <li>Escribe la cantidad, el interés total en porcentaje (0 si no cobras interés), las semanas y la comisión por cada semana de atraso.</li>
          <li>Revisa el total a pagar, el pago semanal y tu ganancia en los recuadros de abajo.</li>
          <li>Toca <b>Crear y firmar pagaré</b>.</li>
          <li>Entrega tu celular al cliente para que lea el pagaré, firme con el dedo, marque la casilla y toque <b>Firmar pagaré</b>.</li>
          <li>Entrega el dinero. El préstamo queda activo y el primer pago vence en una semana.</li>
        </ol>
        <p>Si no puede firmar en ese momento, puede hacerlo después desde su propia app. Para mayor seguridad, imprime el pagaré con <b>Imprimir o guardar PDF</b> y que también lo firme en papel.</p>
      </Topic>

      <Topic title="Aprobar o rechazar una solicitud">
        <ol>
          <li>Cuando un cliente pide un préstamo desde su app, aparece un número rojo en <b>Solicitudes</b>.</li>
          <li>Toca la solicitud para ver cuánto pidió y en cuántas semanas.</li>
          <li>Para aceptarla toca <b>Aprobar</b>, ajusta las condiciones y toca <b>Aprobar y firmar pagaré</b>. Sigue los mismos pasos de firma.</li>
          <li>Si no la aceptas toca <b>Rechazar</b>. Tu cliente la verá como "No aprobado".</li>
        </ol>
        <p>Antes de aprobar, revisa su credencial en el detalle del cliente con <b>Ver fotos de la credencial</b>.</p>
      </Topic>

      <Topic title="Registrar un pago">
        <ol>
          <li>Entra al cliente y toca el préstamo.</li>
          <li>Toca <b>Registrar pago</b>.</li>
          <li>Escribe la cantidad o usa los botones rápidos: <b>Pago semanal</b>, <b>Lo atrasado</b> o <b>Liquidar</b>.</li>
          <li>Revisa la fecha: debe ser el día en que recibiste el dinero, porque de eso depende si cuenta como atraso.</li>
          <li>Toca <b>Guardar pago</b>.</li>
        </ol>
        <p>Si te equivocaste, en <b>Pagos recibidos</b> toca <b>Quitar</b> junto al pago y vuelve a registrarlo.</p>
      </Topic>

      <Topic title="Cómo se cobran las comisiones por atraso">
        <ul>
          <li>Cada semana tiene una fecha de pago. Si ese día no se cubrió el pago, se suma una comisión.</li>
          <li>Pagar el mismo día de la fecha no es atraso.</li>
          <li>La comisión se queda aunque después pague esa semana.</li>
          <li>En la tarjeta de semanas: verde es pagada, ámbar pagada tarde, rojo vencida y punteada pendiente.</li>
        </ul>
      </Topic>

      <Topic title="Mandar el saldo por WhatsApp">
        <ol>
          <li>Entra al cliente.</li>
          <li>Toca <b>Enviar saldo</b>. Se abre WhatsApp con un mensaje que ya trae su saldo, lo atrasado y su próximo pago.</li>
          <li>Revisa el mensaje y envíalo.</li>
        </ol>
      </Topic>

      <Topic title="Renovar un préstamo liquidado">
        <ol>
          <li>Cuando un préstamo llega a saldo cero aparece <b>Renovar préstamo</b>.</li>
          <li>Tócalo: se abre un préstamo nuevo con las mismas condiciones, que puedes ajustar.</li>
          <li>Sigue los mismos pasos de firma del pagaré.</li>
        </ol>
      </Topic>

      <Topic title="Eliminar un cliente">
        <ol>
          <li>Entra al cliente y baja hasta <b>Eliminar cliente</b>.</li>
          <li>Confirma. Se borran sus préstamos, pagos, pagarés y fotos, y no se puede deshacer.</li>
        </ol>
        <p>Solo se puede eliminar a clientes sin saldo pendiente. Antes de borrar, guarda en PDF los pagarés que quieras conservar.</p>
      </Topic>

      <Topic title="Cambiar tu nombre o tu PIN">
        <ol>
          <li>Ve a <b>Cuenta</b>.</li>
          <li>Cambia tu nombre o escribe un PIN nuevo y toca <b>Guardar cambios</b>.</li>
        </ol>
        <p>Tu nombre aparece en los pagarés como la persona a quien se le debe pagar.</p>
      </Topic>

      <Topic title="Cuando aparece Hay una versión nueva">
        <p>
          Significa que la app se mejoró. Toca <b>Actualizar</b> y se recarga sola. Tus datos no se pierden.
        </p>
      </Topic>
    </Screen>
  )
}
