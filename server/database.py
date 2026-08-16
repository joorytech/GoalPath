import sqlite3
import os
import json
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "goalpath.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    return conn

ACHIEVEMENT_TEMPLATES = [
    ('first_step', 'أول خطوة', 'أكملت أول مهمة في مسار أهدافك بنجاح.', 'military_tech', 100),
    ('streak_3', 'سلسلة 3 أيام', 'التزمت بالدخول وإنجاز المهام لمدة 3 أيام متتالية.', 'local_fire_department', 150),
    ('streak_5', 'سلسلة 5 أيام', 'واصلت الإنجاز لـ 5 أيام متتالية دون انقطاع!', 'local_fire_department', 250),
    ('goal_master', 'بطل الأهداف', 'أكملت أول هدف متكامل بنسبة 100%.', 'workspace_premium', 500),
    ('python_pioneer', 'رائد بايثون', 'أنهيت المرحلة الأولى من مسار بايثون.', 'code', 200),
    ('smart_planner', 'المخطط الذكي', 'قمت بإنشاء خطة ذكية بالاعتماد على الذكاء الاصطناعي.', 'auto_awesome', 150),
    ('speed_demon', 'سرعة الإنجاز', 'أكملت 5 مهام خلال يوم واحد.', 'bolt', 200),
    ('unstoppable', 'لا يتوقف', 'حافظت على سلسلة إنجاز لمدة 30 يوماً.', 'social_leaderboard', 1000)
]

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        dark_mode INTEGER DEFAULT 0,
        notifications_enabled INTEGER DEFAULT 1,
        language TEXT DEFAULT 'ar',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Goals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'متوسط',
        start_date TEXT,
        end_date TEXT,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        smart_badge INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Phases Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        phase_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        duration_weeks INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
    )
    """)

    # Tasks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        goal_id INTEGER,
        phase_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'عام',
        due_date TEXT,
        estimated_minutes INTEGER DEFAULT 45,
        priority TEXT DEFAULT 'متوسط',
        is_completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        is_today INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES phases (id) ON DELETE SET NULL
    )
    """)

    # Achievements Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        points_reward INTEGER DEFAULT 100,
        is_unlocked INTEGER DEFAULT 0,
        unlocked_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, code)
    )
    """)

    # Stumble Diagnosis Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stumble_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        goal_id INTEGER,
        reason TEXT NOT NULL,
        ai_suggestion TEXT,
        solution_type TEXT,
        resolved INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Activity Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        points_change INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

def create_user_achievements(conn, user_id):
    cursor = conn.cursor()
    for code, title, desc, icon, pts in ACHIEVEMENT_TEMPLATES:
        cursor.execute("""
        INSERT OR IGNORE INTO achievements (user_id, code, title, description, icon, points_reward, is_unlocked)
        VALUES (?, ?, ?, ?, ?, ?, 0)
        """, (user_id, code, title, desc, icon, pts))
    conn.commit()
