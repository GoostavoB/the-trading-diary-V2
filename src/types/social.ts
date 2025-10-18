export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
  profile_visibility: 'private' | 'followers' | 'public';
  followers_count: number;
  following_count: number;
  public_stats: any;
  created_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  trade_id: string | null;
  content: string;
  post_type: 'trade_share' | 'strategy' | 'milestone' | 'tip';
  visibility: 'private' | 'followers' | 'public';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface SharedStrategy {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  setup_type: string | null;
  rules: {
    entry?: string[];
    exit?: string[];
    risk_management?: string[];
  };
  performance_stats: any;
  visibility: 'public' | 'private';
  likes_count: number;
  uses_count: number;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
