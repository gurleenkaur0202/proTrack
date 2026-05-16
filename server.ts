import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_FILE = path.join(process.cwd(), 'storage.json');

// Initial data structure
const initialData = {
  tasks: [],
  projects: [],
  teams: [],
  users: []
};

// Helper to load data
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return initialData;
  }
}

// Helper to save data
function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Generic Data CRUD
  app.get('/api/:collection', (req, res) => {
    const data = loadData();
    const collection = req.params.collection;
    if (data[collection]) {
      res.json(data[collection]);
    } else {
      res.status(404).json({ error: 'Collection not found' });
    }
  });

  app.post('/api/:collection', (req, res) => {
    const data = loadData();
    const collection = req.params.collection;
    if (!data[collection]) return res.status(404).json({ error: 'Collection not found' });
    
    const newItem = { 
      id: Math.random().toString(36).substr(2, 9),
      ...req.body,
      createdAt: Date.now()
    };
    
    data[collection].push(newItem);
    saveData(data);
    res.json(newItem);
  });

  app.patch('/api/:collection/:id', (req, res) => {
    const data = loadData();
    const { collection, id } = req.params;
    if (!data[collection]) return res.status(404).json({ error: 'Collection not found' });
    
    const index = data[collection].findIndex((item: any) => item.id === id || item.uid === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });
    
    data[collection][index] = { ...data[collection][index], ...req.body, updatedAt: Date.now() };
    saveData(data);
    res.json(data[collection][index]);
  });

  app.delete('/api/:collection/:id', (req, res) => {
    const data = loadData();
    const { collection, id } = req.params;
    if (!data[collection]) return res.status(404).json({ error: 'Collection not found' });
    
    data[collection] = data[collection].filter((item: any) => item.id !== id && item.uid !== id);
    saveData(data);
    res.status(204).send();
  });

  // User Special Endpoint: Profile Update (supports uid)
  app.post('/api/users/profile/:uid', (req, res) => {
    const data = loadData();
    const { uid } = req.params;
    let user = data.users.find((u: any) => u.uid === uid);
    
    if (user) {
      Object.assign(user, req.body);
    } else {
      user = { uid, ...req.body, role: 'Member', createdAt: Date.now() };
      data.users.push(user);
    }
    
    saveData(data);
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
