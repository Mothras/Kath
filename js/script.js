/* ==================================================================
   For Kath - experience logic
   Music starts on "Open"; the experience then advances on tap.
   Scrolling is disabled everywhere, and a freshly shown screen only
   accepts a tap after it has finished appearing (READY_DELAY), so an
   early tap cannot skip it by accident.
   ================================================================== */
(function () {
  'use strict';

  /* ---------- Timing (tweak to taste) ---------- */
  var READY_DELAY = 2000;   // ms a new screen rests before a tap can advance it
  var LETTER_DELAY = 900;   // ms between revealing letter lines by tap
  var COUNT_STEP = 1500;    // ms per countdown number
  var SCREEN_FADE = 800;    // ms opening / countdown fade

  /* ---------- Elements ---------- */
  var audio = document.getElementById('bg-music');
  var openBtn = document.getElementById('open-btn');
  var opening = document.getElementById('opening');
  var countdown = document.getElementById('countdown');
  var musicControl = document.getElementById('music-control');
  var musicToggle = document.getElementById('music-toggle');
  var muteToggle = document.getElementById('mute-toggle');
  var countNum = document.getElementById('count-num');
  var countText = document.getElementById('count-text');
  var tapHint = document.getElementById('tap-hint');
  var transitionScreen = document.getElementById('transition');
  var letterScreen = document.getElementById('letter');
  var closingScreen = document.getElementById('closing');

  var allScreens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var photoSections = Array.prototype.slice.call(document.querySelectorAll('.photo-section'));
  var letterBlocks = Array.prototype.slice.call(document.querySelectorAll('.letter-block'));

  /* The ordered steps the visitor taps through. The opening screen and the
     countdown run on their own before the first step appears. */
  var flow = photoSections.concat([transitionScreen, letterScreen, closingScreen]);

  var flowIndex = -1;
  var tapReady = false;
  var tapTimer = null;
  var finished = false;
  var letterIndex = 0;

  /* ---------- Countdown data ---------- */
  var countdownData = [
    { num: '5', text: 'For all the little moments...' },
    { num: '4', text: 'For all the laughter...' },
    { num: '3', text: 'For all the memories...' },
    { num: '2', text: 'For someone special...' },
    { num: '1', text: 'Kath \u2661' }
  ];
  var countIndex = 0;

  /* ==================================================================
     Screen flow - tap anywhere to move on
     ================================================================== */

  function hideAllScreens() {
    allScreens.forEach(function (s) { s.hidden = true; });
  }

  function setTapReady(state) {
    tapReady = state;
    if (tapHint) tapHint.hidden = !state;
  }

  function scheduleTapReady() {
    clearTimeout(tapTimer);
    setTapReady(false);
    tapTimer = setTimeout(function () {
      setTapReady(true);
    }, READY_DELAY);
  }

  function showScreen(screen) {
    screen.hidden = false;
    // restart the reveal animation from the very beginning
    screen.classList.remove('visible');
    void screen.offsetWidth;
    screen.classList.add('visible');
  }

  function goTo(index) {
    if (index < 0 || index >= flow.length) return;
    flowIndex = index;
    var screen = flow[index];

    hideAllScreens();
    showScreen(screen);

    if (screen === letterScreen) initLetter();

    scheduleTapReady();
  }

  function advance() {
    if (flowIndex >= flow.length - 1) {
      // last screen reached - nothing further to move on to
      finished = true;
      clearTimeout(tapTimer);
      setTapReady(false);
      return;
    }
    goTo(flowIndex + 1);
  }

  function onTap() {
    if (finished || !tapReady) return;

    // Inside the letter, each tap reveals the next line instead of leaving.
    if (flow[flowIndex] === letterScreen && letterIndex < letterBlocks.length) {
      var block = letterBlocks[letterIndex];
      revealLetterBlock();
      scrollLetterTo(block);
      clearTimeout(tapTimer);
      setTapReady(false);
      tapTimer = setTimeout(function () { setTapReady(true); }, LETTER_DELAY);
      return;
    }

    advance();
  }

  document.addEventListener('click', function (event) {
    // the music controls must not count as "tap anywhere"
    if (event.target && event.target.closest && event.target.closest('#music-control')) return;
    onTap();
  });

  /* ---------- Letter: reveal one line at a time (no scrolling) ---------- */
  function revealLetterBlock() {
    if (letterIndex >= letterBlocks.length) return;
    letterBlocks[letterIndex].classList.add('visible');
    letterIndex++;
  }

  function scrollLetterTo(block) {
    if (!block) return;
    var top = block.offsetTop - 80;
    if (top < 0) top = 0;
    if (letterScreen.scrollTo) {
      letterScreen.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      letterScreen.scrollTop = top;
    }
  }

  function initLetter() {
    letterIndex = 0;
    letterScreen.scrollTop = 0;
    letterBlocks.forEach(function (b) { b.classList.remove('visible'); });

    // Reveal the first line, then keep going while the next line still fits
    // on the first screen, so the screen never looks empty.
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var cutoff = vh - 40;
    while (letterIndex < letterBlocks.length) {
      revealLetterBlock();
      if (letterIndex >= letterBlocks.length) break;
      var next = letterBlocks[letterIndex];
      if (next.offsetTop + next.offsetHeight > cutoff) break;
    }
  }

  /* ---------- Open: start music + begin experience ---------- */
  openBtn.addEventListener('click', function () {
    openBtn.disabled = true;

    // Start the music inside the user gesture (autoplay-safe).
    var playPromise = audio.play();
    if (playPromise && playPromise.catch) playPromise.catch(function () {});

    // Show the subtle music control.
    musicControl.hidden = false;

    // Fade the opening away, then start the countdown.
    opening.classList.add('fade-out');
    setTimeout(function () {
      opening.hidden = true;
      opening.classList.remove('fade-out');
      countdown.hidden = false;
      runCountdown();
    }, SCREEN_FADE);
  });

  /* ---------- Music control ---------- */
  function syncMusicUI() {
    if (audio.paused) {
      musicToggle.textContent = '\u25B6';
      musicToggle.setAttribute('aria-label', 'Play music');
      musicToggle.title = 'Play';
    } else {
      musicToggle.textContent = '\u275A\u275A';
      musicToggle.setAttribute('aria-label', 'Pause music');
      musicToggle.title = 'Pause';
    }
  }

  musicToggle.addEventListener('click', function () {
    if (audio.paused) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      audio.pause();
    }
    syncMusicUI();
  });

  muteToggle.addEventListener('click', function () {
    audio.muted = !audio.muted;
    muteToggle.classList.toggle('muted', audio.muted);
    muteToggle.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
    muteToggle.title = audio.muted ? 'Unmute' : 'Mute';
  });

  audio.addEventListener('play', syncMusicUI);
  audio.addEventListener('pause', syncMusicUI);

  /* ---------- Countdown ---------- */
  function restartAnim(el) {
    el.classList.remove('anim');
    void el.offsetWidth; // restart CSS animation
    el.classList.add('anim');
  }

  function runCountdown() {
    function step() {
      if (countIndex >= countdownData.length) {
        countdown.classList.add('fade-out');
        setTimeout(function () {
          countdown.hidden = true;
          countdown.classList.remove('fade-out');
          countIndex = 0;
          goTo(0); // first photo
        }, 950);
        return;
      }
      var d = countdownData[countIndex];
      countNum.textContent = d.num;
      countText.textContent = d.text;
      restartAnim(countNum);
      restartAnim(countText);
      countIndex++;
      setTimeout(step, COUNT_STEP);
    }
    step();
  }

  /* ---------- Decorative particles ---------- */
  function makeParticles(containerId, count, options) {
    var container = document.getElementById(containerId);
    if (!container) return;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = options.cls;
      var size = options.size[0] + Math.random() * (options.size[1] - options.size[0]);
      p.style.width = size.toFixed(1) + 'px';
      p.style.height = size.toFixed(1) + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = options.colors[Math.floor(Math.random() * options.colors.length)];
      p.style.animationDuration = (options.duration[0] + Math.random() * (options.duration[1] - options.duration[0])) + 's';
      p.style.animationDelay = Math.random() * 12 + 's';
      p.style.setProperty('--drift', (Math.random() * 40 - 20).toFixed(0) + 'px');
      if (options.blur) p.style.filter = 'blur(' + options.blur + 'px)';
      container.appendChild(p);
    }
  }

  makeParticles('particles', 22, {
    cls: 'particle',
    size: [4, 9],
    colors: [
      'rgba(246, 201, 211, 0.8)',
      'rgba(255, 255, 255, 0.85)',
      'rgba(247, 224, 205, 0.8)',
      'rgba(231, 226, 241, 0.8)'
    ],
    duration: [14, 26],
    blur: 1
  });

  function makeHearts() {
    var container = document.querySelector('.hearts');
    if (!container) return;
    for (var i = 0; i < 8; i++) {
      var h = document.createElement('span');
      h.className = 'heart-bit';
      h.textContent = '\u2661';
      h.style.left = Math.random() * 100 + '%';
      h.style.fontSize = (0.8 + Math.random() * 1.1).toFixed(2) + 'rem';
      h.style.animationDuration = (12 + Math.random() * 10).toFixed(1) + 's';
      h.style.animationDelay = Math.random() * 12 + 's';
      h.style.setProperty('--drift', (Math.random() * 50 - 25).toFixed(0) + 'px');
      container.appendChild(h);
    }
  }

  makeHearts();

  /* ---------- Missing-photo fallback (preserves position) ---------- */
  document.querySelectorAll('.photo-frame img').forEach(function (img) {
    img.addEventListener('error', function () {
      var frame = img.closest('.photo-frame');
      if (frame) {
        frame.classList.add('missing');
        img.style.display = 'none';
      }
    });
  });

  /* ---------- Initial state: only the opening screen is visible ---------- */
  hideAllScreens();
  opening.hidden = false;
  countdown.hidden = true;
  if (tapHint) tapHint.hidden = true;
})();


