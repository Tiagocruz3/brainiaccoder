import { ClientOnly } from 'remix-utils/client-only';
import { useCallback, useEffect, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { db, getAll, type ChatHistoryItem } from '~/lib/persistence';
import { Link } from '@remix-run/react';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';

export function MyProjects() {
  const [projects, setProjects] = useState<ChatHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'projects'>('projects');
  const chat = useStore(chatStore);

  const loadProjects = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then((filtered) => {
          // Sort by most recent first
          const sorted = filtered.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          });
          setProjects(sorted.slice(0, 6)); // Show top 6 projects
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    // Refresh every 30 seconds
    const interval = setInterval(loadProjects, 30000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  // Only show projects when chat hasn't started
  if (chat.started) {
    return null;
  }

  return (
    <div className="w-full border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 border-b border-bolt-elements-borderColor">
            <button
              onClick={() => setActiveTab('recent')}
              className={classNames(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'recent'
                  ? 'text-bolt-elements-textPrimary border-bolt-elements-textPrimary'
                  : 'text-bolt-elements-textSecondary border-transparent hover:text-bolt-elements-textPrimary',
              )}
            >
              Recently viewed
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={classNames(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'projects'
                  ? 'text-bolt-elements-textPrimary border-bolt-elements-textPrimary'
                  : 'text-bolt-elements-textSecondary border-transparent hover:text-bolt-elements-textPrimary',
              )}
            >
              My projects
            </button>
          </div>
          <button className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors">
            <span>Browse all</span>
            <div className="i-ph:arrow-right text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-8 text-bolt-elements-textTertiary">
              <div className="i-ph:folder-open text-4xl mb-2 opacity-50" />
              <p className="text-sm">No projects yet. Start a new chat to create your first project!</p>
            </div>
          ) : (
            projects.map((project) => (
            <Link
              key={project.id}
              to={`/chat/${project.urlId}`}
              className={classNames(
                'group bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-4',
                'hover:border-bolt-elements-borderColorActive hover:shadow-md transition-all duration-200',
                'flex flex-col gap-3',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-bolt-elements-textPrimary truncate group-hover:text-bolt-elements-textPrimary">
                    {project.description || 'Untitled Project'}
                  </h3>
                  <p className="text-xs text-bolt-elements-textTertiary mt-1">
                    {project.updatedAt
                      ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                      : 'Recently'}
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center border border-bolt-elements-borderColor group-hover:border-bolt-elements-borderColorActive transition-colors">
                  <div className="i-ph:code text-xl text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary" />
                </div>
              </div>
              {project.preview && (
                <div className="w-full h-24 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-bolt-elements-textTertiary text-xs">
                    Preview
                  </div>
                </div>
              )}
            </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function MyProjectsClient() {
  return (
    <ClientOnly fallback={null}>
      {() => <MyProjects />}
    </ClientOnly>
  );
}

