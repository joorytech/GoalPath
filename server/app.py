import os
import sys

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

import json
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from firestore_db import (
    get_firestore_db,
    init_db,
    get_next_id,
    create_user_achievements,
    recalculate_goal_progress,
    check_and_unlock_achievements
)
from ai_engine import generate_ai_goal_plan, diagnose_stumble_reason

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, static_folder=PUBLIC_DIR)

# Allow CORS from any origin (required for Vercel deployment)
# Specify explicit origins if you want to restrict in production
CORS(app, origins="*", supports_credentials=False)

# Ensure DB initialized on startup (only when not in Vercel cold-start without credentials)
try:
    with app.app_context():
        init_db()
except Exception as e:
    print(f"DB init warning (may be missing credentials): {e}")

# --- Helper Functions ---

def get_current_user_id():
    """Extract user_id from request headers. Returns None if not provided."""
    user_id = request.headers.get("X-User-Id")
    if user_id and str(user_id).isdigit() and int(user_id) > 0:
        return int(user_id)
    return None

def require_user_id():
    """Returns user_id or a 401 JSON response tuple."""
    uid = get_current_user_id()
    if uid is None:
        return None, jsonify({"error": "مطلوب تسجيل الدخول", "code": "auth/unauthenticated"}), 401
    return uid, None, None

# --- API Routes ---

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "GoalPath Full-Stack (Firestore)", "timestamp": datetime.now().isoformat()})

# 1. User & Auth
@app.route("/api/auth/user", methods=["GET"])
def get_user_profile():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()
    doc = db.collection("users").document(str(user_id)).get()
    
    if doc.exists:
        return jsonify(doc.to_dict())
        
    return jsonify({"error": "User not found"}), 404

