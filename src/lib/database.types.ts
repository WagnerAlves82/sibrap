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
      admin_codigos_recuperacao: {
        Row: {
          codigo_hash: string
          criado_em: string
          id: string
          usado_em: string | null
        }
        Insert: {
          codigo_hash: string
          criado_em?: string
          id?: string
          usado_em?: string | null
        }
        Update: {
          codigo_hash?: string
          criado_em?: string
          id?: string
          usado_em?: string | null
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          id: boolean
          sessoes_validas_desde: string
          vendas_pausadas: boolean
          vendas_pausadas_em: string | null
          vendas_pausadas_motivo: string | null
          vigia_falhas_seguidas: number
          vigia_saldo_disponivel: number | null
          vigia_ultima_loja: string | null
          vigia_ultimo_alerta_em: string | null
          vigia_ultimo_ok: string | null
        }
        Insert: {
          id?: boolean
          sessoes_validas_desde?: string
          vendas_pausadas?: boolean
          vendas_pausadas_em?: string | null
          vendas_pausadas_motivo?: string | null
          vigia_falhas_seguidas?: number
          vigia_saldo_disponivel?: number | null
          vigia_ultima_loja?: string | null
          vigia_ultimo_alerta_em?: string | null
          vigia_ultimo_ok?: string | null
        }
        Update: {
          id?: boolean
          sessoes_validas_desde?: string
          vendas_pausadas?: boolean
          vendas_pausadas_em?: string | null
          vendas_pausadas_motivo?: string | null
          vigia_falhas_seguidas?: number
          vigia_saldo_disponivel?: number | null
          vigia_ultima_loja?: string | null
          vigia_ultimo_alerta_em?: string | null
          vigia_ultimo_ok?: string | null
        }
        Relationships: []
      }
      admin_desafios: {
        Row: {
          desafio: string
          expira_em: string
          id: string
          tipo: string
        }
        Insert: {
          desafio: string
          expira_em: string
          id?: string
          tipo: string
        }
        Update: {
          desafio?: string
          expira_em?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      admin_passkeys: {
        Row: {
          counter: number
          credential_id: string
          criado_em: string
          id: string
          nome: string
          public_key: string
          sincronizada: boolean
          tipo_dispositivo: string | null
          transports: string[]
          ultimo_uso_em: string | null
        }
        Insert: {
          counter?: number
          credential_id: string
          criado_em?: string
          id?: string
          nome: string
          public_key: string
          sincronizada?: boolean
          tipo_dispositivo?: string | null
          transports?: string[]
          ultimo_uso_em?: string | null
        }
        Update: {
          counter?: number
          credential_id?: string
          criado_em?: string
          id?: string
          nome?: string
          public_key?: string
          sincronizada?: boolean
          tipo_dispositivo?: string | null
          transports?: string[]
          ultimo_uso_em?: string | null
        }
        Relationships: []
      }
      admin_recuperacoes: {
        Row: {
          cancelado_em: string | null
          criado_em: string
          expira_em: string
          id: string
          liberar_em: string
          token_hash: string
          usado_em: string | null
        }
        Insert: {
          cancelado_em?: string | null
          criado_em?: string
          expira_em: string
          id?: string
          liberar_em: string
          token_hash: string
          usado_em?: string | null
        }
        Update: {
          cancelado_em?: string | null
          criado_em?: string
          expira_em?: string
          id?: string
          liberar_em?: string
          token_hash?: string
          usado_em?: string | null
        }
        Relationships: []
      }
      apostilas: {
        Row: {
          atualizado_em: string
          banca: string | null
          capa_path: string | null
          cargo: string
          categoria: string
          cidade: string | null
          criado_em: string
          data_prova: string | null
          descricao: string | null
          destaque: boolean
          id: string
          imagens: string[]
          inscricoes_ate: string | null
          ordem: number
          orgao: string
          paginas: number | null
          preco_original_centavos: number | null
          facebook_post_id: string | null
          facebook_postado_em: string | null
          produto_id: string
          questoes: number | null
          salario: string | null
          selos: string[]
          simulados: number | null
          slug: string
          status: string
          titulo: string
          uf: string
          vagas: string | null
        }
        Insert: {
          atualizado_em?: string
          banca?: string | null
          capa_path?: string | null
          cargo: string
          categoria?: string
          cidade?: string | null
          criado_em?: string
          data_prova?: string | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          imagens?: string[]
          inscricoes_ate?: string | null
          ordem?: number
          orgao: string
          paginas?: number | null
          preco_original_centavos?: number | null
          facebook_post_id?: string | null
          facebook_postado_em?: string | null
          produto_id: string
          questoes?: number | null
          salario?: string | null
          selos?: string[]
          simulados?: number | null
          slug: string
          status?: string
          titulo: string
          uf: string
          vagas?: string | null
        }
        Update: {
          atualizado_em?: string
          banca?: string | null
          capa_path?: string | null
          cargo?: string
          categoria?: string
          cidade?: string | null
          criado_em?: string
          data_prova?: string | null
          descricao?: string | null
          destaque?: boolean
          id?: string
          imagens?: string[]
          inscricoes_ate?: string | null
          ordem?: number
          orgao?: string
          paginas?: number | null
          preco_original_centavos?: number | null
          facebook_post_id?: string | null
          facebook_postado_em?: string | null
          produto_id?: string
          questoes?: number | null
          salario?: string | null
          selos?: string[]
          simulados?: number | null
          slug?: string
          status?: string
          titulo?: string
          uf?: string
          vagas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apostilas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_materiais: {
        Row: {
          aula_id: string
          criado_em: string
          id: string
          titulo: string
          url: string
        }
        Insert: {
          aula_id: string
          criado_em?: string
          id?: string
          titulo: string
          url: string
        }
        Update: {
          aula_id?: string
          criado_em?: string
          id?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_materiais_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_quiz: {
        Row: {
          alternativas: Json
          aula_id: string
          comentario: string | null
          enunciado: string
          gabarito: string
          id: string
          ordem: number
        }
        Insert: {
          alternativas: Json
          aula_id: string
          comentario?: string | null
          enunciado: string
          gabarito: string
          id?: string
          ordem?: number
        }
        Update: {
          alternativas?: Json
          aula_id?: string
          comentario?: string | null
          enunciado?: string
          gabarito?: string
          id?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "aula_quiz_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          atividade: string | null
          carga_min: number
          curso_id: string
          descricao: string | null
          duracao_video_min: number | null
          id: string
          modulo_id: string
          objetivo: string | null
          ordem: number
          resumo: string | null
          titulo: string
          youtube_id: string | null
        }
        Insert: {
          atividade?: string | null
          carga_min?: number
          curso_id: string
          descricao?: string | null
          duracao_video_min?: number | null
          id?: string
          modulo_id: string
          objetivo?: string | null
          ordem: number
          resumo?: string | null
          titulo: string
          youtube_id?: string | null
        }
        Update: {
          atividade?: string | null
          carga_min?: number
          curso_id?: string
          descricao?: string | null
          duracao_video_min?: number | null
          id?: string
          modulo_id?: string
          objetivo?: string | null
          ordem?: number
          resumo?: string | null
          titulo?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
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
      certificados: {
        Row: {
          carga_horaria_horas: number
          codigo: string
          curso_id: string
          emitido_em: string
          forma: string
          id: string
          nome_completo: string
          user_id: string
        }
        Insert: {
          carga_horaria_horas: number
          codigo: string
          curso_id: string
          emitido_em?: string
          forma: string
          id?: string
          nome_completo: string
          user_id: string
        }
        Update: {
          carga_horaria_horas?: number
          codigo?: string
          curso_id?: string
          emitido_em?: string
          forma?: string
          id?: string
          nome_completo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      comprovantes_cadunico: {
        Row: {
          analisado_em: string | null
          enviado_em: string
          id: string
          motivo_recusa: string | null
          nome_arquivo: string | null
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          analisado_em?: string | null
          enviado_em?: string
          id?: string
          motivo_recusa?: string | null
          nome_arquivo?: string | null
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          analisado_em?: string | null
          enviado_em?: string
          id?: string
          motivo_recusa?: string | null
          nome_arquivo?: string | null
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
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
      cronograma_progresso: {
        Row: {
          concluido_em: string
          id: string
          topico_id: string
          user_id: string
        }
        Insert: {
          concluido_em?: string
          id?: string
          topico_id: string
          user_id: string
        }
        Update: {
          concluido_em?: string
          id?: string
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_progresso_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "cronograma_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_topicos: {
        Row: {
          cargo_id: string
          criado_em: string
          disciplina_id: string
          id: string
          minutos_estimados: number
          ordem: number
          titulo: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          disciplina_id: string
          id?: string
          minutos_estimados?: number
          ordem: number
          titulo: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          disciplina_id?: string
          id?: string
          minutos_estimados?: number
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_topicos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_topicos_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean
          carga_horaria_horas: number
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          nota_minima: number
          ordem_obrigatoria: boolean
          quiz_num_questoes: number
          slug: string
          subtitulo: string | null
        }
        Insert: {
          ativo?: boolean
          carga_horaria_horas: number
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          nota_minima?: number
          ordem_obrigatoria?: boolean
          quiz_num_questoes?: number
          slug: string
          subtitulo?: string | null
        }
        Update: {
          ativo?: boolean
          carga_horaria_horas?: number
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          nota_minima?: number
          ordem_obrigatoria?: boolean
          quiz_num_questoes?: number
          slug?: string
          subtitulo?: string | null
        }
        Relationships: []
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
      limite_tentativas: {
        Row: {
          chave: string
          contagem: number
          janela: string
        }
        Insert: {
          chave: string
          contagem?: number
          janela: string
        }
        Update: {
          chave?: string
          contagem?: number
          janela?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          criado_em: string
          curso_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          curso_id: string
          user_id: string
        }
        Update: {
          criado_em?: string
          curso_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          curso_id: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          curso_id: string
          id?: string
          ordem: number
          titulo: string
        }
        Update: {
          curso_id?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          atualizado_em: string
          criado_em: string
          entrega_enviada_em: string | null
          gateway: string
          gateway_charge_id: string | null
          id: string
          mercadopago_order_id: string | null
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
          entrega_enviada_em?: string | null
          gateway?: string
          gateway_charge_id?: string | null
          id?: string
          mercadopago_order_id?: string | null
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
          entrega_enviada_em?: string | null
          gateway?: string
          gateway_charge_id?: string | null
          id?: string
          mercadopago_order_id?: string | null
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
      posts: {
        Row: {
          apostilas_slugs: string[]
          atualizado_em: string
          autor: string
          capa_credito: string | null
          capa_path: string | null
          capa_url: string | null
          categoria: string
          certame_tipo: string | null
          conteudo: string
          criado_em: string
          destaque: boolean
          edital_numero: string | null
          edital_url: string | null
          esfera: string | null
          facebook_post_id: string | null
          facebook_postado_em: string | null
          hashtags: string[]
          palavras_chave: string[]
          seo_descricao: string | null
          seo_titulo: string | null
          importancia: number
          id: string
          publicado_em: string | null
          regiao: string | null
          resumo: string | null
          retificacoes: string | null
          slug: string
          status: string
          titulo: string
          uf: string | null
        }
        Insert: {
          apostilas_slugs?: string[]
          atualizado_em?: string
          autor?: string
          capa_credito?: string | null
          capa_path?: string | null
          capa_url?: string | null
          categoria?: string
          certame_tipo?: string | null
          conteudo?: string
          criado_em?: string
          destaque?: boolean
          edital_numero?: string | null
          edital_url?: string | null
          esfera?: string | null
          facebook_post_id?: string | null
          facebook_postado_em?: string | null
          hashtags?: string[]
          palavras_chave?: string[]
          seo_descricao?: string | null
          seo_titulo?: string | null
          importancia?: number
          id?: string
          publicado_em?: string | null
          regiao?: string | null
          resumo?: string | null
          retificacoes?: string | null
          slug: string
          status?: string
          titulo: string
          uf?: string | null
        }
        Update: {
          apostilas_slugs?: string[]
          atualizado_em?: string
          autor?: string
          capa_credito?: string | null
          capa_path?: string | null
          capa_url?: string | null
          categoria?: string
          certame_tipo?: string | null
          conteudo?: string
          criado_em?: string
          destaque?: boolean
          edital_numero?: string | null
          edital_url?: string | null
          esfera?: string | null
          facebook_post_id?: string | null
          facebook_postado_em?: string | null
          hashtags?: string[]
          palavras_chave?: string[]
          seo_descricao?: string | null
          seo_titulo?: string | null
          importancia?: number
          id?: string
          publicado_em?: string | null
          regiao?: string | null
          resumo?: string | null
          retificacoes?: string | null
          slug?: string
          status?: string
          titulo?: string
          uf?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          apostila_storage_path: string | null
          ativo: boolean
          cargo_id: string | null
          concurso_id: string | null
          criado_em: string
          curso_id: string | null
          descricao: string | null
          id: string
          inclui_apostila: boolean
          inclui_simulado: boolean
          nome: string
          preco_centavos: number
          slug: string
          tipo: string
        }
        Insert: {
          apostila_storage_path?: string | null
          ativo?: boolean
          cargo_id?: string | null
          concurso_id?: string | null
          criado_em?: string
          curso_id?: string | null
          descricao?: string | null
          id?: string
          inclui_apostila?: boolean
          inclui_simulado?: boolean
          nome: string
          preco_centavos: number
          slug: string
          tipo?: string
        }
        Update: {
          apostila_storage_path?: string | null
          ativo?: boolean
          cargo_id?: string | null
          concurso_id?: string | null
          criado_em?: string
          curso_id?: string | null
          descricao?: string | null
          id?: string
          inclui_apostila?: boolean
          inclui_simulado?: boolean
          nome?: string
          preco_centavos?: number
          slug?: string
          tipo?: string
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
          {
            foreignKeyName: "produtos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apostila_enviada_em: string | null
          criado_em: string
          id: string
          nome: string | null
        }
        Insert: {
          apostila_enviada_em?: string | null
          criado_em?: string
          id: string
          nome?: string | null
        }
        Update: {
          apostila_enviada_em?: string | null
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida_em: string | null
          iniciada_em: string
          user_id: string
        }
        Insert: {
          aula_id: string
          concluida_em?: string | null
          iniciada_em?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          concluida_em?: string | null
          iniciada_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
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
          inspirada_em: string | null
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
          inspirada_em?: string | null
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
          inspirada_em?: string | null
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
      quiz_questoes: {
        Row: {
          alternativas: Json
          ativa: boolean
          comentario: string | null
          curso_id: string
          enunciado: string
          gabarito: string
          id: string
        }
        Insert: {
          alternativas: Json
          ativa?: boolean
          comentario?: string | null
          curso_id: string
          enunciado: string
          gabarito: string
          id?: string
        }
        Update: {
          alternativas?: Json
          ativa?: boolean
          comentario?: string | null
          curso_id?: string
          enunciado?: string
          gabarito?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_quiz: {
        Row: {
          curso_id: string
          finalizado_em: string | null
          id: string
          iniciado_em: string
          nota: number | null
          questoes_ids: string[]
          respostas: Json
          user_id: string
        }
        Insert: {
          curso_id: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          nota?: number | null
          questoes_ids: string[]
          respostas?: Json
          user_id: string
        }
        Update: {
          curso_id?: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          nota?: number | null
          questoes_ids?: string[]
          respostas?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_quiz_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
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
      abrir_aula: { Args: { p_aula_id: string }; Returns: undefined }
      concluir_aula: { Args: { p_aula_id: string }; Returns: undefined }
      conferir_miniquiz: {
        Args: { p_letra: string; p_questao_id: string }
        Returns: {
          comentario: string
          correta: boolean
          gabarito: string
        }[]
      }
      criar_pedido_por_slug: {
        Args: { p_slug: string }
        Returns: {
          pedido_id: string
          produto_nome: string
          valor_centavos: number
        }[]
      }
      criar_pedido_premium: {
        Args: never
        Returns: {
          pedido_id: string
          produto_nome: string
          valor_centavos: number
        }[]
      }
      curso_pronto_para_prova: {
        Args: { p_curso: string; p_user: string }
        Returns: boolean
      }
      desempenho_simulado: {
        Args: { p_tentativa_id: string }
        Returns: {
          acertos: number
          disciplina_nome: string
          total: number
        }[]
      }
      emitir_certificado: {
        Args: { p_curso_id: string; p_nome: string }
        Returns: string
      }
      finalizar_quiz: {
        Args: { p_respostas: Json; p_tentativa_id: string }
        Returns: {
          acertos: number
          aprovado: boolean
          nota: number
          nota_minima: number
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
      finalizar_simulado_gratis: {
        Args: { p_respostas: Json; p_tentativa_id: string }
        Returns: {
          acertos: number
          nota: number
          total: number
        }[]
      }
      iniciar_quiz: {
        Args: { p_curso_id: string }
        Returns: {
          alternativas: Json
          enunciado: string
          ordem: number
          questao_id: string
          tentativa_id: string
        }[]
      }
      abandonar_simulado: {
        Args: { p_tentativa_id: string }
        Returns: undefined
      }
      salvar_resposta_simulado: {
        Args: { p_letra: string; p_questao_id: string; p_tentativa_id: string }
        Returns: undefined
      }
      retomar_simulado: {
        Args: { p_produto_id: string }
        Returns: {
          alternativas: Json
          diagrama_svg: string
          disciplina_nome: string
          enunciado: string
          inspirada_em: string
          ordem: number
          questao_id: string
          resposta: string
          tentativa_id: string
        }[]
      }
      parcial_simulado: {
        Args: { p_tentativa_id: string }
        Returns: {
          acertos: number
          disciplina_nome: string
          respondidas: number
        }[]
      }
      iniciar_simulado: {
        Args: { p_cargo_id: string; p_produto_id: string; p_quantidade?: number }
        Returns: {
          alternativas: Json
          diagrama_svg: string
          disciplina_nome: string
          enunciado: string
          inspirada_em: string
          ordem: number
          questao_id: string
          tentativa_id: string
        }[]
      }
      iniciar_simulado_gratis: {
        Args: never
        Returns: {
          alternativas: Json
          diagrama_svg: string
          disciplina_nome: string
          enunciado: string
          inspirada_em: string
          ordem: number
          questao_id: string
          tentativa_id: string
        }[]
      }
      marcar_apostila_enviada: { Args: never; Returns: undefined }
      marcar_topico_cronograma: {
        Args: { p_concluido: boolean; p_topico_id: string }
        Returns: undefined
      }
      matricular_curso: { Args: { p_curso_slug: string }; Returns: string }
      miniquiz_da_aula: {
        Args: { p_aula_id: string }
        Returns: {
          alternativas: Json
          enunciado: string
          ordem: number
          questao_id: string
        }[]
      }
      registrar_order_pagamento: {
        Args: { p_order_id: string; p_payment_id?: string; p_pedido_id: string }
        Returns: undefined
      }
      registrar_tentativa: {
        Args: { p_chave: string; p_janela_segundos: number; p_limite: number }
        Returns: boolean
      }
      revisao_quiz: {
        Args: { p_tentativa_id: string }
        Returns: {
          alternativas: Json
          comentario: string
          enunciado: string
          gabarito: string
          marcada: string
          ordem: number
        }[]
      }
      sortear_perguntas_vf: {
        Args: {
          p_cargo_id: string
          p_produto_id: string
          p_quantidade?: number
        }
        Returns: {
          alternativa: string
          correta: boolean
          enunciado: string
        }[]
      }
      validar_certificado: {
        Args: { p_codigo: string }
        Returns: {
          carga_horaria_horas: number
          curso_nome: string
          curso_slug: string
          emitido_em: string
          nome_completo: string
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
