import { Printer } from 'lucide-react'
import type { Contract } from '../types.ts'

const stamp = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' })

/** Pagaré listo para leer en pantalla o imprimir. */
export function ContractView({ contract, debtor }: { contract: Contract; debtor: string }) {
  const [title, ...body] = contract.text.split('\n')
  return (
    <>
      <article className="contract">
        <h2>{title}</h2>
        {body.map((line, i) => (line ? <p key={i}>{line}</p> : <br key={i} />))}
        <div className="contract-sign">
          {contract.signature ? <img src={contract.signature} alt={`Firma de ${debtor}`} /> : <div className="sign-space" />}
          <span>{debtor}</span>
          <small>Firma del suscriptor</small>
        </div>
        {contract.signedAt && (
          <footer className="contract-meta">
            Firmado electrónicamente{contract.meta?.inPerson ? ' en persona' : ''} el{' '}
            {stamp.format(new Date(contract.signedAt)).replace(/\.$/, '')}.
            {contract.meta?.ip && ` IP ${contract.meta.ip}.`}
            {contract.hash && <> Huella del documento: <code>{contract.hash}</code></>}
          </footer>
        )}
      </article>
      <button type="button" className="btn ghost block no-print" onClick={() => window.print()}>
        <Printer size={18} />Imprimir o guardar PDF
      </button>
    </>
  )
}
