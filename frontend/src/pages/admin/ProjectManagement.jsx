import { useState, useEffect } from 'react';
import { Trash2, FolderKanban, Sparkles, Calendar, User } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter
      };
      const response = await api.get('/admin/projects', { params });
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await api.delete(`/admin/projects/${projectId}`);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const columns = [
    {
      header: 'Project',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <User className="w-3.5 h-3.5" />
              <span>{row.owner_name}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusMap = {
          'not-started': { label: 'Not Started', class: 'bg-gray-100 text-gray-700' },
          'in-progress': { label: 'In Progress', class: 'bg-blue-100 text-blue-700' },
          'completed': { label: 'Completed', class: 'bg-green-100 text-green-700' },
          'on-hold': { label: 'On Hold', class: 'bg-amber-100 text-amber-700' }
        };
        const status = statusMap[row.status?.toLowerCase().replace(/\s+/g, '-')] || statusMap['not-started'];
        return (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.class}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      header: 'Timeline',
      accessor: 'start_date',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {row.start_date ? new Date(row.start_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'Not set'}
            </span>
          </div>
          {row.end_date && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>→</span>
              <span>
                {new Date(row.end_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          badge="Project Administration"
          badgeIcon={Sparkles}
          title="Manage all"
          highlightText="platform projects"
          subtitle="View, filter, and manage projects across all users with comprehensive oversight tools."
          pattern="gradient"
        />

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          <DataTable
            columns={columns}
            data={projects}
            pagination={pagination}
            onPageChange={(page) => setPagination({ ...pagination, page })}
            onSearch={(value) => {
              setSearchTerm(value);
              setPagination({ ...pagination, page: 1 });
            }}
            searchPlaceholder="Search projects..."
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;
