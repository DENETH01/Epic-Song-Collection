const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const title = document.getElementById("song-title");
const artist = document.getElementById("artist");
const time = document.getElementById("time");
const cover = document.getElementById("cover");

let songs = [];
let current = 0;
let isPlaying = false;

// Load song list
fetch("songs.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
    loadSong(current);
    setupVisualizer();
  })
  .catch(err => console.error("Error loading songs:", err));

// Load a song by index
function loadSong(i) {
  const s = songs[i];
  audio.src = s.url;
  title.textContent = s.title;
  artist.textContent = `Artist: ${s.artist}`;
  cover.src = s.cover;
  // 🧩 Change favicon to match current song cover
function updateFavicon(url) {
  const favicon = document.getElementById("dynamic-favicon") || document.createElement("link");
  favicon.id = "dynamic-favicon";
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = url;
  document.head.appendChild(favicon);
}

// inside loadSong(i):
cover.src = s.cover;
updateFavicon(s.cover);
  audio.load();
}

// Play or pause audio
function togglePlay() {
  if (audio.paused) {
    audio.play()
      .then(() => {
        isPlaying = true;
        playBtn.textContent = "⏸"; // pause icon
      })
      .catch(err => console.warn("Playback blocked:", err));
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "▶️"; // play icon
  }
}

playBtn.addEventListener("click", togglePlay);

// Next / Previous
nextBtn.addEventListener("click", () => {
  current = (current + 1) % songs.length;
  loadSong(current);
  if (isPlaying) audio.play();
});

prevBtn.addEventListener("click", () => {
  current = (current - 1 + songs.length) % songs.length;
  loadSong(current);
  if (isPlaying) audio.play();
});

// Auto play next when current ends
audio.addEventListener("ended", () => {
  current = (current + 1) % songs.length;
  loadSong(current);
  audio.play();
});

// Update time display
audio.addEventListener("timeupdate", () => {
  const cur = formatTime(audio.currentTime);
  const dur = formatTime(audio.duration);
  time.textContent = `${cur} / ${dur}`;
});

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* 🎨 Visualizer */
function setupVisualizer() {
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const audioCtx = new AudioContext();
  const src = audioCtx.createMediaElementSource(audio);
  const analyser = audioCtx.createAnalyser();
  src.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 512;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "hsl(" + (Date.now()/50)%360 + ",100%,50%)");
    gradient.addColorStop(1, "black");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] * 1.2;
      const hue = (i / bufferLength) * 360;
      ctx.fillStyle = `hsl(${hue},100%,50%)`;
      ctx.beginPath();
      ctx.ellipse(x, height / 2, 8, barHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      x += barWidth + 1;
    }
  }

  draw();

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Resume AudioContext when user interacts (browser autoplay fix)
  document.body.addEventListener("click", () => {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  });
}
