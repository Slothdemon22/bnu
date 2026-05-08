'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/ToasterProvider'

type UploadState = 'idle' | 'saving'

type UploadedMedia = {
  id: string
  url: string
  name: string
}

export default function AdminNewPropertyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUploads, setImageUploads] = useState<UploadedMedia[]>([])
  const [videoUploads, setVideoUploads] = useState<UploadedMedia[]>([])
  const [state, setState] = useState<UploadState>('idle')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isUploadingVideos, setIsUploadingVideos] = useState(false)

  const isSubmitting = state === 'saving'

  function validate() {
    const errors: Record<string, string> = {}
    if (!title.trim()) errors.title = 'Title is required'
    if (!location.trim()) errors.location = 'Location is required'
    if (!price.trim()) errors.price = 'Price is required'
    if (!description.trim()) errors.description = 'Description is required'
    if (imageUploads.length === 0) {
      errors.images = 'At least one image is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted errors')
      return
    }

    try {
      setState('saving')

      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          location: location.trim(),
          price: price.trim(),
          description: description.trim(),
          images: imageUploads.map((img) => img.url),
          videos: videoUploads.map((vid) => vid.url),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const message = data?.error ?? 'Failed to save property'
        throw new Error(message)
      }

      toast.success('Property created successfully')
      router.push('/admin/properties')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Something went wrong while creating property')
      setState('idle')
    }
  }

  async function handleImagesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsUploadingImages(true)
    try {
      const newUploads: UploadedMedia[] = []
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const filePath = `images/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('takra-bucket')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Image upload error', uploadError)
          throw new Error('Failed to upload one or more images')
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)

        newUploads.push({
          id: `${filePath}-${Date.now()}`,
          url: publicUrl,
          name: file.name,
        })
      }

      setImageUploads((prev) => [...prev, ...newUploads])
      setFormErrors((prev) => ({ ...prev, images: '' }))
      toast.success('Images uploaded')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to upload images')
    } finally {
      setIsUploadingImages(false)
    }
  }

  async function handleVideosSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsUploadingVideos(true)
    try {
      const newUploads: UploadedMedia[] = []
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'mp4'
        const filePath = `videos/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('takra-bucket')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Video upload error', uploadError)
          throw new Error('Failed to upload one or more videos')
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('takra-bucket').getPublicUrl(filePath)

        newUploads.push({
          id: `${filePath}-${Date.now()}`,
          url: publicUrl,
          name: file.name,
        })
      }

      setVideoUploads((prev) => [...prev, ...newUploads])
      toast.success('Videos uploaded')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to upload videos')
    } finally {
      setIsUploadingVideos(false)
    }
  }

  function removeImage(id: string) {
    setImageUploads((prev) => prev.filter((img) => img.id !== id))
  }

  function removeVideo(id: string) {
    setVideoUploads((prev) => prev.filter((vid) => vid.id !== id))
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
        Create premium property
      </h1>
      <p className="text-stone-600 dark:text-gray-400 mb-8">
        Craft a high-converting property listing with rich media. Images and
        videos upload instantly to keep the experience smooth.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl p-6 md:p-8 shadow-lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Luxurious 4BHK Villa"
            />
            {formErrors.title && (
              <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Bandra West, Mumbai"
            />
            {formErrors.location && (
              <p className="mt-1 text-xs text-red-500">{formErrors.location}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1">
              Price (label)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="₹ 1.2 Cr"
            />
            {formErrors.price && (
              <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Describe the property, key highlights, neighbourhood, and amenities."
          />
          {formErrors.description && (
            <p className="mt-1 text-xs text-red-500">
              {formErrors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">
              Property images
            </label>
            <p className="text-xs text-stone-500 dark:text-gray-500 mb-3">
              Drag & drop or click to upload high quality images. The first
              image becomes the card cover.
            </p>
            <MediaDropzone
              accept="image/*"
              disabled={isUploadingImages || isSubmitting}
              loading={isUploadingImages}
              onFilesSelected={handleImagesSelected}
              label="Drop images here or click to browse"
            />
            {formErrors.images && (
              <p className="mt-1 text-xs text-red-500">{formErrors.images}</p>
            )}

            {imageUploads.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {imageUploads.map((img, index) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900"
                  >
                    <div className="relative h-24 w-full">
                      <Image
                        src={img.url}
                        alt={img.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-emerald-600 text-white text-[10px] px-2 py-0.5 shadow">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-2">
              Property videos (optional)
            </label>
            <p className="text-xs text-stone-500 dark:text-gray-500 mb-3">
              Add walkthrough or neighbourhood clips to make the listing feel
              premium. MP4 recommended.
            </p>
            <MediaDropzone
              accept="video/*"
              disabled={isUploadingVideos || isSubmitting}
              loading={isUploadingVideos}
              onFilesSelected={handleVideosSelected}
              label="Drop videos here or click to browse"
            />

            {videoUploads.length > 0 && (
              <div className="mt-4 space-y-2">
                {videoUploads.map((vid) => (
                  <div
                    key={vid.id}
                    className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 px-3 py-2 text-xs text-stone-700 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">🎥</span>
                      <span className="truncate">{vid.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideo(vid.id)}
                      className="text-[11px] font-medium text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-stone-300 dark:border-gray-600 text-sm font-medium text-stone-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {state === 'saving' ? (
              <span className="text-xs">Saving property…</span>
            ) : (
              <span>Create property</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

type MediaDropzoneProps = {
  accept: string
  disabled?: boolean
  loading?: boolean
  label: string
  onFilesSelected: (files: FileList | null) => void
}

function MediaDropzone({
  accept,
  disabled,
  loading,
  label,
  onFilesSelected,
}: MediaDropzoneProps) {
  const inputId = `dropzone-${accept}-${Math.random().toString(36).slice(2)}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors cursor-pointer ${
          disabled
            ? 'border-stone-300/70 bg-stone-50/60 dark:bg-gray-900/40 cursor-not-allowed opacity-75'
            : 'border-stone-300 dark:border-gray-700 bg-stone-50/60 dark:bg-gray-900/40 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10'
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
        <div className="mb-2 text-3xl">⬆️</div>
        <p className="font-medium text-stone-800 dark:text-gray-200">
          {label}
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-gray-500">
          {loading ? 'Uploading… Please wait.' : 'You can select multiple files at once.'}
        </p>
      </label>
    </div>
  )
}


