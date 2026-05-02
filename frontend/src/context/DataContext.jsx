import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import { toolService } from '../services/toolService';

const DataContext = createContext(null);

// Cache configuration - disabled for real-time updates
const CACHE_DURATION = 0; // Disabled - always fetch fresh data
const cache = {
  dashboardStats: { data: null, timestamp: 0 },
  tools: { data: null, timestamp: 0 },
  projects: { data: null, timestamp: 0 },
  entries: { data: null, timestamp: 0 },
};

const isCacheValid = (cacheKey) => {
  const cached = cache[cacheKey];
  return cached.data && Date.now() - cached.timestamp < CACHE_DURATION;
};

const setCache = (cacheKey, data) => {
  cache[cacheKey] = { data, timestamp: Date.now() };
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('dashboardStats')) {
      setDashboardStats(cache.dashboardStats.data);
      return cache.dashboardStats.data;
    }

    try {
      const response = await api.get('/dashboard/stats');
      const stats = response.data.stats;
      setDashboardStats(stats);
      setCache('dashboardStats', stats);
      return stats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }, []);

  const fetchTools = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('tools')) {
      setTools(cache.tools.data);
      return cache.tools.data;
    }

    try {
      const data = await toolService.getAllTools();
      setTools(data);
      setCache('tools', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      throw error;
    }
  }, []);

  const fetchProjects = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('projects')) {
      setProjects(cache.projects.data);
      return cache.projects.data;
    }

    try {
      const response = await api.get('/projects');
      const projectsData = response.data.projects || [];
      setProjects(projectsData);
      setCache('projects', projectsData);
      return projectsData;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }, []);

  const fetchEntries = useCallback(async (params = {}, forceRefresh = false) => {
    const cacheKey = 'entries';
    if (!forceRefresh && isCacheValid(cacheKey)) {
      setEntries(cache[cacheKey].data);
      return cache[cacheKey].data;
    }

    try {
      const data = await toolService.getEntries(params);
      const entriesData = data.entries || [];
      setEntries(entriesData);
      setCache(cacheKey, entriesData);
      return entriesData;
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      throw error;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(true),
        fetchTools(true),
        fetchProjects(true),
        fetchEntries({ limit: 200 }, true),
      ]);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchTools, fetchProjects, fetchEntries]);

  const clearCache = useCallback(() => {
    Object.keys(cache).forEach(key => {
      cache[key] = { data: null, timestamp: 0 };
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    dashboardStats,
    tools,
    projects,
    entries,
    loading,
    
    // Actions
    fetchDashboardStats,
    fetchTools,
    fetchProjects,
    fetchEntries,
    refreshAll,
    clearCache,
    setTools,
    setProjects,
    setEntries,
    setDashboardStats,
  }), [
    dashboardStats,
    tools,
    projects,
    entries,
    loading,
    fetchDashboardStats,
    fetchTools,
    fetchProjects,
    fetchEntries,
    refreshAll,
    clearCache,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};