import json
from datetime import datetime, date, timedelta

def generate_ai_goal_plan(title, description="", category="تعليمي", priority="متوسط", duration_weeks=12):
    """
    Intelligently generates structured phases and tasks based on the goal title and category.
    """
    title_lower = title.lower()
    today = date.today()
    
    # 1. Custom matching for common domains or smart default generation
    if "python" in title_lower or "بايثون" in title_lower:
        plan_duration = 12
        phases = [
            {
                "phase_number": 1,
                "title": "أساسيات Python",
                "description": "المتغيرات، أنواع البيانات، والعمليات الحسابية الأساسية وبناء الجمل البرمجية الأولى.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "تثبيت بيئة Python وVS Code", "description": "تجهيز بيئة التطوير والامتدادات الأساسية", "estimated_minutes": 30, "priority": "متوسط"},
                    {"title": "دراسة المتغيرات والأنواع العددية والنصية", "description": "فهم int, float, str والعمليات الأساسية", "estimated_minutes": 45, "priority": "مرتفع"},
                    {"title": "القوائم والمجموعات والقواميس (Lists, Dictionaries)", "description": "هياكل البيانات والتعامل مع العناصر", "estimated_minutes": 50, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 2,
                "title": "الشروط والحلقات",
                "description": "التحكم في تدفق البرنامج باستخدام If وElse وحلقات For وWhile.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "تعلم الشروط If وElse", "description": "تطبيق الشروط المنطقية والمقارنات في بايثون", "estimated_minutes": 45, "priority": "مرتفع"},
                    {"title": "تمارين حلقات التكرار For وWhile", "description": "حل 5 تحديات برمجية على التكرار", "estimated_minutes": 60, "priority": "متوسط"},
                    {"title": "معالجة الأخطاء والاستثناءات (Try/Except)", "description": "حماية البرنامج من التوقف المفاجئ", "estimated_minutes": 40, "priority": "منخفض"}
                ]
            },
            {
                "phase_number": 3,
                "title": "الدوال والبرمجة الكائنية",
                "description": "تنظيم الكود وإعادة استخدامه عبر الدوال والمكتبات ومفاهيم OOP.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "كتابة الدوال وتمرير المعاملات (Functions)", "description": "بناء دوال معيارية قابلة لإعادة الاستخدام", "estimated_minutes": 60, "priority": "مرتفع"},
                    {"title": "استيراد الوحدات والحزم القياسية", "description": "التعامل مع math, os, json, datetime", "estimated_minutes": 40, "priority": "متوسط"},
                    {"title": "مقدمة في الكائنات والفئات (Classes & Objects)", "description": "فهم مبادئ OOP والـ Constructors", "estimated_minutes": 60, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 4,
                "title": "المشروع النهائي والتطبيقات",
                "description": "بناء تطبيق عملي متكامل لتحليل البيانات أو أتمتة المهام وحل مشكلات واقعية.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "التخطيط للمشروع النهائي وجمع البيانات", "description": "تحديد أهداف المشروع وهيكلية الملفات", "estimated_minutes": 60, "priority": "مرتفع"},
                    {"title": "بناء تطبيق تحليل البيانات والتقارير", "description": "قراءة ملفات ومعالجة البيانات وعرض النتائج", "estimated_minutes": 120, "priority": "مرتفع"},
                    {"title": "مراجعة الكود ونشر المشروع على GitHub", "description": "إضافة التوثيق README ومشاركة الإنجاز", "estimated_minutes": 45, "priority": "متوسط"}
                ]
            }
        ]
    elif "قراءة" in title_lower or "كتاب" in title_lower or "read" in title_lower or "book" in title_lower:
        plan_duration = 8
        phases = [
            {
                "phase_number": 1,
                "title": "اختيار القائمة وتحديد عادات القراءة",
                "description": "تحديد قائمة الكتب وجدولة 20 دقيقة يومياً للقراءة الصباحية أو المسائية.",
                "duration_weeks": 2,
                "tasks": [
                    {"title": "تحديد الكتب الأربعة وجدولتها", "description": "اختيار الكتب وتجهيز النسخ الورقية أو الرقمية", "estimated_minutes": 30, "priority": "متوسط"},
                    {"title": "بدء قراءة الكتاب الأول (20 صفحة يومياً)", "description": "قراءة مركزة بدون مشتتات", "estimated_minutes": 25, "priority": "مرتفع"}
                ]
            },
            {
                "phase_number": 2,
                "title": "قراءة وتلخيص الكتاب الأول والثاني",
                "description": "استخراج أهم المفاهيم وكتابة ملخص تنفيذي لكل كتاب.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "إنهاء الكتاب الأول وتدوين ملخص لأهم 5 أفكار", "description": "كتابة الأفكار الجوهرية وتطبيقاتها", "estimated_minutes": 45, "priority": "مرتفع"},
                    {"title": "البدء في قراءة الكتاب الثاني", "description": "متابعة الوتيرة اليومية للقراءة", "estimated_minutes": 30, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 3,
                "title": "قراءة الكتاب الثالث والرابع",
                "description": "مواصلة الخطة وتطبيق المفاهيم المستفادة في الحياة اليومية والعملية.",
                "duration_weeks": 3,
                "tasks": [
                    {"title": "قراءة فصول الكتاب الثالث", "description": "التركيز على الأدوات العملية المطروحة", "estimated_minutes": 30, "priority": "متوسط"},
                    {"title": "إتمام الكتاب الرابع وكتابة مراجعة شاملة", "description": "مشاركة التقييم وقائمة الدروس المستفادة", "estimated_minutes": 50, "priority": "مرتفع"}
                ]
            }
        ]
    elif "رياضة" in title_lower or "لياقة" in title_lower or "وزن" in title_lower or "gym" in title_lower or "fitness" in title_lower:
        plan_duration = 6
        phases = [
            {
                "phase_number": 1,
                "title": "بناء العادة والتهيئة البدنية",
                "description": "التركيز على الاستمرارية بتمارين خفيفة وتناول كميات كافية من الماء.",
                "duration_weeks": 2,
                "tasks": [
                    {"title": "جلسة تمارين إحماء وتمدد 20 دقيقة", "description": "تمارين مرونة ولياقة أساسية", "estimated_minutes": 20, "priority": "متوسط"},
                    {"title": "مشي سريع أو جري خفيف 30 دقيقة", "description": "رفع اللياقة القلبية وتحفيز الطاقة", "estimated_minutes": 30, "priority": "مرتفع"}
                ]
            },
            {
                "phase_number": 2,
                "title": "زيادة الشدة وبناء القوة",
                "description": "إضافة تمارين المقاومة والكارديو المنتظم بمعدل 4 مرات أسبوعياً.",
                "duration_weeks": 2,
                "tasks": [
                    {"title": "تمارين المقاومة للجزء العلوي والسفلي", "description": "تمارين وزن الجسم أو الأوزان الحرة", "estimated_minutes": 45, "priority": "مرتفع"},
                    {"title": "تتبع السعرات والوجبات الصحية", "description": "الاهتمام بالبروتين وتقليل السكريات", "estimated_minutes": 15, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 3,
                "title": "تثبيت النمط الصحي وقياس النتائج",
                "description": "مقارنة القياسات وتعديل البرنامج للحفاظ على أعلى مستويات النشاط.",
                "duration_weeks": 2,
                "tasks": [
                    {"title": "جلسة تمرين مكثفة HIIT", "description": "حرق الدهون ورفع القدرة البدنية", "estimated_minutes": 35, "priority": "مرتفع"},
                    {"title": "قياس التقدم وتحديد أهداف المرحلة القادمة", "description": "تسجيل الوزن والقياسات والاحتفال بالتقدم", "estimated_minutes": 20, "priority": "متوسط"}
                ]
            }
        ]
    else:
        # Smart General Generator
        plan_duration = int(duration_weeks) if duration_weeks else 8
        phases = [
            {
                "phase_number": 1,
                "title": f"التأسيس والتمهيد لـ {title}",
                "description": "فهم المتطلبات، تجهيز الموارد اللازمة، ووضع خطة البدء الأولية.",
                "duration_weeks": max(1, plan_duration // 4),
                "tasks": [
                    {"title": f"جمع المصادر والأدوات اللازمة لـ {title}", "description": "تحديد المراجع والكتب أو التطبيقات المساعدة", "estimated_minutes": 40, "priority": "مرتفع"},
                    {"title": "تخصيص وقت يومي ثابت للإنجاز", "description": "تثبيت موعد في التقويم بدون مقاطعات", "estimated_minutes": 20, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 2,
                "title": "التطبيق الفعلي وبناء العادة",
                "description": "التنفيذ التدريجي للمهام الأساسية والتركيز على الممارسة المستمرة.",
                "duration_weeks": max(1, plan_duration // 4),
                "tasks": [
                    {"title": "إنجاز الجزء الأول من الممارسة العملية", "description": "التركيز على التطبيق العملي وليس النظري فقط", "estimated_minutes": 50, "priority": "مرتفع"},
                    {"title": "تقييم التحديات الأولية ومعالجتها", "description": "استعراض ما تم إنجازه وتعديل الخطة عند الحاجة", "estimated_minutes": 30, "priority": "متوسط"}
                ]
            },
            {
                "phase_number": 3,
                "title": "التطوير وتخطي العقبات",
                "description": "رفع مستوى الصعوبة والإتقان ومعالجة نقاط الضعف.",
                "duration_weeks": max(1, plan_duration // 4),
                "tasks": [
                    {"title": "تطبيق متقدم ومشاريع مصغرة", "description": "ربط المفاهيم السابقة في نشاط واحد متكامل", "estimated_minutes": 60, "priority": "مرتفع"},
                    {"title": "طلب تغذية راجعة أو استشارة خبير", "description": "مشاركة النتائج للحصول على نصائح تحسين", "estimated_minutes": 35, "priority": "منخفض"}
                ]
            },
            {
                "phase_number": 4,
                "title": "الإتمام والتقييم النهائي",
                "description": "إنهاء المخرجات النهائية، الاحتفال بالإنجاز، ووضع خطة الاستدامة.",
                "duration_weeks": max(1, plan_duration // 4),
                "tasks": [
                    {"title": "إنهاء المخرجات النهائية للهدف بالكامل", "description": "اللمسات الأخيرة والتحقق من اكتمال المعايير", "estimated_minutes": 90, "priority": "مرتفع"},
                    {"title": "توثيق الرحلة والاحتفال بالنجاح", "description": "تسجيل النتائج ومكافأة الذات على الإنجاز", "estimated_minutes": 30, "priority": "متوسط"}
                ]
            }
        ]

    return {
        "title": title,
        "category": category,
        "priority": priority,
        "suggested_duration_weeks": plan_duration,
        "badge": "خطة مخصصة بالذكاء الاصطناعي",
        "phases_count": len(phases),
        "total_tasks": sum(len(p["tasks"]) for p in phases),
        "phases": phases
    }

def diagnose_stumble_reason(reason):
    """
    Returns tailored AI recovery strategies based on the selected bottleneck reason.
    """
    strategies = {
        "لم يكن لدي وقت": {
            "title": "استراتيجية تقليص الوقت إلى خطوات صغيرة (Micro-Habits)",
            "summary": "عندما يكون الوقت ضيقاً، السر يكمن في تقليص الجلسات إلى 15 دقيقة فقط بدلاً من جلسات طويلة مرهقة.",
            "action_text": "تقسيم المهام الحالية إلى خطوات مدتها 15 دقيقة وإعادة جدولة المواعيد",
            "solution_type": "micro_steps",
            "tips": [
                "خصص أول 15 دقيقة بعد الاستيقاظ مباشرة لإنجاز جزء صغير.",
                "استغل أوقات الانتظار أو التنقل للقراءة أو المراجعة السريعة.",
                "لا تنتظر وقتاً مثالياً، فالإنجاز الصغير اليومي يصنع المعجزات."
            ]
        },
        "المهمة صعبة": {
            "title": "استراتيجية تفكيك التعقيد والبدء بالأبسط",
            "summary": "الشعور بصعوبة المهمة يعني عادةً أنها بحاجة للتفكيك إلى أجزاء أصغر وأكثر وضوحاً.",
            "action_text": "إعادة صياغة المهمة إلى 3 أجزاء مبسطة مع إضافة شروحات مساعدة",
            "solution_type": "simplify_task",
            "tips": [
                "ركز على فهم خطوة واحدة فقط اليوم ولا تفكر في باقي المشروع.",
                "استعن بأمثلة تطبيقية مبسطة أو فيديوهات شرح قصيرة.",
                "اطلب المساعدة من المجتمع أو المساعد الذكي لتوضيح المفاهيم المبهمة."
            ]
        },
        "فقدت الحماس": {
            "title": "استراتيجية إعادة إشعال الدافع والمكافآت السريعة",
            "summary": "فقدان الشغف أمر طبيعي يمر به الجميع. الحل هو تذكير نفسك بالهدف الأكبر وتقديم مكافأة فورية بعد كل خطوة.",
            "action_text": "تفعيل نظام المكافآت المزدوجة وتقليل المهام بنسبة 50% لهذا الأسبوع",
            "solution_type": "boost_motivation",
            "tips": [
                "تذكر لماذا بدأت هذا الهدف وكيف ستشعر عند تحقيقه.",
                "كافئ نفسك فور الانتهاء من أي مهمة بسيطة (مشروب مفضل، استراحة ممتعة).",
                "أنجز المهمة بصحبة صديق أو شارك تقدمك في مجتمع المحفزين."
            ]
        },
        "لدي أولويات أخرى": {
            "title": "استراتيجية تجميد مؤقت وتعديل الجدول الزمني",
            "summary": "ظهور أولويات طارئة لا يعني الفشل، بل يتطلب مرونة في تمديد المواعيد دون تأنيب الضمير.",
            "action_text": "تمديد الموعد النهائي للهدف بمقدار أسبوعين وتخفيف المهام اليومية",
            "solution_type": "reschedule_deadline",
            "tips": [
                "أعد ترتيب أولوياتك بوضوح وركز على الأهم أولاً.",
                "قم بتمديد تاريخ الانتهاء لتقليل الضغط النفسي.",
                "احتفظ بحد أدنى من النشاط (5 دقائق يومياً) للحفاظ على السلسلة (Streak)."
            ]
        }
    }

    # Default fallback if custom key used
    matched = strategies.get(reason, strategies["لم يكن لدي وقت"])
    return matched
