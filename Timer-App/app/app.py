"""
Tempo - focus timer for college students
CSI 3210, Fall 2026

PostHog wiring mirrors the course reference app (app/):
  - SDK initialized once from config.py
  - Flask routes call ph.capture() server-side
  - Browser timer events are sent to /track, which calls ph.capture()
"""
import uuid
from flask import Flask, render_template, request, session, jsonify
from posthog import Posthog

try:
    import config
except ImportError:
    config = None
    print("WARNING: app/config.py not found. Copy config.example.py to config.py "
          "and add your PostHog key. Running without tracking.")

app = Flask(__name__)
app.secret_key = "tempo-csi3210-dev"  # only signs the session cookie

# ---- PostHog setup -------------------------------------------------------
ph = None
if config and not config.POSTHOG_API_KEY.startswith("phc_xxx"):
    ph = Posthog(project_api_key=config.POSTHOG_API_KEY, host=config.POSTHOG_HOST)

# Events the browser is allowed to send through /track
ALLOWED_EVENTS = {
    "preset_selected",
    "timer_started",
    "timer_paused",
    "timer_resumed",
    "timer_completed",
    "timer_reset",
}

PRESETS = [5, 15, 25, 50]   # minutes - kept to 4 on purpose (Hick's Law)
DEFAULT_PRESET = 25         # preselected (Default effect)


def get_user_id():
    """Anonymous UUID per browser session, like the reference app."""
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())
        identify(session["user_id"])
    return session["user_id"]


def identify(user_id):
    """Link the anonymous ID to the team member running the app."""
    if ph and config:
        ph.capture(
            event="$identify",
            distinct_id=user_id,
            properties={"$set": {"name": config.STUDENT_NAME,
                                 "email": config.STUDENT_EMAIL}},
        )


def track(event, properties=None):
    """Send one event to PostHog (no-op if tracking is off)."""
    user_id = get_user_id()
    if ph:
        ph.capture(event=event, distinct_id=user_id, properties=properties or {})
    print(f"[posthog] {event} {properties or {}}")


# ---- Routes -------------------------------------------------------------
@app.route("/")
def index():
    track("page_viewed", {"page": "home"})
    demo = request.args.get("demo") == "1"   # ?demo=1 adds a 1-minute preset
    presets = ([1] if demo else []) + PRESETS
    return render_template("index.html", presets=presets,
                           default=DEFAULT_PRESET, tracking=ph is not None)


@app.route("/track", methods=["POST"])
def track_event():
    data = request.get_json(silent=True) or {}
    event = data.get("event")
    if event not in ALLOWED_EVENTS:
        return jsonify(ok=False, error="unknown event"), 400
    track(event, data.get("properties", {}))
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
