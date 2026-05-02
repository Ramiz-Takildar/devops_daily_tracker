import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Filler,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Activity,
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { toolService } from '../services/toolService';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import TimeInput from '../components/common/TimeInput';
import { useData } from '../context/DataContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const toolIcons = {
  AWS: '☁️',
  Docker: '🐳',
  Jenkins: '🧩',
  Kubernetes: '☸️',
  Git: '🌿',
  Linux: '🐧',
  Terraform: '🏗️',
  Azure: '🔷',
  Ansible: '🛠️',
};

const defaultFormData = {
  toolId: '',
  date: new Date().toISOString().split('T')[0],
  hoursSpent: '',
  notes: '',
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const getRelativeLastStudied = (date) => {
  if (!date) return 'No activity yet';
  const today = new Date();
  const practiced = new Date(date);
  const diffTime = today.setHours(0, 0, 0, 0) - practiced.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Studied today';
  if (diffDays === 1) return 'Last studied: 1 day ago';
  return `Last studied: ${diffDays} days ago`;
};

const buildToolStats = (tools, entries) => {
  const latestEntriesByTool = entries.reduce((acc, entry) => {
    const existing = acc[entry.tool_id];
    if (!existing || new Date(entry.date) > new Date(existing.date)) {
      acc[entry.tool_id] = entry;
    }
    return acc;
  }, {});

  return tools.map((tool) => {
    const totalHours = Number(tool.user_total_hours || 0);
    const lastEntry = latestEntriesByTool[tool.id];
    return {
      ...tool,
      totalHours,
      lastUsed: tool.last_practiced || lastEntry?.date || null,
      recentEntry: lastEntry || null,
    };
  });
};

const ToolCard = ({ tool, maxHours, isTopTool, isActive, onClick }) => {
  const progress = maxHours > 0 ? Math.max((tool.totalHours / maxHours) * 100, tool.totalHours > 0 ? 6 : 0) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tool)}
      className="card card-hover group relative cursor-pointer overflow-hidden p-5 transition-shadow hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]"
      title={`Click to log time for ${tool.name}`}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(135deg, ${tool.color}20, transparent 58%)`,
          boxShadow: `inset 0 0 0 1px ${tool.color}33`,
        }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-3xl text-2xl shadow-lg"
              style={{ backgroundColor: `${tool.color}22`, color: tool.color }}
            >
              <span>{toolIcons[tool.name] || tool.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-theme">{tool.name}</h3>
              <p className="text-xs text-theme-muted">{getRelativeLastStudied(tool.lastUsed)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isTopTool ? <span className="badge badge-warning">🔥 Top Tool</span> : null}
            {isActive ? <span className="badge badge-success">⚡ Active</span> : null}
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-theme">{tool.totalHours.toFixed(1)}h</p>
            <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">Total hours</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-theme-muted">Relative usage</p>
            <p className="text-sm font-semibold text-theme">{Math.round(progress)}%</p>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${tool.color}, color-mix(in srgb, ${tool.color} 70%, #ffffff 30%))`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const EntryModal = ({ isOpen, onClose, onSubmit, formData, setFormData, tools, editingEntry, prefilledTool }) => {
  const selectedTool = prefilledTool || tools.find(t => t.id === parseInt(formData.toolId));
  
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
          >
            <div className="flex items-center justify-between border-b border-theme px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">
                  {prefilledTool ? '⚡ Quick entry' : 'Premium entry modal'}
                </p>
                <h2 className="mt-2 text-xl font-bold text-theme">
                  {editingEntry ? 'Update learning entry' : prefilledTool ? `Log time for ${prefilledTool.name}` : 'Create new learning entry'}
                </h2>
              </div>
              <button onClick={onClose} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 p-6">
              {!editingEntry ? (
                <>
                  {prefilledTool ? (
                    <div className="rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold"
                          style={{ backgroundColor: `${prefilledTool.color}22`, color: prefilledTool.color }}
                        >
                          {toolIcons[prefilledTool.name] || prefilledTool.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-theme">{prefilledTool.name}</p>
                          <p className="text-xs text-theme-muted">
                            {prefilledTool.recentEntry 
                              ? `Last logged: ${prefilledTool.recentEntry.hours_spent}h`
                              : 'First entry for this tool'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="toolId" className="label">
                        Tool *
                      </label>
                      <select
                        id="toolId"
                        value={formData.toolId}
                        onChange={(event) => setFormData((current) => ({ ...current, toolId: event.target.value }))}
                        className="input"
                        required
                      >
                        <option value="">Select a tool</option>
                        {tools.map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="date" className="label">
                      Date *
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                </>
              ) : null}

              <TimeInput
                value={formData.hoursSpent}
                onChange={(value) => setFormData((current) => ({ ...current, hoursSpent: value }))}
                suggestions={
                  formData.toolId
                    ? [
                        { label: 'Usual: 2h', value: '2' },
                        { label: 'Quick: 1h', value: '1' },
                        { label: 'Deep: 4h', value: '4' },
                      ]
                    : []
                }
                label="Hours Spent"
              />

              <div className="form-group">
                <label htmlFor="notes" className="label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  className="input"
                  rows="5"
                  placeholder="What did you learn today?"
                  maxLength="1000"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingEntry ? 'Update Entry' : 'Create Entry'}
                </button>
                <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const EntryTable = ({
  entries,
  onEdit,
  onDeleteRequest,
  onOpenNotes,
}) => {
  return (
    <div className="overflow-hidden rounded-[28px] border border-theme">
      <div className="max-h-[520px] overflow-auto">
        <table className="table">
          <thead className="table-header sticky top-0 z-10 backdrop-blur-xl">
            <tr>
              <th className="table-cell text-left font-semibold text-theme-soft">Date</th>
              <th className="table-cell text-left font-semibold text-theme-soft">Tool</th>
              <th className="table-cell text-left font-semibold text-theme-soft">Hours</th>
              <th className="table-cell text-left font-semibold text-theme-soft">Notes</th>
              <th className="table-cell text-left font-semibold text-theme-soft">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <motion.tr
                key={entry.id}
                className={`table-row ${index % 2 === 0 ? 'bg-[color:var(--surface)]/35' : 'bg-transparent'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.02 }}
              >
                <td className="table-cell">
                  <div className="flex items-center gap-2 text-theme">
                    <CalendarDays size={16} className="text-theme-muted" />
                    <span>{formatDate(entry.date)}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="inline-flex items-center gap-2 rounded-full border border-theme bg-[color:var(--surface-soft)] px-3 py-1.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${entry.tool_color}22`, color: entry.tool_color }}
                    >
                      {toolIcons[entry.tool_name] || entry.tool_name.charAt(0)}
                    </span>
                    <span className="text-sm font-semibold text-theme">{entry.tool_name}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2 text-theme">
                    <Clock3 size={16} className="text-theme-muted" />
                    <span>{Number(entry.hours_spent).toFixed(1)}h</span>
                  </div>
                </td>
                <td className="table-cell max-w-xs">
                  {entry.notes ? (
                    <button
                      onClick={() => onOpenNotes(entry)}
                      className="truncate text-left text-sm text-theme-muted transition hover:text-theme"
                      title="View full note"
                    >
                      {entry.notes.length > 72 ? `${entry.notes.slice(0, 72)}...` : entry.notes}
                    </button>
                  ) : (
                    <span className="text-sm text-theme-muted">—</span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(entry)}
                      className="btn btn-secondary btn-sm text-sky-400 hover:shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteRequest(entry)}
                      className="btn btn-secondary btn-sm text-rose-400 hover:shadow-[0_0_18px_rgba(244,63,94,0.28)]"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ToolTracker = () => {
  const {
    tools,
    entries,
    fetchTools,
    fetchEntries,
    fetchDashboardStats,
    clearCache,
    setTools,
    setEntries,
  } = useData();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [prefilledTool, setPrefilledTool] = useState(null);
  const [selectedNotesEntry, setSelectedNotesEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToolId, setSelectedToolId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchTools(),
        fetchEntries({ limit: 200 }),
      ]);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingEntry) {
        const response = await toolService.updateEntry(editingEntry.id, {
          hoursSpent: parseFloat(formData.hoursSpent),
          notes: formData.notes,
        });
        toast.success('Entry Updated ✅');
      } else {
        const response = await toolService.createEntry({
          toolId: parseInt(formData.toolId, 10),
          date: formData.date,
          hoursSpent: parseFloat(formData.hoursSpent),
          notes: formData.notes,
        });
        toast.success('Entry Added ✅');
      }

      setShowModal(false);
      setEditingEntry(null);
      setPrefilledTool(null);
      resetForm();
      
      // Clear cache and refresh all data immediately to show the new entry
      clearCache();
      
      // Force refresh with a small delay to ensure backend trigger has completed
      setTimeout(async () => {
        await Promise.all([
          fetchTools(true),
          fetchEntries({ limit: 200 }, true),
          fetchDashboardStats(true),
        ]);
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save entry');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      toolId: entry.tool_id,
      date: entry.date.split('T')[0],
      hoursSpent: entry.hours_spent,
      notes: entry.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await toolService.deleteEntry(deleteTarget.id);
      setEntries((current) => current.filter((entry) => entry.id !== deleteTarget.id));
      toast.success('Entry Deleted ❌');
      setDeleteTarget(null);
      
      // Clear cache and refresh all data after deletion
      clearCache();
      await Promise.all([
        fetchTools(true),
        fetchEntries({ limit: 200 }, true),
        fetchDashboardStats(true),
      ]);
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const openNewEntryModal = () => {
    setEditingEntry(null);
    setPrefilledTool(null);
    resetForm();
    setShowModal(true);
  };

  const handleToolCardClick = (tool) => {
    setEditingEntry(null);
    setPrefilledTool(tool);
    setFormData({
      toolId: tool.id.toString(),
      date: new Date().toISOString().split('T')[0],
      hoursSpent: tool.recentEntry?.hours_spent || '',
      notes: '',
    });
    setShowModal(true);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesTool = selectedToolId ? String(entry.tool_id) === String(selectedToolId) : true;
      const matchesSearch = searchTerm
        ? `${entry.tool_name} ${entry.notes || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const entryDate = new Date(entry.date);
      const matchesStart = startDate ? entryDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? entryDate <= new Date(endDate) : true;
      return matchesTool && matchesSearch && matchesStart && matchesEnd;
    });
  }, [entries, searchTerm, selectedToolId, startDate, endDate]);

  const toolStats = useMemo(() => buildToolStats(tools, entries), [tools, entries]);
  const maxHours = useMemo(() => Math.max(...toolStats.map((tool) => tool.totalHours), 0), [toolStats]);

  const topTool = useMemo(() => toolStats.reduce((best, current) => (current.totalHours > (best?.totalHours || 0) ? current : best), null), [toolStats]);
  const recentlyUsedIds = useMemo(() => {
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 3);
    return new Set(
      toolStats
        .filter((tool) => tool.lastUsed && new Date(tool.lastUsed) >= recentCutoff)
        .map((tool) => tool.id)
    );
  }, [toolStats]);

  const insights = useMemo(() => {
    const totalToolsUsed = toolStats.filter((tool) => tool.totalHours > 0).length;
    const sorted = [...toolStats].filter((tool) => tool.totalHours > 0).sort((a, b) => a.totalHours - b.totalHours);
    const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0);
    const uniqueDays = new Set(entries.map((entry) => entry.date.split('T')[0])).size || 1;

    return [
      {
        title: 'Total Tools Used',
        value: totalToolsUsed,
        icon: Wrench,
        accent: 'text-sky-400',
      },
      {
        title: 'Most Used Tool',
        value: topTool?.name || '—',
        icon: Sparkles,
        accent: 'text-amber-400',
      },
      {
        title: 'Least Used Tool',
        value: sorted[0]?.name || '—',
        icon: Activity,
        accent: 'text-emerald-400',
      },
      {
        title: 'Avg Daily Hours',
        value: `${(totalHours / uniqueDays).toFixed(1)}h`,
        icon: Clock3,
        accent: 'text-violet-400',
      },
    ];
  }, [entries, toolStats, topTool]);

  const activityChart = useMemo(() => {
    const labels = [];
    const values = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      const key = date.toISOString().split('T')[0];
      labels.push(
        date.toLocaleDateString('en-IN', {
          weekday: 'short',
        })
      );
      values.push(
        entries
          .filter((entry) => entry.date.split('T')[0] === key)
          .reduce((sum, entry) => sum + Number(entry.hours_spent || 0), 0)
      );
    }

    return {
      labels,
      datasets: [
        {
          label: 'Last 7 days',
          data: values,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.16)',
          fill: true,
          tension: 0.42,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [entries]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(56, 189, 248, 0.28)',
        borderWidth: 1,
        cornerRadius: 14,
        callbacks: {
          label: (context) => `${Number(context.raw).toFixed(1)}h logged`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148,163,184,0.12)' },
        ticks: {
          color: '#94a3b8',
          callback: (value) => `${value}h`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="min-h-[180px]" title lines={4} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[180px]" title lines={3} />
          ))}
        </div>
        <LoadingSkeleton className="min-h-[360px]" title lines={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Interactive tool tracker"
        badgeIcon={Sparkles}
        title="Track your"
        highlightText="DevOps practice depth"
        subtitle="Explore premium tool cards, animated activity signals, powerful filters, and a polished entry workflow designed like a modern analytics product."
        pattern="grid"
        actions={
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={openNewEntryModal}
            className="btn btn-primary h-14 rounded-2xl px-6 shadow-[0_18px_40px_rgba(37,99,235,0.28)]"
          >
            <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
              <Plus size={18} />
            </motion.span>
            New Entry
          </motion.button>
        }
        rightContent={
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">Activity Summary</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Total Entries</span>
                  <span className="text-lg font-bold text-theme">{entries.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Tools Tracked</span>
                  <span className="text-lg font-bold text-theme">{toolStats.filter(t => t.totalHours > 0).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-theme-muted">Total Hours</span>
                  <span className="text-lg font-bold text-theme">{entries.reduce((sum, e) => sum + Number(e.hours_spent || 0), 0).toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {toolStats.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            maxHours={maxHours}
            isTopTool={topTool?.id === tool.id}
            isActive={recentlyUsedIds.has(tool.id)}
            onClick={handleToolCardClick}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <div key={insight.title} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">{insight.title}</p>
                <p className="mt-2 text-2xl font-bold text-theme">{insight.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)]">
                <insight.icon size={18} className={insight.accent} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-theme">Study activity pulse</h2>
            <p className="text-sm text-theme-muted">Last 7 days of learning activity with smooth motion.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="input pl-10"
                placeholder="Search notes or tool name"
              />
            </div>
            <select
              value={selectedToolId}
              onChange={(event) => setSelectedToolId(event.target.value)}
              className="input min-w-[180px]"
            >
              <option value="">All tools</option>
              {tools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="input min-w-[170px]" />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="input min-w-[170px]" />
          </div>
        </div>
        <div className="h-64">
          <Line data={activityChart} options={chartOptions} />
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-theme">Recent entries</h2>
            <p className="text-sm text-theme-muted">Readable, filterable history with premium actions and notes expansion.</p>
          </div>
          <div className="badge badge-info">{filteredEntries.length} entries</div>
        </div>

        {filteredEntries.length ? (
          <EntryTable
            entries={filteredEntries}
            onEdit={handleEdit}
            onDeleteRequest={setDeleteTarget}
            onOpenNotes={setSelectedNotesEntry}
          />
        ) : (
          <div className="empty-state border border-dashed border-theme">
            <p>No entries found for the current filters</p>
          </div>
        )}
      </section>

      <EntryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEntry(null);
          setPrefilledTool(null);
          resetForm();
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        tools={tools}
        editingEntry={editingEntry}
        prefilledTool={prefilledTool}
      />

      <AnimatePresence>
        {selectedNotesEntry ? (
          <motion.div
            className="modal-overlay"
            onClick={() => setSelectedNotesEntry(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content max-w-2xl"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
            >
              <div className="flex items-center justify-between border-b border-theme px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">Entry notes</p>
                  <h3 className="mt-2 text-xl font-bold text-theme">{selectedNotesEntry.tool_name}</h3>
                </div>
                <button onClick={() => setSelectedNotesEntry(null)} className="btn btn-secondary btn-sm">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3 p-6">
                <div className="flex items-center gap-2 text-sm text-theme-muted">
                  <CalendarDays size={16} />
                  <span>{formatDate(selectedNotesEntry.date)}</span>
                </div>
                <p className="text-sm leading-7 text-theme">{selectedNotesEntry.notes}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div
            className="modal-overlay"
            onClick={() => setDeleteTarget(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content max-w-lg"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
            >
              <div className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme">Delete this entry?</h3>
                  <p className="mt-2 text-sm text-theme-muted">
                    This will remove the {deleteTarget.tool_name} entry logged on {formatDate(deleteTarget.date)}.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="btn btn-danger flex-1">
                    Delete Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ToolTracker;