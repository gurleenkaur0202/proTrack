export interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo: string;
  projectId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  teamId?: string;
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string; // The person handling the team
  memberIds: string[]; // List of user UIDs
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'Admin' | 'Member';
  displayName?: string;
  photoURL?: string;
  bio?: string;
  teamId?: string; // Which team they belong to
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
