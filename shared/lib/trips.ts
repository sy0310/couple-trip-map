import type { SupabaseAdapter } from './adapter'
import { generateId, type UploadFile } from './utils'
import { getProvinceByName } from './provinces'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TripRow {
  id: string
  couple_id: string
  location_name: string
  province: string
  city: string
  scenic_spot: string | null
  lat: number | null
  lng: number | null
  visit_date: string
  notes: string | null
  photo_count: number
  cover_url: string | null
  created_at: string
  updated_at: string
}

export interface PhotoRow {
  id: string
  trip_id: string | null
  file_url: string
  description: string | null
  taken_at: string | null
  created_at: string
}

export interface TimelineRow {
  id: string
  couple_id: string
  date: string
  title: string
  description: string | null
  icon: string | null
  type: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Trip CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch distinct visited province names for a couple.
 */
export async function getVisitedProvinces(
  adapter: SupabaseAdapter,
  coupleId: string
): Promise<string[]> {
  const result = await adapter
    .from('trips')
    .select('province')
    .eq('couple_id', coupleId)

  if (result.error) {
    console.error('Failed to fetch visited provinces:', result.error.message)
    return []
  }

  const data = result.data as Pick<TripRow, 'province'>[] | null
  return [...new Set((data ?? []).map((t) => t.province))]
}

/**
 * Fetch distinct visited cities for a couple within a province.
 */
export async function getVisitedCities(
  adapter: SupabaseAdapter,
  coupleId: string,
  province: string
): Promise<string[]> {
  const result = await adapter
    .from('trips')
    .select('city')
    .eq('couple_id', coupleId)
    .eq('province', province)

  if (result.error) {
    console.error('Failed to fetch visited cities:', result.error.message)
    return []
  }

  const data = result.data as Pick<TripRow, 'city'>[] | null
  return [...new Set((data ?? []).map((t) => t.city))]
}

/**
 * Fetch visited cities with coordinates for a couple.
 * Groups trips by province+city and matches coordinates from province data.
 *
 * N+1 FIX: Uses a single batch query for photo counts instead of
 * calling getPhotosByTrip per trip in a loop.
 */
export async function getVisitedCitiesWithCoords(
  adapter: SupabaseAdapter,
  coupleId: string
): Promise<{ name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[]> {
  const result = await adapter
    .from('trips')
    .select('id, province, city, cover_url')
    .eq('couple_id', coupleId)

  if (result.error) {
    console.error('Failed to fetch visited cities:', result.error.message)
    return []
  }

  const data = result.data as { id: string; province: string; city: string; cover_url: string | null }[] | null

  // Deduplicate by province+city
  const cityMap = new Map<string, { name: string; province: string; coverUrl?: string; tripIds: string[] }>()
  for (const trip of data ?? []) {
    const key = `${trip.province}::${trip.city}`
    const existing = cityMap.get(key)
    if (existing) {
      existing.tripIds.push(trip.id)
      if (trip.cover_url) existing.coverUrl = trip.cover_url
    } else {
      cityMap.set(key, {
        name: trip.city,
        province: trip.province,
        coverUrl: trip.cover_url || undefined,
        tripIds: [trip.id],
      })
    }
  }

  // Collect all trip IDs for batch photo count query
  const allTripIds = [...cityMap.values()].flatMap((e) => e.tripIds)

  // Batch photo count: single query instead of N individual queries
  const photoCountMap = new Map<string, number>()
  if (allTripIds.length > 0) {
    const photoResult = await adapter
      .from('photos')
      .select('trip_id')
      .in('trip_id', allTripIds)

    if (!photoResult.error && photoResult.data) {
      const photos = photoResult.data as { trip_id: string | null }[]
      for (const photo of photos) {
        if (photo.trip_id) {
          photoCountMap.set(photo.trip_id, (photoCountMap.get(photo.trip_id) || 0) + 1)
        }
      }
    }
  }

  // Match coordinates from province data
  const cities: Awaited<ReturnType<typeof getVisitedCitiesWithCoords>> = []
  for (const entry of cityMap.values()) {
    const provinceData = getProvinceByName(entry.province)
    const cityData = provinceData?.cities.find((c) => c.name === entry.name)
    if (cityData) {
      // Sum photo counts from batch query (no per-trip loop)
      let photoCount = 0
      for (const tripId of entry.tripIds) {
        photoCount += photoCountMap.get(tripId) || 0
      }
      cities.push({
        name: entry.name,
        province: entry.province,
        lat: cityData.lat,
        lng: cityData.lng,
        photoCount,
        coverUrl: entry.coverUrl,
      })
    }
  }

  return cities
}

/**
 * Fetch all trip records for a couple in a specific city.
 */
export async function getTripsByCity(
  adapter: SupabaseAdapter,
  coupleId: string,
  city: string
): Promise<Pick<TripRow, 'id' | 'location_name' | 'province' | 'city' | 'scenic_spot' | 'visit_date' | 'notes' | 'photo_count' | 'created_at'>[]> {
  const result = await adapter
    .from('trips')
    .select('id, location_name, province, city, scenic_spot, visit_date, notes, photo_count, created_at')
    .eq('couple_id', coupleId)
    .eq('city', city)
    .order('visit_date', { ascending: false })

  if (result.error) {
    console.error('Failed to fetch trips by city:', result.error.message)
    return []
  }

  return (result.data as Pick<TripRow, 'id' | 'location_name' | 'province' | 'city' | 'scenic_spot' | 'visit_date' | 'notes' | 'photo_count' | 'created_at'>[] | null) ?? []
}

/**
 * Fetch trip counts for multiple cities in a province (batch, no N+1).
 * Returns a Map of cityName -> tripCount.
 */
export async function getTripCountsByCities(
  adapter: SupabaseAdapter,
  coupleId: string,
  province: string,
  cityNames: string[]
): Promise<Map<string, number>> {
  if (cityNames.length === 0) return new Map()

  const result = await adapter
    .from('trips')
    .select('city')
    .eq('couple_id', coupleId)
    .eq('province', province)
    .in('city', cityNames)

  if (result.error) {
    console.error('Failed to batch fetch trip counts:', result.error.message)
    return new Map()
  }

  const data = result.data as { city: string }[] | null
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.city, (counts.get(row.city) || 0) + 1)
  }
  return counts
}

