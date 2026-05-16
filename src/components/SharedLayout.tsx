import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Layout, CheckSquare, Settings, LogOut, Plus, Menu, Users, Search, 
  User, Camera, Edit3, X, Mail, Info, Briefcase, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { taskService, projectService, teamService, userService } from '../services/dbService';
import { Task, Project, Team, UserProfile } from '../types';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

export const SharedLayout: React.FC<{ children: React.ReactNode; activeTab: string; setActiveTab: (tab: string) => void }> = ({ 
  children, 
  activeTab, 
  setActiveTab 
}) => {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editPhoto, setEditPhoto] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allData, setAllData] = React.useState<{
    tasks: Task[];
    projects: Project[];
    users: UserProfile[];
  }>({ tasks: [], projects: [], users: [] });
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const unsubTasks = taskService.subscribeTasks(tasks => setAllData(prev => ({ ...prev, tasks })));
    const unsubProjects = projectService.subscribeProjects(projects => setAllData(prev => ({ ...prev, projects })));
    userService.getAllUsers().then(users => {
      if (users) setAllData(prev => ({ ...prev, users }));
    });
    return () => {
      unsubTasks();
      unsubProjects();
    };
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return {
      tasks: allData.tasks.filter(t => t.title.toLowerCase().includes(q)),
      projects: allData.projects.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
      users: allData.users.filter(u => u.displayName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    };
  }, [searchQuery, allData]);

  React.useEffect(() => {
    if (profile) {
      setEditName(profile.displayName || '');
      setEditBio(profile.bio || '');
      setEditPhoto(profile.photoURL || '');
    }
  }, [profile, isProfileModalOpen]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      await userService.updateProfile(profile.uid, {
        displayName: editName,
        bio: editBio,
        photoURL: editPhoto
      });
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert("File is too large! Please choose an image under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center flex-1 max-w-xl relative">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                placeholder="Search tasks, projects, or members..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Global Search Results Dropdown */}
            <AnimatePresence>
              {isSearching && searchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearching(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results</span>
                      <span className="text-[10px] font-bold text-blue-600">{
                        (searchResults?.tasks.length || 0) + 
                        (searchResults?.projects.length || 0) + 
                        (searchResults?.users.length || 0)
                      } items found</span>
                    </div>

                    <div className="p-2 space-y-4">
                      {searchResults?.tasks.length! > 0 && (
                        <div>
                          <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tasks</p>
                          {searchResults?.tasks.map(task => (
                            <div 
                              key={task.id} 
                              onClick={() => { setActiveTab('tasks'); setIsSearching(false); setSearchQuery(''); }}
                              className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center space-x-3"
                            >
                              <CheckSquare className="w-4 h-4 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1">
                                  {task.status} <span className="text-[8px] opacity-20">|</span> Assigned To: {task.assignedTo}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.projects.length! > 0 && (
                        <div>
                          <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Projects</p>
                          {searchResults?.projects.map(proj => (
                            <div 
                              key={proj.id} 
                              onClick={() => { setActiveTab('projects'); setIsSearching(false); setSearchQuery(''); }}
                              className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center space-x-3"
                            >
                              <Briefcase className="w-4 h-4 text-emerald-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{proj.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{proj.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchResults?.users.length! > 0 && (
                        <div>
                          <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Directory</p>
                          {searchResults?.users.map(user => (
                            <div 
                              key={user.uid} 
                              onClick={() => { setActiveTab('projects'); setIsSearching(false); setSearchQuery(''); }}
                              className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center space-x-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden text-xs">
                                {user.photoURL ? <img src={user.photoURL} alt="u" /> : user.email[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!searchResults?.tasks.length && !searchResults?.projects.length && !searchResults?.users.length && (
                        <div className="px-6 py-12 text-center">
                          <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-sm text-slate-400">No matches found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-slate-900 capitalize hidden md:block">{activeTab}</h1>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg">
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </header>
        
        <div className="p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Sidebar */}
      <aside className={`bg-white border-l border-slate-200 transition-all ${isSidebarOpen ? 'w-64' : 'w-20'} p-4 flex flex-col`}>
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
            <Layout className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl text-slate-900">ProTrack</span>}
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem 
            icon={<Layout className="w-5 h-5" />} 
            label={isSidebarOpen ? "Dashboard" : ""} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={<CheckSquare className="w-5 h-5" />} 
            label={isSidebarOpen ? "Tasks" : ""} 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
          />
          <SidebarItem 
            icon={<Users className="w-5 h-5" />} 
            label={isSidebarOpen ? "Projects & Teams" : ""} 
            active={activeTab === 'projects'} 
            onClick={() => setActiveTab('projects')}
          />
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-3 px-4 py-3 mb-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500 text-sm border-2 border-transparent group-hover:border-blue-500 transition-all">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.email?.[0].toUpperCase()
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{profile?.displayName || 'Set Name'}</span>
                <span className="text-[10px] text-slate-400 capitalize font-bold">{profile?.role}</span>
              </div>
            )}
            {isSidebarOpen && <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />}
          </div>
          <SidebarItem 
            icon={<LogOut className="w-5 h-5" />} 
            label={isSidebarOpen ? "Sign Out" : ""} 
            onClick={signOut}
          />
        </div>
      </aside>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setIsProfileModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
                  <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        {editPhoto ? (
                          <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-12 h-12 text-slate-300" />
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">Status: {profile?.role}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Full Name
                      </label>
                      <input
                        required
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Profile Photo
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {editPhoto ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {editPhoto && (
                          <button
                            type="button"
                            onClick={() => setEditPhoto('')}
                            className="px-4 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Bio / About You
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsProfileModalOpen(false)}
                      className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Updating...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
