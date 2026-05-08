import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">
            Properties
          </h1>
          <p className="text-stone-600 dark:text-gray-400">
            Manage all property listings in your marketplace.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <span className="text-lg">＋</span>
          <span>Create property</span>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-stone-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-10 text-center">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
            No properties yet
          </h2>
          <p className="text-sm text-stone-600 dark:text-gray-400 mb-4">
            Start by creating your first property listing for the site.
          </p>
          <Link
            href="/admin/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            Create property
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const coverImage = property.images[0] ?? null
            return (
              <div
                key={property.id}
                className="bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative h-32 bg-gradient-to-br from-emerald-600 via-emerald-500 to-stone-600">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">
                      🏡
                    </div>
                  )}
                  <div className="absolute top-2 left-2 rounded-full bg-white/90 dark:bg-gray-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow">
                    Admin view
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1 line-clamp-2">
                      {property.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-gray-400 mb-1">
                      📍 {property.location}
                    </p>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                      {property.price}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-gray-500 line-clamp-2">
                      {property.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 dark:text-gray-500">
                    <span>
                      🖼️ {property.images.length} image
                      {property.images.length === 1 ? '' : 's'}
                    </span>
                    <span>
                      🎥 {property.videos.length} video
                      {property.videos.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                    <Link
                      href={`/properties/${property.id}`}
                      className="flex-1 text-center rounded-lg border border-stone-300 dark:border-gray-600 py-1 text-stone-700 dark:text-gray-200 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      View public page
                    </Link>
                    <Link
                      href={`/admin/properties/new`}
                      className="px-3 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-1 font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
                    >
                      New
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


