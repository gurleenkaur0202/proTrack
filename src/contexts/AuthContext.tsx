import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, AuthStatus } from '../types';
import { userService } from '../services/dbService';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isAdmin: boolean;
  signIn: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Check for existing session
    const storedUid = localStorage.getItem('workshop_uid');
    if (storedUid) {
      userService.getAllUsers().then(users => {
        const user = users.find((u: UserProfile) => u.uid === storedUid);
        if (user) {
          setProfile(user);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      });
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const signIn = async (name: string) => {
    setStatus('loading');
    // Simple UID generation for the session
    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const isSpecialAdmin = 
          name.toLowerCase().includes('gurleen') || 
          name.toLowerCase().includes('admin');
          
    const newProfile: UserProfile = {
      uid,
      email: `${name.toLowerCase().replace(/\s/g, '')}@workshop.local`,
      role: isSpecialAdmin ? 'Admin' : 'Member',
      displayName: name,
    };

    const savedProfile = await userService.updateProfile(uid, newProfile);
    localStorage.setItem('workshop_uid', uid);
    setProfile(savedProfile);
    setStatus('authenticated');
  };

  const signOut = async () => {
    localStorage.removeItem('workshop_uid');
    setProfile(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ 
      user: profile ? { uid: profile.uid, email: profile.email } : null, 
      profile, 
      status, 
      isAdmin: profile?.role === 'Admin',
      signIn,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
