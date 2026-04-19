import { createClient } from '@/lib/supabase-browser';
import type { Database } from './database.types';

type TripRow = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];

/**
 * Get the couple_id for the currently logged-in user.
 * Looks up the couples table to find which couple the user belongs to.
 * Returns null if the user is not in any couple.
 */
type CoupleRow = Database['public']['Tables']['couples']['Row'];

export async function getCoupleId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('couples')
    .select('id')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .single() as { data: Pick<CoupleRow, 'id'> | null; error: { message: string } | null };

  return data?.id ?? null;
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
 * Create a new trip record.
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
): Promise<{ id: string } | null> {
  const supabase = createClient();
  const insertData: TripInsert = {
    couple_id: coupleId,
    location_name: trip.location_name,
    province: trip.province,
    city: trip.city,
    scenic_spot: trip.scenic_spot ?? null,
    lat: trip.lat ?? null,
    lng: trip.lng ?? null,
    visit_date: trip.visit_date,
    notes: trip.notes ?? null,
  };

  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('trips')
    .insert({ ...insertData, id } as never);

  if (error) {
    console.error('Failed to create trip:', error.message);
    return null;
  }

  return { id };
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