@app.route("/api/auth/user", methods=["PUT"])
def update_user_profile():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    data = request.json or {}
    db = get_firestore_db()
    
    updates = {}
    if "name" in data and data["name"]:
        updates["name"] = data["name"]
    if "dark_mode" in data:
        updates["dark_mode"] = 1 if data["dark_mode"] else 0
    if "notifications_enabled" in data:
        updates["notifications_enabled"] = 1 if data["notifications_enabled"] else 0
    if "language" in data:
        updates["language"] = data["language"]

    if updates:
        db.collection("users").document(str(user_id)).update(updates)
        
    return jsonify({"status": "success", "message": "تم تحديث الملف الشخصي بنجاح"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    password = data.get("password", "")

    if not email:
        email = f"user_{int(datetime.now().timestamp())}@goalpath.com"

    db = get_firestore_db()
    users_query = db.collection("users").where("email", "==", email).limit(1).stream()
    matched_users = [u.to_dict() for u in users_query]

    if matched_users:
        return jsonify({"status": "success", "user": matched_users[0]})
    else:
        user_id = get_next_id("users")
        display_name = name or email.split("@")[0]
        new_user = {
            "id": user_id,
            "name": display_name,
            "email": email,
            "password_hash": password or "pass123",
            "avatar": None,
            "points": 0,
            "streak": 0,
            "dark_mode": 0,
            "notifications_enabled": 1,
            "language": "ar",
            "created_at": datetime.now().isoformat()
        }
        db.collection("users").document(str(user_id)).set(new_user)
        create_user_achievements(user_id)
        return jsonify({"status": "success", "user": new_user, "is_new": True})

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    name = (data.get("name") or "").strip() or "مستخدم جديد"
    email = (data.get("email") or "").strip().lower() or f"user_{int(datetime.now().timestamp())}@goalpath.com"
    password = data.get("password", "pass123")

    db = get_firestore_db()
    users_query = db.collection("users").where("email", "==", email).limit(1).stream()
    matched_users = [u.to_dict() for u in users_query]

    if matched_users:
        return jsonify({"status": "success", "user": matched_users[0], "is_new": False})
    
    user_id = get_next_id("users")
    new_user = {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": password,
        "avatar": None,
        "points": 0,
        "streak": 0,
        "dark_mode": 0,
        "notifications_enabled": 1,
        "language": "ar",
        "created_at": datetime.now().isoformat()
    }
    db.collection("users").document(str(user_id)).set(new_user)
    create_user_achievements(user_id)
    return jsonify({"status": "success", "user": new_user, "is_new": True})

# 2. Dynamic Dashboard Aggregation
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    # User details
    user_doc = db.collection("users").document(str(user_id)).get()
    if user_doc.exists:
        user = user_doc.to_dict()
    else:
        user = {"id": user_id, "name": "مستخدم", "points": 0, "streak": 0}

    # Goals metrics for this user
    user_goals_query = db.collection("goals").where("user_id", "==", int(user_id)).stream()
    goals = [g.to_dict() for g in user_goals_query]
    
    active_goals_count = len([g for g in goals if g.get("progress", 0) < 100 and g.get("status") == "active"])
    completed_goals_count = len([g for g in goals if g.get("progress", 0) == 100 or g.get("status") == "completed"])

    # Tasks metrics
    user_tasks_query = db.collection("tasks").where("user_id", "==", int(user_id)).stream()
    tasks = [t.to_dict() for t in user_tasks_query]

    tot_tasks = len(tasks)
    done_tasks = len([t for t in tasks if t.get("is_completed") == 1])
    pending_tasks_count = tot_tasks - done_tasks
    overall_completion_rate = int((done_tasks / tot_tasks) * 100) if tot_tasks > 0 else 0

    # Attach task stats to goals
    for g in goals:
        g_tasks = [t for t in tasks if t.get("goal_id") == g.get("id")]
        g["total_tasks"] = len(g_tasks)
        g["completed_tasks"] = len([t for t in g_tasks if t.get("is_completed") == 1])

    goals.sort(key=lambda x: x.get("id", 0), reverse=True)

    # Next Smart Step for this user
    pending_tasks = [t for t in tasks if t.get("is_completed") == 0]
    next_step = None
    if pending_tasks:
        def sort_priority(t):
            p = t.get("priority", "متوسط")
            p_val = 1 if p == "مرتفع" else (2 if p == "متوسط" else 3)
            today_val = 0 if t.get("is_today") == 1 else 1
            return (p_val, today_val, t.get("id", 0))
        
        pending_tasks.sort(key=sort_priority)
        next_step = pending_tasks[0]
        # Attach goal_title
        goal_match = next((g for g in goals if g.get("id") == next_step.get("goal_id")), None)
        if goal_match:
            next_step["goal_title"] = goal_match.get("title")

    return jsonify({
        "user": user,
        "metrics": {
            "active_goals": active_goals_count,
            "completed_goals": completed_goals_count,
            "pending_tasks": pending_tasks_count,
            "completed_tasks": done_tasks,
            "total_tasks": tot_tasks,
            "completion_rate": overall_completion_rate
        },
        "next_step": next_step,
        "goals": goals
    })

# 3. Goals Endpoints
@app.route("/api/goals", methods=["GET"])
def list_goals():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    goals_docs = db.collection("goals").where("user_id", "==", int(user_id)).stream()
    goals = [g.to_dict() for g in goals_docs]

    tasks_docs = db.collection("tasks").where("user_id", "==", int(user_id)).stream()
    tasks = [t.to_dict() for t in tasks_docs]

    for g in goals:
        g_tasks = [t for t in tasks if t.get("goal_id") == g.get("id")]
        g["total_tasks"] = len(g_tasks)
        g["completed_tasks"] = len([t for t in g_tasks if t.get("is_completed") == 1])

    goals.sort(key=lambda x: x.get("id", 0), reverse=True)
    return jsonify({"goals": goals})

@app.route("/api/goals", methods=["POST"])
def create_goal():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    data = request.json or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "عنوان الهدف مطلوب"}), 400

    description = data.get("description", "")
    category = data.get("category", "تعليمي")
    priority = data.get("priority", "متوسط")
    start_date = data.get("start_date", date.today().isoformat())
    end_date = data.get("end_date", (date.today() + timedelta(days=90)).isoformat())
    phases = data.get("phases", [])

    db = get_firestore_db()
    goal_id = get_next_id("goals")

    goal_data = {
        "id": goal_id,
        "user_id": int(user_id),
        "title": title,
        "description": description,
        "category": category,
        "priority": priority,
        "start_date": start_date,
        "end_date": end_date,
        "progress": 0,
        "status": "active",
        "smart_badge": 1,
        "created_at": datetime.now().isoformat()
    }
    db.collection("goals").document(str(goal_id)).set(goal_data)

    if phases:
        for p in phases:
            phase_id = get_next_id("phases")
            phase_data = {
                "id": phase_id,
                "goal_id": goal_id,
                "phase_number": p.get("phase_number", 1),
                "title": p.get("title", ""),
                "description": p.get("description", ""),
                "duration_weeks": p.get("duration_weeks", 3),
                "status": "pending",
                "created_at": datetime.now().isoformat()
            }
            db.collection("phases").document(str(phase_id)).set(phase_data)

            for t in p.get("tasks", []):
                task_id = get_next_id("tasks")
                task_data = {
                    "id": task_id,
                    "user_id": int(user_id),
                    "goal_id": goal_id,
                    "phase_id": phase_id,
                    "title": t.get("title", ""),
                    "description": t.get("description", ""),
                    "category": category,
                    "due_date": start_date,
                    "estimated_minutes": t.get("estimated_minutes", 45),
                    "priority": t.get("priority", priority),
                    "is_completed": 0,
                    "completed_at": None,
                    "is_today": 1,
                    "order_index": 0,
                    "created_at": datetime.now().isoformat()
                }
                db.collection("tasks").document(str(task_id)).set(task_data)
        
        # Unlock Smart Planner achievement
        aid = f"{user_id}_smart_planner"
        ach_doc = db.collection("achievements").document(aid).get()
        if ach_doc.exists and ach_doc.to_dict().get("is_unlocked") == 0:
            db.collection("achievements").document(aid).update({
                "is_unlocked": 1,
                "unlocked_at": datetime.now().isoformat()
            })
    else:
        phase_id = get_next_id("phases")
        phase_data = {
            "id": phase_id,
            "goal_id": goal_id,
            "phase_number": 1,
            "title": "المرحلة الأولى: البداية",
            "description": "الخطوات التأسيسية لتحقيق الهدف",
            "duration_weeks": 2,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        db.collection("phases").document(str(phase_id)).set(phase_data)

        task_id = get_next_id("tasks")
        task_data = {
            "id": task_id,
            "user_id": int(user_id),
            "goal_id": goal_id,
            "phase_id": phase_id,
            "title": f"البدء في {title}",
            "description": description or "الخطوة الأولى العملية",
            "category": category,
            "due_date": start_date,
            "estimated_minutes": 45,
            "priority": priority,
            "is_completed": 0,
            "completed_at": None,
            "is_today": 1,
            "order_index": 0,
            "created_at": datetime.now().isoformat()
        }
        db.collection("tasks").document(str(task_id)).set(task_data)

    recalculate_goal_progress(goal_id, user_id)
    return jsonify({"status": "success", "goal_id": goal_id, "message": "تم إنشاء الهدف بنجاح!"}), 201

@app.route("/api/goals/<int:goal_id>", methods=["GET"])
def get_goal_details(goal_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    goal_doc = db.collection("goals").document(str(goal_id)).get()
    if not goal_doc.exists:
        return jsonify({"error": "الهدف غير موجود"}), 404

    goal = goal_doc.to_dict()
    if goal.get("user_id") != int(user_id):
        return jsonify({"error": "الهدف غير موجود"}), 404

    # Get Phases
    phases_docs = db.collection("phases").where("goal_id", "==", goal_id).stream()
    phases = [p.to_dict() for p in phases_docs]
    phases.sort(key=lambda x: x.get("phase_number", 1))

    # Get Tasks
    tasks_docs = db.collection("tasks").where("goal_id", "==", goal_id).stream()
    tasks = [t.to_dict() for t in tasks_docs]
    tasks.sort(key=lambda x: (x.get("order_index", 0), x.get("id", 0)))

    for p in phases:
        p["tasks"] = [t for t in tasks if t.get("phase_id") == p.get("id")]

    goal["phases"] = phases
    goal["tasks"] = tasks
    goal["total_tasks"] = len(tasks)
    goal["completed_tasks"] = len([t for t in tasks if t.get("is_completed") == 1])

    return jsonify(goal)

@app.route("/api/goals/<int:goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    # Delete goal doc
    db.collection("goals").document(str(goal_id)).delete()

    # Delete related tasks
    tasks = db.collection("tasks").where("goal_id", "==", goal_id).stream()
    for t in tasks:
        db.collection("tasks").document(t.id).delete()

    # Delete related phases
    phases = db.collection("phases").where("goal_id", "==", goal_id).stream()
    for p in phases:
        db.collection("phases").document(p.id).delete()

    return jsonify({"status": "success", "message": "تم حذف الهدف بنجاح"})

# 4. Tasks Endpoints
@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    today_only = request.args.get("today", "").lower() == "true"
    goal_id = request.args.get("goal_id")

    db = get_firestore_db()
    query = db.collection("tasks").where("user_id", "==", int(user_id))
    
    if goal_id:
        query = query.where("goal_id", "==", int(goal_id))

    tasks_docs = query.stream()
    tasks = [t.to_dict() for t in tasks_docs]

    # Attach goal titles
    goals_docs = db.collection("goals").where("user_id", "==", int(user_id)).stream()
    goals_dict = {g.to_dict().get("id"): g.to_dict() for g in goals_docs}

    today_str = date.today().isoformat()
    filtered_tasks = []
    for t in tasks:
        gid = t.get("goal_id")
        if gid in goals_dict:
            t["goal_title"] = goals_dict[gid].get("title")
            t["goal_category"] = goals_dict[gid].get("category")

        if today_only:
            if t.get("is_today") == 1 or (t.get("due_date") and t.get("due_date") <= today_str):
                filtered_tasks.append(t)
        else:
            filtered_tasks.append(t)

    filtered_tasks.sort(key=lambda x: (x.get("is_completed", 0), x.get("id", 0)))

    total = len(filtered_tasks)
    completed = len([t for t in filtered_tasks if t.get("is_completed") == 1])
    progress = int((completed / total) * 100) if total > 0 else 0

    return jsonify({
        "tasks": filtered_tasks,
        "total": total,
        "completed": completed,
        "progress": progress
    })

@app.route("/api/tasks", methods=["POST"])
def create_task():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    data = request.json or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "عنوان المهمة مطلوب"}), 400

    goal_id = int(data.get("goal_id")) if data.get("goal_id") else None
    description = data.get("description", "")
    category = data.get("category", "عام")
    due_date_val = data.get("due_date", date.today().isoformat())
    estimated_minutes = data.get("estimated_minutes", 30)
    priority = data.get("priority", "متوسط")
    is_today = 1 if data.get("is_today", True) else 0

    db = get_firestore_db()
    task_id = get_next_id("tasks")

    task_data = {
        "id": task_id,
        "user_id": int(user_id),
        "goal_id": goal_id,
        "phase_id": None,
        "title": title,
        "description": description,
        "category": category,
        "due_date": due_date_val,
        "estimated_minutes": estimated_minutes,
        "priority": priority,
        "is_completed": 0,
        "completed_at": None,
        "is_today": is_today,
        "order_index": 0,
        "created_at": datetime.now().isoformat()
    }
    db.collection("tasks").document(str(task_id)).set(task_data)

    if goal_id:
        recalculate_goal_progress(goal_id, user_id)

    return jsonify({"status": "success", "task_id": task_id, "message": "تمت إضافة المهمة بنجاح"}), 201

@app.route("/api/tasks/<int:task_id>/toggle", methods=["POST", "PATCH"])
def toggle_task(task_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()
    
    task_doc = db.collection("tasks").document(str(task_id)).get()
    if not task_doc.exists:
        return jsonify({"error": "المهمة غير موجودة"}), 404

    task = task_doc.to_dict()
    if task.get("user_id") != int(user_id):
        return jsonify({"error": "المهمة غير موجودة"}), 404

    new_status = 0 if task.get("is_completed") == 1 else 1
    completed_at = datetime.now().isoformat() if new_status == 1 else None

    db.collection("tasks").document(str(task_id)).update({
        "is_completed": new_status,
        "completed_at": completed_at
    })

    # Points reward & streak update
    points_delta = 25 if new_status == 1 else -25
    user_doc_ref = db.collection("users").document(str(user_id))
    user_doc = user_doc_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {"points": 0, "streak": 0}
    
    current_points = max(0, user_data.get("points", 0) + points_delta)
    current_streak = user_data.get("streak", 0)
    if current_points > 0 and current_streak == 0:
        current_streak = 1

    user_doc_ref.update({
        "points": current_points,
        "streak": current_streak
    })
    user_data["points"] = current_points
    user_data["streak"] = current_streak

    # Activity Log
    log_id = get_next_id("activity_logs")
    db.collection("activity_logs").document(str(log_id)).set({
        "id": log_id,
        "user_id": int(user_id),
        "action_type": "task_toggle",
        "description": f"{'إكمال' if new_status == 1 else 'إلغاء إكمال'} المهمة: {task.get('title')}",
        "points_change": points_delta,
        "timestamp": datetime.now().isoformat()
    })

    goal_progress = None
    goal_status = None
    goal_title = None
    is_goal_completed = False
    if task.get("goal_id"):
        goal_progress, goal_status = recalculate_goal_progress(task["goal_id"], user_id)
        g_doc = db.collection("goals").document(str(task["goal_id"])).get()
        if g_doc.exists:
            goal_title = g_doc.to_dict().get("title")
        if goal_status == 'completed' and goal_progress == 100 and new_status == 1:
            is_goal_completed = True
            user_data["points"] += 100
            user_doc_ref.update({"points": user_data["points"]})
            
            log2_id = get_next_id("activity_logs")
            db.collection("activity_logs").document(str(log2_id)).set({
                "id": log2_id,
                "user_id": int(user_id),
                "action_type": "goal_completed",
                "description": f"إتمام الهدف بنجاح: {goal_title}",
                "points_change": 100,
                "timestamp": datetime.now().isoformat()
            })

    unlocked_achievements = check_and_unlock_achievements(user_id)

    return jsonify({
        "status": "success",
        "task_id": task_id,
        "is_completed": bool(new_status),
        "goal_id": task.get("goal_id"),
        "goal_title": goal_title,
        "goal_progress": goal_progress,
        "goal_status": goal_status,
        "is_goal_completed": is_goal_completed,
        "user": user_data,
        "unlocked_achievements": unlocked_achievements
    })

@app.route("/api/goals/<int:goal_id>/complete", methods=["POST"])
def complete_goal(goal_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    goal_doc = db.collection("goals").document(str(goal_id)).get()
    if not goal_doc.exists:
        return jsonify({"error": "الهدف غير موجود"}), 404

    goal = goal_doc.to_dict()

    # Mark all tasks completed
    tasks_docs = db.collection("tasks").where("goal_id", "==", goal_id).where("user_id", "==", int(user_id)).stream()
    for t in tasks_docs:
        db.collection("tasks").document(t.id).update({
            "is_completed": 1,
            "completed_at": datetime.now().isoformat()
        })

    # Mark phases completed
    phases_docs = db.collection("phases").where("goal_id", "==", goal_id).stream()
    for p in phases_docs:
        db.collection("phases").document(p.id).update({"status": "completed"})

    # Mark goal completed
    db.collection("goals").document(str(goal_id)).update({
        "progress": 100,
        "status": "completed"
    })

    # Bonus points
    user_doc_ref = db.collection("users").document(str(user_id))
    user_doc = user_doc_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {"points": 0, "streak": 0}
    user_data["points"] = user_data.get("points", 0) + 150
    user_doc_ref.update({"points": user_data["points"]})

    log_id = get_next_id("activity_logs")
    db.collection("activity_logs").document(str(log_id)).set({
        "id": log_id,
        "user_id": int(user_id),
        "action_type": "goal_completed",
        "description": f"إتمام الهدف كاملاً: {goal.get('title')}",
        "points_change": 150,
        "timestamp": datetime.now().isoformat()
    })

    unlocked_achievements = check_and_unlock_achievements(user_id)

    return jsonify({
        "status": "success",
        "goal_id": goal_id,
        "goal_title": goal.get("title"),
        "goal_progress": 100,
        "goal_status": "completed",
        "is_goal_completed": True,
        "user": user_data,
        "unlocked_achievements": unlocked_achievements
    })

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    task_doc = db.collection("tasks").document(str(task_id)).get()
    goal_id = None
    if task_doc.exists:
        goal_id = task_doc.to_dict().get("goal_id")
        db.collection("tasks").document(str(task_id)).delete()

    if goal_id:
        recalculate_goal_progress(goal_id, user_id)

    return jsonify({"status": "success", "message": "تم حذف المهمة"})

# 5. Smart Next Step Action
@app.route("/api/next-step", methods=["GET"])
def get_next_step():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    tasks_docs = db.collection("tasks").where("user_id", "==", int(user_id)).where("is_completed", "==", 0).stream()
    tasks = [t.to_dict() for t in tasks_docs]

    if tasks:
        def sort_priority(t):
            p = t.get("priority", "متوسط")
            p_val = 1 if p == "مرتفع" else (2 if p == "متوسط" else 3)
            today_val = 0 if t.get("is_today") == 1 else 1
            return (p_val, today_val, t.get("id", 0))

        tasks.sort(key=sort_priority)
        next_step = tasks[0]
        
        if next_step.get("goal_id"):
            g_doc = db.collection("goals").document(str(next_step["goal_id"])).get()
            if g_doc.exists:
                next_step["goal_title"] = g_doc.to_dict().get("title")
                next_step["goal_category"] = g_doc.to_dict().get("category")

        return jsonify({"task": next_step})
    return jsonify({"task": None, "message": "لا توجد مهام معلقة حالياً."})

# 6. AI Features
@app.route("/api/ai/generate-plan", methods=["POST"])
def ai_generate_plan():
    data = request.json or {}
    title = data.get("title", "تعلم بايثون")
    description = data.get("description", "")
    category = data.get("category", "تعليمي")
    priority = data.get("priority", "متوسط")
    duration_weeks = data.get("duration_weeks", 12)

    plan = generate_ai_goal_plan(title, description, category, priority, duration_weeks)
    return jsonify(plan)

@app.route("/api/ai/diagnose-stumble", methods=["POST"])
def ai_diagnose():
    data = request.json or {}
    reason = data.get("reason", "لم يكن لدي وقت")
    solution = diagnose_stumble_reason(reason)
    return jsonify({
        "reason": reason,
        "solution": solution
    })

@app.route("/api/ai/apply-solution", methods=["POST"])
def ai_apply_solution():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    data = request.json or {}
    reason = data.get("reason", "لم يكن لدي وقت")
    goal_id = data.get("goal_id")

    solution = diagnose_stumble_reason(reason)
    db = get_firestore_db()

    log_id = get_next_id("stumble_logs")
    db.collection("stumble_logs").document(str(log_id)).set({
        "id": log_id,
        "user_id": int(user_id),
        "goal_id": goal_id,
        "reason": reason,
        "ai_suggestion": solution["summary"],
        "solution_type": solution["solution_type"],
        "resolved": 1,
        "created_at": datetime.now().isoformat()
    })

    if goal_id:
        if solution["solution_type"] == "micro_steps":
            tasks = db.collection("tasks").where("user_id", "==", int(user_id)).where("goal_id", "==", int(goal_id)).where("is_completed", "==", 0).stream()
            for t in tasks:
                db.collection("tasks").document(t.id).update({"estimated_minutes": 20})
        elif solution["solution_type"] == "reschedule_deadline":
            g_doc = db.collection("goals").document(str(goal_id)).get()
            if g_doc.exists:
                cur_end = g_doc.to_dict().get("end_date")
                try:
                    new_end = (date.fromisoformat(cur_end) + timedelta(days=14)).isoformat()
                    db.collection("goals").document(str(goal_id)).update({"end_date": new_end})
                except Exception:
                    pass

    return jsonify({
        "status": "success",
        "message": "تم تطبيق الحل الذكي وإعادة تنظيم الخطة بنجاح!",
        "solution": solution
    })

# 7. Reports & Analytics
@app.route("/api/reports", methods=["GET"])
def get_reports():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    tasks_docs = db.collection("tasks").where("user_id", "==", int(user_id)).stream()
    tasks = [t.to_dict() for t in tasks_docs]

    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.get("is_completed") == 1])
    weekly_rate = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    days_names = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
    days_data = [{"day": d, "completed": completed_tasks if total_tasks > 0 else 0, "total": total_tasks if total_tasks > 0 else 0} for d in days_names]

    # Categories breakdown
    cat_counts = {}
    for t in tasks:
        if t.get("is_completed") == 1:
            c = t.get("category", "عام")
            cat_counts[c] = cat_counts.get(c, 0) + 1

    categories = [{"category": k, "count": v} for k, v in cat_counts.items()]

    return jsonify({
        "weekly_completion_rate": weekly_rate,
        "completed_tasks_count": completed_tasks,
        "total_tasks_count": total_tasks,
        "days": days_data,
        "categories": categories
    })

# 8. Achievements
@app.route("/api/achievements", methods=["GET"])
def get_achievements():
    user_id = get_current_user_id()
    if user_id is None:
        return jsonify({"error": "مطلوب تسجيل الدخول"}), 401
    db = get_firestore_db()

    user_doc = db.collection("users").document(str(user_id)).get()
    user = user_doc.to_dict() if user_doc.exists else {"points": 0, "streak": 0}

    create_user_achievements(user_id)

    ach_docs = db.collection("achievements").where("user_id", "==", int(user_id)).stream()
    achievements = [a.to_dict() for a in ach_docs]
    achievements.sort(key=lambda x: (x.get("is_unlocked", 0), -x.get("id", 0)), reverse=True)

    unlocked_count = len([a for a in achievements if a.get("is_unlocked") == 1])

    return jsonify({
        "points": user.get("points", 0),
        "streak": user.get("streak", 0),
        "unlocked_count": unlocked_count,
        "total_count": len(achievements),
        "achievements": achievements
    })

# --- Static Views Serving ---

@app.route("/")
def serve_index():
    return send_from_directory(PUBLIC_DIR, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    stitch_dirs = [
        "ai_lavender", "goalpath_lavender", "lavender_1", "lavender_2",
        "lavender_3", "lavender_4", "lavender_5", "lavender_6",
        "lavender_7", "lavender_8", "lavender_9", "lavender_10", "lavender_11"
    ]
    parts = path.strip("/").split("/")
    if parts[0] in stitch_dirs:
        dir_path = os.path.join(BASE_DIR, parts[0])
        if len(parts) > 1:
            return send_from_directory(dir_path, "/".join(parts[1:]))
        return send_from_directory(dir_path, "code.html")

    if os.path.exists(os.path.join(PUBLIC_DIR, path)):
        return send_from_directory(PUBLIC_DIR, path)
    return send_from_directory(PUBLIC_DIR, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"GoalPath Server (Firestore) running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
