import { useEffect, useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarDays,
  CircleDashed,
  GripVertical,
  Pencil,
  Plus,
  Rocket,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { useData } from '../context/DataContext';

const BOARD_COLUMNS = [
  { id: 'Not Started', title: 'Not Started', icon: CircleDashed, accent: 'text-slate-400' },
  { id: 'In Progress', title: 'In Progress', icon: Rocket, accent: 'text-sky-400' },
  { id: 'Completed', title: 'Completed', icon: CalendarDays, accent: 'text-emerald-400' },
];

const defaultFormData = {
  name: '',
  description: '',
  techStack: '',
  status: 'Not Started',
  completionPercentage: 0,
  startDate: '',
  endDate: '',
};

const SortableProjectCard = ({ project, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(project.id), data: { type: 'project', project } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`card card-hover p-5 ${isDragging ? 'scale-[1.02] opacity-80 shadow-2xl' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-theme">{project.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-theme-muted">{project.status}</p>
        </div>
        <button
          type="button"
          className="cursor-grab rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-2 text-theme-muted"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${project.name}`}
        >
          <GripVertical size={16} />
        </button>
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-theme-muted">
        {project.description || 'No description added yet.'}
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-theme-muted">
          <span>Progress</span>
          <span>{project.completion_percentage}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.completion_percentage}%` }} />
        </div>
      </div>

      {!!project.tech_stack?.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech_stack.slice(0, 4).map((tech, index) => (
            <span key={`${project.id}-${index}`} className="badge badge-info">
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span className="badge badge-info">+{project.tech_stack.length - 4}</span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-theme pt-4 text-xs text-theme-muted">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} />
          <span>
            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="btn btn-secondary btn-sm"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="btn btn-danger btn-sm"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

const KanbanColumn = ({ column, projects, onEdit, onDelete }) => {
  const Icon = column.icon;

  return (
    <section className="flex min-h-[420px] flex-col rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface)]">
            <Icon size={18} className={column.accent} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-theme">{column.title}</h2>
            <p className="text-xs text-theme-muted">{projects.length} projects</p>
          </div>
        </div>
      </div>

      <SortableContext items={projects.map((project) => String(project.id))} strategy={rectSortingStrategy}>
        <div className="flex flex-1 flex-col gap-4">
          {projects.length ? (
            projects.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-3xl border border-dashed border-theme text-sm text-theme-muted">
              Drop a project here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
};

const ProjectTracker = () => {
  const { projects, fetchProjects, fetchDashboardStats, setProjects } = useData();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadProjects();
  }, []);

  const boardProjects = useMemo(() => {
    return BOARD_COLUMNS.reduce((acc, column) => {
      acc[column.id] = projects.filter((project) => project.status === column.id);
      return acc;
    }, {});
  }, [projects]);

  const loadProjects = async () => {
    try {
      await fetchProjects();
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const openNewProjectModal = () => {
    setEditingProject(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      techStack: project.tech_stack ? project.tech_stack.join(', ') : '',
      status: project.status,
      completionPercentage: project.completion_percentage,
      startDate: project.start_date ? project.start_date.split('T')[0] : '',
      endDate: project.end_date ? project.end_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${id}`);
      setProjects((current) => current.filter((project) => project.id !== id));
      toast.success('Project removed successfully');
      
      // Refresh dashboard stats after deletion
      await fetchDashboardStats();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const projectData = {
      ...formData,
      techStack: formData.techStack.split(',').map((item) => item.trim()).filter(Boolean),
      completionPercentage: parseInt(formData.completionPercentage, 10),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    try {
      if (editingProject) {
        const response = await api.put(`/projects/${editingProject.id}`, projectData);
        const updatedProject = response.data.project;
        setProjects((current) =>
          current.map((project) => (project.id === editingProject.id ? updatedProject : project))
        );
        toast.success('Project Updated 🚀');
      } else {
        const response = await api.post('/projects', projectData);
        setProjects((current) => [response.data.project, ...current]);
        toast.success('Entry Added ✅');
      }

      setShowModal(false);
      setEditingProject(null);
      resetForm();
      
      // Refresh dashboard stats to update UI across pages
      await fetchDashboardStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save project');
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project || project.status === newStatus) return;

    const previousProjects = projects;
    const completionPercentage =
      newStatus === 'Completed'
        ? 100
        : newStatus === 'Not Started'
        ? Math.min(project.completion_percentage, 15)
        : Math.max(project.completion_percentage, 35);

    setProjects((current) =>
      current.map((item) =>
        item.id === projectId
          ? { ...item, status: newStatus, completion_percentage: completionPercentage }
          : item
      )
    );

    try {
      await api.put(`/projects/${projectId}`, {
        name: project.name,
        description: project.description || '',
        techStack: project.tech_stack || [],
        status: newStatus,
        completionPercentage,
        startDate: project.start_date || null,
        endDate: project.end_date || null,
      });
      toast.success('Project Updated 🚀');
      
      // Refresh dashboard stats after status change
      await fetchDashboardStats();
    } catch (error) {
      setProjects(previousProjects);
      toast.error('Failed to move project');
    }
  };

  const findColumnForProject = (projectId) => {
    const project = projects.find((item) => item.id === Number(projectId) || item.id === projectId);
    return project?.status;
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = String(over.id);

    const activeColumn = findColumnForProject(activeId);
    const overColumn = BOARD_COLUMNS.some((column) => column.id === overId)
      ? overId
      : findColumnForProject(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn === overColumn) {
      const columnProjects = boardProjects[activeColumn] || [];
      const oldIndex = columnProjects.findIndex((project) => project.id === activeId);
      const newIndex = columnProjects.findIndex((project) => project.id === Number(overId));

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnProjects, oldIndex, newIndex);
      const others = projects.filter((project) => project.status !== activeColumn);
      setProjects([...others, ...reordered]);
      return;
    }

    await updateProjectStatus(activeId, overColumn);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="min-h-[180px]" title lines={4} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingSkeleton key={index} className="min-h-[360px]" title lines={6} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Premium Kanban board"
        badgeIcon={Rocket}
        title="Build projects in a"
        highlightText="flow-driven workspace"
        subtitle="Drag tasks across Not Started, In Progress, and Completed lanes with smooth interactions, glassmorphism cards, and fast project updates."
        pattern="dots"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary h-14 rounded-2xl px-6 shadow-[0_18px_40px_rgba(37,99,235,0.28)]"
          >
            <Plus size={18} />
            New Project
          </button>
        }
        rightContent={
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">Backlog</p>
              <p className="mt-2 text-3xl font-bold text-slate-400">{boardProjects['Not Started']?.length || 0}</p>
            </div>
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">Active</p>
              <p className="mt-2 text-3xl font-bold text-sky-400">{boardProjects['In Progress']?.length || 0}</p>
            </div>
            <div className="rounded-[28px] border border-theme bg-[color:var(--surface-soft)] p-4 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-theme-muted">Completed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">{boardProjects['Completed']?.length || 0}</p>
            </div>
          </div>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {BOARD_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              projects={boardProjects[column.id] || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </section>
      </DndContext>

      {!projects.length && (
        <div className="empty-state card border border-dashed border-theme">
          <p>No projects yet</p>
          <button onClick={openNewProjectModal} className="mt-3 text-sm font-semibold text-[color:var(--accent)]">
            Create your first project
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-theme px-6 py-5">
              <h2 className="text-xl font-bold text-theme">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="form-group">
                <label htmlFor="name" className="label">
                  Project Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="input"
                  placeholder="CI/CD Pipeline Setup"
                  required
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Describe your project..."
                  maxLength="1000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="techStack" className="label">
                  Tech Stack (comma-separated)
                </label>
                <input
                  id="techStack"
                  type="text"
                  value={formData.techStack}
                  onChange={(event) => setFormData({ ...formData, techStack: event.target.value })}
                  className="input"
                  placeholder="Docker, Kubernetes, Jenkins"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="form-group">
                  <label htmlFor="status" className="label">
                    Status *
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                    className="input"
                    required
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="completionPercentage" className="label">
                    Completion % *
                  </label>
                  <input
                    id="completionPercentage"
                    type="number"
                    value={formData.completionPercentage}
                    onChange={(event) =>
                      setFormData({ ...formData, completionPercentage: event.target.value })
                    }
                    className="input"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="form-group">
                  <label htmlFor="startDate" className="label">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate" className="label">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTracker;