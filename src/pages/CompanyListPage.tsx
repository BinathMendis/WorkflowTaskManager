import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Pencil, Trash2, Loader2, ClipboardList } from 'lucide-react'
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api/companyService'
import { CompanyDto } from '../types/company.types'
import { toast } from 'react-toastify'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import ConfirmDialog from '../components/common/ConfirmDialog'
import CompanyModal from '../components/companies/CompanyModal'
import { formatDate } from '../utils/dateHelpers'

export default function CompanyListPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CompanyDto | null>(null)

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['companies'] })

  const create = useMutation({
    mutationFn: createCompany,
    onSuccess: () => { toast.success('Company created'); refresh(); setModalOpen(false) },
    onError: () => toast.error('Failed to create company'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string } }) =>
      updateCompany(id, data),
    onSuccess: () => { toast.success('Company updated'); refresh(); setEditing(null); setModalOpen(false) },
    onError: () => toast.error('Failed to update company'),
  })

  const del = useMutation({
    mutationFn: (id: number) => deleteCompany(id),
    onSuccess: () => { toast.success('Company deleted'); refresh(); setDeleteTarget(null) },
    onError: () => toast.error('Failed to delete company'),
  })

  const handleSave = async (data: { name: string; description: string }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, data })
    } else {
      await create.mutateAsync(data)
    }
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 text-sm mt-0.5">{companies.length} companies registered</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-sm shadow-red-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Company
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="mt-12" />
      ) : error ? (
        <ErrorMessage message="Failed to load companies." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Created</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                    No companies yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                companies.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4.5 w-4.5 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 line-clamp-1">{company.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        <ClipboardList className="h-3 w-3" />
                        {company.taskCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(company.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(company); setModalOpen(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(company)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          {del.isPending && del.variables === company.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <CompanyModal
        open={modalOpen}
        company={editing}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        saving={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteTarget && del.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
