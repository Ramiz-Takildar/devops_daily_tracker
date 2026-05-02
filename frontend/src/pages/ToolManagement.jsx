import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Wrench,
  Sparkles,
  Search,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

const defaultFormData = {
  name: '',
  category: '',
  icon: '',
  color: '#6B7280',
  description: '',
};

const commonCategories = [
  'Operating System',
  'Version Control',
  'Containerization',
  'Orchestration',
  'CI/CD',
  'IaC',
  'Cloud',
  'Configuration',
  'Monitoring',
  'Web Server',
  'Programming',
  'Scripting',
  'Package Manager',
  'GitOps',
  'Database',
  'Security',
  'Service Mesh',
  'Message Queue',
];

const colorPalette = [
  '#EE0000', '#D24939', '#F05032', '#2496ED', '#326CE5', '#0078D4',
  '#FF9900', '#FC6D26', '#F46800', '#7B42BC', '#6B46C1', '#009639',
  '#4EAA25', '#22C55E', '#FCC624', '#F59E0B', '#6B7280', '#4B5563',
];

const ToolManagement = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data.tools || []);
    } catch (error) {
      toast.error('Failed to load tools');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const openNewToolModal = () => {
    setEditingTool(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      category: tool.category || '',
      icon: tool.icon || '',
      color: tool.color || '#6B7280',
      description: tool.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`/tools/${deleteTarget.id}`);
      setTools((current) => current.filter((tool) => tool.id !== deleteTarget.id));
      toast.success('Tool deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete tool');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTool) {
        const response = await api.put(`/tools/${editingTool.id}`, formData);
        setTools((current) =>
          current.map((tool) => (tool.id === editingTool.id ? response.data.tool : tool))
        );
        toast.success('Tool updated successfully');
      } else {
        const response = await api.post('/tools', formData);
        setTools((current) => [response.data.tool, ...current]);
        toast.success('Tool added successfully');
      }

      setShowModal(false);
      setEditingTool(null);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save tool');
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tool.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="min-h-[180px]" title lines={4} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[180px]" title lines={3} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Tool Management"
        badgeIcon={Wrench}
        title="Manage your"
        highlightText="DevOps tools"
        subtitle="Add, edit, or remove tools from your tracking system. All changes are reflected immediately across the application."
        pattern="dots"
        actions={
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={openNewToolModal}
            className="btn btn-primary h-14 rounded-2xl px-6 shadow-[0_18px_40px_rgba(37,99,235,0.28)]"
          >
            <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
              <Plus size={18} />
            </motion.span>
            Add New Tool
          </motion.button>
        }
        rightContent={
          <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-theme-muted">Tool Stats</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-theme-muted">Total Tools</span>
                <span className="text-lg font-bold text-theme">{tools.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-theme-muted">Categories</span>
                <span className="text-lg font-bold text-theme">{new Set(tools.map(t => t.category).filter(Boolean)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-theme-muted">Active</span>
                <span className="text-lg font-bold text-emerald-400">{tools.length}</span>
              </div>
            </div>
          </div>
        }
      />

      <section className="card p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-theme">All Tools</h2>
            <p className="text-sm text-theme-muted">Manage your DevOps tool collection</p>
          </div>
          <div className="relative min-w-[280px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
              placeholder="Search tools..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              whileHover={{ scale: 1.02, y: -4 }}
              className="card card-hover p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold"
                    style={{ backgroundColor: `${tool.color}22`, color: tool.color }}
                  >
                    {tool.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-theme">{tool.name}</h3>
                    {tool.category && (
                      <p className="text-xs text-theme-muted">{tool.category}</p>
                    )}
                  </div>
                </div>
              </div>

              {tool.description && (
                <p className="mt-3 text-sm text-theme-muted line-clamp-2">
                  {tool.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-theme pt-4">
                <button
                  onClick={() => handleEdit(tool)}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(tool)}
                  className="btn btn-danger btn-sm flex-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {!filteredTools.length && (
          <div className="empty-state border border-dashed border-theme">
            <Wrench size={48} className="mx-auto mb-4 text-theme-muted" />
            <p>No tools found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-sm font-semibold text-[color:var(--accent)]"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingTool(null);
              resetForm();
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
            >
              <div className="flex items-center justify-between border-b border-theme px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">
                    {editingTool ? 'Edit Tool' : 'Add New Tool'}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-theme">
                    {editingTool ? `Edit ${editingTool.name}` : 'Create New Tool'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTool(null);
                    resetForm();
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="form-group">
                  <label htmlFor="name" className="label">
                    Tool Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Ansible, Prometheus"
                    required
                    maxLength="50"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="label">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    placeholder="e.g., Configuration, Monitoring"
                    list="categories"
                    maxLength="50"
                  />
                  <datalist id="categories">
                    {commonCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="color" className="label">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-12 w-20 cursor-pointer rounded-2xl border border-theme"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input flex-1"
                      placeholder="#6B7280"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="h-8 w-8 rounded-full border-2 border-theme transition hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Brief description of the tool..."
                    maxLength="500"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingTool ? 'Update Tool' : 'Add Tool'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTool(null);
                      resetForm();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="modal-overlay"
            onClick={() => setDeleteTarget(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content max-w-lg"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
            >
              <div className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme">Delete this tool?</h3>
                  <p className="mt-2 text-sm text-theme-muted">
                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will also delete all associated entries and cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="btn btn-danger flex-1">
                    Delete Tool
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolManagement;
