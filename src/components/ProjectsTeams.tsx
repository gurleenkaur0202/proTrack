import React, { useEffect, useState } from 'react';
import { teamService, projectService, userService } from '../services/dbService';
import { Team, Project, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  FolderPlus, 
  UserPlus, 
  Briefcase, 
  ChevronRight, 
  Star, 
  Trash2, 
  Search, 
  Mail, 
  ShieldCheck,
  Edit3,
  User,
  Camera,
  X,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

export const ProjectsTeams: React.FC = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Forms
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLead, setNewTeamLead] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTeam, setNewProjTeam] = useState('');

  useEffect(() => {
    const unsubTeams = teamService.subscribeTeams(setTeams);
    const unsubProjs = projectService.subscribeProjects((data) => {
      setProjects(data);
      setLoading(false);
    });

    userService.getAllUsers().then(users => {
      if (users) setAllUsers(users);
    });

    return () => {
      unsubTeams();
      unsubProjs();
    };
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    await teamService.createTeam(newTeamName, '', newTeamLead);
    setIsTeamModalOpen(false);
    setNewTeamName('');
    setNewTeamLead('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await projectService.createProject(newProjName, newProjDesc, newProjTeam);
    setIsProjectModalOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTeam('');
  };

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  // Member Edit Logic
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserBio, setEditUserBio] = useState('');
  const [editUserPhoto, setEditUserPhoto] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const userFileInputRef = React.useRef<HTMLInputElement>(null);

  const openEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUserName(user.displayName || '');
    setEditUserBio(user.bio || '');
    setEditUserPhoto(user.photoURL || '');
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSavingUser(true);
    try {
      await userService.updateProfile(selectedUser.uid, {
        displayName: editUserName,
        bio: editUserBio,
        photoURL: editUserPhoto
      });
      // Refresh list
      const users = await userService.getAllUsers();
      if (users) setAllUsers(users);
      setIsEditUserModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update member profile');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert("File is too large! Please choose an image under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditUserPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = memberEmail;
    if (!email) return;

    const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      alert("User not found in the system! They must sign up first.");
      return;
    }

    try {
      await teamService.addMemberToTeam(selectedTeamId, user.uid);
      setIsAddMemberModalOpen(false);
      setMemberEmail('');
      alert(`${user.displayName || user.email} has been added to the team.`);
    } catch (err: any) {
      alert("Failed to add member: " + err.message);
    }
  };

  const openAddMemberModal = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsAddMemberModalOpen(true);
  };

  const getTeamName = (id?: string) => teams.find(t => t.id === id)?.name || 'No Team';
  const getUserName = (id: string) => {
    const u = allUsers.find(u => u.uid === id);
    return u?.displayName || u?.email || 'Unknown User';
  };

  if (loading) return <div className="p-20 text-center">Loading Project & Team data...</div>;

  return (
    <div className="space-y-10">
      {/* Teams Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team Management
          </h2>
          {isAdmin && (
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <motion.div 
              key={team.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  Team
                </span>
                <span className="text-xs text-slate-400">{team.memberIds?.length || 0} Members</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{team.name}</h3>
              
              {isAdmin && (
                <button 
                  onClick={() => openAddMemberModal(team.id)}
                  className="mt-2 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              )}

              <div className="space-y-3 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Team Lead</p>
                      <p className="text-sm font-semibold truncate text-slate-700">{getUserName(team.leadId)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Team Members</p>
                  {team.memberIds?.map(mid => (
                    <div key={mid} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {getUserName(mid)[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{getUserName(mid)}</span>
                      </div>
                      {isAdmin && mid !== team.leadId && (
                        <button 
                          onClick={async () => {
                            if (confirm(`Remove ${getUserName(mid)} from this team?`)) {
                              await teamService.removeMemberFromTeam(team.id, mid);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          {teams.length === 0 && <p className="text-slate-400 italic py-4">No teams created yet.</p>}
        </div>
      </section>

      {/* Projects Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-600" />
            Active Projects
          </h2>
          {isAdmin && (
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Project Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Assigned Team</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(proj => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-semibold text-slate-900">{proj.name}</td>
                  <td className="px-6 py-5 text-sm text-slate-500 max-w-xs truncate">{proj.description || 'No description'}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      {getTeamName(proj.teamId)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">{formatDate(proj.createdAt)}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Member Directory */}
      {isAdmin && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-6 h-6 text-violet-600" />
              Member Directory
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by email..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none w-64 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allUsers
              .filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()))
              .map(user => {
                const userTeam = teams.find(t => t.memberIds?.includes(user.uid));
                return (
                  <div 
                    key={user.uid} 
                    className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-4 group relative"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="p" className="w-full h-full object-cover" />
                      ) : (
                        user.displayName?.[0] || user.email?.[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || 'No Name'}</p>
                      <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase truncate">
                        <Mail className="w-3 h-3 mr-1" />
                        {user.email}
                      </div>
                      <p className="text-[9px] text-blue-600 font-bold mt-1">
                        {userTeam ? `Team: ${userTeam.name}` : 'No Team Assigned'}
                      </p>
                    </div>
                    {user.role === 'Admin' ? <ShieldCheck className="w-4 h-4 text-orange-500" /> : (
                      <button 
                        onClick={() => openEditUser(user)}
                        className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Team Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                  <input required value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Lead</label>
                  <select required value={newTeamLead} onChange={e => setNewTeamLead(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select a user...</option>
                    {allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsTeamModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">Create Team</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Project Modal */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                  <input required value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={newProjDesc} onChange={e => setNewProjDesc(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign Team</label>
                  <select value={newProjTeam} onChange={e => setNewProjTeam(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">No Team Assigned</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-emerald-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors">Create Project</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Add Member Modal */}
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Assign to {teams.find(t => t.id === selectedTeamId)?.name}</h2>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <p className="text-sm text-slate-500">
                  Search for a registered user by their email address to add them to this team.
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">User Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required 
                      type="email"
                      value={memberEmail} 
                      onChange={e => setMemberEmail(e.target.value)} 
                      placeholder="colleague@example.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">Add Member</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Edit User Modal (Admin only) */}
        {isEditUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Member Settings</h2>
                  <button onClick={() => setIsEditUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-5">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center relative group">
                      {editUserPhoto ? <img src={editUserPhoto} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-200" />}
                      <button 
                        type="button"
                        onClick={() => userFileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={userFileInputRef} 
                      onChange={handleUserFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> Display Name
                    </label>
                    <input
                      required
                      type="text"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Member Photo
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => userFileInputRef.current?.click()}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        {editUserPhoto ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {editUserPhoto && (
                        <button
                          type="button"
                          onClick={() => setEditUserPhoto('')}
                          className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Bio
                    </label>
                    <textarea
                      value={editUserBio}
                      onChange={(e) => setEditUserBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500">Cancel</button>
                    <button type="submit" disabled={isSavingUser} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
                      {isSavingUser ? 'Saving...' : 'Update Member'}
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
