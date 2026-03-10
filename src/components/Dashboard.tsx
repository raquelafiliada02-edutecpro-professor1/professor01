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

interface DashboardProps {
  userId: string;
  role: UserProfile;
  userCreatedAt?: string | null;
  userDataExpiracao?: string | null;
  onLogout: () => void;
  onGoToPayment: () => void;
}

export default function Dashboard({ userId, role, userCreatedAt, userDataExpiracao, onLogout, onGoToPayment }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(NAV_ITEMS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [records, setRecords] = useState<PedagogicalRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PedagogicalRecord | null>(null);

  // Supabase dynamic students for forms
  const [supabaseStudents, setSupabaseStudents] = useState<Student[]>([]);
  const [manualBnccInput, setManualBnccInput] = useState('');

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
    evaluation: ''
  });

  // Load records from localStorage on mount
  useEffect(() => {
    const savedRecords = localStorage.getItem(`edutec_records_${role}`);
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, [role]);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`edutec_records_${role}`, JSON.stringify(records));
  }, [records, role]);

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
        bnccCodes: Array.isArray(record.bnccCodes) ? record.bnccCodes : (record.bnccCodes ? record.bnccCodes.split(',').map(s => s.trim()) : []),
        objectives: record.objectives || '',
        content: record.content || '',
        resources: record.resources || '',
        evaluation: record.evaluation || ''
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
        } else if (['diario-semanal', 'registro-mensal', 'plano-aula', 'relatorios-turma'].includes(activeTab)) {
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
        evaluation: ''
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

    // SUPABASE INTEGRAÇÃO PARA CÓDIGOS BNCC
    // Se o registro possuir códigos BNCC, salvar no supabase
    if (formData.bnccCodes.length > 0) {
      try {
        // 1. Inserir códigos BNCC caso não existam (upsert / on conflict do nothing não nativo via client requer malabarismos no array, 
        // mas tentaremos o upsert por bloco se o código for unique, ou ignoraremos conflito via restrição de tabela)
        for (const code of formData.bnccCodes) {
          const matchedStatic = bnccCodesList.find(b => b.codigo === code);
          const rawDescricao = matchedStatic ? matchedStatic.descricao : 'Inserido manualmente';

          // Tentativa de insert limpo ignorando se já existir
          const { error: bnccError } = await supabase
            .from('bncc_codes')
            .upsert({
              codigo: code,
              descricao: rawDescricao
            }, { onConflict: 'codigo', ignoreDuplicates: true });

          if (bnccError) console.error("Erro inserindo bncc_codes:", bnccError);
        }

        // 2. Recuperar os IDs reais do banco de dados para criar os vínculos 
        // (necessário pois a tabela planejamento_bncc deve referenciar o `id` (uuid) que é a PK de bncc_codes)
        const { data: insertedCodes, error: fetchError } = await supabase
          .from('bncc_codes')
          .select('id, codigo')
          .in('codigo', formData.bnccCodes);

        if (fetchError) throw fetchError;

        if (insertedCodes && insertedCodes.length > 0) {
          // 3. Inserir na tabela relacional planejamento_bncc
          const planejamemtoBnccInserts = insertedCodes.map(c => ({
            planejamento_id: recordIdToSave,
            bncc_id: c.id
          }));

          const { error: relError } = await supabase
            .from('planejamento_bncc')
            .insert(planejamemtoBnccInserts); // Irá inserir, pode dar conflito de duplicate se já existia, ideal deletar velhos antes na edição

          if (relError) console.error("Erro inserindo na tabela relacional:", relError);
        }

        alert("Códigos BNCC vinculados com sucesso.");

      } catch (err: any) {
        console.error("Falha ao salvar códigos BNCC: ", err);
        alert("O relatório foi salvo localmente, mas houve um erro ao vincular a BNCC: " + err.message);
      }
    } else {
      if (activeTab === 'planejamento-diario') {
        alert("Planejamento diário registrado com sucesso.");
      } else {
        alert("Registro salvo com sucesso.");
      }
    }

    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const generatePDF = () => {
    if (!formData.title || !formData.date) {
      alert("Por favor, preencha os campos obrigatórios (Título e Data) antes de gerar o documento.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(0, 168, 89); // EduTecPro Green (#00A859)
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
    doc.text(formData.title, 14, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${new Date(formData.date).toLocaleDateString('pt-BR')} `, 14, 65);

    const infoData = [];
    if (formData.turma) infoData.push(['Turma/Série', formData.turma]);
    if (formData.studentName) infoData.push(['Aluno', formData.studentName]);
    if (formData.curricularComponent) infoData.push(['Componente Curricular', formData.curricularComponent]);
    if (formData.period) infoData.push(['Período', formData.period]);
    if (formData.bnccCodes && formData.bnccCodes.length > 0) infoData.push(['Códigos BNCC', formData.bnccCodes.join(', ')]);

    autoTable(doc, {
      startY: 75,
      body: infoData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [0, 0, 0], cellWidth: 50 },
        1: { textColor: [80, 80, 80] }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    const addSection = (title: string, content: string) => {
      if (!content) return;

      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 168, 89);
      doc.text(title, 14, currentY);
      currentY += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const splitText = doc.splitTextToSize(content, pageWidth - 28);
      doc.text(splitText, 14, currentY);

      currentY += (splitText.length * 5) + 10;
    };

    if (activeTab === 'planejamento-diario') {
      addSection("Objetivos da Aula", formData.objectives);
      addSection("Conteúdo / Atividades Planejadas", formData.content);
      addSection("Recursos Didáticos", formData.resources);
      addSection("Avaliação / Observações", formData.evaluation);
    } else {
      addSection("Observações do Professor", formData.description);
      addSection("Tom do Texto", formData.tone);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`EduTecPro - Gerador de Relatórios Pedagógicos • Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`EduTecPro_${activeItem?.label.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
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
                      <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Turma / Ano/Série</label>
                      <select
                        value={formData.turma}
                        onChange={(e) => setFormData({ ...formData, turma: e.target.value, studentName: '' })}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                      >
                        <option value="">Selecione uma Turma já cadastrada (Opcional)</option>
                        {Array.from(new Set(supabaseStudents.map(s => s.turma).filter(Boolean))).map((t) => (
                          <option key={t as string} value={t as string}>{t}</option>
                        ))}
                      </select>
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
                            setFormData({ ...formData, bnccCodes: selectedOptions });
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white text-sm"
                        >
                          {bnccCodesList.map((bncc) => (
                            <option key={bncc.codigo} value={bncc.codigo} className="py-2 px-2 border-b border-black/5 hover:bg-black/5 cursor-pointer">
                              {bncc.codigo} - {bncc.descricao.substring(0, 60)}{bncc.descricao.length > 60 ? '...' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-black/40 mt-1">Segure CTRL (ou CMD) para selecionar múltiplos códigos.</p>
                      </div>

                      {role !== 'free' && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={manualBnccInput}
                            onChange={(e) => setManualBnccInput(e.target.value.toUpperCase())}
                            placeholder="Ou digite o código BNCC manual (Ex: EF01LP99)"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none text-sm bg-white transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
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
                      )}

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
                ) : (
                  /* General Module Fields */
                  <div className="bg-black/5 p-6 rounded-2xl space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Detalhes do Registro</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {activeTab !== 'relatorios-turma' && (
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

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#00A859] text-white rounded-full font-bold hover:bg-[#008F4C] transition-all shadow-lg shadow-[#00A859]/20"
                >
                  {activeTab === 'planejamento-diario' ? 'Salvar Planejamento' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
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
                      onClick={() => alert("Gerando documento... O PDF será baixado em instantes.")}
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
    </DashboardLayout>
  );
}
