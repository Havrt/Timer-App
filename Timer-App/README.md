# Tempo

A focus timer that helps college students study in timed sessions.

CSI 3210 – Fall 2026 · Oakland University

## Team
| Member | Role |
|---|---|
| Jake Spencer | UX Lead |
| Sydney Lum | Front-end Developer |
| Ken Yu | GitHub Manager |
| Mihir Patel | Back-end / Analytics |
| Jonathan Lopez | Researcher / QA |

## Tech Stack
Python · Flask · Jinja2 · HTML · CSS · JavaScript · PostHog (Python SDK)

## Run Locally
```bash
git clone https://github.com/Havrt/Timer-App.git
cd Timer-App/app
pip install -r requirements.txt   # skip in the course container
cp config.example.py config.py   # then add your PostHog key
python app.py
```
Open http://127.0.0.1:5000 in your browser (http://127.0.0.1:5001 in the course Docker container).
Add `?demo=1` to the URL for a 1-minute preset during the live demo.

## Project Structure
```
app/
  app.py              # Flask server + PostHog
  config.example.py   # template for config.py (gitignored)
  templates/          # Jinja2 HTML
  static/             # CSS + JS
```
