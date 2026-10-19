// Tempo timer logic + PostHog event tracking (sent through Flask /track)

const display = document.getElementById("display");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const presetBtns = document.querySelectorAll(".preset");

let durationMin = window.TEMPO_DEFAULT;   // selected preset
let secondsLeft = durationMin * 60;
let intervalId = null;
let usedDefault = true;                   // did the user keep the default?

function track(event, properties = {}) {
  fetch("/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {}); // never break the timer if tracking fails
}

function render() {
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");
  display.textContent = `${m}:${s}`;
  document.title = intervalId ? `${m}:${s} – Tempo` : "Tempo – Focus Timer";
}

function setRunning(running) {
  startBtn.disabled = running;
  pauseBtn.disabled = !running;
  resetBtn.disabled = false;
  presetBtns.forEach(b => (b.disabled = running));
  display.classList.toggle("running", running);
}

function tick() {
  secondsLeft--;
  render();
  if (secondsLeft <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    setRunning(false);
    startBtn.textContent = "Start again";
    statusEl.textContent = "Session complete — nice work!";
    display.classList.add("done");
    track("timer_completed", { duration: durationMin });
    secondsLeft = durationMin * 60;
  }
}

presetBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    presetBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    durationMin = Number(btn.dataset.minutes);
    usedDefault = durationMin === window.TEMPO_DEFAULT;
    secondsLeft = durationMin * 60;
    display.classList.remove("done");
    statusEl.textContent = "Ready to focus";
    startBtn.textContent = "Start";
    render();
    track("preset_selected", { duration: durationMin });
  });
});

startBtn.addEventListener("click", () => {
  const resuming = secondsLeft < durationMin * 60;
  display.classList.remove("done");
  intervalId = setInterval(tick, 1000);
  setRunning(true);
  statusEl.textContent = "Focusing…";
  if (resuming) {
    track("timer_resumed", { seconds_left: secondsLeft });
  } else {
    track("timer_started", { duration: durationMin, was_default: usedDefault });
  }
});

pauseBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  intervalId = null;
  setRunning(false);
  startBtn.textContent = "Resume";
  statusEl.textContent = "Paused";
  track("timer_paused", { seconds_left: secondsLeft });
});

resetBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  intervalId = null;
  track("timer_reset", { seconds_left: secondsLeft });
  secondsLeft = durationMin * 60;
  setRunning(false);
  resetBtn.disabled = true;
  startBtn.textContent = "Start";
  statusEl.textContent = "Ready to focus";
  render();
});

render();
