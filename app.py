from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

# Secret key for session management
app.secret_key = "careerpath_ai_secret_key"

# Database location
DATABASE = os.path.join(app.root_path, "careerpath.db")


# =====================================================
# 1. CAREER SKILLS
# =====================================================

CAREER_SKILLS = {
    "frontend": ["HTML", "CSS", "JavaScript", "React"],

    "python": ["Python", "SQL", "Django", "Git"],

    "data": ["Python", "SQL", "Excel", "Power BI"],

    "cybersecurity": [
        "Networking",
        "Linux",
        "Python",
        "Cybersecurity Fundamentals",
        "SIEM"
    ],

    "machinelearning": [
        "Python",
        "Statistics",
        "Machine Learning",
        "SQL",
        "TensorFlow"
    ],

    "uiux": [
        "Figma",
        "Wireframing",
        "Prototyping",
        "User Research",
        "Visual Design"
    ],

    "fullstack": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Node.js",
        "Express",
        "SQL",
        "Git"
    ],

    "cloud": [
        "Linux",
        "Networking",
        "AWS",
        "Docker",
        "Git"
    ]
}


# =====================================================
# 2. DATABASE CONNECTION
# =====================================================

def get_db_connection():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


# =====================================================
# 3. INITIALIZE DATABASE
# =====================================================

def init_db():

    conn = get_db_connection()

    # Users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # Add selected_career to existing users table
    columns = [
        row["name"]
        for row in conn.execute(
            "PRAGMA table_info(users)"
        ).fetchall()
    ]

    if "selected_career" not in columns:

        conn.execute("""
            ALTER TABLE users
            ADD COLUMN selected_career TEXT
        """)

    # User progress table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            career TEXT NOT NULL,
            skill TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,

            UNIQUE(user_id, career, skill),

            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    conn.commit()

    conn.close()

    print("Database initialized successfully!")


# =====================================================
# 4. GET LOGGED-IN USER
# =====================================================

def get_logged_in_user():

    if "user" not in session:
        return None

    conn = get_db_connection()

    user = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (session["user"],)
    ).fetchone()

    conn.close()

    if not user:

        session.pop("user", None)

        return None

    return user


# =====================================================
# 5. HOME PAGE
# =====================================================

@app.route("/")
def home():

    if "user" in session:

        return redirect(url_for("profile"))

    return redirect(url_for("login"))


# =====================================================
# 6. USER REGISTRATION
# =====================================================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form.get("name", "").strip()

        email = request.form.get("email", "").strip().lower()

        password = request.form.get("password", "")

        if not name or not email or not password:

            flash("Please fill in all fields.")

            return redirect(url_for("register"))

        hashed_password = generate_password_hash(password)

        conn = get_db_connection()

        try:

            conn.execute(
                """
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
                """,
                (name, email, hashed_password)
            )

            conn.commit()

            flash("Registration successful! Please login.")

            return redirect(url_for("login"))

        except sqlite3.IntegrityError:

            flash("Email already registered. Please login.")

            return redirect(url_for("login"))

        finally:

            conn.close()

    return render_template("register.html")


# =====================================================
# 7. USER LOGIN
# =====================================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if "user" in session:

        return redirect(url_for("profile"))

    if request.method == "POST":

        email = request.form.get("email", "").strip().lower()

        password = request.form.get("password", "")

        conn = get_db_connection()

        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        conn.close()

        if user and check_password_hash(user["password"], password):

            session["user"] = email

            flash("Login successful!")

            return redirect(url_for("profile"))

        flash("Invalid email or password.")

    return render_template("login.html")


# =====================================================
# 8. USER DASHBOARD
# =====================================================

@app.route("/profile")
def profile():

    user = get_logged_in_user()

    if not user:

        flash("Please login to access your dashboard.")

        return redirect(url_for("login"))

    return render_template(
        "profile.html",
        user={
            "name": user["name"],
            "email": user["email"]
        }
    )


# =====================================================
# 9. LEARNING ROADMAP
# =====================================================

@app.route("/roadmap")
def roadmap():

    if not get_logged_in_user():

        flash("Please login first.")

        return redirect(url_for("login"))

    return render_template("roadmap.html")


# =====================================================
# 10. LEARNING RESOURCES
# =====================================================

@app.route("/resources")
def resources():

    if not get_logged_in_user():

        flash("Please login first.")

        return redirect(url_for("login"))

    return render_template("resources.html")


# =====================================================
# 11. SAVE SELECTED CAREER
# =====================================================

@app.route("/api/career", methods=["POST"])
def save_career():

    user = get_logged_in_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json(silent=True) or {}

    career = data.get("career")

    if career not in CAREER_SKILLS:

        return jsonify({
            "success": False,
            "message": "Invalid career selected."
        }), 400

    conn = get_db_connection()

    conn.execute(
        """
        UPDATE users
        SET selected_career = ?
        WHERE id = ?
        """,
        (career, user["id"])
    )

    conn.commit()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Career saved successfully."
    })


# =====================================================
# 12. SAVE SKILL PROGRESS
# =====================================================

@app.route("/api/progress", methods=["POST"])
def save_progress():

    user = get_logged_in_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json(silent=True) or {}

    career = data.get("career")

    skill = data.get("skill")

    completed = data.get("completed")

    if career not in CAREER_SKILLS:

        return jsonify({
            "success": False,
            "message": "Invalid career."
        }), 400

    if skill not in CAREER_SKILLS[career]:

        return jsonify({
            "success": False,
            "message": "Invalid skill."
        }), 400

    if not isinstance(completed, bool):

        return jsonify({
            "success": False,
            "message": "Invalid completion status."
        }), 400

    conn = get_db_connection()

    conn.execute(
        """
        INSERT INTO user_progress
        (user_id, career, skill, completed)

        VALUES (?, ?, ?, ?)

        ON CONFLICT(user_id, career, skill)

        DO UPDATE SET completed = excluded.completed
        """,
        (
            user["id"],
            career,
            skill,
            int(completed)
        )
    )

    conn.commit()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Skill progress saved successfully."
    })


# =====================================================
# 13. GET SKILL PROGRESS
# =====================================================

@app.route("/api/progress", methods=["GET"])
def get_progress():

    user = get_logged_in_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    conn = get_db_connection()

    rows = conn.execute(
        """
        SELECT career, skill, completed
        FROM user_progress
        WHERE user_id = ?
        """,
        (user["id"],)
    ).fetchall()

    conn.close()

    progress = {}

    for row in rows:

        career = row["career"]

        skill = row["skill"]

        completed = bool(row["completed"])

        if career not in progress:

            progress[career] = {}

        progress[career][skill] = completed

    return jsonify({
        "success": True,
        "selectedCareer": user["selected_career"],
        "progress": progress
    })


# =====================================================
# 14. USER LOGOUT
# =====================================================

@app.route("/logout")
def logout():

    session.pop("user", None)

    flash("You have logged out successfully.")

    return redirect(url_for("login"))


# =====================================================
# 15. RUN FLASK APPLICATION
# =====================================================
init_db()
if __name__ == "__main__":



    print("Starting CareerPath AI...")

    app.run(
        debug=True,
        use_reloader=False
    )