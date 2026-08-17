import os
import sys
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, date

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(SERVER_DIR, "serviceAccountKey.json")

_db = None

def get_firestore_db():
    global _db
    if _db is None:
        if not firebase_admin._apps:
            # 1. Check environment variable FIREBASE_SERVICE_ACCOUNT (for Vercel/Cloud deployment)
            env_sa = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
            if env_sa:
                try:
                    sa_info = json.loads(env_sa)
                    cred = credentials.Certificate(sa_info)
                    firebase_admin.initialize_app(cred)
                except Exception as e:
                    print(f"Failed to load FIREBASE_SERVICE_ACCOUNT from env: {e}")
            
            # 2. Check local serviceAccountKey.json file
            if not firebase_admin._apps and os.path.exists(KEY_PATH):
                try:
                    cred = credentials.Certificate(KEY_PATH)
                    firebase_admin.initialize_app(cred)
                except Exception as e:
                    print(f"Failed to load serviceAccountKey.json: {e}")

            # 3. Fallback to default application credentials or project ID
            if not firebase_admin._apps:
                try:
                    project_id = os.environ.get("FIREBASE_PROJECT_ID", "goalpath-747c4")
                    firebase_admin.initialize_app(options={"projectId": project_id})
                except Exception as e:
                    print(f"Fallback initialize_app failed: {e}")

        _db = firestore.client()
    return _db

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
    # Verify firestore connection
    db = get_firestore_db()
    return db

def get_next_id(collection_name):
    """Generates next integer ID to keep compatibility with UI/REST API"""
    db = get_firestore_db()
    docs = db.collection(collection_name).stream()
    max_id = 0
    for doc in docs:
        d = doc.to_dict()
        val = d.get("id")
        if isinstance(val, int) and val > max_id:
            max_id = val
        elif str(doc.id).isdigit() and int(doc.id) > max_id:
            max_id = int(doc.id)
    return max_id + 1

def create_user_achievements(user_id):
    db = get_firestore_db()
    
    # Calculate ach_id ONCE instead of 8 times (prevent Vercel 10s timeout)
    ach_id = get_next_id("achievements")
    
    batch = db.batch()
    has_updates = False
    
    for code, title, desc, icon, pts in ACHIEVEMENT_TEMPLATES:
        aid = f"{user_id}_{code}"
        doc_ref = db.collection("achievements").document(aid)
        
        # In a batch we technically shouldn't do a get() in loop if we want max performance,
        # but achievements are small. For safety, we only add if it doesn't exist.
        if not doc_ref.get().exists:
            batch.set(doc_ref, {
                "id": ach_id,
                "user_id": int(user_id),
                "code": code,
                "title": title,
                "description": desc,
                "icon": icon,
                "points_reward": pts,
                "is_unlocked": 0,
                "unlocked_at": None
            })
            ach_id += 1
            has_updates = True
            
    if has_updates:
        batch.commit()


def recalculate_goal_progress(goal_id, user_id=None):
    db = get_firestore_db()
    goal_id_int = int(goal_id)
    
    # Get all tasks for this goal
    tasks_query = db.collection("tasks").where("goal_id", "==", goal_id_int).stream()
    tasks = [t.to_dict() for t in tasks_query]
    
    total = len(tasks)
    completed = len([t for t in tasks if t.get("is_completed") == 1])
    
    progress = int((completed / total) * 100) if total > 0 else 0
    status = 'completed' if (total > 0 and completed == total) else 'active'
    
    # Update goal
    db.collection("goals").document(str(goal_id_int)).update({
        "progress": progress,
        "status": status
    })
    
    # Update phases
    phases_query = db.collection("phases").where("goal_id", "==", goal_id_int).stream()
    for ph_doc in phases_query:
        ph = ph_doc.to_dict()
        ph_id = ph.get("id")
        ph_tasks = [t for t in tasks if t.get("phase_id") == ph_id]
        p_tot = len(ph_tasks)
        p_done = len([t for t in ph_tasks if t.get("is_completed") == 1])
        
        p_status = 'completed' if p_tot > 0 and p_done == p_tot else ('in_progress' if p_done > 0 else 'pending')
        db.collection("phases").document(str(ph_id)).update({"status": p_status})
        
    return progress, status

def check_and_unlock_achievements(user_id):
    db = get_firestore_db()
    uid = int(user_id)
    
    # Completed tasks count
    tasks_query = db.collection("tasks").where("user_id", "==", uid).where("is_completed", "==", 1).stream()
    completed_tasks_count = len(list(tasks_query))
    
    # Completed goals count
    goals_query = db.collection("goals").where("user_id", "==", uid).stream()
    completed_goals_count = len([g.to_dict() for g in goals_query if g.to_dict().get("progress") == 100 or g.to_dict().get("status") == 'completed'])
    
    # Streak
    user_doc = db.collection("users").document(str(uid)).get()
    streak = user_doc.to_dict().get("streak", 0) if user_doc.exists else 0
    
    unlocked_codes = []
    
    def try_unlock(code, condition):
        if not condition:
            return
        aid = f"{uid}_{code}"
        doc_ref = db.collection("achievements").document(aid)
        doc = doc_ref.get()
        if doc.exists and doc.to_dict().get("is_unlocked") == 0:
            doc_ref.update({
                "is_unlocked": 1,
                "unlocked_at": datetime.now().isoformat()
            })
            unlocked_codes.append(code)
            
    try_unlock('first_step', completed_tasks_count >= 1)
    try_unlock('speed_demon', completed_tasks_count >= 5)
    try_unlock('streak_3', streak >= 3)
    try_unlock('streak_5', streak >= 5)
    try_unlock('goal_master', completed_goals_count >= 1)
    
    return unlocked_codes
