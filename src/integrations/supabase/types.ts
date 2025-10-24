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
      achievement_showcase: {
        Row: {
          badge_id: string
          created_at: string
          display_order: number
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          display_order: number
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          display_order?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ai_cost_log: {
        Row: {
          cache_hit: boolean | null
          canary: boolean | null
          complexity: string | null
          cost_cents: number
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: number
          latency_ms: number
          model_id: string
          ocr_quality_score: number | null
          route: string
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          cache_hit?: boolean | null
          canary?: boolean | null
          complexity?: string | null
          cost_cents?: number
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: number
          latency_ms?: number
          model_id: string
          ocr_quality_score?: number | null
          route: string
          tokens_in?: number
          tokens_out?: number
          user_id: string
        }
        Update: {
          cache_hit?: boolean | null
          canary?: boolean | null
          complexity?: string | null
          cost_cents?: number
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: number
          latency_ms?: number
          model_id?: string
          ocr_quality_score?: number | null
          route?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_extraction_feedback: {
        Row: {
          created_at: string
          extracted_data: Json
          feedback_text: string | null
          feedback_type: string
          id: string
          image_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data: Json
          feedback_text?: string | null
          feedback_type: string
          id?: string
          image_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          image_path?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_image_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          image_hash: string
          model_id: string
          model_version: string
          ocr_confidence: number | null
          ocr_quality_score: number | null
          ocr_text: string | null
          parsed_json: Json
          perceptual_hash: string | null
          preprocessing_version: string
          prompt_version: string
          route_used: string
          tokens_saved: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          image_hash: string
          model_id: string
          model_version: string
          ocr_confidence?: number | null
          ocr_quality_score?: number | null
          ocr_text?: string | null
          parsed_json: Json
          perceptual_hash?: string | null
          preprocessing_version?: string
          prompt_version?: string
          route_used: string
          tokens_saved?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          image_hash?: string
          model_id?: string
          model_version?: string
          ocr_confidence?: number | null
          ocr_quality_score?: number | null
          ocr_text?: string | null
          parsed_json?: Json
          perceptual_hash?: string | null
          preprocessing_version?: string
          prompt_version?: string
          route_used?: string
          tokens_saved?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_trade_cache: {
        Row: {
          analysis_type: string
          cache_key: string
          created_at: string | null
          model_id: string
          parsed_json: Json
          prompt_version: string
          trade_hash: string
          trade_id: string | null
          ttl_expires_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          cache_key: string
          created_at?: string | null
          model_id: string
          parsed_json: Json
          prompt_version: string
          trade_hash: string
          trade_id?: string | null
          ttl_expires_at: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          cache_key?: string
          created_at?: string | null
          model_id?: string
          parsed_json?: Json
          prompt_version?: string
          trade_hash?: string
          trade_id?: string | null
          ttl_expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_id: string
          alert_type: string
          clicked: boolean
          clicked_at: string | null
          created_at: string
          id: string
          message: string
          notification_sent_at: string | null
          notified: boolean
          threshold_value: number
          triggered_value: number
          user_id: string
        }
        Insert: {
          alert_id: string
          alert_type: string
          clicked?: boolean
          clicked_at?: string | null
          created_at?: string
          id?: string
          message: string
          notification_sent_at?: string | null
          notified?: boolean
          threshold_value: number
          triggered_value: number
          user_id: string
        }
        Update: {
          alert_id?: string
          alert_type?: string
          clicked?: boolean
          clicked_at?: string | null
          created_at?: string
          id?: string
          message?: string
          notification_sent_at?: string | null
          notified?: boolean
          threshold_value?: number
          triggered_value?: number
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          categories_json: Json | null
          coingecko_id: string | null
          color_hex: string | null
          created_at: string
          decimals: number
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          primary_category: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          categories_json?: Json | null
          coingecko_id?: string | null
          color_hex?: string | null
          created_at?: string
          decimals?: number
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          primary_category?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          categories_json?: Json | null
          coingecko_id?: string | null
          color_hex?: string | null
          created_at?: string
          decimals?: number
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          primary_category?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      badge_tiers: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          requirement_multiplier: number
          tier: string
          xp_reward: number
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          requirement_multiplier?: number
          tier: string
          xp_reward?: number
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          requirement_multiplier?: number
          tier?: string
          xp_reward?: number
        }
        Relationships: []
      }
      browser_notifications: {
        Row: {
          created_at: string
          id: string
          last_notified_at: string | null
          push_subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_notified_at?: string | null
          push_subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_notified_at?: string | null
          push_subscription?: Json
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
      categories: {
        Row: {
          coingecko_category_id: string | null
          color_hex: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          coingecko_category_id?: string | null
          color_hex: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          coingecko_category_id?: string | null
          color_hex?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          target_currency: string
          updated_at: string
        }
        Insert: {
          base_currency: string
          id?: string
          rate: number
          target_currency: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          target_currency?: string
          updated_at?: string
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
      custom_tags: {
        Row: {
          created_at: string | null
          id: string
          tag_name: string
          tag_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_name: string
          tag_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_name?: string
          tag_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          mystery_unlocked: boolean | null
          target_value: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          challenge_date?: string
          challenge_type: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          mystery_unlocked?: boolean | null
          target_value: number
          user_id: string
          xp_reward: number
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          mystery_unlocked?: boolean | null
          target_value?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      dopamine_events: {
        Row: {
          animation_type: string | null
          event_type: string
          id: string
          sound_type: string | null
          triggered_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          animation_type?: string | null
          event_type: string
          id?: string
          sound_type?: string | null
          triggered_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          animation_type?: string | null
          event_type?: string
          id?: string
          sound_type?: string | null
          triggered_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
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
          failed_sync_count: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_deposit_sync_at: string | null
          last_order_sync_at: string | null
          last_synced_at: string | null
          last_trade_sync_at: string | null
          last_withdrawal_sync_at: string | null
          sync_cursor: Json | null
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
          failed_sync_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_deposit_sync_at?: string | null
          last_order_sync_at?: string | null
          last_synced_at?: string | null
          last_trade_sync_at?: string | null
          last_withdrawal_sync_at?: string | null
          sync_cursor?: Json | null
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
          failed_sync_count?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_deposit_sync_at?: string | null
          last_order_sync_at?: string | null
          last_synced_at?: string | null
          last_trade_sync_at?: string | null
          last_withdrawal_sync_at?: string | null
          sync_cursor?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_deposits: {
        Row: {
          amount: number
          connection_id: string
          created_at: string | null
          currency: string
          exchange_deposit_id: string
          id: string
          network: string | null
          status: string
          timestamp: string
          tx_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          connection_id: string
          created_at?: string | null
          currency: string
          exchange_deposit_id: string
          id?: string
          network?: string | null
          status: string
          timestamp: string
          tx_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          connection_id?: string
          created_at?: string | null
          currency?: string
          exchange_deposit_id?: string
          id?: string
          network?: string | null
          status?: string
          timestamp?: string
          tx_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_deposits_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_orders: {
        Row: {
          connection_id: string
          created_at: string | null
          exchange_order_id: string
          filled: number | null
          id: string
          price: number
          quantity: number
          side: string
          status: string
          symbol: string
          timestamp: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          exchange_order_id: string
          filled?: number | null
          id?: string
          price: number
          quantity: number
          side: string
          status: string
          symbol: string
          timestamp: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          exchange_order_id?: string
          filled?: number | null
          id?: string
          price?: number
          quantity?: number
          side?: string
          status?: string
          symbol?: string
          timestamp?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
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
      exchange_rates_cache: {
        Row: {
          id: string
          rates: Json
          updated_at: string
        }
        Insert: {
          id: string
          rates: Json
          updated_at?: string
        }
        Update: {
          id?: string
          rates?: Json
          updated_at?: string
        }
        Relationships: []
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
      exchange_withdrawals: {
        Row: {
          amount: number
          connection_id: string
          created_at: string | null
          currency: string
          exchange_withdrawal_id: string
          fee: number
          id: string
          network: string | null
          status: string
          timestamp: string
          tx_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          connection_id: string
          created_at?: string | null
          currency: string
          exchange_withdrawal_id: string
          fee: number
          id?: string
          network?: string | null
          status: string
          timestamp: string
          tx_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          connection_id?: string
          created_at?: string | null
          currency?: string
          exchange_withdrawal_id?: string
          fee?: number
          id?: string
          network?: string | null
          status?: string
          timestamp?: string
          tx_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_withdrawals_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          generated_at: string
          id: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          trade_count: number
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          trade_count?: number
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          trade_count?: number
          user_id?: string
        }
        Relationships: []
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
      leaderboard_entries: {
        Row: {
          consistency_index: number
          created_at: string
          id: string
          performance_score: number
          rank: number
          roi: number
          season_id: string
          updated_at: string
          user_id: string
          win_rate: number
        }
        Insert: {
          consistency_index?: number
          created_at?: string
          id?: string
          performance_score?: number
          rank?: number
          roi?: number
          season_id: string
          updated_at?: string
          user_id: string
          win_rate?: number
        }
        Update: {
          consistency_index?: number
          created_at?: string
          id?: string
          performance_score?: number
          rank?: number
          roi?: number
          season_id?: string
          updated_at?: string
          user_id?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasonal_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_learned_log: {
        Row: {
          confirmed_at: string
          created_at: string | null
          errors_shown: Json
          hold_duration_seconds: number
          id: string
          shown_date: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          created_at?: string | null
          errors_shown?: Json
          hold_duration_seconds: number
          id?: string
          shown_date?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          created_at?: string | null
          errors_shown?: Json
          hold_duration_seconds?: number
          id?: string
          shown_date?: string
          user_id?: string
        }
        Relationships: []
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
      mystery_rewards: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rarity: string
          reward_type: string
          reward_value: number
          trigger_condition: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rarity?: string
          reward_type: string
          reward_value: number
          trigger_condition?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rarity?: string
          reward_type?: string
          reward_value?: number
          trigger_condition?: Json
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      performance_alerts: {
        Row: {
          alert_name: string
          alert_type: string
          comparison_operator: string
          cooldown_minutes: number
          created_at: string
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          threshold_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_name: string
          alert_type: string
          comparison_operator: string
          cooldown_minutes?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          threshold_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_name?: string
          alert_type?: string
          comparison_operator?: string
          cooldown_minutes?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          threshold_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          base_currency: string
          blur_sensitive: boolean
          category_split_mode: boolean
          cost_method: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string
          blur_sensitive?: boolean
          category_split_mode?: boolean
          cost_method?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          blur_sensitive?: boolean
          category_split_mode?: boolean
          cost_method?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      position_lots: {
        Row: {
          acquisition_date: string
          acquisition_tx_id: string | null
          asset_symbol: string
          cost_basis_per_unit: number
          created_at: string
          id: string
          is_closed: boolean
          lot_method: string
          quantity_remaining: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_date: string
          acquisition_tx_id?: string | null
          asset_symbol: string
          cost_basis_per_unit: number
          created_at?: string
          id?: string
          is_closed?: boolean
          lot_method: string
          quantity_remaining: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_date?: string
          acquisition_tx_id?: string | null
          asset_symbol?: string
          cost_basis_per_unit?: number
          created_at?: string
          id?: string
          is_closed?: boolean
          lot_method?: string
          quantity_remaining?: number
          updated_at?: string
          user_id?: string
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
      price_history: {
        Row: {
          created_at: string
          price: number
          source: string
          symbol: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          price: number
          source?: string
          symbol: string
          timestamp: string
        }
        Update: {
          created_at?: string
          price?: number
          source?: string
          symbol?: string
          timestamp?: string
        }
        Relationships: []
      }
      profile_frames: {
        Row: {
          created_at: string
          frame_id: string
          frame_name: string
          frame_style: Json
          id: string
          required_badge: string | null
          required_level: number | null
          unlock_requirement: string
        }
        Insert: {
          created_at?: string
          frame_id: string
          frame_name: string
          frame_style?: Json
          id?: string
          required_badge?: string | null
          required_level?: number | null
          unlock_requirement: string
        }
        Update: {
          created_at?: string
          frame_id?: string
          frame_name?: string
          frame_style?: Json
          id?: string
          required_badge?: string | null
          required_level?: number | null
          unlock_requirement?: string
        }
        Relationships: []
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
          subscription_status: string | null
          subscription_tier: string | null
          terms_accepted_at: string | null
          trial_end_date: string | null
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
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          trial_end_date?: string | null
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
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      psychology_logs: {
        Row: {
          conditions: string[] | null
          created_at: string
          emotional_state: string
          id: string
          intensity: number
          logged_at: string
          notes: string | null
          user_id: string
        }
        Insert: {
          conditions?: string[] | null
          created_at?: string
          emotional_state: string
          id?: string
          intensity: number
          logged_at?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          conditions?: string[] | null
          created_at?: string
          emotional_state?: string
          id?: string
          intensity?: number
          logged_at?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactions_log: {
        Row: {
          created_at: string
          id: string
          reaction_emoji: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_emoji: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_emoji?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      realized_pnl: {
        Row: {
          asset_symbol: string
          cost_disposed_base: number
          created_at: string
          fees_base: number
          id: string
          proceeds_base: number
          realized_date: string
          realized_pnl: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          asset_symbol: string
          cost_disposed_base: number
          created_at?: string
          fees_base?: number
          id?: string
          proceeds_base: number
          realized_date: string
          realized_pnl: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          asset_symbol?: string
          cost_disposed_base?: number
          created_at?: string
          fees_base?: number
          id?: string
          proceeds_base?: number
          realized_date?: string
          realized_pnl?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          date_range: Json
          error_message: string | null
          file_size: string | null
          file_url: string | null
          id: string
          metrics: Json | null
          report_format: string
          report_name: string
          report_type: string
          sections: string[]
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_range: Json
          error_message?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          metrics?: Json | null
          report_format: string
          report_name: string
          report_type: string
          sections: string[]
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_range?: Json
          error_message?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          metrics?: Json | null
          report_format?: string
          report_name?: string
          report_type?: string
          sections?: string[]
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          email_address: string | null
          email_enabled: boolean | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          report_config: Json
          report_format: string
          report_type: string
          schedule_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean | null
          frequency: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          report_config: Json
          report_format: string
          report_type: string
          schedule_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          report_config?: Json
          report_format?: string
          report_type?: string
          schedule_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seasonal_challenges: {
        Row: {
          challenge_type: string
          completed_at: string | null
          cosmetic_reward: string | null
          created_at: string
          current_progress: number
          description: string
          id: string
          is_completed: boolean
          season_id: string
          target_value: number
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          completed_at?: string | null
          cosmetic_reward?: string | null
          created_at?: string
          current_progress?: number
          description: string
          id?: string
          is_completed?: boolean
          season_id: string
          target_value: number
          title: string
          user_id: string
          xp_reward: number
        }
        Update: {
          challenge_type?: string
          completed_at?: string | null
          cosmetic_reward?: string | null
          created_at?: string
          current_progress?: number
          description?: string
          id?: string
          is_completed?: boolean
          season_id?: string
          target_value?: number
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_challenges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasonal_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_competitions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          season_name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          season_name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          season_name?: string
          start_date?: string
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
      social_notifications: {
        Row: {
          actor_avatar: string | null
          actor_id: string | null
          actor_name: string
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar?: string | null
          actor_id?: string | null
          actor_name: string
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          actor_avatar?: string | null
          actor_id?: string | null
          actor_name?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          read?: boolean | null
          type?: string
          user_id?: string
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
          media_urls: string[] | null
          post_type: string
          shares_count: number | null
          trade_data: Json | null
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
          media_urls?: string[] | null
          post_type: string
          shares_count?: number | null
          trade_data?: Json | null
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
          media_urls?: string[] | null
          post_type?: string
          shares_count?: number | null
          trade_data?: Json | null
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
          cost_basis_method: string | null
          created_at: string
          exchange: string | null
          fee_amount: number | null
          fee_currency: string | null
          fx_rate: number | null
          holding_id: string | null
          id: string
          is_realized_event: boolean | null
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
          cost_basis_method?: string | null
          created_at?: string
          exchange?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          fx_rate?: number | null
          holding_id?: string | null
          id?: string
          is_realized_event?: boolean | null
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
          cost_basis_method?: string | null
          created_at?: string
          exchange?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          fx_rate?: number | null
          holding_id?: string | null
          id?: string
          is_realized_event?: boolean | null
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
      streak_freeze_inventory: {
        Row: {
          created_at: string
          earned_from_level: number | null
          earned_from_streak: number | null
          freeze_tokens: number
          id: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_from_level?: number | null
          earned_from_streak?: number | null
          freeze_tokens?: number
          id?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          earned_from_level?: number | null
          earned_from_streak?: number | null
          freeze_tokens?: number
          id?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tour_versions: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          steps: Json
          title: string
          type: string
          version: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          steps: Json
          title: string
          type: string
          version: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          steps?: Json
          title?: string
          type?: string
          version?: number
        }
        Relationships: []
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
          account_id: string | null
          broker: string | null
          closed_at: string | null
          created_at: string | null
          deleted_at: string | null
          duration_days: number | null
          duration_hours: number | null
          duration_minutes: number | null
          emotion_tags: string[] | null
          emotional_tag: string | null
          entry_price: number | null
          error_description: string | null
          error_tags: string[] | null
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
          slippage_cost: number | null
          spread_cost: number | null
          symbol: string | null
          symbol_temp: string
          trade_date: string | null
          trade_hash: string | null
          trade_type: string | null
          trading_fee: number | null
          updated_at: string | null
          user_id: string
          xp_awarded: boolean
        }
        Insert: {
          account_id?: string | null
          broker?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          emotion_tags?: string[] | null
          emotional_tag?: string | null
          entry_price?: number | null
          error_description?: string | null
          error_tags?: string[] | null
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
          slippage_cost?: number | null
          spread_cost?: number | null
          symbol?: string | null
          symbol_temp: string
          trade_date?: string | null
          trade_hash?: string | null
          trade_type?: string | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id: string
          xp_awarded?: boolean
        }
        Update: {
          account_id?: string | null
          broker?: string | null
          closed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          duration_days?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          emotion_tags?: string[] | null
          emotional_tag?: string | null
          entry_price?: number | null
          error_description?: string | null
          error_tags?: string[] | null
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
          slippage_cost?: number | null
          spread_cost?: number | null
          symbol?: string | null
          symbol_temp?: string
          trade_date?: string | null
          trade_hash?: string | null
          trade_type?: string | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id?: string
          xp_awarded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string
          broker: string
          created_at: string
          currency: string
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string
          broker: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string
          broker?: string
          created_at?: string
          currency?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          notes?: string | null
          updated_at?: string
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
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
      trading_journal: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lessons_learned: string | null
          mood: string | null
          rating: number | null
          tags: string[] | null
          title: string
          trade_id: string | null
          updated_at: string | null
          user_id: string
          what_to_improve: string | null
          what_went_well: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lessons_learned?: string | null
          mood?: string | null
          rating?: number | null
          tags?: string[] | null
          title: string
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
          what_to_improve?: string | null
          what_went_well?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lessons_learned?: string | null
          mood?: string | null
          rating?: number | null
          tags?: string[] | null
          title?: string
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
          what_to_improve?: string | null
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_journal_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_plans: {
        Row: {
          created_at: string
          description: string | null
          entry_rules: string | null
          exit_rules: string | null
          id: string
          is_active: boolean | null
          markets: string[] | null
          name: string
          position_sizing: string | null
          review_process: string | null
          risk_management: string | null
          timeframes: string[] | null
          trading_schedule: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_rules?: string | null
          exit_rules?: string | null
          id?: string
          is_active?: boolean | null
          markets?: string[] | null
          name: string
          position_sizing?: string | null
          review_process?: string | null
          risk_management?: string | null
          timeframes?: string[] | null
          trading_schedule?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_rules?: string | null
          exit_rules?: string | null
          id?: string
          is_active?: boolean | null
          markets?: string[] | null
          name?: string
          position_sizing?: string | null
          review_process?: string | null
          risk_management?: string | null
          timeframes?: string[] | null
          trading_schedule?: string | null
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
          progress_to_next_tier: number
          tier: string
          unlock_animation_seen: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          notified?: boolean
          progress_to_next_tier?: number
          tier?: string
          unlock_animation_seen?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          notified?: boolean
          progress_to_next_tier?: number
          tier?: string
          unlock_animation_seen?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      updates_log: {
        Row: {
          changes: Json
          created_at: string | null
          description: string
          id: number
          published: boolean | null
          title: string
          version: number
        }
        Insert: {
          changes: Json
          created_at?: string | null
          description: string
          id?: number
          published?: boolean | null
          title: string
          version: number
        }
        Update: {
          changes?: Json
          created_at?: string | null
          description?: string
          id?: number
          published?: boolean | null
          title?: string
          version?: number
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          assets: string[]
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      user_ai_budget: {
        Row: {
          blocked_at_100_percent: boolean | null
          budget_cents: number
          created_at: string | null
          force_lite_at_80_percent: boolean | null
          last_reset_at: string | null
          month_start: string
          plan: string
          spend_cents: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at_100_percent?: boolean | null
          budget_cents: number
          created_at?: string | null
          force_lite_at_80_percent?: boolean | null
          last_reset_at?: string | null
          month_start: string
          plan: string
          spend_cents?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at_100_percent?: boolean | null
          budget_cents?: number
          created_at?: string | null
          force_lite_at_80_percent?: boolean | null
          last_reset_at?: string | null
          month_start?: string
          plan?: string
          spend_cents?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ai_usage: {
        Row: {
          analyses_run: number | null
          chat_messages: number | null
          clarifications_run: number | null
          images_used: number | null
          month_start: string
          predictions_run: number | null
          psychology_run: number | null
          reports_run: number | null
          total_tokens_in: number | null
          total_tokens_out: number | null
          user_id: string
          widgets_run: number | null
        }
        Insert: {
          analyses_run?: number | null
          chat_messages?: number | null
          clarifications_run?: number | null
          images_used?: number | null
          month_start: string
          predictions_run?: number | null
          psychology_run?: number | null
          reports_run?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          user_id: string
          widgets_run?: number | null
        }
        Update: {
          analyses_run?: number | null
          chat_messages?: number | null
          clarifications_run?: number | null
          images_used?: number | null
          month_start?: string
          predictions_run?: number | null
          psychology_run?: number | null
          reports_run?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          user_id?: string
          widgets_run?: number | null
        }
        Relationships: []
      }
      user_broker_preferences: {
        Row: {
          broker_name: string
          created_at: string
          id: string
          last_used_at: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          broker_name: string
          created_at?: string
          id?: string
          last_used_at?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          broker_name?: string
          created_at?: string
          id?: string
          last_used_at?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_customization_preferences: {
        Row: {
          active_theme: string
          animation_speed: string
          calm_mode_enabled: boolean
          created_at: string
          haptic_feedback_enabled: boolean
          id: string
          profile_frame: string | null
          sound_enabled: boolean
          unlocked_themes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_theme?: string
          animation_speed?: string
          calm_mode_enabled?: boolean
          created_at?: string
          haptic_feedback_enabled?: boolean
          id?: string
          profile_frame?: string | null
          sound_enabled?: boolean
          unlocked_themes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_theme?: string
          animation_speed?: string
          calm_mode_enabled?: boolean
          created_at?: string
          haptic_feedback_enabled?: boolean
          id?: string
          profile_frame?: string | null
          sound_enabled?: boolean
          unlocked_themes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          page_icon: string
          page_title: string
          page_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          page_icon: string
          page_title: string
          page_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          page_icon?: string
          page_title?: string
          page_url?: string
          updated_at?: string | null
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
      user_profile_frames: {
        Row: {
          frame_id: string
          id: string
          is_active: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          frame_id: string
          id?: string
          is_active?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          frame_id?: string
          id?: string
          is_active?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progression: {
        Row: {
          created_at: string
          customization_count: number
          daily_streak: number
          id: string
          last_active_date: string
          level: number
          rank: string
          rank_expires_at: string | null
          total_badges_unlocked: number
          trader_identity_scores: Json | null
          updated_at: string
          user_id: string
          weekly_streak: number
          xp: number
        }
        Insert: {
          created_at?: string
          customization_count?: number
          daily_streak?: number
          id?: string
          last_active_date?: string
          level?: number
          rank?: string
          rank_expires_at?: string | null
          total_badges_unlocked?: number
          trader_identity_scores?: Json | null
          updated_at?: string
          user_id: string
          weekly_streak?: number
          xp?: number
        }
        Update: {
          created_at?: string
          customization_count?: number
          daily_streak?: number
          id?: string
          last_active_date?: string
          level?: number
          rank?: string
          rank_expires_at?: string | null
          total_badges_unlocked?: number
          trader_identity_scores?: Json | null
          updated_at?: string
          user_id?: string
          weekly_streak?: number
          xp?: number
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          id: string
          is_seen: boolean
          reward_id: string
          reward_type: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_seen?: boolean
          reward_id: string
          reward_type: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_seen?: boolean
          reward_id?: string
          reward_type?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rivals: {
        Row: {
          created_at: string
          id: string
          last_notified_at: string | null
          rival_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_notified_at?: string | null
          rival_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_notified_at?: string | null
          rival_user_id?: string
          user_id?: string
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
          crypto_display_mode: boolean | null
          currency: string | null
          display_currency: string | null
          email_notifications: boolean | null
          event_reminders: boolean | null
          guided_tour_completed: boolean | null
          id: string
          initial_investment: number | null
          language: string | null
          last_seen_updates_version: number | null
          layout_json: Json | null
          monthly_report: boolean | null
          onboarding_completed: boolean | null
          performance_alerts: boolean | null
          sidebar_style: string | null
          theme: string | null
          tour_version_completed: number | null
          trade_reminders: boolean | null
          updated_at: string | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          accent_color?: string | null
          blur_enabled?: boolean | null
          created_at?: string | null
          crypto_display_mode?: boolean | null
          currency?: string | null
          display_currency?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          guided_tour_completed?: boolean | null
          id?: string
          initial_investment?: number | null
          language?: string | null
          last_seen_updates_version?: number | null
          layout_json?: Json | null
          monthly_report?: boolean | null
          onboarding_completed?: boolean | null
          performance_alerts?: boolean | null
          sidebar_style?: string | null
          theme?: string | null
          tour_version_completed?: number | null
          trade_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          accent_color?: string | null
          blur_enabled?: boolean | null
          created_at?: string | null
          crypto_display_mode?: boolean | null
          currency?: string | null
          display_currency?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          guided_tour_completed?: boolean | null
          id?: string
          initial_investment?: number | null
          language?: string | null
          last_seen_updates_version?: number | null
          layout_json?: Json | null
          monthly_report?: boolean | null
          onboarding_completed?: boolean | null
          performance_alerts?: boolean | null
          sidebar_style?: string | null
          theme?: string | null
          tour_version_completed?: number | null
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
      user_trade_patterns: {
        Row: {
          avg_leverage: number | null
          broker_frequency: Json | null
          emotional_tag_frequency: Json | null
          id: string
          last_updated: string
          setup_frequency: Json | null
          symbol_frequency: Json | null
          user_id: string
        }
        Insert: {
          avg_leverage?: number | null
          broker_frequency?: Json | null
          emotional_tag_frequency?: Json | null
          id?: string
          last_updated?: string
          setup_frequency?: Json | null
          symbol_frequency?: Json | null
          user_id: string
        }
        Update: {
          avg_leverage?: number | null
          broker_frequency?: Json | null
          emotional_tag_frequency?: Json | null
          id?: string
          last_updated?: string
          setup_frequency?: Json | null
          symbol_frequency?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_widget_styles: {
        Row: {
          id: string
          is_active: boolean
          style_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          style_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          style_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp_levels: {
        Row: {
          created_at: string
          current_level: number
          current_xp: number
          id: string
          last_xp_earned_at: string | null
          level_up_count: number
          total_xp_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_xp?: number
          id?: string
          last_xp_earned_at?: string | null
          level_up_count?: number
          total_xp_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_xp?: number
          id?: string
          last_xp_earned_at?: string | null
          level_up_count?: number
          total_xp_earned?: number
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
      weekly_challenges: {
        Row: {
          challenge_type: string
          completed_at: string | null
          created_at: string
          current_progress: number
          description: string
          id: string
          is_completed: boolean
          target_value: number
          title: string
          user_id: string
          week_start_date: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description: string
          id?: string
          is_completed?: boolean
          target_value: number
          title: string
          user_id: string
          week_start_date?: string
          xp_reward: number
        }
        Update: {
          challenge_type?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description?: string
          id?: string
          is_completed?: boolean
          target_value?: number
          title?: string
          user_id?: string
          week_start_date?: string
          xp_reward?: number
        }
        Relationships: []
      }
      widget_styles: {
        Row: {
          created_at: string
          id: string
          required_level: number | null
          style_config: Json
          style_id: string
          style_name: string
          unlock_requirement: string
        }
        Insert: {
          created_at?: string
          id?: string
          required_level?: number | null
          style_config?: Json
          style_id: string
          style_name: string
          unlock_requirement: string
        }
        Update: {
          created_at?: string
          id?: string
          required_level?: number | null
          style_config?: Json
          style_id?: string
          style_name?: string
          unlock_requirement?: string
        }
        Relationships: []
      }
      widget_usage_stats: {
        Row: {
          created_at: string
          id: string
          interaction_count: number
          last_interacted_at: string
          total_time_seconds: number
          user_id: string
          widget_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_count?: number
          last_interacted_at?: string
          total_time_seconds?: number
          user_id: string
          widget_type: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_count?: number
          last_interacted_at?: string
          total_time_seconds?: number
          user_id?: string
          widget_type?: string
        }
        Relationships: []
      }
      xp_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
          xp_earned: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
          xp_earned?: number
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
      check_daily_alert_cap: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_deleted_trades: { Args: never; Returns: undefined }
      cleanup_expired_deleted_batches: { Args: never; Returns: undefined }
      cleanup_expired_pending_trades: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_spend: {
        Args: { p_cost_cents: number; p_month_start: string; p_user_id: string }
        Returns: undefined
      }
      increment_broker_usage: {
        Args: { p_broker_name: string }
        Returns: undefined
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
      user_has_access: { Args: { _user_id: string }; Returns: boolean }
      user_has_active_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
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
