import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { storedUser } from './api.ts'
import { Account } from './pages/Account.tsx'
import { ClientDetail, Requests } from './pages/admin/ClientDetail.tsx'
import { Clients, NewClient } from './pages/admin/Clients.tsx'
import { AdminHome } from './pages/admin/Home.tsx'
import { AddPayment, AdminLoan, ApproveLoan, NewLoan } from './pages/admin/Loan.tsx'
import { Manual } from './pages/admin/Manual.tsx'
import { Login, Register } from './pages/Auth.tsx'
import { AdminContract, AdminSign, ClientContract } from './pages/Contract.tsx'
import { Privacy, Terms } from './pages/Legal.tsx'
import { ClientHome, ClientLoan, RequestLoan } from './pages/client/Client.tsx'

function AppRoutes() {
  // Se suscribe a la ubicación para releer la sesión al entrar o salir.
  useLocation()
  const user = storedUser()
  if (!user) {
    return (
      <Routes>
        <Route path="/registro" element={<Register />} />
        <Route path="/privacidad" element={<Privacy />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }
  if (user.role === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/nuevo" element={<NewClient />} />
        <Route path="/clientes/:id" element={<ClientDetail />} />
        <Route path="/clientes/:id/prestamo" element={<NewLoan />} />
        <Route path="/solicitudes" element={<Requests />} />
        <Route path="/prestamos/:id" element={<AdminLoan />} />
        <Route path="/prestamos/:id/pago" element={<AddPayment />} />
        <Route path="/prestamos/:id/aprobar" element={<ApproveLoan />} />
        <Route path="/prestamos/:id/pagare" element={<AdminContract />} />
        <Route path="/prestamos/:id/firmar" element={<AdminSign />} />
        <Route path="/privacidad" element={<Privacy />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/cuenta" element={<Account />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<ClientHome />} />
      <Route path="/prestamos/:id" element={<ClientLoan />} />
      <Route path="/prestamos/:id/pagare" element={<ClientContract />} />
      <Route path="/solicitar" element={<RequestLoan />} />
      <Route path="/privacidad" element={<Privacy />} />
      <Route path="/terminos" element={<Terms />} />
      <Route path="/cuenta" element={<Account />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
