import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadAttachment } from '../../api/attachmentService'
import { toast } from 'react-toastify'

const FILE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_SIZE = 10 * 1024 * 1024

interface Props {
  taskId: number
  onUploaded: () => void
  imageOnly?: boolean
}

export default function AttachmentUpload({ taskId, onUploaded, imageOnly = false }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<File | null>(null)
  const [error, setError] = useState('')
  const allowedTypes = imageOnly ? IMAGE_TYPES : FILE_TYPES

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setError('')
    if (rejected.length > 0) {
      setError(rejected[0].errors[0].message)
      return
    }
    if (accepted[0]) setPreview(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    accept: imageOnly
      ? {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        }
      : {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
  })

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    try {
      await uploadAttachment(taskId, preview)
      toast.success(imageOnly ? 'Image uploaded successfully' : 'File uploaded successfully')
      setPreview(null)
      onUploaded()
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {isDragActive
            ? `Drop ${imageOnly ? 'image' : 'file'} here...`
            : `Drag & drop or click to select ${imageOnly ? 'an image' : 'a file'}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">{allowedTypes.join(', ')} · max 10 MB</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {preview && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{preview.name}</p>
            <p className="text-xs text-gray-500">{(preview.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </button>
        </div>
      )}
    </div>
  )
}
