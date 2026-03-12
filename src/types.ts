export type UserProfile = 'diretor' | 'professor' | 'free' | 'pro' | 'public';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  category: '' | 'Registros Pedagógicos' | 'Relatórios' | 'Gestão Escolar';
  roles: ('diretor' | 'professor' | 'free' | 'pro')[];
}

export interface Student {
  id: string;
  nome: string;
  data_nascimento?: string;
  turma?: string;
  serie?: string;
  status?: string;
  necessidades_especiais?: boolean;
  professor_id?: string;
  created_at?: string;
}

export interface PedagogicalRecord {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  date: string;
  turma?: string;
  createdAt: string;
  studentName?: string;
  yearGrade?: string;
  curricularComponent?: string;
  period?: string;
  tone?: string;
  bnccCodes?: string;
  objectives?: string;
  content?: string;
  resources?: string;
  evaluation?: string;
  // New Monthly Record fields
  professorName?: string;
  discipline?: string;
  schoolUnit?: string;
  totalAulasDadas?: string;
  aulasPrevistas?: string;
  aulasPendentes?: string;
  apdHours?: string;
  metodologias?: string;
  materiaisDidaticos?: string;
  frequenciaDiaria?: string;
  justificativasFaltas?: string;
  obsComportamento?: string;
  comunicacaoResponsaveis?: string;
  participacaoConselhos?: string;
  atividadesColetivas?: string;
  formacaoContinuada?: string;
  autoavaliacao?: string;
  feedbackCoordenacao?: string;
  exportFormat?: 'pdf' | 'csv';
}

export const NAV_ITEMS: NavItem[] = [
  // Dashboard isolated
  { id: 'dashboard-evolucao', label: 'Dashboard de Evolução', icon: 'LayoutDashboard', category: '', roles: ['diretor', 'professor', 'pro'] },

  // Registros Pedagógicos
  { id: 'diario-semanal', label: 'Diário Semanal', icon: 'Calendar', category: 'Registros Pedagógicos', roles: ['diretor', 'professor', 'free', 'pro'] },
  { id: 'registro-mensal', label: 'Registro Mensal', icon: 'ClipboardList', category: 'Registros Pedagógicos', roles: ['diretor', 'professor', 'free', 'pro'] },
  { id: 'planejamento-diario', label: 'Planejamento Diário', icon: 'FileEdit', category: 'Registros Pedagógicos', roles: ['diretor', 'professor', 'free', 'pro'] },

  // Relatórios
  { id: 'relatorio-individual', label: 'Relatório Individual', icon: 'FileText', category: 'Relatórios', roles: ['diretor', 'professor', 'free', 'pro'] },
  { id: 'relatorios-turma', label: 'Relatórios da Turma', icon: 'Users', category: 'Relatórios', roles: ['diretor', 'professor', 'free', 'pro'] },
  { id: 'parecer-pcd', label: 'Parecer PCD', icon: 'Accessibility', category: 'Relatórios', roles: ['diretor', 'professor', 'pro'] },
  { id: 'parecer-final', label: 'Parecer Final (IA)', icon: 'Sparkles', category: 'Relatórios', roles: ['diretor', 'professor', 'pro'] },

  // Gestão Escolar (Escola only)
  { id: 'alunos', label: 'Alunos', icon: 'Users', category: 'Gestão Escolar', roles: ['diretor', 'professor', 'pro'] },
  { id: 'professores', label: 'Professores', icon: 'GraduationCap', category: 'Gestão Escolar', roles: ['diretor'] },
  { id: 'turmas', label: 'Turmas', icon: 'School', category: 'Gestão Escolar', roles: ['diretor'] },
  { id: 'presenca', label: 'Presença', icon: 'CheckSquare', category: 'Gestão Escolar', roles: ['diretor', 'professor'] },
];
