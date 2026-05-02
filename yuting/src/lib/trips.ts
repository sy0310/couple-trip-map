import { createClient } from '@/lib/supabase-browser';
import type { Database } from './database.types';
import { getProvinceByName } from '@/lib/provinces';

type TripRow = Database['public']['Tables']['trips']['Row'];

/**
 * Get the couple_id for the currently logged-in user.
 * Looks up the couples table to find which couple the user belongs to.
 * Returns null if the user is not in any couple.
 */
type CoupleRow = Database['public']['Tables']['couples']['Row'];

/**
 * Generate a binding code.
 * Creates a new couples row with the current user as user_a.
 * Returns the generated 6-character code, or null on failure.
 */
export async function generateBindingCode(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Generate a unique 6-char alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  // Check uniqueness, regenerate if taken
  const { data: existing } = await supabase
    .from('couples')
    .select('id')
    .eq('binding_code', code)
    .maybeSingle();

  if (existing) return generateBindingCode(); // retry

  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('couples')
    .insert({ id, user_a_id: user.id, binding_code: code } as never);

  if (error) {
    console.error('Failed to generate binding code:', error.message);
    return null;
  }

  return code;
}

/**
 * Accept a binding code from the other user.
 * Finds the couple by code and sets the current user as user_b.
 * Returns true on success.
 */
export async function acceptBindingCode(code: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const trimmed = code.trim().toUpperCase();

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('binding_code', trimmed)
    .is('user_b_id', null)
    .maybeSingle() as { data: Pick<CoupleRow, 'id'> | null; error: { message: string } | null };

  if (!couple) return false;

  const { error } = await supabase
    .from('couples')
    .update({ user_b_id: user.id, binding_code: null, updated_at: new Date().toISOString() } as never)
    .eq('id', couple.id);

  if (error) {
    console.error('Failed to accept binding code:', error.message);
    return false;
  }

  return true;
}

/**
 * Delete the couple binding for the current user.
 * Returns true on success.
 */
export async function deleteCoupleBinding(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .not('user_b_id', 'is', null)
    .maybeSingle() as { data: Pick<CoupleRow, 'id'> | null; error: { message: string } | null };

  if (!couple) return false;

  const { error } = await supabase
    .from('couples')
    .delete()
    .eq('id', couple.id);

  if (error) {
    console.error('Failed to delete couple binding:', error.message);
    return false;
  }

  return true;
}

export async function getCoupleId(userId?: string): Promise<string | null> {
  const supabase = createClient();

  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return null;

  const { data } = await supabase
    .from('couples')
    .select('id')
    .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`)
    .maybeSingle() as { data: Pick<CoupleRow, 'id'> | null; error: { message: string } | null };

  return data?.id ?? null;
}

/**
 * Get the couple_id and partner info for the currently logged-in user.
 * Returns null if the user is not in any couple.
 */
export async function getCoupleInfo(userId?: string): Promise<{ id: string; partnerId: string; partnerNickname: string; sinceDate: string | null; anniversary: string | null } | null> {
  const supabase = createClient();

  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return null;

  const { data: couple } = await supabase
    .from('couples')
    .select('id, user_a_id, user_b_id, since_date, anniversary')
    .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`)
    .not('user_b_id', 'is', null)
    .maybeSingle() as { data: Pick<CoupleRow, 'id' | 'user_a_id' | 'user_b_id' | 'since_date' | 'anniversary'> | null; error: { message: string } | null };

  if (!couple) return null;

  const partnerId = couple.user_a_id === uid ? couple.user_b_id! : couple.user_a_id;

  const { data: rpcResult } = await supabase.rpc('get_partner_nickname') as {
    data: { couple_id: string; partner_id: string; partner_nickname: string }[] | null;
    error: { message: string } | null;
  };
  const partnerNickname = rpcResult && rpcResult.length > 0
    ? rpcResult[0].partner_nickname || partnerId.slice(0, 8)
    : partnerId.slice(0, 8);

  return {
    id: couple.id,
    partnerId,
    partnerNickname,
    sinceDate: couple.since_date,
    anniversary: couple.anniversary,
  };
}

/**
 * Fetch distinct visited province names for a couple.
 */
