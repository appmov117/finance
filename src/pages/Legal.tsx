import { storedUser } from '../api.ts'
import { Screen } from '../components/common.tsx'
import { useApi } from '../hooks.ts'
import type { PublicInfo } from '../types.ts'

function useContact() {
  const { data } = useApi<PublicInfo>('/info')
  return data?.email ? `al correo ${data.email}` : 'por los medios de contacto que te proporcionó'
}

const UPDATED = '26 de octubre de 2026'

export function Privacy() {
  const contact = useContact()
  return (
    <Screen title="Aviso de privacidad" back tabs={!!storedUser()}>
      <article className="legal">
        <p className="muted">Última actualización: {UPDATED}</p>
        <h2>Responsable</h2>
        <p>
          La persona que te otorga el préstamo (en adelante, el Responsable) es responsable del tratamiento de tus
          datos personales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares. Puedes contactar al Responsable {contact}.
        </p>
        <h2>Datos que recabamos</h2>
        <ul>
          <li>Nombre completo, teléfono y domicilio.</li>
          <li>Fotografías de tu identificación oficial (frente y reverso).</li>
          <li>Tu firma electrónica en los pagarés que suscribas.</li>
          <li>Montos, fechas y pagos de tus préstamos.</li>
          <li>Dirección IP y tipo de dispositivo al momento de firmar.</li>
        </ul>
        <p>No recabamos datos personales sensibles.</p>
        <h2>Para qué usamos tus datos</h2>
        <ul>
          <li>Verificar tu identidad antes de otorgarte un préstamo.</li>
          <li>Registrar tus préstamos, pagos y saldos, y mostrártelos en esta aplicación.</li>
          <li>Elaborar y conservar los pagarés que firmes.</li>
          <li>Contactarte por teléfono o WhatsApp sobre tus pagos.</li>
          <li>En su caso, ejercer las acciones legales para el cobro de adeudos.</li>
        </ul>
        <h2>Con quién compartimos tus datos</h2>
        <p>
          No vendemos ni compartimos tus datos con terceros, salvo con autoridades judiciales o administrativas
          cuando sea legalmente requerido, o con quien nos asesore legalmente para el cobro de un adeudo. La
          información se guarda con proveedores de alojamiento que solo la almacenan por nuestra cuenta.
        </p>
        <h2>Tus derechos (ARCO)</h2>
        <p>
          Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos, o revocar tu consentimiento,
          comunicándote {contact}. Responderemos en un plazo máximo de 20 días hábiles. La cancelación
          de datos relacionados con un adeudo vigente procederá cuando este quede liquidado.
        </p>
        <h2>Conservación</h2>
        <p>
          Conservamos tus datos mientras tengas una cuenta o un préstamo vigente, y después solo el tiempo
          necesario para cumplir obligaciones legales.
        </p>
        <h2>Cambios a este aviso</h2>
        <p>Cualquier cambio se publicará en esta misma página dentro de la aplicación.</p>
      </article>
    </Screen>
  )
}

export function Terms() {
  const contact = useContact()
  return (
    <Screen title="Términos y deslinde" back tabs={!!storedUser()}>
      <article className="legal">
        <p className="muted">Última actualización: {UPDATED}</p>
        <h2>Qué es esta aplicación</h2>
        <p>
          Esta aplicación es una herramienta para llevar el registro de préstamos personales entre quien otorga el
          préstamo y sus clientes. No es una institución financiera, no capta recursos del público y no está supervisada por
          la CNBV ni por la CONDUSEF.
        </p>
        <h2>Acuerdo entre particulares</h2>
        <p>
          Cada préstamo es un acuerdo directo entre quien lo otorga y el cliente. Las condiciones (cantidad, interés,
          plazo y comisión por atraso) se muestran antes de firmar y quedan establecidas en el pagaré.
        </p>
        <h2>Información mostrada</h2>
        <p>
          Los saldos se calculan con los pagos registrados. Si encuentras una diferencia, comunícate {contact}
          para aclararla; conserva tus comprobantes de pago. En caso de discrepancia prevalece lo acordado en el
          pagaré y los comprobantes de pago.
        </p>
        <h2>Firma electrónica</h2>
        <p>
          Al dibujar tu firma y confirmar, aceptas que esa firma electrónica te obliga en los términos del pagaré,
          igual que una firma en papel. Se registran la fecha, la hora, la dirección IP y una huella digital del
          texto firmado como constancia. Puede solicitarse además tu firma autógrafa en papel.
        </p>
        <h2>Tu cuenta</h2>
        <p>
          Eres responsable de mantener tu PIN en secreto. Avisa de inmediato si crees que alguien más lo conoce.
        </p>
        <h2>Limitación de responsabilidad</h2>
        <p>
          La aplicación se ofrece tal cual. No garantizamos que funcione sin interrupciones ni errores, y no
          respondemos por fallas de internet, del dispositivo o de terceros proveedores. Las obligaciones de pago
          no se suspenden si la aplicación no está disponible.
        </p>
      </article>
    </Screen>
  )
}
