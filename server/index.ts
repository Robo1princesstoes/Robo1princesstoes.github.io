import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool, setupDatabase } from './db';
import { storage } from './storage';
import { validateAdmin, createAdmin, changePassword, generateSecurePassword, getAdminCount } from './auth';

const app = express();
const PgSession = pgSession(session);

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error('SESSION_SECRET must be set when NODE_ENV=production');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: sessionSecret || 'local-development-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  }
}));

const publicDir = path.join(process.cwd(), 'public');
const uploadDir = path.join(publicDir, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

declare module 'express-session' {
  interface SessionData {
    admin?: { id: number; username: string };
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

const mainPage = path.join(publicDir, 'index.html');
const adminPage = path.join(publicDir, 'admin.html');

// Support direct URLs for the single-page site sections and admin panel.
app.get([
  '/cats',
  '/cats/',
  '/clinic',
  '/clinic/',
  '/foster',
  '/foster/',
  '/fosterparents',
  '/fosterparents/',
  '/forms',
  '/forms/',
  '/contact',
  '/contact/',
  '/faq',
  '/faq/',
  '/resources',
  '/resources/',
], (req, res) => {
  res.sendFile(mainPage);
});

app.get(['/admin', '/admin/', '/admin-control', '/admin-control/'], (req, res) => {
  res.sendFile(adminPage);
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const result = await validateAdmin(username, password);
  if (result.valid && result.admin) {
    req.session.admin = result.admin;
    res.json({ success: true, admin: result.admin });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.admin) {
    res.json({ authenticated: true, admin: req.session.admin });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  const success = await changePassword(req.session.admin!.id, newPassword);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/cats', async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const cats = await storage.getCats(publishedOnly);
  res.json(cats);
});

app.get('/api/cats/:id', async (req, res) => {
  const cat = await storage.getCatById(parseInt(req.params.id));
  if (cat) {
    res.json(cat);
  } else {
    res.status(404).json({ error: 'Cat not found' });
  }
});

app.post('/api/cats', requireAuth, async (req, res) => {
  try {
    const cat = await storage.createCat(req.body);
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cat' });
  }
});

app.put('/api/cats/:id', requireAuth, async (req, res) => {
  const cat = await storage.updateCat(parseInt(req.params.id), req.body);
  if (cat) {
    res.json(cat);
  } else {
    res.status(404).json({ error: 'Cat not found' });
  }
});

app.delete('/api/cats/:id', requireAuth, async (req, res) => {
  await storage.deleteCat(parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/cats/:id/publish', requireAuth, async (req, res) => {
  const cat = await storage.publishCat(parseInt(req.params.id));
  res.json(cat);
});

app.post('/api/cats/:id/unpublish', requireAuth, async (req, res) => {
  const cat = await storage.unpublishCat(parseInt(req.params.id));
  res.json(cat);
});

app.get('/api/fosters', async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const fosters = await storage.getFosters(publishedOnly);
  res.json(fosters);
});

app.post('/api/fosters', requireAuth, async (req, res) => {
  const foster = await storage.createFoster(req.body);
  res.json(foster);
});

app.put('/api/fosters/:id', requireAuth, async (req, res) => {
  const foster = await storage.updateFoster(parseInt(req.params.id), req.body);
  res.json(foster);
});

app.delete('/api/fosters/:id', requireAuth, async (req, res) => {
  await storage.deleteFoster(parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/fosters/:id/publish', requireAuth, async (req, res) => {
  const foster = await storage.publishFoster(parseInt(req.params.id));
  res.json(foster);
});

app.post('/api/fosters/:id/unpublish', requireAuth, async (req, res) => {
  const foster = await storage.unpublishFoster(parseInt(req.params.id));
  res.json(foster);
});

app.get('/api/foster-parents', async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const fps = await storage.getFosterParents(publishedOnly);
  res.json(fps);
});

app.post('/api/foster-parents', requireAuth, async (req, res) => {
  const fp = await storage.createFosterParent(req.body);
  res.json(fp);
});

app.put('/api/foster-parents/:id', requireAuth, async (req, res) => {
  const fp = await storage.updateFosterParent(parseInt(req.params.id), req.body);
  res.json(fp);
});

app.delete('/api/foster-parents/:id', requireAuth, async (req, res) => {
  await storage.deleteFosterParent(parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/foster-parents/:id/publish', requireAuth, async (req, res) => {
  const fp = await storage.publishFosterParent(parseInt(req.params.id));
  res.json(fp);
});

app.post('/api/foster-parents/:id/unpublish', requireAuth, async (req, res) => {
  const fp = await storage.unpublishFosterParent(parseInt(req.params.id));
  res.json(fp);
});

app.get('/api/events', async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const events = await storage.getEvents(publishedOnly);
  res.json(events);
});

app.post('/api/events', requireAuth, async (req, res) => {
  const event = await storage.createEvent(req.body);
  res.json(event);
});

app.put('/api/events/:id', requireAuth, async (req, res) => {
  const event = await storage.updateEvent(parseInt(req.params.id), req.body);
  res.json(event);
});

app.delete('/api/events/:id', requireAuth, async (req, res) => {
  await storage.deleteEvent(parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/events/:id/publish', requireAuth, async (req, res) => {
  const event = await storage.publishEvent(parseInt(req.params.id));
  res.json(event);
});

app.get('/api/sections', requireAuth, async (req, res) => {
  const sections = await storage.getAllSections();
  res.json(sections);
});

app.get('/api/sections/:key', async (req, res) => {
  const section = await storage.getSection(req.params.key);
  if (section) {
    res.json(section);
  } else {
    res.status(404).json({ error: 'Section not found' });
  }
});

app.put('/api/sections/:key', requireAuth, async (req, res) => {
  const section = await storage.upsertSection(req.params.key, req.body);
  res.json(section);
});

app.post('/api/sections/:key/publish', requireAuth, async (req, res) => {
  const section = await storage.publishSection(req.params.key);
  res.json(section);
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    success: true, 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

app.post('/api/upload/multiple', requireAuth, upload.array('images', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  res.json({ 
    success: true, 
    files: files.map(f => ({ filename: f.filename, path: `/uploads/${f.filename}` }))
  });
});

app.get('/api/photos', async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const photos = await storage.getPhotos(publishedOnly);
  res.json(photos);
});

app.post('/api/photos', requireAuth, async (req, res) => {
  const photo = await storage.createPhoto(req.body);
  res.json(photo);
});

app.put('/api/photos/:id', requireAuth, async (req, res) => {
  const photo = await storage.updatePhoto(parseInt(req.params.id), req.body);
  if (photo) {
    res.json(photo);
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

app.delete('/api/photos/:id', requireAuth, async (req, res) => {
  await storage.deletePhoto(parseInt(req.params.id));
  res.json({ success: true });
});

app.post('/api/publish-all', requireAuth, async (req, res) => {
  await storage.publishAllDrafts();
  res.json({ success: true, message: 'All drafts published' });
});

async function initializeAdmin() {
  const count = await getAdminCount();
  if (count === 0) {
    const username = 'admin';
    const password = generateSecurePassword(16);
    await createAdmin(username, password);
    console.log('\n========================================');
    console.log('ADMIN CREDENTIALS (SAVE THESE!)');
    console.log('========================================');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('========================================');
    console.log('IMPORTANT: Change this password after first login!');
    console.log('========================================\n');
  }
}

const PORT = Number.parseInt(process.env.PORT || '5000', 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT must be a valid TCP port number');
}
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await setupDatabase();
    await initializeAdmin();

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

startServer();
