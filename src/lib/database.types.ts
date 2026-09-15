// src/lib/database.types.ts
//
// Gerado a partir do schema do projeto Supabase "sibrap"
// (mcp__supabase__generate_typescript_types). Não editar à mão — rodar
// de novo depois de qualquer migration nova.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acessos: {
        Row: {
          concedido_em: string
          id: string
          pedido_id: string | null
          produto_id: string
          user_id: string
        }
        Insert: {
          concedido_em?: string
          id?: string
          pedido_id?: string | null
          produto_id: string
          user_id: string
        }
        Update: {
          concedido_em?: string
          id?: string
          pedido_id?: string | null
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      bancas: {
        Row: {
          criado_em: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      cargo_disciplinas: {
        Row: {
          cargo_id: string
          conteudo_programatico: string | null
          disciplina_id: string
          id: string
          numero_questoes: number
        }
        Insert: {
          cargo_id: string
          conteudo_programatico?: string | null
          disciplina_id: string
          id?: string
          numero_questoes: number
        }
        Update: {
          cargo_id?: string
          conteudo_programatico?: string | null
          disciplina_id?: string
          id?: string
          numero_questoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "cargo_disciplinas_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_disciplinas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          codigo: string | null
          concurso_id: string
          criado_em: string
          edital_numero: string | null
          id: string
          nome: string
          quadro: string | null
          vagas: number | null
        }
        Insert: {
          codigo?: string | null
          concurso_id: string
          criado_em?: string
          edital_numero?: string | null
          id?: string
          nome: string
          quadro?: string | null
          vagas?: number | null
        }
        Update: {
          codigo?: string | null
          concurso_id?: string
          criado_em?: string
          edital_numero?: string | null
          id?: string
          nome?: string
          quadro?: string | null
          vagas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      concursos: {
        Row: {
          ano: number | null
          ativo: boolean
          banca_id: string
          criado_em: string
          descricao: string | null
          edital_numero: string | null
          id: string
          imagem_url: string | null
          nome: string
          orgao: string | null
          slug: string
        }
        Insert: {
          ano?: number | null
          ativo?: boolean
          banca_id: string
          criado_em?: string
          descricao?: string | null
          edital_numero?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          orgao?: string | null
          slug: string
        }
        Update: {
          ano?: number | null
          ativo?: boolean
          banca_id?: string
          criado_em?: string
          descricao?: string | null
          edital_numero?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          orgao?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "concursos_banca_id_fkey"
            columns: ["banca_id"]
            isOneToOne: false
            referencedRelation: "bancas"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinas: {
        Row: {
          id: string
          nome: string
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      interesses_aluno: {
        Row: {
          cargo_id: string
          criado_em: string
          id: string
          user_id: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interesses_aluno_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          concurso_id: string | null
          criado_em: string
          email: string
          id: string
        }
        Insert: {
          concurso_id?: string | null
          criado_em?: string
          email: string
          id?: string
        }
        Update: {
          concurso_id?: string | null
          criado_em?: string
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          produto_id: string
          status: string
          user_id: string
          valor_centavos: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          produto_id: string
          status?: string
          user_id: string
          valor_centavos: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          produto_id?: string
          status?: string
          user_id?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          apostila_storage_path: string | null
          ativo: boolean
          cargo_id: string | null
          concurso_id: string
          criado_em: string
          descricao: string | null
          id: string
          inclui_apostila: boolean
          inclui_simulado: boolean
          nome: string
          preco_centavos: number
          slug: string
        }
        Insert: {
          apostila_storage_path?: string | null
          ativo?: boolean
          cargo_id?: string | null
          concurso_id: string
          criado_em?: string
          descricao?: string | null
          id?: string
          inclui_apostila?: boolean
          inclui_simulado?: boolean
          nome: string
          preco_centavos: number
          slug: string
        }
        Update: {
          apostila_storage_path?: string | null
          ativo?: boolean
          cargo_id?: string | null
          concurso_id?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          inclui_apostila?: boolean
          inclui_simulado?: boolean
          nome?: string
          preco_centavos?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string
          id: string
          nome: string | null
        }
        Insert: {
          criado_em?: string
          id: string
          nome?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      questoes: {
        Row: {
          alternativas: Json
          ano: number | null
          ativa: boolean
          banca_id: string
          cargo_id: string | null
          comentario: string | null
          concurso_id: string
          criado_em: string
          diagrama_svg: string | null
          dificuldade: string | null
          disciplina_id: string
          enunciado: string
          gabarito: string
          id: string
        }
        Insert: {
          alternativas: Json
          ano?: number | null
          ativa?: boolean
          banca_id: string
          cargo_id?: string | null
          comentario?: string | null
          concurso_id: string
          criado_em?: string
          diagrama_svg?: string | null
          dificuldade?: string | null
          disciplina_id: string
          enunciado: string
          gabarito: string
          id?: string
        }
        Update: {
          alternativas?: Json
          ano?: number | null
          ativa?: boolean
          banca_id?: string
          cargo_id?: string | null
          comentario?: string | null
          concurso_id?: string
          criado_em?: string
          diagrama_svg?: string | null
          dificuldade?: string | null
          disciplina_id?: string
          enunciado?: string
          gabarito?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_banca_id_fkey"
            columns: ["banca_id"]
            isOneToOne: false
            referencedRelation: "bancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_concurso_id_fkey"
            columns: ["concurso_id"]
            isOneToOne: false
            referencedRelation: "concursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_simulado: {
        Row: {
          cargo_id: string
          finalizado_em: string | null
          id: string
          iniciado_em: string
          nota: number | null
          produto_id: string
          questoes_ids: string[]
          respostas: Json
          user_id: string
        }
        Insert: {
          cargo_id: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          nota?: number | null
          produto_id: string
          questoes_ids: string[]
          respostas?: Json
          user_id: string
        }
        Update: {
          cargo_id?: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          nota?: number | null
          produto_id?: string
          questoes_ids?: string[]
          respostas?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_simulado_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tentativas_simulado_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      desempenho_simulado: {
        Args: { p_tentativa_id: string }
        Returns: {
          acertos: number
          disciplina_nome: string
          total: number
        }[]
      }
      finalizar_simulado: {
        Args: { p_respostas: Json; p_tentativa_id: string }
        Returns: {
          acertos: number
          nota: number
          total: number
        }[]
      }
      iniciar_simulado: {
        Args: { p_cargo_id: string; p_produto_id: string }
        Returns: {
          alternativas: Json
          disciplina_nome: string
          enunciado: string
          ordem: number
          questao_id: string
          tentativa_id: string
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