export async function getVisitedProvinces(coupleId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('province')
    .eq('couple_id', coupleId) as { data: Pick<TripRow, 'province'>[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch visited provinces:', error.message);
    return [];
  }

  return [...new Set((data ?? []).map((t) => t.province))];
}

/**
 * Fetch distinct visited cities for a couple within a province.
 */
export async function getVisitedCities(
  coupleId: string,
  province: string
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('city')
    .eq('couple_id', coupleId)
    .eq('province', province) as { data: Pick<TripRow, 'city'>[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch visited cities:', error.message);
    return [];
  }

  return [...new Set((data ?? []).map((t) => t.city))];
}

/**
 * Fetch visited cities with coordinates for a couple.
 * Groups trips by province+city and matches coordinates from province data.
 */
export async function getVisitedCitiesWithCoords(
  coupleId: string
): Promise<{ name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('id, province, city, cover_url')
    .eq('couple_id', coupleId) as { data: { id: string; province: string; city: string; cover_url: string | null }[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch visited cities:', error.message);
    return [];
  }

  // Deduplicate by province+city
  const cityMap = new Map<string, { name: string; province: string; coverUrl?: string; tripIds: string[] }>();
  for (const trip of data ?? []) {
    const key = `${trip.province}::${trip.city}`;
    const existing = cityMap.get(key);
    if (existing) {
      existing.tripIds.push(trip.id);
      if (trip.cover_url) existing.coverUrl = trip.cover_url;
    } else {
      cityMap.set(key, { name: trip.city, province: trip.province, coverUrl: trip.cover_url || undefined, tripIds: [trip.id] });
    }
  }

  // Match coordinates from province data
  const cities: Awaited<ReturnType<typeof getVisitedCitiesWithCoords>> = [];
  for (const entry of cityMap.values()) {
    const provinceData = getProvinceByName(entry.province);
    const cityData = provinceData?.cities.find((c) => c.name === entry.name);
    if (cityData) {
      // Count photos for this city
      let photoCount = 0;
      for (const tripId of entry.tripIds) {
        const photos = await getPhotosByTrip(tripId);
        photoCount += photos.length;
      }
      cities.push({
        name: entry.name,
        province: entry.province,
        lat: cityData.lat,
        lng: cityData.lng,
        photoCount,
        coverUrl: entry.coverUrl,
      });
    }
  }

  return cities;
}

/**
 * Fetch all trip records for a couple in a specific city.
 */
export async function getTripsByCity(
  coupleId: string,
  city: string
): Promise<
  Pick<TripRow, 'id' | 'location_name' | 'province' | 'city' | 'scenic_spot' | 'visit_date' | 'notes' | 'photo_count' | 'created_at'>[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('trips')
    .select('id, location_name, province, city, scenic_spot, visit_date, notes, photo_count, created_at')
    .eq('couple_id', coupleId)
    .eq('city', city)
    .order('visit_date', { ascending: false }) as { data: Pick<TripRow, 'id' | 'location_name' | 'province' | 'city' | 'scenic_spot' | 'visit_date' | 'notes' | 'photo_count' | 'created_at'>[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch trips by city:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Create a new trip record, or return existing one if
 * couple + province + city + scenic_spot + date already match.
 */
export async function createTrip(
  coupleId: string,
  trip: {
    location_name: string;
    province: string;
    city: string;
    scenic_spot?: string;
    lat?: number;
    lng?: number;
    visit_date: string;
    notes?: string;
  }
): Promise<{ id: string; existed: boolean } | null> {
  const supabase = createClient();

  // Check for existing trip with same couple + location + date
  const existingQuery = supabase
    .from('trips')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('province', trip.province)
    .eq('city', trip.city)
    .eq('visit_date', trip.visit_date);

  if (trip.scenic_spot) {
    (existingQuery as unknown as typeof existingQuery).eq('scenic_spot', trip.scenic_spot);
  } else {
    (existingQuery as unknown as typeof existingQuery).is('scenic_spot', null);
  }

  const { data: existing } = await existingQuery.maybeSingle() as { data: Pick<TripRow, 'id'> | null; error: { message: string } | null };

  if (existing) {
    return { id: existing.id, existed: true };
  }

  const id = crypto.randomUUID();
  const { error } = await supabase
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
    } as never);

  if (error) {
    console.error('Failed to create trip:', error.message);
    return null;
  }

  return { id, existed: false };
}

type PhotoRow = Database['public']['Tables']['photos']['Row'];
type PhotoInsert = Database['public']['Tables']['photos']['Insert'];

/**
 * Upload a photo file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPhoto(
  coupleId: string,
  file: File
): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${coupleId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type });

  if (error) {
    console.error('Failed to upload photo:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fetch all photo records for a specific trip.
 */
export async function getPhotosByTrip(tripId: string): Promise<PhotoRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true }) as { data: PhotoRow[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch trip photos:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch all photos for a couple, ordered by created_at descending.
 */
export async function getAllPhotosForCouple(
  coupleId: string
): Promise<{ id: string; file_url: string; created_at: string; visitDate?: string; tripLocation?: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('id, file_url, created_at, trips!inner(location_name, visit_date)')
    .eq('trips.couple_id', coupleId)
    .order('created_at', { ascending: false }) as { data: { id: string; file_url: string; created_at: string; trips: { location_name: string | null; visit_date: string } }[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch couple photos:', error.message);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    file_url: p.file_url,
    created_at: p.created_at,
    visitDate: p.trips?.visit_date,
    tripLocation: p.trips?.location_name ?? undefined,
  }));
}

/**
 * Create a photo record linked to a trip.
 */
export async function createPhotoRecord(
  tripId: string,
  fileUrl: string
): Promise<boolean> {
  const supabase = createClient();
  const insertData: PhotoInsert = {
    trip_id: tripId,
    file_url: fileUrl,
  };

  const { error } = await supabase
    .from('photos')
    .insert(insertData as never);

  if (error) {
    console.error('Failed to create photo record:', error.message);
    return false;
  }

  return true;
}

/**
 * Update trip fields (province, city, scenic_spot, visit_date, notes, location_name).
 */
export async function updateTrip(
  tripId: string,
  fields: {
    location_name?: string;
    province?: string;
    city?: string;
    scenic_spot?: string | null;
    lat?: number | null;
    lng?: number | null;
    visit_date?: string;
    notes?: string | null;
  }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('trips')
    .update(fields as never)
    .eq('id', tripId);

  if (error) {
    console.error('Failed to update trip:', error.message);
    return false;
  }

  return true;
}

/**
 * Delete a single photo record and its storage file.
 */
export async function deletePhoto(photoId: string, fileUrl: string): Promise<boolean> {
  const supabase = createClient();

  // Extract storage path from URL
  const urlParts = fileUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const coupleId = urlParts[urlParts.length - 2];
  const storagePath = `${coupleId}/${fileName}`;

  // Delete from storage
  await supabase.storage
    .from('photos')
    .remove([storagePath]);

  // Delete from DB
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('Failed to delete photo:', error.message);
    return false;
  }

  return true;
}

/**
 * Delete an entire trip and all its photos.
 */
export async function deleteTrip(tripId: string): Promise<boolean> {
  const supabase = createClient();

  // Fetch photos to delete from storage
  const photos = await getPhotosByTrip(tripId);

  // Delete from storage
  for (const photo of photos) {
    const urlParts = photo.file_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const coupleId = urlParts[urlParts.length - 2];
    const storagePath = `${coupleId}/${fileName}`;
    await supabase.storage
      .from('photos')
      .remove([storagePath]);
  }

  // Delete photo records from DB
  await supabase
    .from('photos')
    .delete()
    .eq('trip_id', tripId);

  // Delete trip
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error('Failed to delete trip:', error.message);
    return false;
  }

  return true;
}

/**
 * Upload multiple photos to a trip and create photo records.
 */
export async function uploadPhotosToTrip(
  tripId: string,
  coupleId: string,
  files: File[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<number> {
  let uploaded = 0;
  for (const file of files) {
    const url = await uploadPhoto(coupleId, file);
    if (url) {
      await createPhotoRecord(tripId, url);
    }
    uploaded++;
    onProgress?.(uploaded, files.length);
  }
  return uploaded;
}

/**
 * Update couple dates (since_date and anniversary).
 */
export async function updateCoupleDates(
  coupleId: string,
  fields: { since_date?: string | null; anniversary?: string | null }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('couples')
    .update(fields as never)
    .eq('id', coupleId);

  if (error) {
    console.error('Failed to update couple dates:', error.message);
    return false;
  }

  return true;
}

type TimelineRow = Database['public']['Tables']['timelines']['Row'];

export async function getTimelines(
  coupleId: string
): Promise<TimelineRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date', { ascending: true }) as { data: TimelineRow[] | null; error: { message: string } | null };

  if (error) {
    console.error('Failed to fetch timelines:', error.message);
    return [];
  }

  return data ?? [];
}

export async function addTimeline(
  coupleId: string,
  entry: { date: string; title: string; description?: string; icon?: string; type?: string }
): Promise<string | null> {
  const supabase = createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('timelines')
    .insert({
      id,
      couple_id: coupleId,
      date: entry.date,
      title: entry.title,
      description: entry.description ?? null,
      icon: entry.icon ?? null,
      type: entry.type ?? 'milestone',
    } as never);

  if (error) {
    console.error('Failed to add timeline:', error.message);
    return null;
  }

  return id;
}

export async function updateTimeline(
  timelineId: string,
  entry: { date?: string; title?: string; description?: string | null; icon?: string | null; type?: string }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('timelines')
    .update({ ...entry, updated_at: new Date().toISOString() } as never)
    .eq('id', timelineId);

  if (error) {
    console.error('Failed to update timeline:', error.message);
    return false;
  }

  return true;
}

export async function deleteTimeline(timelineId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('timelines')
    .delete()
    .eq('id', timelineId);

  if (error) {
    console.error('Failed to delete timeline:', error.message);
    return false;
  }

  return true;
}

type UserRow = Database['public']['Tables']['users']['Row'];

export async function updateUserProfile(
  fields: { nickname?: string; avatar_url?: string | null; city?: string | null; bio?: string | null; birthday?: string | null }
): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('users')
    .update(fields as never)
    .eq('id', user.id);

  if (error) {
    console.error('Failed to update user profile:', error.message);
    return false;
  }

  return true;
}
