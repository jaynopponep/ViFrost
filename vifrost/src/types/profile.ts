export type UserRole = "admin" | "user"

export type UserStatus = "pending" | "approved" | "banned" | "rejected"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
  rating: number
  peak_rating: number
  wins: number
  losses: number
  ties: number
  current_streak: number
}

export interface MatchRecord {
  id: string
  created_at: string
  room_id: string
  mode: "ranked" | "casual"
  player1_id: string
  player2_id: string
  player1_score: number
  player2_score: number
  winner_id: string | null
  player1_rating_before: number
  player1_rating_after: number
  player2_rating_before: number
  player2_rating_after: number
  challenge: string
  duration_seconds: number
}

export interface LeaderboardRow {
  id: string
  display_name: string
  rating: number
  wins: number
  losses: number
  ties: number
}

export interface AdminStats {
  total: number
  pending: number
  approved: number
  banned: number
  rejected: number
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          role?: UserRole
          status?: UserStatus
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      admin_moderate_user: {
        Args: {
          target_id: string
          new_status: UserStatus
        }
        Returns: Profile
      }
      admin_set_user_role: {
        Args: {
          target_id: string
          new_role: UserRole
        }
        Returns: Profile
      }
      admin_get_stats: {
        Args: Record<string, never>
        Returns: AdminStats
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
    }
    CompositeTypes: Record<string, never>
  }
}
