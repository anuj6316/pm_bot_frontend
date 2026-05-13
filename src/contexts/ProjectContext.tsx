import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, auth, User } from '../lib/api';

interface Project {
  id: string;
  name: string;
  identifier: string;
  description?: string;
  workspace?: string;
}

interface ProjectContextType {
  selectedProject: Project | null;
  availableProjects: Project[];
  setSelectedProject: (project: Project | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'pm_bot_selected_project';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      setAvailableProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ msg: string; data: Project[] }>('/user/projects/');
      const projects = response.data || [];
      setAvailableProjects(projects);

      // If no selected project, auto-select the first one
      if (projects.length > 0 && !selectedProject) {
        const storedProjectId = localStorage.getItem(STORAGE_KEY);
        const storedProject = projects.find(p => p.id === storedProjectId);

        if (storedProject) {
          setSelectedProjectState(storedProject);
        } else {
          // Auto-select first project if no stored preference
          setSelectedProjectState(projects[0]);
          localStorage.setItem(STORAGE_KEY, projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects on mount and when auth changes
  useEffect(() => {
    loadProjects();
  }, []);

  // Update selected project and persist to localStorage
  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, project.id);

      // Sync to backend for persistence across browsers
      api.post('/user/set-selected-project/', { project_id: project.id }).catch(err => {
        console.error('Failed to sync selected project to backend:', err);
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Refresh projects list
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  return (
    <ProjectContext.Provider
      value={{
        selectedProject,
        availableProjects,
        setSelectedProject,
        isLoading,
        error,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
