import { useState, useEffect } from 'react';
import { Trash2, FileText, Sparkles, Calendar, Clock, User, Wrench } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EntryManagement = () => {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    tool_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchEntries();
  }, [pagination.page, filters]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await api.get('/admin/entries', { params });
      setEntries(response.data.entries);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await api.delete(`/admin/entries/${entryId}`);
      toast.success('Entry deleted successfully');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'entry_date',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {new Date(row.entry_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      )
    },
    {
      header: 'User',
      accessor: 'username',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white shadow-sm">
            {row.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.username}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Tool',
      accessor: 'tool_name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-gray-400" />
            <p className="font-semibold text-gray-900">{row.tool_name}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{row.tool_category}</p>
        </div>
      )
    },
    {
      header: 'Hours',
      accessor: 'hours_spent',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {row.hours_spent}h
          </span>
        </div>
      )
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (row) => (
        <p className="text-sm text-gray-600 truncate max-w-xs">
          {row.notes || <span className="text-gray-400 italic">No notes</span>}
        </p>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
          title="Delete entry"
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
          badge="Entry Administration"
          badgeIcon={Sparkles}
          title="Manage time"
          highlightText="entries and logs"
          subtitle="View, filter, and manage all time tracking entries across the platform with date range filtering."
          pattern="gradient"
        />

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => {
                  setFilters({ ...filters, start_date: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => {
                  setFilters({ ...filters, end_date: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          <DataTable
            columns={columns}
            data={entries}
            pagination={pagination}
            onPageChange={(page) => setPagination({ ...pagination, page })}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default EntryManagement;