/**
 * Fetch photos for multiple trips in one batch query (no N+1).
 * Returns a Map of tripId -> photoUrls[].
 */
export async function getPhotosByTripIds(
  adapter: SupabaseAdapter,
  tripIds: string[]
): Promise<Map<string, string[]>> {
  if (tripIds.length === 0) return new Map()

  const result = await adapter
    .from('photos')
    .select('trip_id, file_url')
    .in('trip_id', tripIds)

  if (result.error) {
    console.error('Failed to batch fetch photos:', result.error.message)
    return new Map()
  }

  const data = result.data as { trip_id: string | null; file_url: string }[] | null
  const photoMap = new Map<string, string[]>()
  for (const row of data ?? []) {
    if (row.trip_id) {
      const existing = photoMap.get(row.trip_id) || []
      existing.push(row.file_url)
      photoMap.set(row.trip_id, existing)
    }
  }
  return photoMap
}

/**
 * Create a new trip record, or return existing one if
 * couple + province + city + scenic_spot + date already match.
 */
export async function createTrip(
  adapter: SupabaseAdapter,
  coupleId: string,
  trip: {
    location_name: string
    province: string
    city: string
    scenic_spot?: string
    lat?: number
    lng?: number
    visit_date: string
    notes?: string
  }
): Promise<{ id: string; existed: boolean } | null> {
  // Check for existing trip with same couple + location + date
  const existingQuery = adapter
    .from('trips')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('province', trip.province)
    .eq('city', trip.city)
    .eq('visit_date', trip.visit_date)

  if (trip.scenic_spot) {
    existingQuery.eq('scenic_spot', trip.scenic_spot)
  } else {
    existingQuery.is('scenic_spot', null)
  }

  const existingResult = await existingQuery.maybeSingle()

  if (existingResult.data) {
    const existing = existingResult.data as Pick<TripRow, 'id'>
    return { id: existing.id, existed: true }
  }

  const id = generateId()
  const insertResult = await adapter
    .from('trips')
    .insert({
      id,
      couple_id: coupleId,
      location_name: trip.location_name,
      province: trip.province,
      city: trip.city,
      scenic_spot: trip.scenic_spot ?? null,
      lat: trip.lat ?? null,
      lng: trip.lng ?? null,
      visit_date: trip.visit_date,
      notes: trip.notes ?? null,
    })

  if (insertResult.error) {
    console.error('Failed to create trip:', insertResult.error.message)
    return null
  }

  return { id, existed: false }
}

