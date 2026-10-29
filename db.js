/**
 * SceneFlow Database & Authentication Engine
 * Built on Node.js built-in DatabaseSync (node:sqlite)
 * Persistent SQLite storage for Users, Sessions, Projects, Scenes, and Quotas.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'sceneflow.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ==================== 1. SCHEMA MIGRATIONS ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    salt TEXT,
    role TEXT DEFAULT 'creator',
    credits_remaining INTEGER DEFAULT 250,
    credits_total INTEGER DEFAULT 250,
    is_guest INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    aspect_ratio TEXT DEFAULT '16:9',
    is_public INTEGER DEFAULT 0,
    starred INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT,
    reference_image TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'pending',
    mode TEXT DEFAULT 'video',
    duration INTEGER DEFAULT 5,
    aspect_ratio TEXT DEFAULT '16:9',
    model TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    prompt TEXT NOT NULL,
    mode TEXT DEFAULT 'video',
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    aspect_ratio TEXT DEFAULT '16:9',
    style TEXT,
    camera_motion TEXT,
    lighting TEXT,
    duration INTEGER DEFAULT 5,
    status TEXT DEFAULT 'completed',
    model TEXT,
    credits_used INTEGER DEFAULT 25,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    credits_consumed INTEGER NOT NULL,
    ip_address TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id, scene_number);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
`);

// ==================== 2. PASSWORD CRYPTOGRAPHY ====================
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
}

// ==================== 3. USER & AUTH OPERATIONS ====================
function createUser({ email, username, password, isGuest = false, role = 'creator', credits = 250 }) {
  const id = `usr-${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  let passwordHash = null;
  let salt = null;

  if (password) {
    const hp = hashPassword(password);
    passwordHash = hp.hash;
    salt = hp.salt;
  }

  const stmt = db.prepare(`
    INSERT INTO users (id, email, username, password_hash, salt, role, credits_remaining, credits_total, is_guest, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, email || null, username, passwordHash, salt, role, credits, credits, isGuest ? 1 : 0, now);
  return getUserById(id);
}

function getUserById(id) {
  const stmt = db.prepare('SELECT id, email, username, role, credits_remaining, credits_total, is_guest, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

function getUserByLogin(login) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?');
  return stmt.get(login, login);
}

function authenticateUser(login, password) {
  const user = getUserByLogin(login);
  if (!user) return null;
  if (!user.password_hash || !user.salt) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    credits_remaining: user.credits_remaining,
    credits_total: user.credits_total,
    is_guest: !!user.is_guest,
    created_at: user.created_at
  };
}

function createSession(userId, daysValid = 30) {
  const sessionId = `sf_tok_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(sessionId, userId, expiresAt, now.toISOString());
  return { token: sessionId, expiresAt };
}

function getSessionUser(token) {
  if (!token) return null;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT u.id, u.email, u.username, u.role, u.credits_remaining, u.credits_total, u.is_guest, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > ?
  `);
  return stmt.get(token, now);
}

function deleteSession(token) {
  if (!token) return;
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  stmt.run(token);
}

// ==================== 4. QUOTA & USAGE OPERATIONS ====================
function checkAndDeductCredits(userId, amount, actionType, ip = '') {
  const userStmt = db.prepare('SELECT credits_remaining FROM users WHERE id = ?');
  const user = userStmt.get(userId);
  if (!user) return { success: false, error: 'User not found' };

  if (user.credits_remaining < amount) {
    return {
      success: false,
      error: `Insufficient generation credits. You have ${user.credits_remaining} credits remaining, but this requires ${amount} credits.`,
      creditsRemaining: user.credits_remaining,
      cost: amount
    };
  }

  const newCredits = user.credits_remaining - amount;
  const updateStmt = db.prepare('UPDATE users SET credits_remaining = ? WHERE id = ?');
  updateStmt.run(newCredits, userId);

  const logStmt = db.prepare('INSERT INTO usage_logs (id, user_id, action_type, credits_consumed, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  logStmt.run(`log-${Date.now()}-${Math.floor(Math.random() * 1000)}`, userId, actionType, amount, ip, new Date().toISOString());

  return { success: true, creditsRemaining: newCredits, cost: amount };
}

function refillUserCredits(userId, targetCredits = 500) {
  const stmt = db.prepare('UPDATE users SET credits_remaining = ?, credits_total = ? WHERE id = ?');
  stmt.run(targetCredits, targetCredits, userId);
  return getUserById(userId);
}

// ==================== 5. PROJECT & SCENE CRUD ====================
function getUserProjects(userId) {
  const stmt = db.prepare(`
    SELECT p.*, COUNT(s.id) as scene_count
    FROM projects p
    LEFT JOIN scenes s ON p.id = s.project_id
    WHERE p.user_id = ? OR p.is_public = 1
    GROUP BY p.id
    ORDER BY p.is_public DESC, p.updated_at DESC
  `);
  return stmt.all(userId);
}

function getProject(projectId) {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(projectId);
}

function getProjectScenes(projectId) {
  const stmt = db.prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number ASC');
  const rows = stmt.all(projectId);
  return rows.map((r) => ({
    id: r.id,
    sceneNumber: r.scene_number,
    title: r.title,
    prompt: r.prompt || '',
    referenceImage: r.reference_image || '',
    mediaUrl: r.media_url,
    thumbnailUrl: r.thumbnail_url,
    status: r.status,
    mode: r.mode,
    duration: r.duration,
    aspectRatio: r.aspect_ratio,
    model: r.model,
    errorMessage: r.error_message,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

function createProject({ id, userId, name, description, aspectRatio = '16:9', isPublic = false, scenes = [] }) {
  const projId = id || `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO projects (id, user_id, name, description, aspect_ratio, is_public, starred, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(projId, userId, name, description || '', aspectRatio, isPublic ? 1 : 0, 0, now, now);

  if (Array.isArray(scenes) && scenes.length > 0) {
    saveProjectScenes(projId, userId, scenes);
  }

  return { ...getProject(projId), scenes: getProjectScenes(projId) };
}

function updateProject(projectId, userId, updates) {
  const current = getProject(projectId);
  if (!current) return null;
  if (current.user_id !== userId && current.is_public !== 1) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const description = updates.description !== undefined ? updates.description : current.description;
  const aspectRatio = updates.aspectRatio !== undefined ? updates.aspectRatio : current.aspect_ratio;
  const starred = updates.starred !== undefined ? (updates.starred ? 1 : 0) : current.starred;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, aspect_ratio = ?, starred = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(name, description, aspectRatio, starred, now, projectId);

  if (Array.isArray(updates.scenes)) {
    saveProjectScenes(projectId, userId, updates.scenes);
  }

  return { ...getProject(projectId), scenes: getProjectScenes(projectId) };
}

function deleteProject(projectId, userId) {
  const current = getProject(projectId);
  if (!current) return false;
  if (current.user_id !== userId) return false; // Private ownership check
  if (current.is_public === 1) return false; // Public sample projects are protected

  const deleteScenes = db.prepare('DELETE FROM scenes WHERE project_id = ?');
  deleteScenes.run(projectId);

  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(projectId);
  return true;
}

function saveProjectScenes(projectId, userId, scenesList) {
  // Clear previous scenes
  const delStmt = db.prepare('DELETE FROM scenes WHERE project_id = ?');
  delStmt.run(projectId);

  const insertStmt = db.prepare(`
    INSERT INTO scenes (id, project_id, scene_number, title, prompt, reference_image, media_url, thumbnail_url, status, mode, duration, aspect_ratio, model, error_message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (let i = 0; i < scenesList.length; i++) {
    const s = scenesList[i];
    const sId = s.id || `scene-${Date.now()}-${i + 1}`;
    insertStmt.run(
      sId,
      projectId,
      i + 1,
      s.title || `Scene ${i + 1}`,
      s.prompt || '',
      s.referenceImage || '',
      s.mediaUrl || null,
      s.thumbnailUrl || null,
      s.status || 'pending',
      s.mode || 'video',
      Number(s.duration) || 5,
      s.aspectRatio || '16:9',
      s.model || null,
      s.errorMessage || null,
      s.createdAt || now,
      now
    );
  }

  // Touch project updated_at
  const touch = db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?');
  touch.run(now, projectId);

  return getProjectScenes(projectId);
}

// ==================== 6. SEED SAMPLE PROJECT & SYSTEM ACCOUNTS ====================
function seedSampleData() {
  // Check if system sample user exists
  let sampleUser = getUserByLogin('director@sceneflow.ai');
  if (!sampleUser) {
    sampleUser = createUser({
      email: 'director@sceneflow.ai',
      username: 'SceneFlow Studio',
      password: 'DemoStudioPassword2026!',
      role: 'director',
      credits: 9999
    });
    console.log('✓ Created SceneFlow Studio Director system user');
  }

  // Check if public sample project exists
  const existingSample = db.prepare('SELECT id FROM projects WHERE id = ?').get('proj-sample-solaris');
  if (!existingSample) {
    const sampleScenes = [
      {
        id: 'scene-sample-1',
        sceneNumber: 1,
        title: 'Scene 1: Establishing Dyson Swarm Orbit',
        prompt: 'A solitary reconnaissance ship glides across the glowing cyan horizon of a colossal ring structure, volumetric starlight, 35mm anamorphic',
        referenceImage: '',
        mediaUrl: '/exports/sample-clip.mp4',
        thumbnailUrl: '/exports/sample-clip.mp4',
        status: 'completed',
        mode: 'video',
        duration: 5,
        aspectRatio: '16:9',
        model: 'Google Veo 3.1 Cinema'
      },
      {
        id: 'scene-sample-2',
        sceneNumber: 2,
        title: 'Scene 2: Nebula Flythrough & Starlight Flare',
        prompt: 'FPV drone flythrough of cavernous obsidian vault with rotating geometric rings emitting cobalt luminescence, 35mm anamorphic',
        referenceImage: '',
        mediaUrl: '/exports/sample-clip.mp4',
        thumbnailUrl: '/exports/sample-clip.mp4',
        status: 'completed',
        mode: 'video',
        duration: 5,
        aspectRatio: '16:9',
        model: 'Google Veo 3.1 Cinema'
      },
      {
        id: 'scene-sample-3',
        sceneNumber: 3,
        title: 'Scene 3: Ancient Monolith Discovery',
        prompt: 'Close-up macro pan across weathered alien hieroglyphs pulsing with amber bioluminescence under volumetric starlight',
        referenceImage: '',
        mediaUrl: '/exports/sample-clip.mp4',
        thumbnailUrl: '/exports/sample-clip.mp4',
        status: 'completed',
        mode: 'video',
        duration: 5,
        aspectRatio: '16:9',
        model: 'Google Veo 3.1 Cinema'
      }
    ];

    createProject({
      id: 'proj-sample-solaris',
      userId: sampleUser.id,
      name: 'Solaris Odyssey: The Dyson Perimeter (Director\'s Cut)',
      description: 'Public sample film project. Explore SceneFlow\'s multi-shot storyboard workflow without generating media. Pre-loaded with 3 full cinematic scenes, reference art frames, camera directions, and an assembled master cut ready for instant playback.',
      aspectRatio: '16:9',
      isPublic: true,
      scenes: sampleScenes
    });
    console.log('✓ Seeded public sample project: Solaris Odyssey');
  }
}

seedSampleData();

module.exports = {
  db,
  createUser,
  getUserById,
  getUserByLogin,
  authenticateUser,
  createSession,
  getSessionUser,
  deleteSession,
  checkAndDeductCredits,
  refillUserCredits,
  getUserProjects,
  getProject,
  getProjectScenes,
  createProject,
  updateProject,
  deleteProject,
  saveProjectScenes
};
