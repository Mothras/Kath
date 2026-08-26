/* ==================================================================
   For Kath ♡ — experience logic
   Music starts on Open; scroll-driven reveal of photos & letter.
   ================================================================== */
(function () {
  'use strict';

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
  var firstPhoto = document.getElementById('photo-1');
  var transitionScreen = document.getElementById('transition');
  var letterScreen = document.getElementById('letter');

  /* ---------- Countdown data ---------- */
  var countdownData = [
    { num: '5', text: 'For all the little moments...' },
    { num: '4', text: 'For all the laughter...' },
    { num: '3', text: 'For all the memories...' },
    { num: '2', text: 'For someone special...' },
    { num: '1', text: 'Kath ♡' }
  ];

  var COUNT_STEP = 1500;   // ms per number
  var SCREEN_FADE = 800;   // ms opening fade
  var countIndex = 0;

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
      countdown.hidden = false;
      runCountdown();
    }, SCREEN_FADE);
  });

  /* ---------- Music control ---------- */
  function syncMusicUI() {
    if (audio.paused) {
      musicToggle.textContent = '▶';
      musicToggle.setAttribute('aria-label', 'Play music');
      musicToggle.title = 'Play';
    } else {
      musicToggle.textContent = '❚❚';
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
          firstPhoto.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  /* ---------- Scroll reveal (photos / transition / closing) ---------- */
  var revealSections = document.querySelectorAll('.photo-section, #transition, #closing');
  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });

  revealSections.forEach(function (el) { sectionIO.observe(el); });

  /* ---------- Letter blocks reveal progressively while scrolling ---------- */
  var letterBlocks = document.querySelectorAll('.letter-block');
  var blockIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        blockIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

  letterBlocks.forEach(function (el) { blockIO.observe(el); });

  /* ---------- Transition: pause, then move gently into the letter ---------- */
  var transitionDone = false;
  var transitionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !transitionDone) {
        transitionDone = true;
        setTimeout(function () {
          letterScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 3200);
      }
    });
  }, { threshold: 0.6 });

  transitionIO.observe(transitionScreen);

  /* ---------- Subtle parallax on the posters ---------- */
  var photoImages = document.querySelectorAll('.photo-frame img');
  var ticking = false;

  function applyParallax() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    photoImages.forEach(function (img) {
      var section = img.closest('.photo-section');
      if (!section) return;
      var rect = section.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > vh + 300) return;
      var center = rect.top + rect.height / 2 - vh / 2;
      var offset = Math.max(-24, Math.min(24, center * -0.08));
      img.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
    });
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    }
  }, { passive: true });

  applyParallax();


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
      h.textContent = '♡';
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
})();

