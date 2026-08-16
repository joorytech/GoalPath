import os
import sys
import sqlite3
import firebase_admin
from firebase_admin import credentials, firestore

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(SERVER_DIR, "serviceAccountKey.json")
DB_PATH = os.path.join(SERVER_DIR, "goalpath.db")

print(f"Connecting to Firestore using {KEY_PATH}...")
cred = credentials.Certificate(KEY_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Reading SQLite database...")
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 1. Migrate Users
cursor.execute("SELECT * FROM users")
users = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(users)} users.")

for u in users:
    uid = str(u["id"])
    user_data = {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "password_hash": u["password_hash"],
        "avatar": u["avatar"],
        "points": u["points"],
        "streak": u["streak"],
        "dark_mode": u["dark_mode"],
        "notifications_enabled": u["notifications_enabled"],
        "language": u["language"],
        "created_at": u["created_at"]
    }
    db.collection("users").document(uid).set(user_data)
    print(f"  -> Migrated User: {u['name']} (ID: {uid})")

# 2. Migrate Goals
cursor.execute("SELECT * FROM goals")
goals = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(goals)} goals.")

for g in goals:
    gid = str(g["id"])
    goal_data = {
        "id": g["id"],
        "user_id": g["user_id"],
        "title": g["title"],
        "description": g["description"],
        "category": g["category"],
        "priority": g["priority"],
        "start_date": g["start_date"],
        "end_date": g["end_date"],
        "progress": g["progress"],
        "status": g["status"],
        "smart_badge": g["smart_badge"],
        "created_at": g["created_at"]
    }
    db.collection("goals").document(gid).set(goal_data)
    print(f"  -> Migrated Goal: {g['title']} (ID: {gid})")

# 3. Migrate Phases
cursor.execute("SELECT * FROM phases")
phases = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(phases)} phases.")

for p in phases:
    pid = str(p["id"])
    phase_data = {
        "id": p["id"],
        "goal_id": p["goal_id"],
        "phase_number": p["phase_number"],
        "title": p["title"],
        "description": p["description"],
        "duration_weeks": p["duration_weeks"],
        "status": p["status"],
        "created_at": p["created_at"]
    }
    db.collection("phases").document(pid).set(phase_data)
    print(f"  -> Migrated Phase: {p['title']} (ID: {pid})")

# 4. Migrate Tasks
cursor.execute("SELECT * FROM tasks")
tasks = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(tasks)} tasks.")

for t in tasks:
    tid = str(t["id"])
    task_data = {
        "id": t["id"],
        "user_id": t["user_id"],
        "goal_id": t["goal_id"],
        "phase_id": t["phase_id"],
        "title": t["title"],
        "description": t["description"],
        "category": t["category"],
        "due_date": t["due_date"],
        "estimated_minutes": t["estimated_minutes"],
        "priority": t["priority"],
        "is_completed": t["is_completed"],
        "completed_at": t["completed_at"],
        "is_today": t["is_today"],
        "order_index": t["order_index"],
        "created_at": t["created_at"]
    }
    db.collection("tasks").document(tid).set(task_data)
    print(f"  -> Migrated Task: {t['title']} (ID: {tid})")

# 5. Migrate Achievements
cursor.execute("SELECT * FROM achievements")
achievements = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(achievements)} achievements.")

for a in achievements:
    aid = f"{a['user_id']}_{a['code']}"
    ach_data = {
        "id": a["id"],
        "user_id": a["user_id"],
        "code": a["code"],
        "title": a["title"],
        "description": a["description"],
        "icon": a["icon"],
        "points_reward": a["points_reward"],
        "is_unlocked": a["is_unlocked"],
        "unlocked_at": a["unlocked_at"]
    }
    db.collection("achievements").document(aid).set(ach_data)

# 6. Migrate Activity Logs
cursor.execute("SELECT * FROM activity_logs")
logs = [dict(row) for row in cursor.fetchall()]
print(f"Found {len(logs)} activity logs.")

for l in logs:
    lid = str(l["id"])
    log_data = {
        "id": l["id"],
        "user_id": l["user_id"],
        "action_type": l["action_type"],
        "description": l["description"],
        "points_change": l["points_change"],
        "timestamp": l["timestamp"]
    }
    db.collection("activity_logs").document(lid).set(log_data)

conn.close()
print("\n✅ All data successfully migrated from SQLite to Firestore!")
