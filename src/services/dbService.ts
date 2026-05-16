import { Task, Project, Team, UserProfile } from '../types';

const api = {
  get: async (coll: string) => {
    const res = await fetch(`/api/${coll}`);
    return res.ok ? res.json() : [];
  },
  post: async (coll: string, data: any) => {
    const res = await fetch(`/api/${coll}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  patch: async (coll: string, id: string, data: any) => {
    const res = await fetch(`/api/${coll}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (coll: string, id: string) => {
    await fetch(`/api/${coll}/${id}`, { method: 'DELETE' });
  }
};

export const taskService = {
  subscribeTasks: (callback: (tasks: Task[]) => void) => {
    // Polling as a simple replacement for onSnapshot
    const fetchTasks = () => api.get('tasks').then(callback);
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  },

  createTask: async (taskData: Partial<Task>) => {
    return api.post('tasks', taskData);
  },

  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    return api.patch('tasks', taskId, { status });
  },

  deleteTask: async (taskId: string) => {
    return api.delete('tasks', taskId);
  }
};

export const projectService = {
  getProjects: async () => {
    return api.get('projects');
  },

  subscribeProjects: (callback: (projects: Project[]) => void) => {
    const fetchProj = () => api.get('projects').then(callback);
    fetchProj();
    const interval = setInterval(fetchProj, 5000);
    return () => clearInterval(interval);
  },

  createProject: async (name: string, description: string, teamId?: string) => {
    return api.post('projects', { name, description, teamId: teamId || null });
  },

  updateProject: async (projectId: string, data: Partial<Project>) => {
    return api.patch('projects', projectId, data);
  }
};

export const teamService = {
  subscribeTeams: (callback: (teams: Team[]) => void) => {
    const fetchTeams = () => api.get('teams').then(callback);
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  },

  createTeam: async (name: string, description: string, leadId: string) => {
    const team = await api.post('teams', {
      name,
      description,
      leadId,
      memberIds: [leadId],
    });
    // Also update lead's teamId
    await userService.updateProfile(leadId, { teamId: team.id });
    return team.id;
  },

  addMemberToTeam: async (teamId: string, userId: string) => {
    const teams = await api.get('teams');
    const team = teams.find((t: any) => t.id === teamId);
    if (team) {
      const memberIds = [...new Set([...(team.memberIds || []), userId])];
      await api.patch('teams', teamId, { memberIds });
      await userService.updateProfile(userId, { teamId });
    }
  },

  removeMemberFromTeam: async (teamId: string, userId: string) => {
    const teams = await api.get('teams');
    const team = teams.find((t: any) => t.id === teamId);
    if (team) {
      const memberIds = (team.memberIds || []).filter((id: string) => id !== userId);
      await api.patch('teams', teamId, { memberIds });
      await userService.updateProfile(userId, { teamId: null });
    }
  }
};

export const userService = {
  getAllUsers: async () => {
    return api.get('users');
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const res = await fetch(`/api/users/profile/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
