export interface Entity {
  id: string
  name: string
  description: string
  rustType: string
  category: 'core' | 'processing' | 'output' | 'workflow'
  fields: EntityField[]
  recordCount?: number
}

export interface EntityField {
  name: string
  type: string
  nullable: boolean
  primaryKey?: boolean
  foreignKey?: string
  description?: string
}

export interface EntityRelation {
  id: string
  from: string
  to: string
  relationshipType: '1:1' | '1:N' | 'N:N'
  label: string
  strength: 'high' | 'low'
  description: string
}

export interface DatabaseSchema {
  entities: Entity[]
  relations: EntityRelation[]
}
