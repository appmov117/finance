import { FileSignature } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, storedUser } from '../api.ts'
import { Loading, Screen } from '../components/common.tsx'
import { ContractView } from '../components/ContractView.tsx'
import { SignaturePad } from '../components/SignaturePad.tsx'
import { useAction, useApi } from '../hooks.ts'
import type { Contract, LoanDetail } from '../types.ts'

function SignContract({ contract, debtor, signPath, doneTo, inPerson }: {
  contract: Contract
  debtor: string
  signPath: string
  doneTo: string
  inPerson: boolean
}) {
  const navigate = useNavigate()
  const { busy, error, setError, run } = useAction()
  const [signature, setSignature] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)

  const sign = () => {
    if (!signature) return setError('Dibuja la firma')
    if (!agree) return setError('Confirma que leíste y aceptas el pagaré')
    run(async () => {
      await api('POST', signPath, { signature, text: contract.text })
      navigate(doneTo, { replace: true })
    })
  }

  return (
    <Screen
      title="Firmar pagaré"
      back
      footer={<button className="btn" disabled={busy} onClick={sign}>{busy ? 'Firmando...' : 'Firmar pagaré'}</button>}
    >
      {inPerson && (
        <p className="alert info no-print">Entrega el celular a {debtor} para que lea el pagaré y firme.</p>
      )}
      <ContractView contract={contract} debtor={debtor} />
      <div className="section no-print">
        <h2>Firma de {debtor}</h2>
        <SignaturePad onChange={setSignature} />
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>Leí el pagaré, estoy de acuerdo con sus condiciones y acepto firmarlo electrónicamente.</span>
        </label>
        {error && <p className="error">{error}</p>}
      </div>
    </Screen>
  )
}

export function ClientContract() {
  const { id } = useParams()
  const { data, error } = useApi<Contract>(`/me/loans/${id}/contract`)
  if (!data) return <Screen title="Pagaré" back><Loading error={error} /></Screen>
  const name = storedUser()!.name
  if (data.signedAt) {
    return (
      <Screen title="Pagaré" back>
        <ContractView contract={data} debtor={name} />
      </Screen>
    )
  }
  return <SignContract contract={data} debtor={name} signPath={`/me/loans/${id}/sign`} doneTo={`/prestamos/${id}`} inPerson={false} />
}

function useAdminContract() {
  const { id } = useParams()
  const contract = useApi<Contract>(`/admin/loans/${id}/contract`)
  const detail = useApi<LoanDetail>(`/admin/loans/${id}`)
  return { id, contract: contract.data, detail: detail.data, error: contract.error || detail.error }
}

/** Firma en persona, en el celular de la administradora, al momento de entregar el préstamo. */
export function AdminSign() {
  const { id, contract, detail, error } = useAdminContract()
  if (!contract || !detail) return <Screen title="Firmar pagaré" back><Loading error={error} /></Screen>
  return (
    <SignContract
      contract={contract}
      debtor={detail.user.name}
      signPath={`/admin/loans/${id}/sign`}
      doneTo={`/prestamos/${id}`}
      inPerson
    />
  )
}

export function AdminContract() {
  const { id, contract, detail, error } = useAdminContract()
  if (!contract || !detail) return <Screen title="Pagaré" back><Loading error={error} /></Screen>
  const unsigned = !contract.signedAt && detail.loan.status === 'to_sign'
  return (
    <Screen
      title="Pagaré"
      back
      footer={unsigned ? <Link to={`/prestamos/${id}/firmar`} className="btn"><FileSignature size={18} />Firmar ahora con el cliente</Link> : undefined}
    >
      {unsigned && (
        <p className="alert info no-print">
          Aún no está firmado. Puede firmarlo ahora en tu celular, desde su propia aplicación o en papel impreso.
        </p>
      )}
      <ContractView contract={contract} debtor={detail.user.name} />
    </Screen>
  )
}
