import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';
import { NAV_ITEMS, NavItem, UserProfile, PedagogicalRecord, Student } from '../types';
import DashboardLayout from './layout/DashboardLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EvolutionDashboard from './EvolutionDashboard';
import StudentManager from './StudentManager';
import { supabase } from '../lib/supabase';
import { bnccCodesList } from '../lib/bnccCodes';
import DataRetentionBanner from './DataRetentionBanner';
import { useBncc } from '../hooks/useBncc';

interface DashboardProps {
  userId: string;
  userEmail: string;
  role: UserProfile;
  userCreatedAt?: string | null;
  userDataExpiracao?: string | null;
  statusPagamento?: string | null;
  onLogout: () => void;
  onGoToPayment: () => void;
}

export default function Dashboard({ 
  userId, 
  userEmail, 
  role, 
  userCreatedAt, 
  userDataExpiracao, 
  statusPagamento,
  onLogout, 
  onGoToPayment 
}: DashboardProps) {
  // Initialize with a valid tab for the role or the first one if unsure
  const getInitialTab = () => {
    const authorizedTabs = NAV_ITEMS.filter(item => item.roles.includes(role as any));
    return authorizedTabs.length > 0 ? authorizedTabs[0].id : NAV_ITEMS[0].id;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<PedagogicalRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PedagogicalRecord | null>(null);

  // Supabase dynamic students for forms
  const [supabaseStudents, setSupabaseStudents] = useState<Student[]>([]);
  const [manualBnccInput, setManualBnccInput] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [recordForExport, setRecordForExport] = useState<PedagogicalRecord | null>(null);
  const { bnccCodes: dbBnccCodes, isLoading: isBnccLoading } = useBncc();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!userId) return;
      try {
        const { data } = await supabase
          .from('alunos')
          .select('*')
          .eq('professor_id', userId)
          .eq('status', 'ativo')
          .order('nome');
        if (data) setSupabaseStudents(data);
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      }
    };
    fetchStudents();
  }, [userId]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    turma: '',
    studentName: '',
    yearGrade: '',
    curricularComponent: '',
    period: '',
    tone: 'Formal',
    bnccCodes: [] as string[],
    objectives: '',
    content: '',
    resources: '',
    evaluation: '',
    // New Monthly Record fields
    professorName: '',
    discipline: '',
    schoolUnit: '',
    totalAulasDadas: '',
    aulasPrevistas: '',
    aulasPendentes: '',
    apdHours: '',
    metodologias: '',
    materiaisDidaticos: '',
    frequenciaDiaria: '',
    justificativasFaltas: '',
    obsComportamento: '',
    comunicacaoResponsaveis: '',
    participacaoConselhos: '',
    atividadesColetivas: '',
    formacaoContinuada: '',
    autoavaliacao: '',
    feedbackCoordenacao: '',
    exportFormat: 'pdf' as 'pdf' | 'csv'
  });

  // Load records from localStorage on mount
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(`edutec_records_${role}`);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        } else {
          setRecords([]);
        }
      }
    } catch (err) {
      console.error('Failed to load local records:', err);
      setRecords([]);
    }
  }, [role]);

  // Save records to localStorage whenever they change
  useEffect(() => {
    if (records && Array.isArray(records)) {
      localStorage.setItem(`edutec_records_${role}`, JSON.stringify(records));
    }
  }, [records, role]);

  // Ensure activeTab is valid when role changes
  useEffect(() => {
    const authorizedTabs = NAV_ITEMS.filter(item => item.roles.includes(role as any));
    const isTabAuthorized = authorizedTabs.some(item => item.id === activeTab);

    if (!isTabAuthorized && authorizedTabs.length > 0) {
      setActiveTab(authorizedTabs[0].id);
    }
  }, [role]);

  // Reset form when changing tabs
  useEffect(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
  }, [activeTab]);

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role as any));
  const categories = Array.from(new Set(filteredNav.map(item => item.category)));
  const activeItem = NAV_ITEMS.find(item => item.id === activeTab);

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className={className} size={18} /> : null;
  };

  const handleOpenForm = (record?: PedagogicalRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        title: record.title,
        description: record.description,
        date: record.date,
        turma: record.turma || '',
        studentName: record.studentName || '',
        yearGrade: record.yearGrade || '',
        curricularComponent: record.curricularComponent || '',
        period: record.period || '',
        tone: record.tone || 'Formal',
        bnccCodes: Array.isArray(record.bnccCodes) ? record.bnccCodes : [],
        objectives: record.objectives || '',
        content: record.content || '',
        resources: record.resources || '',
        evaluation: record.evaluation || '',
        professorName: record.professorName || '',
        discipline: record.discipline || '',
        schoolUnit: record.schoolUnit || '',
        totalAulasDadas: record.totalAulasDadas || '',
        aulasPrevistas: record.aulasPrevistas || '',
        aulasPendentes: record.aulasPendentes || '',
        apdHours: record.apdHours || '',
        metodologias: record.metodologias || '',
        materiaisDidaticos: record.materiaisDidaticos || '',
        frequenciaDiaria: record.frequenciaDiaria || '',
        justificativasFaltas: record.justificativasFaltas || '',
        obsComportamento: record.obsComportamento || '',
        comunicacaoResponsaveis: record.comunicacaoResponsaveis || '',
        participacaoConselhos: record.participacaoConselhos || '',
        atividadesColetivas: record.atividadesColetivas || '',
        formacaoContinuada: record.formacaoContinuada || '',
        autoavaliacao: record.autoavaliacao || '',
        feedbackCoordenacao: record.feedbackCoordenacao || '',
        weeklyData: record.weeklyData || {
          'Segunda-feira': {},
          'Terça-feira': {},
          'Quarta-feira': {},
          'Quinta-feira': {},
          'Sexta-feira': {}
        },
        exportFormat: 'pdf'
      });
    } else {
      // Check limits for Free plan
      if (role === 'free') {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();

        const moduleRecords = records.filter(r => r.moduleId === activeTab);

        if (activeTab === 'relatorio-individual' || activeTab === 'planejamento-diario') {
          const todayRecords = moduleRecords.filter(r => new Date(r.createdAt).getTime() >= startOfDay);
          if (todayRecords.length >= 1) {
            alert(`Limite do Plano Free: 1 ${activeItem?.label} por dia. Mude para o Pro para ilimitado!`);
            return;
          }
        } else if (['planejamento-semanal', 'registro-mensal', 'plano-aula', 'relatorios-turma'].includes(activeTab)) {
          const weekRecords = moduleRecords.filter(r => new Date(r.createdAt).getTime() >= startOfWeek);
          if (weekRecords.length >= 1) {
            alert("Limite do Plano Free: 1 registro por semana neste módulo. Mude para o Pro para ilimitado!");
            return;
          }
        } else {
          // Default limit for other modules in Free plan
          if (moduleRecords.length >= 1) {
            alert("Limite do Plano Free atingido para este módulo. Mude para o Pro para ilimitado!");
            return;
          }
        }
      }

      setEditingRecord(null);
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        turma: '',
        studentName: '',
        yearGrade: '',
        curricularComponent: '',
        period: '',
        tone: 'Formal',
        bnccCodes: [],
        objectives: '',
        content: '',
        resources: '',
        evaluation: '',
        weeklyData: {
          'Segunda-feira': { bnccCodes: [] },
          'Terça-feira': { bnccCodes: [] },
          'Quarta-feira': { bnccCodes: [] },
          'Quinta-feira': { bnccCodes: [] },
          'Sexta-feira': { bnccCodes: [] }
        },
        exportFormat: 'pdf'
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Module specific validation
    if (activeTab === 'planejamento-diario') {
      if (!formData.objectives || !formData.content || !formData.resources || !formData.evaluation) {
        alert("Por favor, preencha os campos obrigatórios do planejamento.");
        return;
      }
    } else if (activeTab === 'planejamento-semanal') {
      // Basic validation for at least one field filled? or just title/date
      if (!formData.title || !formData.date) {
        alert("Por favor, preencha o título e a data da semana.");
        return;
      }
    } else {
      if (!formData.description) {
        alert("Por favor, preencha a descrição do registro.");
        return;
      }
    }

    let recordIdToSave = '';

    if (editingRecord) {
      recordIdToSave = editingRecord.id;
      setRecords(records.map(r => r.id === editingRecord.id ? {
        ...r,
        ...formData
      } : r));
    } else {
      recordIdToSave = crypto.randomUUID();
      const newRecord: PedagogicalRecord = {
        id: recordIdToSave,
        moduleId: activeTab,
        ...formData,
        createdAt: new Date().toISOString()
      };
      setRecords([...records, newRecord]);
    }

    // SUPABASE INTEGRAÇÃO PARA CÓDIGOS BNCC E REGISTROS
    try {
      // 1. Identificar tabela e dados principais
      let targetTable = '';
      let recordData: any = {
        id: recordIdToSave,
        professor_id: userId,
        created_at: new Date().toISOString()
      };

      if (activeTab === 'planejamento-diario') {
        targetTable = 'planejamento_diario';
        recordData = {
          ...recordData,
          titulo: formData.title,
          data: formData.date,
          componente: formData.curricularComponent,
          objetivos: formData.objectives,
          conteudo: formData.content,
          recursos: formData.resources,
          avaliacao: formData.evaluation
        };
      } else if (activeTab === 'planejamento-semanal') {
        const days = Object.keys(formData.weeklyData || {});
        for (const dia of days) {
          const dayData = formData.weeklyData![dia];
          // Determine existing ID or create new one for the day row
          const dayId = editingRecord?.weeklyData?.[dia]?.id || crypto.randomUUID();
          
          const recordDataDay = {
            id: dayId,
            professor_id: userId,
            parent_doc_id: recordIdToSave,
            dia_semana: dia,
            turno: dayData.turno || '',
            horario: dayData.horario || '',
            campo_experiencia: dayData.campoExperiencia || '',
            atividade: dayData.atividade || '',
            objetivo: dayData.objetivo || '',
            acompanhamento: dayData.acompanhamento || '',
            observacoes: dayData.observacoes || '',
            created_at: new Date().toISOString()
          };

          await supabase.from('planejamento_semanal').upsert(recordDataDay);

          // Save BNCC links for this specific day
          if (dayData.bnccCodes && dayData.bnccCodes.length > 0) {
            const selectedBnccIds = dbBnccCodes
              .filter(b => dayData.bnccCodes!.includes(b.codigo))
              .map(b => b.id);

            if (selectedBnccIds.length > 0) {
              await supabase.from('planejamento_semanal_bncc').delete().eq('semanal_id', dayId);
              const links = selectedBnccIds.map(bnccId => ({ semanal_id: dayId, bncc_id: bnccId }));
              await supabase.from('planejamento_semanal_bncc').insert(links);
            }
          }
        }
        // Skip normal flow below since we saved sub-records
        targetTable = ''; 
      } else if (['relatorio-individual', 'parecer-pcd', 'parecer-final', 'registro-mensal'].includes(activeTab)) {
        targetTable = 'relatorios';
        const selectedStudent = (supabaseStudents as any[]).find(s => s.nome === formData.studentName);
        
        // Consolidar campos específicos se for registro mensal
        let bundledContent = formData.description || formData.content;
        if (activeTab === 'registro-mensal') {
          bundledContent = `
            Metodologias: ${formData.metodologias || ''}
            Materiais: ${formData.materiaisDidaticos || ''}
            Obs Comportamento: ${formData.obsComportamento || ''}
            Comunicação Responsaveis: ${formData.comunicacaoResponsaveis || ''}
            Descrição Geral: ${formData.description || ''}
          `.trim();
        }

        recordData = {
          ...recordData,
          aluno_id: selectedStudent?.id,
          tipo: activeTab,
          conteudo: bundledContent
        };
      }

      if (targetTable) {
        // Upsert do registro principal
        const { error: mainError } = await supabase
          .from(targetTable)
          .upsert(recordData);

        if (mainError) throw mainError;

        // 2. Salvar vínculos BNCC (Até 3)
        if (formData.bnccCodes.length > 0) {
          const selectedBnccIds = dbBnccCodes
            .filter(b => formData.bnccCodes.includes(b.codigo))
            .map(b => b.id);

          if (selectedBnccIds.length > 0) {
            if (targetTable === 'planejamento_diario') {
              if (editingRecord) {
                await supabase.from('planejamento_bncc').delete().eq('planejamento_id', recordIdToSave);
              }
              const links = selectedBnccIds.map(bnccId => ({ planejamento_id: recordIdToSave, bncc_id: bnccId }));
              await supabase.from('planejamento_bncc').insert(links);
            } else if (targetTable === 'planejamento_semanal') {
              if (editingRecord) {
                await supabase.from('planejamento_semanal_bncc').delete().eq('semanal_id', recordIdToSave);
              }
              const links = selectedBnccIds.map(bnccId => ({ semanal_id: recordIdToSave, bncc_id: bnccId }));
              await supabase.from('planejamento_semanal_bncc').insert(links);
            } else if (targetTable === 'relatorios') {
              if (editingRecord) {
                await supabase.from('relatorios_bncc').delete().eq('relatorio_id', recordIdToSave);
              }
              const links = selectedBnccIds.map(bnccId => ({ relatorio_id: recordIdToSave, bncc_id: bnccId }));
              await supabase.from('relatorios_bncc').insert(links);
            }
          }
        }
      }

      alert("Registro e vínculos BNCC salvos com sucesso no servidor.");
    } catch (err: any) {
      console.error("Erro na sincronização com Supabase:", err);
      alert("Registro salvo localmente, mas erro ao sincronizar com servidor: " + err.message);
    }

    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleExport = async (recordToExport: PedagogicalRecord | null = null) => {
    const targetData = recordToExport || formData;
    const format = targetData.exportFormat || 'pdf';

    if (!targetData.title || !targetData.date) {
      alert("Por favor, preencha os campos obrigatórios (Título e Data) antes de exportar.");
      return;
    }

    try {
      if (format === 'csv') {
        // Generate CSV
        const headers = ['Título', 'Data', 'Módulo', 'Turma', 'Componente Curricular', 'Período', 'Descrição'];
        const row = [
          targetData.title,
          targetData.date,
          activeItem?.label || activeTab,
          targetData.turma || '',
          targetData.curricularComponent || '',
          targetData.period || '',
          targetData.description || targetData.content || ''
        ];

        // Add module-specific fields to CSV if needed
        if (activeTab === 'registro-mensal') {
          headers.push('Professor', 'Disciplina', 'Escola', 'Aulas Dadas', 'Aulas Previstas', 'Aulas Pendentes');
          row.push(targetData.professorName || '', targetData.discipline || '', targetData.schoolUnit || '', targetData.totalAulasDadas || '', targetData.aulasPrevistas || '', targetData.aulasPendentes || '');
        }

        const csvContent = [headers.join(','), row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `EduTecPro_${activeItem?.label.replace(/ /g, '_')}_${new Date().getTime()}.csv`;
        link.click();

        // Send Email
        await supabase.functions.invoke('sendExportEmail', {
          body: { csvContent, format: 'csv' }
        });

      } else {
        // Generate PDF
        const isWeekly = activeTab === 'planejamento-semanal';
        const doc = new jsPDF({
          orientation: isWeekly ? 'landscape' : 'portrait'
        });
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(0, 168, 89);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("EduTecPro", 14, 25);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(activeItem?.label || 'Documento Pedagógico', pageWidth - 14, 25, { align: 'right' });

        // Document Info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(targetData.title, 14, 55);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Data: ${new Date(targetData.date).toLocaleDateString('pt-BR')} `, 14, 65);

        const infoData = [];
        if (targetData.turma) infoData.push(['Turma / Ano / Série', targetData.turma]);
        if (targetData.studentName) infoData.push(['Aluno', targetData.studentName]);
        if (targetData.curricularComponent) infoData.push(['Componente Curricular', targetData.curricularComponent]);
        if (targetData.period) infoData.push(['Período', targetData.period]);
        
        if (!isWeekly && targetData.bnccCodes && targetData.bnccCodes.length > 0) {
          const bnccInfo = targetData.bnccCodes.map(code => {
            const dbRef = dbBnccCodes.find(b => b.codigo === code);
            return dbRef ? `${code}: ${dbRef.descricao}` : code;
          }).join('\n');
          infoData.push(['BNCC', bnccInfo]);
        }

        autoTable(doc, {
          startY: 75,
          body: infoData,
          theme: 'plain',
          styles: { fontSize: 11, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 50 }, 1: { textColor: [80, 80, 80] } }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 15;

        if (isWeekly && targetData.weeklyData) {
          const tableHeaders = [['Dia', 'Turno', 'Horário', 'Campo Exp.', 'BNCC', 'Atividade', 'Objetivo', 'Acomp.', 'Obs.']];
          const tableBody = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].map(day => {
            const dayData = targetData.weeklyData?.[day] || {};
            return [
              day,
              dayData.turno || '-',
              dayData.horario || '-',
              dayData.campoExperiencia || '-',
              (dayData.bnccCodes || []).join(', ') || '-',
              dayData.atividade || '-',
              dayData.objetivo || '-',
              dayData.acompanhamento || '-',
              dayData.observacoes || '-'
            ];
          });

          autoTable(doc, {
            startY: currentY,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 89], textColor: [255, 255, 255], fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 25 },
              1: { cellWidth: 20 },
              2: { cellWidth: 25 },
              3: { cellWidth: 30 },
              4: { cellWidth: 30 },
              5: { cellWidth: 40 },
              6: { cellWidth: 40 },
              7: { cellWidth: 30 },
              8: { cellWidth: 30 }
            }
          });
        } else {
          const addPDFSection = (title: string, content: string) => {
            if (!content) return;
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 168, 89);
            doc.text(title, 14, currentY); currentY += 8;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
            const splitText = doc.splitTextToSize(content, pageWidth - 28);
            doc.text(splitText, 14, currentY); currentY += (splitText.length * 5) + 10;
          };

          if (activeTab === 'planejamento-diario') {
            addPDFSection("Objetivos da Aula", targetData.objectives);
            addPDFSection("Conteúdo / Atividades Planejadas", targetData.content);
            addPDFSection("Recursos Didáticos", targetData.resources);
            addPDFSection("Avaliação / Observações", targetData.evaluation);
          } else if (activeTab === 'registro-mensal') {
            addPDFSection("1. Identificação e Carga Horária", `Professor: ${targetData.professorName}\nDisciplina: ${targetData.discipline}\nUnidade: ${targetData.schoolUnit}\nTotal Aulas Dadas: ${targetData.totalAulasDadas}\nAulas Previstas: ${targetData.aulasPrevistas}\nAulas Pendentes: ${targetData.aulasPendentes}\nHoras APD: ${targetData.apdHours}`);
            addPDFSection("2. Conteúdos e Metodologias", `Conteúdos: ${targetData.content}\nMetodologias: ${targetData.metodologias}`);
            addPDFSection("3. Avaliações e Materiais", `Avaliações: ${targetData.evaluation}\nMateriais: ${targetData.materiaisDidaticos}`);
            addPDFSection("4. Frequência e Comportamento", `Frequência: ${targetData.frequenciaDiaria}\nJustificativas: ${targetData.justificativasFaltas}\nComportamento: ${targetData.obsComportamento}`);
            addPDFSection("5. Relacionamento Escola-Comunidade", `Comunicação: ${targetData.comunicacaoResponsaveis}\nConselhos: ${targetData.participacaoConselhos}\nAtividades Coletivas: ${targetData.atividadesColetivas}`);
            addPDFSection("6. Reflexão e Desenvolvimento", `Formação: ${targetData.formacaoContinuada}\nAutoavaliação: ${targetData.autoavaliacao}\nFeedback: ${targetData.feedbackCoordenacao}`);
          } else {
            addPDFSection("Observações do Professor", targetData.description);
            addPDFSection("Tom do Texto", targetData.tone);
          }
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
          doc.text(`EduTecPro - Gerador de Relatórios Pedagógicos • Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        const pdfBase64 = doc.output('datauristring').split(',')[1];
        doc.save(`EduTecPro_${activeItem?.label.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);

        // Send Email
        await supabase.functions.invoke('sendExportEmail', {
          body: { pdfContent: pdfBase64, format: 'pdf' }
        });
      }

      alert(`Documento gerado e enviado para ${userEmail} com sucesso!`);
      setIsExportModalOpen(false);
      setRecordForExport(null);
    } catch (err: any) {
      console.error("Erro na exportação:", err);
      alert("O documento foi baixado, mas houve um erro ao enviar por e-mail: " + (err.message || "Verifique as configurações das Edge Functions."));
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const currentModuleRecords = records.filter(r => r.moduleId === activeTab);

  return (
    <DashboardLayout
      role={role}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={onLogout}
      onGoToPayment={onGoToPayment}
      userDataExpiracao={userDataExpiracao}
      statusPagamento={statusPagamento}
    >
      <motion.div
        key={activeTab + (isFormOpen ? '-form' : '-list')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto"
      >
        <DataRetentionBanner
          role={role}
          userCreatedAt={userCreatedAt || null}
          userDataExpiracao={userDataExpiracao || null}
          records={records}
          students={supabaseStudents.length > 0 ? supabaseStudents : []}
        />

        {activeTab === 'alunos' ? (
          <StudentManager professorId={userId} />
        ) : isFormOpen ? (
          /* Form View */
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-black/5 p-6 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                {editingRecord ? 'Editar Registro' : 'Novo Registro'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <Icons.X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <>
                <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Informações Básicas</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Título do Registro *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Diário de Classe - 1º Ano A"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Data *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Turma / Ano / Série</label>
                      <input
                        type="text"
                        value={formData.turma}
                        onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                        placeholder="Ex: 1º Ano A, 2º Ano B..."
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Componente Curricular</label>
                      <input
                        type="text"
                        value={formData.curricularComponent}
                        onChange={(e) => setFormData({ ...formData, curricularComponent: e.target.value })}
                        placeholder="Ex: Língua Portuguesa"
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Período</label>
                      <select
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                      >
                        <option value="">Selecione o período</option>
                        {activeTab === 'planejamento-diario' ? (
                          <>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                          </>
                        ) : (
                          <>
                            <option value="1º Bimestre">1º Bimestre</option>
                            <option value="2º Bimestre">2º Bimestre</option>
                            <option value="3º Bimestre">3º Bimestre</option>
                            <option value="4º Bimestre">4º Bimestre</option>
                            <option value="1º Semestre">1º Semestre</option>
                            <option value="2º Semestre">2º Semestre</option>
                            <option value="Anual">Anual</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Códigos BNCC (Opcional)</label>
                      {/* Selector Multiple BNCC */}
                      <div className="relative">
                        <select
                          multiple
                          size={5}
                          value={formData.bnccCodes}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, (option: any) => option.value);
                            if (selectedOptions.length > 3) {
                              alert("Você pode selecionar no máximo 3 códigos BNCC.");
                              return;
                            }
                            setFormData({ ...formData, bnccCodes: selectedOptions });
                          }}
                          disabled={isBnccLoading}
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white text-sm ${formData.bnccCodes.length > 0 ? 'border-[#00A859]' : 'border-black/10'}`}
                        >
                          {dbBnccCodes.map((bncc) => (
                            <option key={bncc.id} value={bncc.codigo} className="py-2 px-2 border-b border-black/5 hover:bg-black/5 cursor-pointer">
                              {bncc.codigo} - {bncc.descricao.substring(0, 60)}{bncc.descricao.length > 60 ? '...' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-black/40 mt-1">Segure CTRL (ou CMD) para selecionar até 3 códigos.</p>
                      </div>

                      {/* Display Selected Pills */}
                      {formData.bnccCodes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.bnccCodes.map(code => (
                            <div key={code} className="flex items-center gap-1.5 px-3 py-1 bg-[#00A859]/10 text-[#00A859] rounded-full text-xs font-bold border border-[#00A859]/20">
                              {code}
                              <button 
                                type="button"
                                onClick={() => setFormData({ ...formData, bnccCodes: formData.bnccCodes.filter(c => c !== code) })}
                                className="hover:text-red-500 transition-colors"
                              >
                                <Icons.X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 space-y-2">
                        <label className="text-[10px] font-bold text-black/40 uppercase tracking-wider">Adicionar Código BNCC (opcional)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualBnccInput}
                            onChange={(e) => setManualBnccInput(e.target.value.toUpperCase())}
                            placeholder="Ex: EF01LP99"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none text-sm bg-white transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (formData.bnccCodes.length >= 3) {
                                  alert("Você já atingiu o limite de 3 códigos BNCC.");
                                  return;
                                }
                                if (manualBnccInput.trim() && !formData.bnccCodes.includes(manualBnccInput.trim())) {
                                  setFormData({ ...formData, bnccCodes: [...formData.bnccCodes, manualBnccInput.trim()] });
                                  setManualBnccInput('');
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (manualBnccInput.trim() && !formData.bnccCodes.includes(manualBnccInput.trim())) {
                                setFormData({ ...formData, bnccCodes: [...formData.bnccCodes, manualBnccInput.trim()] });
                                setManualBnccInput('');
                              }
                            }}
                            className="px-5 py-2.5 bg-[#00A859]/10 text-[#00A859] font-bold rounded-xl text-sm hover:bg-[#00A859] hover:text-white transition-all whitespace-nowrap"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {formData.bnccCodes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.bnccCodes.map(code => (
                            <span key={code} className="inline-flex items-center gap-1 bg-[#00A859]/10 text-[#00A859] text-xs font-bold px-2 py-1 rounded-md">
                              {code}
                              <button type="button" onClick={() => setFormData({ ...formData, bnccCodes: formData.bnccCodes.filter(c => c !== code) })} className="hover:text-red-500">
                                <Icons.X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === 'planejamento-diario' ? (
                  /* Planejamento Diário Specific Fields */
                  <div className="space-y-6">
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Conteúdo Pedagógico</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Objetivos da Aula *</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.objectives}
                          onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                          placeholder="Quais são os objetivos principais desta aula?"
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Conteúdo / Atividades Planejadas *</label>
                        <textarea
                          required
                          rows={4}
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Descreva as atividades e o conteúdo que será abordado..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Recursos e Avaliação</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Recursos Didáticos *</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.resources}
                          onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                          placeholder="Ex: Livro didático, projetor, cartolinas..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Avaliação / Observações *</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.evaluation}
                          onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
                          placeholder="Como será a avaliação ou observações relevantes..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'planejamento-semanal' ? (
                  /* Planejamento Semanal - 5 Day Grid */
                  <div className="space-y-6">
                    <div className="bg-black/5 p-6 rounded-2xl overflow-x-auto">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30 mb-6">Grade Semanal (Segunda a Sexta)</h4>
                      
                      <table className="w-full min-w-[1200px] border-collapse">
                        <thead>
                          <tr className="text-left border-b border-black/10">
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-32">Dia</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-32">Turno</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-32">Horário</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-40">Campo Exp.</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-48">Códigos BNCC</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-64">Atividade</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-64">Objetivo (EI01)</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-64">Acompanhamento</th>
                            <th className="pb-3 text-[10px] font-black uppercase tracking-tighter text-black/40 w-64">Observações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].map((day) => (
                            <tr key={day} className="group">
                              <td className="py-4 pr-4 align-top">
                                <span className="text-sm font-bold text-black/80">{day}</span>
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <select
                                  value={formData.weeklyData?.[day]?.turno || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), turno: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none bg-white"
                                >
                                  <option value="">Selecione</option>
                                  <option value="Manhã">Manhã</option>
                                  <option value="Tarde">Tarde</option>
                                  <option value="Integral">Integral</option>
                                </select>
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <input
                                  type="text"
                                  placeholder="____ às ____"
                                  value={formData.weeklyData?.[day]?.horario || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), horario: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none"
                                />
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <input
                                  type="text"
                                  placeholder="Ex: EI0"
                                  value={formData.weeklyData?.[day]?.campoExperiencia || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), campoExperiencia: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none"
                                />
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Códigos (Ex: EF01LP01)"
                                    value={formData.weeklyData?.[day]?.bnccCodes?.join(', ') || ''}
                                    onChange={(e) => {
                                      const codes = e.target.value.split(',').map(c => c.trim()).filter(c => c !== '');
                                      setFormData({
                                        ...formData,
                                        weeklyData: {
                                          ...formData.weeklyData,
                                          [day]: { ...(formData.weeklyData?.[day] || {}), bnccCodes: codes.slice(0, 3) }
                                        }
                                      });
                                    }}
                                    className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none"
                                  />
                                  <p className="text-[9px] text-black/30">Até 3 códigos separados por vírgula.</p>
                                </div>
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <textarea
                                  rows={2}
                                  value={formData.weeklyData?.[day]?.atividade || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), atividade: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none resize-none"
                                />
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <textarea
                                  rows={2}
                                  value={formData.weeklyData?.[day]?.objetivo || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), objetivo: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none resize-none"
                                />
                              </td>
                              <td className="py-4 pr-4 align-top">
                                <textarea
                                  rows={2}
                                  value={formData.weeklyData?.[day]?.acompanhamento || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), acompanhamento: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none resize-none"
                                />
                              </td>
                              <td className="py-4 align-top">
                                <textarea
                                  rows={2}
                                  value={formData.weeklyData?.[day]?.observacoes || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    weeklyData: {
                                      ...formData.weeklyData,
                                      [day]: { ...(formData.weeklyData?.[day] || {}), observacoes: e.target.value }
                                    }
                                  })}
                                  className="w-full px-2 py-2 rounded-lg border border-black/10 text-xs focus:border-[#00A859] outline-none resize-none"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeTab === 'registro-mensal' ? (
                  /* Registro Mensal Specific Fields - 6 Sections */
                  <div className="space-y-8">
                    {/* Section 1: Identificação e Carga Horária */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">1. Identificação e Carga Horária</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Nome do Professor</label>
                          <input
                            type="text"
                            value={formData.professorName}
                            onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                            placeholder="Nome completo"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Disciplina</label>
                          <input
                            type="text"
                            value={formData.discipline}
                            onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                            placeholder="Ex: Língua Portuguesa"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Unidade Escolar</label>
                          <input
                            type="text"
                            value={formData.schoolUnit}
                            onChange={(e) => setFormData({ ...formData, schoolUnit: e.target.value })}
                            placeholder="Nome da Escola"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Turma / Ano / Série</label>
                          <input
                            type="text"
                            value={formData.yearGrade}
                            onChange={(e) => setFormData({ ...formData, yearGrade: e.target.value })}
                            placeholder="Ex: 1º Ano Ensino Fundamental"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-6 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider text-xs">Total Aulas Dadas</label>
                          <input
                            type="number"
                            value={formData.totalAulasDadas}
                            onChange={(e) => setFormData({ ...formData, totalAulasDadas: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider text-xs">Aulas Previstas</label>
                          <input
                            type="number"
                            value={formData.aulasPrevistas}
                            onChange={(e) => setFormData({ ...formData, aulasPrevistas: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider text-xs">Aulas Pendentes</label>
                          <input
                            type="number"
                            value={formData.aulasPendentes}
                            onChange={(e) => setFormData({ ...formData, aulasPendentes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider text-xs">Horas APD</label>
                          <input
                            type="text"
                            value={formData.apdHours}
                            onChange={(e) => setFormData({ ...formData, apdHours: e.target.value })}
                            placeholder="Planejamento/APD"
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Conteúdos e Metodologias */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">2. Conteúdos e Metodologias</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Conteúdos Ministrados no Mês</label>
                        <textarea
                          rows={3}
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Resumo dos conteúdos trabalhados..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Metodologias e Tecnologias</label>
                        <textarea
                          rows={3}
                          value={formData.metodologias}
                          onChange={(e) => setFormData({ ...formData, metodologias: e.target.value })}
                          placeholder="Metodologias ativas, Sala do Futuro, CMSP, etc..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Section 3: Avaliações e Materiais */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">3. Avaliações e Materiais</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Registro de Avaliações e Recuperação</label>
                        <textarea
                          rows={3}
                          value={formData.evaluation}
                          onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
                          placeholder="Provas, trabalhos, recuperação contínua..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Materiais Didáticos Utilizados</label>
                        <textarea
                          rows={2}
                          value={formData.materiaisDidaticos}
                          onChange={(e) => setFormData({ ...formData, materiaisDidaticos: e.target.value })}
                          placeholder="Livros, vídeos, ferramentas digitais..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Section 4: Frequência e Comportamento */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">4. Frequência e Comportamento</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Resumo da Frequência Diária</label>
                        <textarea
                          rows={2}
                          value={formData.frequenciaDiaria}
                          onChange={(e) => setFormData({ ...formData, frequenciaDiaria: e.target.value })}
                          placeholder="Observações sobre faltas e pontualidade..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Justificativa de Faltas</label>
                          <textarea
                            rows={2}
                            value={formData.justificativasFaltas}
                            onChange={(e) => setFormData({ ...formData, justificativasFaltas: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Obs. de Comportamento</label>
                          <textarea
                            rows={2}
                            value={formData.obsComportamento}
                            onChange={(e) => setFormData({ ...formData, obsComportamento: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Relacionamento Escola-Comunidade */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">5. Relacionamento Escola-Comunidade</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Comunicação com Responsáveis</label>
                        <textarea
                          rows={2}
                          value={formData.comunicacaoResponsaveis}
                          onChange={(e) => setFormData({ ...formData, comunicacaoResponsaveis: e.target.value })}
                          placeholder="Reuniões, comunicados, atendimentos..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Conselhos e Reuniões</label>
                          <textarea
                            rows={2}
                            value={formData.participacaoConselhos}
                            onChange={(e) => setFormData({ ...formData, participacaoConselhos: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Atividades Coletivas</label>
                          <textarea
                            rows={2}
                            value={formData.atividadesColetivas}
                            onChange={(e) => setFormData({ ...formData, atividadesColetivas: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Reflexão e Desenvolvimento */}
                    <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black/30">6. Reflexão e Desenvolvimento</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Formação Continuada</label>
                        <textarea
                          rows={2}
                          value={formData.formacaoContinuada}
                          onChange={(e) => setFormData({ ...formData, formacaoContinuada: e.target.value })}
                          placeholder="Cursos, HTPCs, formações específicas..."
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Autoavaliação do Mês</label>
                          <textarea
                            rows={2}
                            value={formData.autoavaliacao}
                            onChange={(e) => setFormData({ ...formData, autoavaliacao: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Feedback da Coordenação</label>
                          <textarea
                            rows={2}
                            value={formData.feedbackCoordenacao}
                            onChange={(e) => setFormData({ ...formData, feedbackCoordenacao: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* General Module Fields */
                  <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Detalhes do Registro</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {activeTab !== 'relatorios-turma' && activeTab !== 'planejamento-semanal' && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Nome do Aluno</label>
                          {formData.turma ? (
                            <select
                              value={formData.studentName}
                              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                            >
                              <option value="">Selecione o Aluno (Opcional)</option>
                              {supabaseStudents.filter(s => s.turma === formData.turma).map((s) => (
                                <option key={s.id} value={s.nome}>{s.nome}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={formData.studentName}
                              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                              placeholder="Selecione a Turma primeiro ou digite aqui"
                              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                            />
                          )}
                        </div>
                      )}
                      <div className={cn("space-y-2", activeTab === 'relatorios-turma' && "md:col-start-2")}>
                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Ano / Série</label>
                        <input
                          type="text"
                          value={formData.yearGrade}
                          onChange={(e) => setFormData({ ...formData, yearGrade: e.target.value })}
                          placeholder="Ex: 1º Ano Ensino Fundamental"
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Tom do Texto</label>
                      <select
                        value={formData.tone}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                      >
                        <option value="Formal">Formal</option>
                        <option value="Acolhedor">Acolhedor</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Incentivador">Incentivador</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Observações do Professor *</label>
                      <textarea
                        required
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva detalhadamente o registro pedagógico..."
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </>

              <div className="bg-black/5 p-6 rounded-2xl space-y-4 mb-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Configurações de Exportação</h4>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Formato de Exportação</label>
                  <select
                    value={formData.exportFormat}
                    onChange={(e) => setFormData({ ...formData, exportFormat: e.target.value as 'pdf' | 'csv' })}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                  >
                    <option value="pdf">PDF (Documento Estruturado)</option>
                    <option value="csv">CSV (Planilha Excel)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#00A859] text-white rounded-full font-bold hover:bg-[#008F4C] transition-all shadow-lg shadow-[#00A859]/20"
                >
                  {activeTab === 'planejamento-diario' ? 'Salvar Planejamento' : activeTab === 'registro-mensal' ? 'Salvar Registro Mensal' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport()}
                  className="flex-1 py-4 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all shadow-lg"
                >
                  Gerar Documento
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 bg-black/5 text-black/60 rounded-full font-bold hover:bg-black/10 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'dashboard-evolucao' ? (
          <EvolutionDashboard onNavigate={(id) => setActiveTab(id)} />
        ) : currentModuleRecords.length > 0 ? (
          /* List View */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                {`Registros em ${activeItem?.label}`}
              </h3>
              <button
                onClick={() => handleOpenForm()}
                className="px-6 py-2.5 bg-[#00A859] text-white rounded-full font-bold hover:bg-[#008F4C] transition-all flex items-center gap-2 shadow-lg shadow-[#00A859]/20"
              >
                <Icons.Plus size={18} />
                Novo Registro
              </button>
            </div>

            <div className="grid gap-4">
              {currentModuleRecords.map(record => (
                <div
                  key={record.id}
                  className="bg-white p-6 rounded-2xl border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#00A859]/10 rounded-xl flex items-center justify-center text-[#00A859] shrink-0">
                      {renderIcon(activeItem?.icon || 'FileText')}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{record.title}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-xs text-black/40 flex items-center gap-1">
                          <Icons.Calendar size={12} />
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                        </p>
                        {record.turma && (
                          <p className="text-xs text-black/40 flex items-center gap-1">
                            <Icons.Users size={12} />
                            {record.turma}
                          </p>
                        )}
                        {record.studentName && (
                          <p className="text-xs text-black/40 flex items-center gap-1">
                            <Icons.User size={12} />
                            {record.studentName}
                          </p>
                        )}
                        {record.period && (
                          <p className="text-xs text-black/40 flex items-center gap-1">
                            <Icons.Clock size={12} />
                            {record.period}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-black/60 mt-3 line-clamp-2">{record.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setRecordForExport(record);
                        setIsExportModalOpen(true);
                      }}
                      className="p-2.5 bg-black/5 rounded-lg text-black/40 hover:text-[#00A859] hover:bg-[#00A859]/10 transition-all"
                      title="Gerar Documento"
                    >
                      <Icons.FileDown size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenForm(record)}
                      className="p-2.5 bg-black/5 rounded-lg text-black/40 hover:text-[#00A859] hover:bg-[#00A859]/10 transition-all"
                      title="Editar"
                    >
                      <Icons.Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2.5 bg-black/5 rounded-lg text-black/40 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Excluir"
                    >
                      <Icons.Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-black/5 p-6 md:p-12 min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-black/5 rounded-full flex items-center justify-center text-black/10 mb-6 md:mb-8">
              {renderIcon(activeItem?.icon || 'Search', 'w-8 h-8 md:w-12 md:h-12')}
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">Nenhum registro encontrado</h3>
            <p className="text-sm md:text-base text-black/40 max-w-sm mb-8 md:mb-10">
              Ainda não existem dados cadastrados no módulo de <span className="font-bold text-black/60">{activeItem?.label}</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() => handleOpenForm()}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#00A859] text-white rounded-full font-bold hover:bg-[#008F4C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00A859]/20"
              >
                <Icons.Plus size={18} />
                Novo Registro
              </button>
              {role === 'diretor' && (
                <button className="w-full sm:w-auto px-8 py-3.5 border border-black/10 rounded-full font-bold hover:bg-black hover:text-white transition-all text-center">
                  Importar Dados
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
      {/* Export Selection Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-[#00A859]/10 rounded-2xl flex items-center justify-center text-[#00A859]">
                <Icons.FileDown size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Exportar Registro</h3>
                <p className="text-sm text-black/40">Escolha o formato do documento</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Formato de Exportação</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRecordForExport(prev => prev ? { ...prev, exportFormat: 'pdf' } : null)}
                    className={`py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${(recordForExport?.exportFormat || 'pdf') === 'pdf'
                      ? 'border-[#00A859] bg-[#00A859]/5 text-[#00A859]'
                      : 'border-black/5 hover:border-black/10 text-black/40'
                      }`}
                  >
                    <Icons.FileText size={20} />
                    PDF
                  </button>
                  <button
                    onClick={() => setRecordForExport(prev => prev ? { ...prev, exportFormat: 'csv' } : null)}
                    className={`py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${recordForExport?.exportFormat === 'csv'
                      ? 'border-[#00A859] bg-[#00A859]/5 text-[#00A859]'
                      : 'border-black/5 hover:border-black/10 text-black/40'
                      }`}
                  >
                    <Icons.Table size={20} />
                    CSV
                  </button>
                </div>
              </div>

              <div className="p-4 bg-black/5 rounded-2xl">
                <p className="text-xs text-black/40 leading-relaxed">
                  O documento será baixado localmente e uma cópia será enviada automaticamente para seu e-mail cadastrado.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleExport(recordForExport)}
                className="flex-1 py-4 bg-[#00A859] text-white rounded-full font-bold hover:bg-[#008F4C] transition-all shadow-lg shadow-[#00A859]/20"
              >
                Exportar agora
              </button>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setRecordForExport(null);
                }}
                className="flex-1 py-4 bg-black/5 text-black/60 rounded-full font-bold hover:bg-black/10 transition-all font-bold"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
