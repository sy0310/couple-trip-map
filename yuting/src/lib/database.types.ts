export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          city: string | null;
          bio: string | null;
          birthday: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          city?: string | null;
          bio?: string | null;
          birthday?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          avatar_url?: string | null;
          city?: string | null;
          bio?: string | null;
          birthday?: string | null;
          created_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string | null;
          binding_code: string;
          since_date: string | null;
          anniversary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id?: string | null;
          binding_code: string;
          since_date?: string | null;
          anniversary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string | null;
          binding_code?: string;
          since_date?: string | null;
          anniversary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          couple_id: string;
          location_name: string;
          province: string;
          city: string;
          scenic_spot: string | null;
          lat: number | null;
          lng: number | null;
          visit_date: string;
          notes: string | null;
          photo_count: number;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          location_name: string;
          province: string;
          city: string;
          scenic_spot?: string | null;
          lat?: number | null;
          lng?: number | null;
          visit_date: string;
          notes?: string | null;
          photo_count?: number;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          location_name?: string;
          province?: string;
          city?: string;
          scenic_spot?: string | null;
          lat?: number | null;
          lng?: number | null;
          visit_date?: string;
          notes?: string | null;
          photo_count?: number;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          trip_id: string | null;
          file_url: string;
          description: string | null;
          taken_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          file_url: string;
          description?: string | null;
          taken_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          file_url?: string;
          description?: string | null;
          taken_at?: string | null;
          created_at?: string;
        };
      };
      timelines: {
        Row: {
          id: string;
          couple_id: string;
          date: string;
          title: string;
          description: string | null;
          icon: string | null;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          date: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          date?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
