import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await signIn(name);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100"
      >
        <div className="flex justify-center mb-10">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-200">
            <Layout className="text-white w-10 h-10" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Welcome to Workshop
          </h2>
          <p className="text-slate-500 font-medium">
            Enter your name to join the collaborative space
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Your Full Name
            </label>
            <input 
              type="text" 
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all text-lg font-bold placeholder-slate-300"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              'Entering...'
            ) : (
              <>
                Join Workshop <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          No sign up required • Local Session
        </p>
      </motion.div>
    </div>
  );
};
