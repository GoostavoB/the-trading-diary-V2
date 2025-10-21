export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analysis_cache: {
        Row: {
          analysis_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          request_hash: string
          result: Json
          trade_id: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_hash: string
          result: Json
          trade_id?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_hash?: string
          result?: Json
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_cache_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_history: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          message: string
          response: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          response: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      capital_log: {
        Row: {
          amount_added: number
          created_at: string
          id: string
          log_date: string
          notes: string | null
          total_after: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_added: number
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          total_after: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_added?: number
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          total_after?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_dashboard_widgets: {
        Row: {
          created_at: string
          description: string | null
          display_config: Json
          height: number
          id: string
          menu_item_id: string | null
          position_x: number
          position_y: number
          query_config: Json
          title: string
          updated_at: string
          user_id: string
          widget_type: string
          width: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_config?: Json
          height?: number
          id?: string
          menu_item_id?: string | null
          position_x?: number
          position_y?: number
          query_config?: Json
          title: string
          updated_at?: string
          user_id: string
          widget_type: string
          width?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_config?: Json
          height?: number
          id?: string
          menu_item_id?: string | null
          position_x?: number
          position_y?: number
          query_config?: Json
          title?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboard_widgets_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "custom_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_menu_items: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          label: string
          order_index: number
          parent_id: string | null
          route: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          order_index?: number
          parent_id?: string | null
          route?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          order_index?: number
          parent_id?: string | null
          route?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "custom_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string | null
          event_category: string | null
          event_impact: string | null
          event_name: string
          event_time: string
          id: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_category?: string | null
          event_impact?: string | null
          event_name: string
          event_time: string
          id?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_category?: string | null
          event_impact?: string | null
          event_name?: string
          event_time?: string
          id?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_connections: {
        Row: {
          api_key_encrypted: string
          api_passphrase_encrypted: string | null
          api_secret_encrypted: string
          created_at: string | null
          exchange_name: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_passphrase_encrypted?: string | null
          api_secret_encrypted: string
          created_at?: string | null
          exchange_name: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_passphrase_encrypted?: string | null
          api_secret_encrypted?: string
          created_at?: string | null
          exchange_name?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_pending_trades: {
        Row: {
          connection_id: string
          expires_at: string | null
          fetched_at: string | null
          id: string
          is_selected: boolean | null
          trade_data: Json
          user_id: string
        }
        Insert: {
          connection_id: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          is_selected?: boolean | null
          trade_data: Json
          user_id: string
        }
        Update: {
          connection_id?: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          is_selected?: boolean | null
          trade_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_pending_trades_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_sync_history: {
        Row: {
          completed_at: string | null
          connection_id: string | null
          created_at: string | null
          error_message: string | null
          exchange_name: string
          id: string
          started_at: string | null
          status: string
          sync_type: string
          trades_fetched: number | null
          trades_imported: number | null
          trades_skipped: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_name: string
          id?: string
          started_at?: string | null
          status: string
          sync_type: string
          trades_fetched?: number | null
          trades_imported?: number | null
          trades_skipped?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_name?: string
          id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
          trades_fetched?: number | null
          trades_imported?: number | null
          trades_skipped?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_sync_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          lessons_learned: string | null
          mood: string
          tags: string[] | null
          title: string
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          lessons_learned?: string | null
          mood: string
          tags?: string[] | null
          title: string
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          lessons_learned?: string | null
          mood?: string
          tags?: string[] | null
          title?: string
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      lsr_alert_daily_stats: {
        Row: {
          alerts_clicked: number
          alerts_dismissed: number
          alerts_triggered: number
          id: string
          stat_date: string
          user_id: string
        }
        Insert: {
          alerts_clicked?: number
          alerts_dismissed?: number
          alerts_triggered?: number
          id?: string
          stat_date?: string
          user_id: string
        }
        Update: {
          alerts_clicked?: number
          alerts_dismissed?: number
          alerts_triggered?: number
          id?: string
          stat_date?: string
          user_id?: string
        }
        Relationships: []
      }
      lsr_alert_history: {
        Row: {
          alert_id: string
          alert_type: string
          change_percentage: number | null
          clicked: boolean
          clicked_at: string | null
          direction: string | null
          id: string
          long_account: number | null
          notification_sent_at: string | null
          notified: boolean
          previous_value: number | null
          ratio_value: number
          short_account: number | null
          symbol: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          alert_id: string
          alert_type: string
          change_percentage?: number | null
          clicked?: boolean
          clicked_at?: string | null
          direction?: string | null
          id?: string
          long_account?: number | null
          notification_sent_at?: string | null
          notified?: boolean
          previous_value?: number | null
          ratio_value: number
          short_account?: number | null
          symbol: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          alert_type?: string
          change_percentage?: number | null
          clicked?: boolean
          clicked_at?: string | null
          direction?: string | null
          id?: string
          long_account?: number | null
          notification_sent_at?: string | null
          notified?: boolean
          previous_value?: number | null
          ratio_value?: number
          short_account?: number | null
          symbol?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lsr_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lsr_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      lsr_alerts: {
        Row: {
          alert_type: string
          cooldown_minutes: number | null
          created_at: string
          direction: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          symbol: string
          threshold_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          cooldown_minutes?: number | null
          created_at?: string
          direction?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          symbol?: string
          threshold_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          cooldown_minutes?: number | null
          created_at?: string
          direction?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          symbol?: string
          threshold_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lsr_latest_values: {
        Row: {
          binance_ratio: number | null
          bybit_ratio: number | null
          long_account: number
          ratio_value: number
          short_account: number
          symbol: string
          updated_at: string
        }
        Insert: {
          binance_ratio?: number | null
          bybit_ratio?: number | null
          long_account: number
          ratio_value: number
          short_account: number
          symbol: string
          updated_at?: string
        }
        Update: {
          binance_ratio?: number | null
          bybit_ratio?: number | null
          long_account?: number
          ratio_value?: number
          short_account?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_privacy_at: string | null
          accepted_terms_at: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          email: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          marketing_consent: boolean | null
          profile_visibility: string | null
          provider: string | null
          public_stats: Json | null
          terms_accepted_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          accepted_privacy_at?: string | null
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          marketing_consent?: boolean | null
          profile_visibility?: string | null
          provider?: string | null
          public_stats?: Json | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          accepted_privacy_at?: string | null
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean | null
          profile_visibility?: string | null
          provider?: string | null
          public_stats?: Json | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      shared_strategies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          likes_count: number | null
          performance_stats: Json | null
          rules: Json
          setup_type: string | null
          title: string
          updated_at: string | null
          user_id: string
          uses_count: number | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          performance_stats?: Json | null
          rules: Json
          setup_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          uses_count?: number | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          performance_stats?: Json | null
          rules?: Json
          setup_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          uses_count?: number | null
          visibility?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_type: string
          shares_count: number | null
          trade_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type: string
          shares_count?: number | null
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_type?: string
          shares_count?: number | null
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_holdings: {
        Row: {
          created_at: string
          exchange: string | null
          id: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          token_name: string
          token_symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exchange?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          token_name: string
          token_symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exchange?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          token_name?: string
          token_symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spot_transactions: {
        Row: {
          created_at: string
          exchange: string | null
          holding_id: string | null
          id: string
          notes: string | null
          price: number
          quantity: number
          token_symbol: string
          total_value: number
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exchange?: string | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price: number
          quantity: number
          token_symbol: string
          total_value: number
          transaction_date?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          exchange?: string | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price?: number
          quantity?: number
          token_symbol?: string
          total_value?: number
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "spot_holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_annotations: {
        Row: {
          annotation_type: string
          created_at: string | null
          id: string
          note: string | null
          price: number | null
          timestamp: string
          trade_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_type: string
          created_at?: string | null
          id?: string
          note?: string | null
          price?: number | null
          timestamp: string
          trade_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_type?: string
          created_at?: string | null
          id?: string
          note?: string | null
          price?: number | null
          timestamp?: string
          trade_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_annotations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          broker: string | null
          closed_at: string | null
          created_at: string | null
          deleted_at: string | null
          duration_days: number | null
          duration_hours: number | null
          duration_minutes: number | null
          emotional_tag: string | null
          entry_price: number | null
          exchange_source: string | null
          exchange_trade_id: string | null
          exit_price: number | null
          funding_fee: number | null
          id: string
          image_url: string | null
          leverage: number | null
          margin: number | null
          notes: string | null
          opened_at: string | null
          period_of_day: string | null
          pnl: number | null
          position_size: number | null
          profit_loss: number | null
          roi: number | null
          screenshot_url: string | null
          setup: string | null
          side: string | null
          side_temp: string | null
          symbol: string | null
          symbol_temp: string
          trade_date: string | null
          trade_hash: string | null
          trading_fee: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          emotional_tag?: string | null
          entry_price?: number | null
          exchange_source?: string | null
          exchange_trade_id?: string | null
          exit_price?: number | null
          funding_fee?: number | null
          id?: string
          image_url?: string | null
          leverage?: number | null
          margin?: number | null
          notes?: string | null
          opened_at?: string | null
          period_of_day?: string | null
          pnl?: number | null
          position_size?: number | null
          profit_loss?: number | null
          roi?: number | null
          screenshot_url?: string | null
          setup?: string | null
          side?: string | null
          side_temp?: string | null
          symbol?: string | null
          symbol_temp: string
          trade_date?: string | null
          trade_hash?: string | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          emotional_tag?: string | null
          entry_price?: number | null
          exchange_source?: string | null
          exchange_trade_id?: string | null
          exit_price?: number | null
          funding_fee?: number | null
          id?: string
          image_url?: string | null
          leverage?: number | null
          margin?: number | null
          notes?: string | null
          opened_at?: string | null
          period_of_day?: string | null
          pnl?: number | null
          position_size?: number | null
          profit_loss?: number | null
          roi?: number | null
          screenshot_url?: string | null
          setup?: string | null
          side?: string | null
          side_temp?: string | null
          symbol?: string | null
          symbol_temp?: string
          trade_date?: string | null
          trade_hash?: string | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trading_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          recurring: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          recurring?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          recurring?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_goals: {
        Row: {
          created_at: string
          current_value: number
          deadline: string | null
          goal_type: string
          id: string
          period: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type: string
          id?: string
          period: string
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          deadline?: string | null
          goal_type?: string
          id?: string
          period?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unlocked_badges: {
        Row: {
          badge_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          assets: string[]
          created_at: string
          id: string
          most_recent_trade_asset: string | null
          most_recent_trade_id: string | null
          most_recent_trade_value: number | null
          total_entry_value: number
          trade_count: number
          user_id: string
        }
        Insert: {
          assets?: string[]
          created_at?: string
          id?: string
          most_recent_trade_asset?: string | null
          most_recent_trade_id?: string | null
          most_recent_trade_value?: number | null
          total_entry_value?: number
          trade_count?: number
          user_id: string
        }
        Update: {
          assets?: string[]
          created_at?: string
          id?: string
          most_recent_trade_asset?: string | null
          most_recent_trade_id?: string | null
          most_recent_trade_value?: number | null
          total_entry_value?: number
          trade_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          accent_color: string | null
          blur_enabled: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          event_reminders: boolean | null
          id: string
          initial_investment: number | null
          layout_json: Json | null
          monthly_report: boolean | null
          performance_alerts: boolean | null
          sidebar_style: string | null
          theme: string | null
          trade_reminders: boolean | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          accent_color?: string | null
          blur_enabled?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          id?: string
          initial_investment?: number | null
          layout_json?: Json | null
          monthly_report?: boolean | null
          performance_alerts?: boolean | null
          sidebar_style?: string | null
          theme?: string | null
          trade_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          accent_color?: string | null
          blur_enabled?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          id?: string
          initial_investment?: number | null
          layout_json?: Json | null
          monthly_report?: boolean | null
          performance_alerts?: boolean | null
          sidebar_style?: string | null
          theme?: string | null
          trade_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      user_setups: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_snapshots: {
        Row: {
          created_at: string
          currency: string
          id: string
          snapshot_data: Json
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          snapshot_data: Json
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          snapshot_data?: Json
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string | null
          profile_visibility: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          profile_visibility?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          profile_visibility?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_daily_alert_cap: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_deleted_trades: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_pending_trades: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_alert_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      update_lsr_latest_value: {
        Args: {
          p_binance_ratio?: number
          p_bybit_ratio?: number
          p_long_account: number
          p_ratio_value: number
          p_short_account: number
          p_symbol: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
