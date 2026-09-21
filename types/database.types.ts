// Tipi generati manualmente per il primo avvio. Dopo il primo deploy,
// rigenerare con: `npm run types:generate` (richiede supabase CLI e
// SUPABASE_PROJECT_ID), che sovrascriverà questo file con i tipi reali
// e sempre allineati allo schema.
//
// STATO ATTUALE: questo file NON è più passato come generic al client
// Supabase (vedi lib/supabase/server.ts) perché la forma esatta attesa
// varia tra versioni minori di @supabase/supabase-js/postgrest-js e
// senza le dipendenze reali installate non potevo verificarla — ha
// causato build fallite su Vercel. Resta comunque utile come tipo
// standalone per le props dei componenti (es. Database['public']
// ['Tables']['players']['Row']). Dopo aver rigenerato questo file con
// la CLI Supabase reale, puoi reintrodurre createServerClient<Database>
// in lib/supabase/server.ts con sicurezza.
//
// NOTA: ogni tabella include "Relationships: []" perché è un campo
// richiesto dalla struttura generica attesa da @supabase/supabase-js
// per riconoscere correttamente lo schema tipizzato (senza, i tipi
// delle query collassano su "never").

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name: string; avatar_url?: string | null };
        Update: { full_name?: string; avatar_url?: string | null };
        Relationships: [];
      };
      seasons: {
        Row: { id: string; coach_id: string; name: string; start_date: string | null; end_date: string | null; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { coach_id: string; name: string; start_date?: string | null; end_date?: string | null };
        Update: { name?: string; is_archived?: boolean };
        Relationships: [];
      };
      teams: {
        Row: { id: string; season_id: string; name: string; logo_url: string | null; category: string | null; created_at: string; updated_at: string };
        Insert: { season_id: string; name: string; logo_url?: string | null; category?: string | null };
        Update: { name?: string; logo_url?: string | null; category?: string | null };
        Relationships: [];
      };
      team_members: {
        Row: { id: string; team_id: string; user_id: string; role: 'allenatore' | 'vice' | 'collaboratore'; created_at: string };
        Insert: { team_id: string; user_id: string; role?: 'allenatore' | 'vice' | 'collaboratore' };
        Update: { role?: 'allenatore' | 'vice' | 'collaboratore' };
        Relationships: [];
      };
      players: {
        Row: { id: string; team_id: string; first_name: string; last_name: string; jersey_number: number | null; position: 'portiere' | 'difensore' | 'centrocampista' | 'attaccante' | null; photo_url: string | null; phone: string | null; birth_date: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { team_id: string; first_name: string; last_name: string; jersey_number?: number | null; position?: string | null; phone?: string | null; birth_date?: string | null; notes?: string | null };
        Update: { first_name?: string; last_name?: string; jersey_number?: number | null; position?: string | null; photo_url?: string | null; phone?: string | null; birth_date?: string | null; notes?: string | null };
        Relationships: [];
      };
      player_tokens: {
        Row: { id: string; player_id: string; token: string; is_active: boolean; created_at: string; regenerated_at: string | null };
        Insert: { player_id: string };
        Update: { is_active?: boolean; token?: string };
        Relationships: [];
      };
      trainings: {
        Row: { id: string; team_id: string; session_date: string; title: string | null; notes: string | null; created_by: string; created_at: string; updated_at: string };
        Insert: { team_id: string; session_date: string; title?: string | null; created_by: string };
        Update: { title?: string | null; notes?: string | null; session_date?: string };
        Relationships: [];
      };
      attendances: {
        Row: { id: string; training_id: string; player_id: string; status: 'presente' | 'assente'; created_at: string };
        Insert: { training_id: string; player_id: string; status: 'presente' | 'assente' };
        Update: { status?: 'presente' | 'assente' };
        Relationships: [];
      };
      matches: {
        Row: { id: string; training_id: string; team_a_name: string; team_b_name: string; score_a: number; score_b: number; created_at: string; updated_at: string };
        Insert: { training_id: string; team_a_name?: string; team_b_name?: string };
        Update: { score_a?: number; score_b?: number; team_a_name?: string; team_b_name?: string };
        Relationships: [];
      };
      match_players: {
        Row: { id: string; match_id: string; player_id: string; team_side: 'A' | 'B'; minutes_played: number };
        Insert: { match_id: string; player_id: string; team_side: 'A' | 'B'; minutes_played?: number };
        Update: { team_side?: 'A' | 'B'; minutes_played?: number };
        Relationships: [];
      };
      tournaments: {
        Row: { id: string; training_id: string; name: string; mode: 'risultati' | 'classifica'; created_at: string };
        Insert: { training_id: string; name: string; mode: 'risultati' | 'classifica' };
        Update: { name?: string };
        Relationships: [];
      };
      tournament_teams: {
        Row: { id: string; tournament_id: string; name: string };
        Insert: { tournament_id: string; name: string };
        Update: { name?: string };
        Relationships: [];
      };
      tournament_matches: {
        Row: { id: string; tournament_id: string; team_a_id: string; team_b_id: string; score_a: number; score_b: number };
        Insert: { tournament_id: string; team_a_id: string; team_b_id: string };
        Update: { score_a?: number; score_b?: number };
        Relationships: [];
      };
      tournament_standing_entries: {
        Row: { id: string; tournament_id: string; tournament_team_id: string; final_position: number; points: number };
        Insert: { tournament_id: string; tournament_team_id: string; final_position: number; points: number };
        Update: { final_position?: number; points?: number };
        Relationships: [];
      };
      tournament_team_players: {
        Row: { id: string; tournament_team_id: string; player_id: string };
        Insert: { tournament_team_id: string; player_id: string };
        Update: { tournament_team_id?: string; player_id?: string };
        Relationships: [];
      };
      rpe_entries: {
        Row: { id: string; training_id: string; player_id: string; rpe: number; duration_minutes: number; session_load: number; created_at: string; updated_at: string };
        Insert: { training_id: string; player_id: string; rpe: number; duration_minutes: number };
        Update: { rpe?: number; duration_minutes?: number };
        Relationships: [];
      };
      penalties: {
        Row: { id: string; team_id: string; player_id: string; points: number; reason: string | null; created_by: string; created_at: string };
        Insert: { team_id: string; player_id: string; points: number; reason?: string | null; created_by: string };
        Update: { points?: number; reason?: string | null };
        Relationships: [];
      };
      activity_log: {
        Row: { id: string; team_id: string | null; user_id: string | null; action: string; entity_type: string; entity_id: string | null; old_value: Json | null; new_value: Json | null; created_at: string };
        Insert: { team_id?: string | null; user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; old_value?: Json | null; new_value?: Json | null };
        Update: { action?: string; entity_type?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_team_standings: {
        Args: { p_team_id: string };
        Returns: {
          player_id: string;
          full_name: string;
          played: number;
          wins: number;
          draws: number;
          losses: number;
          points: number;
          attendances_count: number;
          matches_count: number;
          minutes_total: number;
          win_rate: number;
          penalty_points: number;
        }[];
      };
      get_player_workload: {
        Args: { p_player_id: string };
        Returns: {
          training_date: string;
          session_load: number;
          acute_load: number | null;
          chronic_load: number | null;
          acwr: number | null;
          monotony: number | null;
          strain: number | null;
        }[];
      };
      create_season_with_team: {
        Args: { p_season_name: string; p_team_name: string; p_category: string | null };
        Returns: { season_id: string; team_id: string }[];
      };
      regenerate_player_token: {
        Args: { p_player_id: string };
        Returns: string;
      };
      invite_collaborator_by_email: {
        Args: { p_team_id: string; p_email: string; p_role: 'vice' | 'collaboratore' };
        Returns: string;
      };
    };
    Enums: {
      team_role: 'allenatore' | 'vice' | 'collaboratore';
      attendance_status: 'presente' | 'assente';
      match_side: 'A' | 'B';
      tournament_mode: 'risultati' | 'classifica';
      player_position: 'portiere' | 'difensore' | 'centrocampista' | 'attaccante';
    };
  };
}
