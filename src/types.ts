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
  masterStorageNode?: string; // "Notebook MaxBorba"
  officialPhoneRepository?: string; // "998299505"
  officialMasterIpId?: string; // "835E8FB-7F16-4C93-B228-3B73FAE5FF24"
  originIp?: string;
  originDevice?: string;
  retentionUntil?: string; // ISO (6 meses de guarda garantida ou até exclusão)
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
  masterStorageNode?: string; // "Notebook MaxBorba"
  officialPhoneRepository?: string; // "998299505"
  officialMasterIpId?: string; // "835E8FB-7F16-4C93-B228-3B73FAE5FF24"
  originIp?: string;
  originDevice?: string;
  retentionUntil?: string; // ISO (6 meses de guarda garantida ou até exclusão)
}

export interface AccessLog {
  id: string;
  role: RecordRole;
  schoolCode?: string;
  schoolName?: string;
  authorName: string;
  isMasterKey: boolean;
  ip: string;
  device: string;
  userAgent?: string;
  action: string;
  targetId?: string;
  timestamp: string; // ISO
  formattedDateTimeBrasilia: string;
  masterStorageNode: string; // "Notebook MaxBorba"
  officialPhoneRepository?: string; // "998299505"
  officialMasterIpId?: string; // "835E8FB-7F16-4C93-B228-3B73FAE5FF24"
  retentionUntil: string; // ISO (6 meses ou até exclusão)
}

export interface MasterNodeStatus {
  nodeName: string; // "Notebook MaxBorba"
  officialPhone?: string; // "998299505"
  officialMasterIpId?: string; // "835E8FB-7F16-4C93-B228-3B73FAE5FF24"
  ip?: string;
  status: string;
  retentionPolicy: string; // "06 Meses (180 dias) ou até exclusão voluntária"
  retentionRule?: string; // "Ficam registrados até a exclusão ou após 6 meses de salvamento"
  authorizedRoles: string;
  authorizedSchoolCodes: string[];
  totalRecordsStored: number;
  totalExtraWorks: number;
  totalAccessLogs: number;
  lastSyncAt: string;
}

export interface UserSession {
  role: 'articulador' | 'direcao' | 'coordenacao';
  school?: School;
  authenticatedAt: string;
  clientIp?: string;
  device?: string;
}

