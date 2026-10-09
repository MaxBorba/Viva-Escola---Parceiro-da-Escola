export interface School {
  id: string;
  name: string;
  code: string;
  driveUrl: string;
  city: string;
  gre?: string;
}

export type RecordRole = 'articulador' | 'direcao' | 'coordenacao';
export type MaintenanceStatus = 'pendente' | 'em_andamento' | 'realizado' | 'nao_realizado';
export type MaintenanceCategory = 
  | 'Elétrica' 
  | 'Hidráulica' 
  | 'Estrutural / Alvenaria' 
  | 'Pintura' 
  | 'Telhado / Infiltração' 
  | 'Mobiliário / Equipamento' 
  | 'Sanitários' 
  | 'Acessibilidade' 
  | 'Serviços Gerais / Limpeza (ASG)'
  | 'Outro';

export type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export type ExtraWorkType = 'plano_asg' | 'conforme_plano' | 'manutencao_extra';

export interface ExtraWork {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  workType: ExtraWorkType; // 'plano_asg' | 'conforme_plano' | 'manutencao_extra'
  title: string; // Título / Objeto da Manutenção
  description: string; // Descrição dos serviços executados
  category: MaintenanceCategory;
  completedDate: string; // YYYY-MM-DD
  completedTimeBrasilia: string; // e.g. "18/08/2026 14:30"
  registeredByRole: 'coordenacao' | 'articulador';
  registeredByName: string;
  contractorName: string; // Empresa executora / Equipe técnica
  responsibleTechnician: string; // Técnico ou engenheiro responsável
  photoBeforeUrl?: string; // Foto Antes (opcional)
  photoAfterUrl: string; // Foto Depois / Conclusão (obrigatória)
  costEstimate?: string;
  observations?: string;
  driveUrl: string;
  createdAt: string; // ISO string
}

export interface ResolutionData {
  status: 'realizado' | 'nao_realizado';
  resolvedPhotoUrl?: string;
  resolvedDate: string;
  resolvedTimeBrasilia: string;
  resolvedBy: string;
  notes: string;
  newDeadlineIfUnresolved?: string;
}

export interface MaintenanceRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  createdByRole: RecordRole;
  authorName: string;
  photoUrl: string; // Base64 or image URL
  title: string; // Enunciado / Ponto que requer atenção
  description?: string;
  category: MaintenanceCategory;
  urgency: UrgencyLevel;
  deadline: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  formattedDateTimeBrasilia: string; // e.g. "14/08/2026 13:22"
  status: MaintenanceStatus;
  driveUrl: string;
  resolution?: ResolutionData;
}

export interface UserSession {
  role: 'articulador' | 'direcao' | 'coordenacao';
  school?: School;
  authenticatedAt: string;
}
