import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { taskService, projectService, teamService } from '../services/dbService';
import { Task, Project, Team } from '../types';
import { motion } from 'motion/react';
import { 
  CheckCircle2, Clock, PlayCircle, BarChart3, Briefcase, 
  Users, TrendingUp, Target, Plus 
} from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

export const Dashboard: React.FC<{ onKpiClick: (filter: string | null) => void; setActiveTab: (tab: string) => void }> = ({ 
  onKpiClick, 
  setActiveTab 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedProj, setSelectedProj] = useState('');

  const handleQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedProj) return;
    await taskService.createTask({
      title: taskTitle,
      assignedTo: assignee || 'Unassigned',
      projectId: selectedProj,
      status: 'Pending'
    });
    setTaskTitle('');
    setAssignee('');
    setIsTaskModalOpen(false);
  };

  useEffect(() => {
    const unsubTasks = taskService.subscribeTasks((data) => {
      setTasks(data);
      setLoading(false);
    });
    const unsubProjs = projectService.subscribeProjects(setProjects);
    const unsubTeams = teamService.subscribeTeams(setTeams);

    return () => {
      unsubTasks();
      unsubProjs();
      unsubTeams();
    };
  }, []);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    projects: projects.length,
    teams: teams.length,
  };

  const chartData = [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending', value: stats.pending },
    { name: 'In Progress', value: stats.inProgress },
  ].filter(d => d.value > 0);

  // Project progress data
  const projectProgressData = projects.slice(0, 5).map(proj => {
    const projectTasks = tasks.filter(t => t.projectId === proj.id);
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
    return { name: proj.name, progress };
  });

  const StatCard = ({ title, value, icon: Icon, gradient, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`p-6 rounded-2xl shadow-lg text-white ${gradient} cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group`}
    >
      <div className="flex justify-between items-start mb-4 text-white/50 group-hover:text-white transition-colors">
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-slate-500 font-medium font-display uppercase tracking-widest text-xs">Analyzing Project Data</p>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* KPI Cards */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Workspace Dashboard</h2>
          <p className="text-slate-500 text-sm">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <button 
          onClick={() => setIsTaskModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Tasks" value={stats.total} icon={Target} gradient="bg-gradient-to-br from-blue-600 to-blue-700" onClick={() => onKpiClick(null)} />
        <StatCard title="Projects" value={stats.projects} icon={Briefcase} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" onClick={() => setActiveTab('projects')} />
        <StatCard title="Teams" value={stats.teams} icon={Users} gradient="bg-gradient-to-br from-violet-500 to-violet-600" onClick={() => setActiveTab('projects')} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} gradient="bg-gradient-to-br from-teal-500 to-teal-600" onClick={() => onKpiClick('Completed')} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} gradient="bg-gradient-to-br from-orange-500 to-orange-600" onClick={() => onKpiClick('Pending')} />
        <StatCard title="In Progress" value={stats.inProgress} icon={PlayCircle} gradient="bg-gradient-to-br from-blue-400 to-cyan-500" onClick={() => onKpiClick('In Progress')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creative Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl border-t-4 border-t-blue-600"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold font-display text-slate-900">Task Distribution</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">Live Activity</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Project Progress Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl border-t-4 border-t-emerald-500"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-display text-slate-900">Project Progress (%)</h3>
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="progress" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900">Global Activity Feed</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.slice(0, 8).map(task => (
            <motion.div 
              key={task.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-2xl transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'Completed' ? 'bg-emerald-500' :
                  task.status === 'In Progress' ? 'bg-blue-500' : 'bg-orange-500'
                }`} />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">ASSIGNED TO: {task.assignedTo}</p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {task.status}
              </span>
            </motion.div>
          ))}
          {tasks.length === 0 && <p className="text-slate-400 text-center py-20 italic col-span-2">No activity detected yet</p>}
        </div>
      </div>

      {/* Quick Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">New Task Notification</h2>
            </div>
            <form onSubmit={handleQuickTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input 
                  autoFocus
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                  <input 
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    placeholder="Member Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <select 
                    required
                    value={selectedProj}
                    onChange={(e) => setSelectedProj(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
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
    </div>
  );
};

