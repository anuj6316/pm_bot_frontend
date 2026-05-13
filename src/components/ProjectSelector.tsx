import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useProject } from '@/src/contexts/ProjectContext';

export function ProjectSelector() {
  const { selectedProject, availableProjects, setSelectedProject, isLoading } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleProjectSelect = (project: typeof selectedProject) => {
    setSelectedProject(project);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-apple-border bg-apple-card/50">
        <Loader2 className="w-4 h-4 text-apple-text-muted animate-spin" />
        <span className="text-sm text-apple-text-muted">Loading...</span>
      </div>
    );
  }

  if (availableProjects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-apple-border bg-apple-card/50">
        <FolderOpen className="w-4 h-4 text-apple-text-muted" />
        <span className="text-sm text-apple-text-muted">No projects</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
          'bg-apple-card/50 hover:bg-black/5',
          'border-apple-border focus:outline-none focus:ring-2 focus:ring-apple-blue/30',
          isOpen && 'ring-2 ring-apple-blue/30'
        )}
      >
        <FolderOpen className="w-4 h-4 text-apple-blue flex-shrink-0" />
        <span className="text-sm font-medium text-apple-text max-w-[150px] truncate">
          {selectedProject?.name || 'Select Project'}
        </span>
        {selectedProject && (
          <span className="text-xs text-apple-text-muted bg-apple-bg px-1.5 py-0.5 rounded">
            {selectedProject.identifier}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-apple-text-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-72 rounded-xl border border-apple-border',
            'bg-apple-card/95 backdrop-blur-xl shadow-lg shadow-black/10',
            'overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-apple-border/50 bg-apple-bg/50">
            <p className="text-xs font-semibold text-apple-text-muted uppercase tracking-wider">
              Select Project
            </p>
          </div>

          {/* Project List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {availableProjects.map((project) => {
              const isSelected = selectedProject?.id === project.id;

              return (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
                    'hover:bg-black/5',
                    isSelected && 'bg-apple-blue/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      'bg-apple-blue/10 text-apple-blue'
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-apple-blue' : 'text-apple-text'
                    )}>
                      {project.name}
                    </p>
                    <p className="text-xs text-apple-text-muted">
                      {project.identifier}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-apple-blue flex-shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {availableProjects.length > 0 && (
            <div className="px-3 py-2 border-t border-apple-border/50 bg-apple-bg/50">
              <p className="text-xs text-apple-text-muted">
                {availableProjects.length} project{availableProjects.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
