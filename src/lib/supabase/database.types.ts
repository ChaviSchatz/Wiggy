export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity: {
        Row: {
          actor_user_id: string | null
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          payload: Json
          subject_id: string
          subject_type: string
          verb: string
          work_order_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payload?: Json
          subject_id: string
          subject_type: string
          verb: string
          work_order_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payload?: Json
          subject_id?: string
          subject_type?: string
          verb?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          business_id: string
          created_at: string
          file_name: string
          id: string
          kind: string
          mime_type: string | null
          parent_id: string
          parent_type: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          file_name: string
          id?: string
          kind: string
          mime_type?: string | null
          parent_id: string
          parent_type: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string | null
          parent_id?: string
          parent_type?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          business_id: string
          sprint_cadence_days: number
          updated_at: string
        }
        Insert: {
          business_id: string
          sprint_cadence_days?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          sprint_cadence_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          default_locale: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_locale?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_locale?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_items: {
        Row: {
          business_id: string
          created_at: string
          id: string
          kind: string
          message: string
          page_path: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          kind: string
          message: string
          page_path?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          kind?: string
          message?: string
          page_path?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_items_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_template_items: {
        Row: {
          config: Json
          created_at: string
          field_key: string | null
          field_label: string | null
          field_type: string | null
          id: string
          intake_template_id: string
          item_kind: string
          options: Json | null
          sort_order: number
          task_group_id: string | null
          task_type_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          field_key?: string | null
          field_label?: string | null
          field_type?: string | null
          id?: string
          intake_template_id: string
          item_kind: string
          options?: Json | null
          sort_order?: number
          task_group_id?: string | null
          task_type_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          field_key?: string | null
          field_label?: string | null
          field_type?: string | null
          id?: string
          intake_template_id?: string
          item_kind?: string
          options?: Json | null
          sort_order?: number
          task_group_id?: string | null
          task_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_template_items_intake_template_id_fkey"
            columns: ["intake_template_id"]
            isOneToOne: false
            referencedRelation: "intake_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_template_items_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_template_items_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_templates: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          work_order_kind: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          work_order_kind?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          work_order_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missing_items: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          handled_at: string | null
          id: string
          kind: string
          notes: string | null
          responsible_staff_member_id: string | null
          status: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          handled_at?: string | null
          id?: string
          kind: string
          notes?: string | null
          responsible_staff_member_id?: string | null
          status?: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          handled_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          responsible_staff_member_id?: string | null
          status?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_items_responsible_staff_member_id_fkey"
            columns: ["responsible_staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      runtime_tasks: {
        Row: {
          approver_staff_member_id: string | null
          assigned_staff_member_id: string | null
          availability_override: boolean
          business_id: string
          completed_at: string | null
          created_at: string
          deferred_reason: string | null
          deferred_until: string | null
          description: string | null
          due_at: string | null
          id: string
          origin_item_id: string | null
          priority: boolean
          production_notes: string | null
          queue_rank: number | null
          requires_approval: boolean
          sequence_order: number
          source: string
          sprint_id: string | null
          started_at: string | null
          status: string
          task_type_id: string | null
          title: string
          updated_at: string
          work_order_id: string
          work_stage_id: string
        }
        Insert: {
          approver_staff_member_id?: string | null
          assigned_staff_member_id?: string | null
          availability_override?: boolean
          business_id: string
          completed_at?: string | null
          created_at?: string
          deferred_reason?: string | null
          deferred_until?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          origin_item_id?: string | null
          priority?: boolean
          production_notes?: string | null
          queue_rank?: number | null
          requires_approval?: boolean
          sequence_order?: number
          source: string
          sprint_id?: string | null
          started_at?: string | null
          status?: string
          task_type_id?: string | null
          title: string
          updated_at?: string
          work_order_id: string
          work_stage_id: string
        }
        Update: {
          approver_staff_member_id?: string | null
          assigned_staff_member_id?: string | null
          availability_override?: boolean
          business_id?: string
          completed_at?: string | null
          created_at?: string
          deferred_reason?: string | null
          deferred_until?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          origin_item_id?: string | null
          priority?: boolean
          production_notes?: string | null
          queue_rank?: number | null
          requires_approval?: boolean
          sequence_order?: number
          source?: string
          sprint_id?: string | null
          started_at?: string | null
          status?: string
          task_type_id?: string | null
          title?: string
          updated_at?: string
          work_order_id?: string
          work_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runtime_tasks_approver_staff_member_id_fkey"
            columns: ["approver_staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_assigned_staff_member_id_fkey"
            columns: ["assigned_staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_origin_item_id_fkey"
            columns: ["origin_item_id"]
            isOneToOne: false
            referencedRelation: "intake_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runtime_tasks_work_stage_id_fkey"
            columns: ["work_stage_id"]
            isOneToOne: false
            referencedRelation: "work_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          business_id: string
          created_at: string
          ends_on: string
          id: string
          name: string | null
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          ends_on: string
          id?: string
          name?: string | null
          starts_on: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          name?: string | null
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          business_id: string
          created_at: string
          default_work_stage_id: string | null
          full_name: string
          id: string
          is_active: boolean
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          default_work_stage_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          default_work_stage_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_default_work_stage_id_fkey"
            columns: ["default_work_stage_id"]
            isOneToOne: false
            referencedRelation: "work_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approvals: {
        Row: {
          action: string
          actor_user_id: string | null
          business_id: string
          created_at: string
          id: string
          reason: string | null
          runtime_task_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          reason?: string | null
          runtime_task_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          runtime_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_approvals_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_runtime_task_id_fkey"
            columns: ["runtime_task_id"]
            isOneToOne: false
            referencedRelation: "runtime_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_user_id: string | null
          body: string
          business_id: string
          created_at: string
          id: string
          runtime_task_id: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          business_id: string
          created_at?: string
          id?: string
          runtime_task_id: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          runtime_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_runtime_task_id_fkey"
            columns: ["runtime_task_id"]
            isOneToOne: false
            referencedRelation: "runtime_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_group_items: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          task_group_id: string
          task_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          task_group_id: string
          task_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          task_group_id?: string
          task_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_group_items_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_group_items_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_groups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          business_id: string
          created_at: string
          default_duration_minutes: number | null
          default_staff_member_id: string | null
          default_work_stage_id: string
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          requires_approval_default: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          default_duration_minutes?: number | null
          default_staff_member_id?: string | null
          default_work_stage_id: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          requires_approval_default?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          default_duration_minutes?: number | null
          default_staff_member_id?: string | null
          default_work_stage_id?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          requires_approval_default?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_types_default_staff_member_id_fkey"
            columns: ["default_staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_types_default_work_stage_id_fkey"
            columns: ["default_work_stage_id"]
            isOneToOne: false
            referencedRelation: "work_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_counters: {
        Row: {
          business_id: string
          next_number: number
        }
        Insert: {
          business_id: string
          next_number?: number
        }
        Update: {
          business_id?: string
          next_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_order_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_at: string | null
          id: string
          intake_responses: Json
          intake_template_id: string
          notes: string | null
          number: number
          order_received_date: string
          priority: string
          status: string
          template_name: string | null
          updated_at: string
          work_order_kind: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_at?: string | null
          id?: string
          intake_responses?: Json
          intake_template_id: string
          notes?: string | null
          number: number
          order_received_date?: string
          priority?: string
          status?: string
          template_name?: string | null
          updated_at?: string
          work_order_kind: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_at?: string | null
          id?: string
          intake_responses?: Json
          intake_template_id?: string
          notes?: string | null
          number?: number
          order_received_date?: string
          priority?: string
          status?: string
          template_name?: string | null
          updated_at?: string
          work_order_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_intake_template_id_fkey"
            columns: ["intake_template_id"]
            isOneToOne: false
            referencedRelation: "intake_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      work_stages: {
        Row: {
          business_id: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_business_admin: { Args: { bid: string }; Returns: boolean }
      is_business_member: { Args: { bid: string }; Returns: boolean }
      next_work_order_number: {
        Args: { p_business_id: string }
        Returns: number
      }
      shares_business_with: { Args: { target_user: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

