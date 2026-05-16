import React, { useEffect, useState } from 'react';
import { taskService, projectService, teamService, userService } from '../services/dbService';
import { Task, Project, Team, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trash2, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  Briefcase, 
  Users, 
  Star,
  Clock,
  FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

export const TaskBoard: React.FC<{ initialFilter?: string | null }> = ({ initialFilter }) => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<Task['status'] | 'All'>('All');
  
  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter as any);
    }
  }, [initialFilter]);
  
  // New Task Form
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState('');

  // New Project Form (Quick Admin)
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isQuickProjectMode, setIsQuickProjectMode] = useState(false);

  useEffect(() => {
    const unsubTasks = taskService.subscribeTasks(setTasks);
    const unsubProjects = projectService.subscribeProjects(data => {
      setProjects(data);
      if (data.length > 0 && !projectId) setProjectId(data[0].id);
    });
    const unsubTeams = teamService.subscribeTeams(setTeams);
    
    userService.getAllUsers().then(users => {
      if (users) setAllUsers(users);
    });

    return () => {
      unsubTasks();
      unsubProjects();
      unsubTeams();
    };
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId && projects.length === 0) {
      // Auto create a project if none exist
      const newProjectId = `project-${Date.now()}`;
      await projectService.createProject('Default Project', 'First project created automatically');
      // Wait for re-fetch or just use it
    }
    
    await taskService.createTask({
      title,
      assignedTo,
      projectId: projectId || (projects[0]?.id),
      status: 'Pending',
    });
    
    setTitle('');
    setAssignedTo('');
    setIsModalOpen(false);
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    await projectService.createProject(newProjectName, newProjectDesc);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsQuickProjectMode(false);
  };

  const filteredTasks = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Task Creation Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-500">Organize and track progress across all projects.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsQuickProjectMode(true)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-2xl transition-all font-bold text-sm shadow-sm"
            >
              <FolderPlus className="w-5 h-5 text-emerald-600" />
              <span>Add Project</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition-all font-bold text-sm shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" />
              <span>Assign Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Project & Team Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {projects.slice(0, 2).map(proj => {
          const team = teams.find(t => t.id === proj.teamId);
          return (
            <div key={proj.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Active Project</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{proj.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{proj.description}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Created {formatDate(proj.createdAt)}</span>
                </div>
              </div>

              <div className="md:w-64 bg-slate-50 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-wide">Team: {team?.name || 'Unassigned'}</p>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Star className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold leading-none">LEAD</p>
                      <p className="text-xs font-bold text-slate-700">{team?.leadId ? (allUsers.find(u => u.uid === team.leadId)?.displayName || allUsers.find(u => u.uid === team.leadId)?.email || 'Unknown') : 'No Lead'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Members</p>
                  <div className="flex -space-x-1.5">
                    {team?.memberIds?.map(mid => (
                      <div key={mid} title={allUsers.find(u => u.uid === mid)?.email} className="w-7 h-7 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                        {allUsers.find(u => u.uid === mid)?.email?.[0].toUpperCase() || '?'}
                      </div>
                    ))}
                    {(!team?.memberIds || team.memberIds.length === 0) && <span className="text-[10px] text-slate-400 italic">No members yet</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="lg:col-span-3 bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No projects active. Create one in the Projects & Teams tab.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200">
          {['All', 'Pending', 'In Progress', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.tr 
                  layout
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="text-slate-900 font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(task.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={task.status}
                      onChange={(e) => taskService.updateTaskStatus(task.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                         {task.assignedTo?.[0].toUpperCase()}
                       </div>
                       <span className="text-sm text-slate-600">{task.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && (
                        <button 
                          onClick={() => taskService.deleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input 
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Design UI flow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select 
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a member</option>
                  {allUsers.map(user => (
                    <option key={user.uid} value={user.email}>{user.displayName || user.email} ({user.role})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Note: Members must sign up first to appear in this list.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {projects.length === 0 && <option disabled>No projects - one will be created</option>}
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Quick Project Modal */}
      {isQuickProjectMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold">Launch New Project</h2>
            </div>
            <form onSubmit={handleCreateQuickProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input 
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Marketing Q3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsQuickProjectMode(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
