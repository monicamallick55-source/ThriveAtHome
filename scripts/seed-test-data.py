#!/usr/bin/env python3
import json, urllib.request, urllib.error

SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c"
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=representation"}

def req(method, path, body=None, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{path}{params}"
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            txt = resp.read().decode(); return resp.status, json.loads(txt) if txt else []
    except urllib.error.HTTPError as e: return e.code, e.read().decode()

def upsert(table, rows):
    return req("POST", table, rows)

def patch_all(table, where_params, body):
    h = dict(HEADERS); h["Prefer"] = "return=representation"
    url = f"{SUPABASE_URL}/rest/v1/{table}{where_params}"
    data = json.dumps(body).encode()
    r = urllib.request.Request(url, data=data, headers=h, method="PATCH")
    try:
        with urllib.request.urlopen(r) as resp:
            txt = resp.read().decode(); return resp.status, json.loads(txt) if txt else []
    except urllib.error.HTTPError as e: return e.code, e.read().decode()

print("=== SEEDING TEST DATA ===\n")

# 1. navigator_tasks: set completed=false (route checks completed=false for status=open)
print("[1] navigator_tasks → completed=false")
s, d = req("GET", "navigator_tasks", params="?limit=5")
print(f"  Existing rows: {s}, count={len(d) if isinstance(d,list) else 'err'}")
s1, _ = patch_all("navigator_tasks", "?completed=is.null", {"completed": False, "task_type": "wellness_check", "priority": "medium"})
s2, _ = patch_all("navigator_tasks", "?completed=eq.true", {"completed": False})
print(f"  Patch null: {s1}, Patch true: {s2}")
# Insert fresh seeds if still empty
s, d = req("GET", "navigator_tasks", params="?completed=eq.false&limit=1")
if not isinstance(d, list) or len(d) == 0:
    s3, r3 = upsert("navigator_tasks", [
        {"id": "nav-task-seed-001", "task_type": "wellness_check", "description": "Follow up on weekly check-in", "priority": "high", "completed": False},
        {"id": "nav-task-seed-002", "task_type": "service_referral", "description": "Connect member with meal delivery", "priority": "medium", "completed": False},
    ])
    print(f"  Inserted seeds: {s3}")

# 2. encore_career_opportunities: status=open
print("\n[2] encore_career_opportunities → status=open")
s, d = req("GET", "encore_career_opportunities", params="?status=eq.open&limit=1")
print(f"  Open listings: {s}, count={len(d) if isinstance(d,list) else d}")
if not isinstance(d, list) or len(d) == 0:
    s2, r2 = upsert("encore_career_opportunities", [
        {"id": "eco-seed-001", "title": "Part-Time Community Outreach Coordinator", "employer": "CommunityFirst", "type": "part_time", "description": "Coordinate outreach for seniors.", "location": "San Francisco, CA", "remote_ok": True, "hours_per_week": 20, "salary_range": "$20-25/hr", "status": "open"},
        {"id": "eco-seed-002", "title": "Senior Technology Mentor", "employer": "TechBridge", "type": "volunteer", "description": "Help seniors with technology.", "location": "Remote", "remote_ok": True, "hours_per_week": 10, "salary_range": "Volunteer", "status": "open"},
    ])
    print(f"  Inserted: {s2}, {r2 if isinstance(r2,str) else 'ok'}")

# 3. corporate_volunteer_programs: status=active
print("\n[3] corporate_volunteer_programs → status=active")
s, d = req("GET", "corporate_volunteer_programs", params="?status=eq.active&limit=1")
print(f"  Active programs: {s}, count={len(d) if isinstance(d,list) else d}")
if not isinstance(d, list) or len(d) == 0:
    s2, r2 = upsert("corporate_volunteer_programs", [
        {"id": "cvp-seed-001", "program_name": "Senior Tech Help Initiative", "status": "active", "tier": "gold"},
        {"id": "cvp-seed-002", "program_name": "Meal Delivery Partners", "status": "active", "tier": "silver"},
    ])
    print(f"  Inserted: {s2}, {r2 if isinstance(r2,str) else 'ok'}")

# 4. university_affiliates: status=pending
print("\n[4] university_affiliates → status=pending")
for tname in ["university_affiliates", "affiliates"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        s2, d2 = req("GET", tname, params="?status=eq.pending&limit=1")
        if not isinstance(d2, list) or len(d2) == 0:
            s3, r3 = upsert(tname, [
                {"id": "ua-seed-001", "name": "Stanford University", "status": "pending"},
                {"id": "ua-seed-002", "name": "UC Berkeley", "status": "pending"},
            ])
            print(f"  Inserted: {s3}")
        else:
            print(f"  Has pending rows ✓")
        break

# 5. org_config_steps / implementation checklist
print("\n[5] implementation checklist tables")
for tname in ["org_config_steps", "implementation_steps", "onboarding_steps"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        if isinstance(d, list) and len(d) == 0:
            s2, r2 = upsert(tname, [
                {"id": "step-seed-001", "title": "Set up member portal", "order": 1, "status": "pending"},
                {"id": "step-seed-002", "title": "Configure care team", "order": 2, "status": "pending"},
                {"id": "step-seed-003", "title": "Launch communications", "order": 3, "status": "pending"},
            ])
            print(f"  Inserted: {s2}")
        else:
            print(f"  Has rows ✓")
        break

# 6. vso_volunteer_hours: status=pending_approval
print("\n[6] vso_volunteer_hours → pending_approval")
for tname in ["vso_volunteer_hours", "volunteer_hours"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        s2, d2 = req("GET", tname, params="?status=eq.pending_approval&limit=1")
        if not isinstance(d2, list) or len(d2) == 0:
            s3, r3 = upsert(tname, [
                {"id": "vso-hr-seed-001", "hours": 2.5, "status": "pending_approval", "description": "Community outreach"},
                {"id": "vso-hr-seed-002", "hours": 3.0, "status": "pending_approval", "description": "Senior tech help"},
            ])
            print(f"  Inserted: {s3}, {r3 if isinstance(r3,str) else 'ok'}")
        else:
            print(f"  Has pending rows ✓")
        break

# 7. campaigns: active
print("\n[7] campaigns → active")
s, d = req("GET", "campaigns", params="?status=eq.active&limit=1")
print(f"  Active campaigns: {s}, count={len(d) if isinstance(d,list) else d}")
if isinstance(d, list) and len(d) == 0:
    s2, r2 = upsert("campaigns", [{"id": "camp-seed-001", "name": "Holiday Companion Fund", "status": "active", "goal_amount": 10000, "current_amount": 3500}])
    print(f"  Inserted: {s2}")

# 8. life_transitions / transitions
print("\n[8] life_transitions / transitions")
for tname in ["life_transitions", "transitions"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}, count={len(d) if isinstance(d,list) else '?'}")
    if s == 200: break

# 9. crisis open
print("\n[9] crisis → open")
for tname in ["crisis", "crises", "crisis_events"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        s2, d2 = req("GET", tname, params="?status=eq.open&limit=1")
        print(f"  Open: {s2}, count={len(d2) if isinstance(d2,list) else d2}")
        break

# 10. tracked_items pending
print("\n[10] tracked_items → pending")
for tname in ["tracked_items", "tracking_items"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        s2, d2 = req("GET", tname, params="?status=eq.pending&limit=1")
        print(f"  Pending: {s2}, count={len(d2) if isinstance(d2,list) else d2}")
        break

# 11. trusted_advisors grief
print("\n[11] trusted_advisors → grief category")
for tname in ["trusted_advisors", "advisors"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200:
        s2, d2 = req("GET", tname, params="?category=eq.grief&limit=1")
        print(f"  Grief: {s2}, count={len(d2) if isinstance(d2,list) else d2}")
        break

# 12. volunteer rides
print("\n[12] volunteer rides")
for tname in ["volunteer_rides", "ride_requests", "rides"]:
    s, d = req("GET", tname, params="?limit=1")
    print(f"  {tname}: {s}")
    if s == 200: print(f"  Found ✓"); break

print("\n=== DONE ===")
