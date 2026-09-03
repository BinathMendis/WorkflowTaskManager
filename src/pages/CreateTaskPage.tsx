import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, PlusCircle, Paperclip, X, FileText } from 'lucide-react'
import { createTask, uploadAttachment } from '../api/taskService'
import { getCompanies } from '../api/companyService'
import { getUsers } from '../api/userService'
import SelectField from '../components/common/SelectField'
import { toast } from 'react-toastify'
import { useState } from 'react'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Max 500 characters'),
  description: z.string().optional().default(''),
  companyId: z.string().min(1, 'Company is required'),
  assignedUserId: z.string().min(1, 'Assigned user is required'),
  platform: z.string(),
  priority: z.string(),
  dueDate: z.string().min(1, 'Due date is required'),
})

type FormValues = z.infer<typeof schema>

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false)

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      companyId: '',
      assignedUserId: '',
      platform: 'Facebook',  // Changed from Platform.Facebook to string
      priority: 'Medium',    // Changed from TaskPriority.Medium to string
      dueDate: '',
    },
  })

  const companyId = watch('companyId') || ''
  const assignedUserId = watch('assignedUserId') || ''
  const platform = watch('platform') || 'Facebook'
  const priority = watch('priority') || 'Medium'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 10MB limit`)
        return false
      }
      return true
    })
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const onSubmit = async (values: FormValues) => {
    let createdTaskId: number | null = null
    
    try {
      setUploadingFiles(true)
      
      // Step 1: Create the task - send string values to match backend
      const taskData = {
        title: values.title,
        description: values.description || '',
        companyId: Number(values.companyId),
        assignedUserId: Number(values.assignedUserId),
        platform: values.platform,  // Send string like "Facebook"
        priority: values.priority,   // Send string like "Medium"
        dueDate: new Date(values.dueDate).toISOString(),
      }
      const createdTask = await createTask(taskData)
      createdTaskId = createdTask.id

      // Step 2: Upload attachments one by one
      if (attachments.length > 0) {
        const uploadPromises = attachments.map(attachment => 
          uploadAttachment(createdTaskId!, attachment)
        )
        
        await Promise.all(uploadPromises)
        toast.success(`Task created successfully with ${attachments.length} attachment(s)!`)
      } else {
        toast.success('Task created successfully!')
      }
      
      navigate('/tasks')
    } catch (err: any) {
      console.error('Create task error:', err)
      console.error('Error response:', err?.response?.data)
      
      if (createdTaskId) {
        console.error('Task created but attachment upload failed:', err)
        toast.error('Task created but some attachments failed to upload. You can add them later.')
        navigate('/tasks')
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create task')
      }
    } finally {
      setUploadingFiles(false)
    }
  }

  const field = (label: string, error?: string, children?: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-shadow'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Task
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Fill in the details below to assign a new task
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {field(
            'Task Title *',
            errors.title?.message,
            <input {...register('title')} className={inputClass} />
          )}

          {field(
            'Description',
            errors.description?.message,
            <textarea {...register('description')} rows={4} className={`${inputClass} resize-none`} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field(
              'Company *',
              errors.companyId?.message,
              <SelectField
                value={companyId}
                placeholder="Select a company..."
                options={companies.map(company => ({ value: String(company.id), label: company.name }))}
                onChange={value => setValue('companyId', value, { shouldValidate: true, shouldDirty: true })}
              />
            )}

            {field(
              'Assign To *',
              errors.assignedUserId?.message,
              <SelectField
                value={assignedUserId}
                placeholder="Select a user..."
                options={users.map(user => ({ value: String(user.id), label: user.username }))}
                onChange={value => setValue('assignedUserId', value, { shouldValidate: true, shouldDirty: true })}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field(
              'Platform',
              errors.platform?.message,
              <SelectField
                value={platform}
                options={[
                  { value: 'Facebook', label: 'Facebook' },
                  { value: 'Instagram', label: 'Instagram' },
                  { value: 'TikTok', label: 'TikTok' },
                  { value: 'YouTube', label: 'YouTube' },
                ]}
                onChange={value => setValue('platform', value, { shouldValidate: true, shouldDirty: true })}
              />
            )}

            {field(
              'Priority',
              errors.priority?.message,
              <SelectField
                value={priority}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
                onChange={value => setValue('priority', value, { shouldValidate: true, shouldDirty: true })}
              />
            )}
          </div>

          {field(
            'Due Date *',
            errors.dueDate?.message,
            <input
              {...register('dueDate')}
              type="date"
              className={inputClass}
            />
          )}

          {/* Attachment Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attachments (Optional)
            </label>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                <Paperclip className="h-4 w-4" />
                Choose Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">
                Max file size: 10MB per file
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  Selected files ({attachments.length}):
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate max-w-[200px] md:max-w-[300px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || uploadingFiles}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {(isSubmitting || uploadingFiles) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
