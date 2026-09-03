import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

interface Props {
  adminOnly?: boolean
  fullAdminOnly?: boolean
  approverOnly?: boolean
  publisherOnly?: boolean
}

export default function PrivateRoute({ adminOnly = false, fullAdminOnly = false, approverOnly = false, publisherOnly = false }: Props) {
  const { state, loading, hasRole } = useAuth()
  const isPrimaryAdmin = state.role === 'Admin'
  const hasApproverRole = hasRole('Approver')
  const hasPublisherRole = hasRole('Publisher')
  const canApprove = isPrimaryAdmin || hasApproverRole
  const canPublish = isPrimaryAdmin || hasPublisherRole

  // Wait until auth restoration finishes
  if (loading) {
    return <LoadingSpinner />
  }

  // Not logged in
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Admin-only route check
  if (adminOnly && !isPrimaryAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (fullAdminOnly && !isPrimaryAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (approverOnly && !canApprove) {
    return <Navigate to="/dashboard" replace />
  }

  if (publisherOnly && !canPublish) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
