import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  FileText,
  Calendar,
  ClipboardList,
  Accessibility,
  Sparkles,
  GraduationCap,
  School,
  Book,
  Megaphone,
  HelpCircle,
  DollarSign,
  FileBox,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  FileEdit,
  Search,
  ArrowLeft,
  User,
  Clock,
  History
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const performanceData = [
  { month: 'Jan', grade: 7.2 },
  { month: 'Fev', grade: 7.5 },
  { month: 'Mar', grade: 7.1 },
  { month: 'Abr', grade: 8.0 },
  { month: 'Mai', grade: 8.4 },
  { month: 'Jun', grade: 8.2 },
];

const studentPerformanceData = [
  { period: '1º Bim', grade: 8.5 },
  { period: '2º Bim', grade: 7.8 },
  { period: '3º Bim', grade: 9.2 },
  { period: '4º Bim', grade: 8.8 },
];

const distributionData = [
  { name: 'Abaixo de 5', value: 5, color: '#EF4444' },
  { name: '5 a 7', value: 15, color: '#F59E0B' },
  { name: '7 a 9', value: 45, color: '#10B981' },
  { name: 'Acima de 9', value: 35, color: '#00A859' },
];

interface EvolutionDashboardProps {
  onNavigate: (tabId: string) => void;
}

export default function EvolutionDashboard({ onNavigate }: EvolutionDashboardProps) {
  const [view, setView] = useState<'general' | 'individual'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const indicators = [
    { label: 'Média Geral', value: '8.2', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Planos Concluídos', value: '24/30', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Alunos em Risco', value: '3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const shortcutCategories = [
    {
      title: 'Registros Pedagógicos',
      items: [
        { id: 'planejamento-semanal', label: 'Planejamento Semanal', icon: Calendar },
        { id: 'registro-mensal', label: 'Registro Mensal', icon: ClipboardList },
        { id: 'planejamento-diario', label: 'Planejamento Diário', icon: FileEdit },
      ]
    },
    {
      title: 'Relatórios',
      items: [
        { id: 'relatorio-individual', label: 'Relatório Individual', icon: FileText },
        { id: 'parecer-pcd', label: 'Parecer PCD', icon: Accessibility },
        { id: 'parecer-final', label: 'Parecer Final (Análise)', icon: Sparkles },
      ]
    },
    {
      title: 'Gestão de Alunos',
      items: [
        { id: 'alunos', label: 'Alunos', icon: Users },
      ]
    }
  ];

  if (view === 'individual') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('general')}
            className="flex items-center gap-2 text-black/60 hover:text-black transition-colors font-bold"
          >
            <ArrowLeft size={20} />
            Voltar ao Dashboard Geral
          </button>
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-black/5 shadow-sm">
            <div className="w-10 h-10 bg-[#00A859]/10 rounded-full flex items-center justify-center text-[#00A859]">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-black/40 uppercase tracking-wider">Aluno Selecionado</p>
              <p className="font-black">Ana Beatriz Silva</p>
            </div>
          </div>
        </div>

        {/* Individual Charts */}
        <div className="grid grid-cols-1 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#00A859]" />
              Evolução de Notas por Período
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#00A859"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#00A859', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* History and Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <History size={24} className="text-black/40" />
              Histórico de Pareceres e Relatórios
            </h3>
            <div className="space-y-4">
              {[
                { date: '2024-03-15', type: 'Parecer Pedagógico', title: 'Desenvolvimento Socioemocional', status: 'Finalizado' },
                { date: '2024-02-28', type: 'Relatório Mensal', title: 'Acompanhamento de Alfabetização', status: 'Finalizado' },
                { date: '2024-02-10', type: 'Planejamento Semanal', title: 'Participação em Atividades em Grupo', status: 'Finalizado' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-black/5 flex items-center justify-between group hover:border-[#00A859] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40 group-hover:bg-[#00A859]/10 group-hover:text-[#00A859]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black/40 uppercase tracking-wider">{item.type} • {new Date(item.date).toLocaleDateString('pt-BR')}</p>
                      <h4 className="font-bold">{item.title}</h4>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/20 hover:text-[#00A859]">
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles size={24} className="text-[#00A859]" />
              Insights de Análise
            </h3>
            <div className="bg-gradient-to-br from-[#00A859] to-[#008F4C] p-6 rounded-[32px] text-white space-y-4 shadow-lg shadow-[#00A859]/20">
              <p className="text-sm leading-relaxed opacity-90">
                Ana Beatriz demonstra excelente progresso em Língua Portuguesa, com aumento de 15% na média desde o 1º bimestre.
                <br /><br />
                <strong>Recomendação:</strong> Introduzir atividades de desafio em produção textual para manter o engajamento.
              </p>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Análise
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Individual Evolution Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Dashboard de Evolução</h2>
          <p className="text-black/40 font-medium">Visão geral do desempenho acadêmico</p>
        </div>
        <button
          onClick={() => setView('individual')}
          className="px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          <TrendingUp size={20} />
          Ver Evolução Individual
        </button>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map((indicator, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${indicator.bg} ${indicator.color} rounded-2xl flex items-center justify-center`}>
                <indicator.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-black/40 uppercase tracking-wider">{indicator.label}</p>
                <p className="text-2xl font-black">{indicator.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8">
        {/* Evolution Grade Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm"
        >
          <h3 className="text-lg font-bold mb-6">Evolução de Notas</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#00A859"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#00A859', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm"
        >
          <h3 className="text-lg font-bold mb-6">Distribuição de Notas</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
              {distributionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-black/5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs font-bold text-black/40 uppercase tracking-wider">{item.name}</p>
                    <p className="text-lg font-black">{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Shortcuts */}
      <div className="space-y-8 pb-12">
        <h2 className="text-2xl font-black tracking-tight">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {shortcutCategories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black/30 px-2">
                {category.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => onNavigate(item.id)}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-black/5 hover:border-[#00A859] hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40 group-hover:bg-[#00A859]/10 group-hover:text-[#00A859] transition-colors">
                        <item.icon size={20} />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-black/20 group-hover:text-[#00A859] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