/**
 * Update trip fields (province, city, scenic_spot, visit_date, notes, location_name).
 */
export async function updateTrip(
  adapter: SupabaseAdapter,
  tripId: string,
  fields: {
    location_name?: string
    province?: string
    city?: string
    scenic_spot?: string | null
    lat?: number | null
    lng?: number | null
    visit_date?: string
    notes?: string | null
  }
): Promise<boolean> {
  const result = await adapter
    .from('trips')
    .update(fields)
    .eq('id', tripId)

  if (result.error) {
    console.error('Failed to update trip:', result.error.message)
    return false
  }

  return true
}

/**
 * Delete an entire trip and all its photos.
 */
export async function deleteTrip(
  adapter: SupabaseAdapter,
  tripId: string
): Promise<boolean> {
  // Fetch photos to delete from storage
  const photos = await getPhotosByTrip(adapter, tripId)

  // Delete from storage (check result per photo)
  for (const photo of photos) {
    const parsed = new URL(photo.file_url)
    const pathSegments = parsed.pathname.split('/').filter(Boolean)
    const fileName = pathSegments[pathSegments.length - 1]
    const coupleIdPart = pathSegments[pathSegments.length - 2]
    const storagePath = `${coupleIdPart}/${fileName}`
    const storageResult = await adapter.storage.from('photos').remove([storagePath])
    if (storageResult.error) {
      console.error('Storage delete failed for', storagePath, ':', storageResult.error.message)
      // Continue with other photos -- don't abort the entire deletion
    }
  }

  // Delete photo records from DB
  await adapter
    .from('photos')
    .delete()
    .eq('trip_id', tripId)

  // Delete trip
  const result = await adapter
    .from('trips')
    .delete()
    .eq('id', tripId)

  if (result.error) {
    console.error('Failed to delete trip:', result.error.message)
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Photo Management
// ---------------------------------------------------------------------------

/**
 * Upload a photo file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPhoto(
  adapter: SupabaseAdapter,
  coupleId: string,
  file: UploadFile
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${coupleId}/${generateId()}.${ext}`

  const uploadResult = await adapter.storage
    .from('photos')
    .upload(path, file, { contentType: file.type })

  if (uploadResult.error) {
    console.error('Failed to upload photo:', uploadResult.error.message)
    return null
  }

  const { data } = adapter.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Fetch all photo records for a specific trip.
 */
export async function getPhotosByTrip(
  adapter: SupabaseAdapter,
  tripId: string
): Promise<PhotoRow[]> {
  const result = await adapter
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (result.error) {
    console.error('Failed to fetch trip photos:', result.error.message)
    return []
  }

  return (result.data as PhotoRow[] | null) ?? []
}

/**
 * Fetch all photos for a couple, ordered by created_at descending.
 * Uses !inner join to filter by couple_id through the trips table.
 */
export async function getAllPhotosForCouple(
  adapter: SupabaseAdapter,
  coupleId: string
): Promise<{ id: string; file_url: string; created_at: string; visitDate?: string; tripLocation?: string }[]> {
  const result = await adapter
    .from('photos')
    .select('id, file_url, created_at, trips!inner(location_name, visit_date)')
    .eq('trips.couple_id', coupleId)
    .order('created_at', { ascending: false })

  if (result.error) {
    console.error('Failed to fetch couple photos:', result.error.message)
    return []
  }

  const data = result.data as {
    id: string
    file_url: string
    created_at: string
    trips: { location_name: string | null; visit_date: string }
  }[] | null

  return (data ?? []).map((p) => ({
    id: p.id,
    file_url: p.file_url,
    created_at: p.created_at,
    visitDate: p.trips?.visit_date,
    tripLocation: p.trips?.location_name ?? undefined,
  }))
}

/**
 * Create a photo record linked to a trip.
 */
export async function createPhotoRecord(
  adapter: SupabaseAdapter,
  tripId: string,
  fileUrl: string
): Promise<boolean> {
  const result = await adapter
    .from('photos')
    .insert({
      trip_id: tripId,
      file_url: fileUrl,
    })

  if (result.error) {
    console.error('Failed to create photo record:', result.error.message)
    return false
  }

  return true
}

/**
 * Delete a single photo record and its storage file.
 */
export async function deletePhoto(
  adapter: SupabaseAdapter,
  photoId: string,
  fileUrl: string
): Promise<boolean> {
  // Extract storage path from URL
  const parsed = new URL(fileUrl)
  const pathSegments = parsed.pathname.split('/').filter(Boolean)
  const fileName = pathSegments[pathSegments.length - 1]
  const coupleIdPart = pathSegments[pathSegments.length - 2]
  const storagePath = `${coupleIdPart}/${fileName}`

  // Delete from storage
  const storageResult = await adapter.storage.from('photos').remove([storagePath])
  if (storageResult.error) {
    console.error('Storage delete failed:', storageResult.error.message)
    return false
  }

  // Delete from DB
  const result = await adapter
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (result.error) {
    console.error('Failed to delete photo:', result.error.message)
    return false
  }

  return true
}

/**
 * Upload multiple photos to a trip and create photo records.
 */
export async function uploadPhotosToTrip(
  adapter: SupabaseAdapter,
  tripId: string,
  coupleId: string,
  files: UploadFile[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<number> {
  let uploaded = 0
  for (const file of files) {
    const url = await uploadPhoto(adapter, coupleId, file)
    if (url) {
      await createPhotoRecord(adapter, tripId, url)
    }
    uploaded++
    onProgress?.(uploaded, files.length)
  }
  return uploaded
}

// ---------------------------------------------------------------------------
// Timelines
// ---------------------------------------------------------------------------

export async function getTimelines(
  adapter: SupabaseAdapter,
  coupleId: string
): Promise<TimelineRow[]> {
  const result = await adapter
    .from('timelines')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date', { ascending: true })

  if (result.error) {
    console.error('Failed to fetch timelines:', result.error.message)
    return []
  }

  return (result.data as TimelineRow[] | null) ?? []
}

export async function addTimeline(
  adapter: SupabaseAdapter,
  coupleId: string,
  entry: { date: string; title: string; description?: string; icon?: string; type?: string }
): Promise<string | null> {
  const id = generateId()
  const result = await adapter
    .from('timelines')
    .insert({
      id,
      couple_id: coupleId,
      date: entry.date,
      title: entry.title,
      description: entry.description ?? null,
      icon: entry.icon ?? null,
      type: entry.type ?? 'milestone',
    })

  if (result.error) {
    console.error('Failed to add timeline:', result.error.message)
    return null
  }

  return id
}

export async function updateTimeline(
  adapter: SupabaseAdapter,
  timelineId: string,
  entry: { date?: string; title?: string; description?: string | null; icon?: string | null; type?: string }
): Promise<boolean> {
  const result = await adapter
    .from('timelines')
    .update({ ...entry, updated_at: new Date().toISOString() })
    .eq('id', timelineId)

  if (result.error) {
    console.error('Failed to update timeline:', result.error.message)
    return false
  }

  return true
}

export async function deleteTimeline(
  adapter: SupabaseAdapter,
  timelineId: string
): Promise<boolean> {
  const result = await adapter
    .from('timelines')
    .delete()
    .eq('id', timelineId)

  if (result.error) {
    console.error('Failed to delete timeline:', result.error.message)
    return false
  }

  return true
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  adapter: SupabaseAdapter,
  userId: string,
  fields: { nickname?: string; avatar_url?: string | null; city?: string | null; bio?: string | null; birthday?: string | null }
): Promise<boolean> {
  const result = await adapter
    .from('users')
    .update(fields)
    .eq('id', userId)

  if (result.error) {
    console.error('Failed to update user profile:', result.error.message)
    return false
  }

  return true
}
