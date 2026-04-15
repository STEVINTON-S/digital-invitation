import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ── Scratch Card Component ──────────────────────────────────────────────────
function ScratchCard({ revealText, label, subtext }) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Gold foil scratch layer
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#c8922a');
    grad.addColorStop(0.3, '#e8c96d');
    grad.addColorStop(0.6, '#b8791a');
    grad.addColorStop(1, '#d4a843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cross-hatch pattern for texture
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + canvas.height, canvas.height); ctx.stroke();
    }
    // Scratch icon
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = '12px Lato';
    ctx.textAlign = 'center';
    ctx.fillText('✦  Scratch to reveal  ✦', canvas.width / 2, canvas.height / 2);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };

  const scratch = useCallback((e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
    ctx.fill();
    lastPos.current = pos;

    // Check reveal percent
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) transparent++;
    }
    const pct = (transparent / (canvas.width * canvas.height)) * 100;
    setScratchPercent(pct);
    if (pct > 50 && !isRevealed) {
      setIsRevealed(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isRevealed]);

  return (
    <div className="scratch-card-wrapper">
      <div className="scratch-reveal-text">
        <span className="scratch-label">{label}</span>
        <span className="scratch-main">{revealText}</span>
        {subtext && <span className="scratch-sub">{subtext}</span>}
      </div>
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          className="scratch-canvas"
          onMouseDown={(e) => { isDrawing.current = true; lastPos.current = null; scratch(e); }}
          onMouseMove={scratch}
          onMouseUp={() => { isDrawing.current = false; }}
          onMouseLeave={() => { isDrawing.current = false; }}
          onTouchStart={(e) => { isDrawing.current = true; lastPos.current = null; scratch(e); }}
          onTouchMove={scratch}
          onTouchEnd={() => { isDrawing.current = false; }}
        />
      )}
      {isRevealed && <div className="reveal-sparkle">✨ Revealed!</div>}
    </div>
  );
}

// ── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Countdown Timer ─────────────────────────────────────────────────────────
function Countdown({ targetDate }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTime({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTime({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / (1000 * 60)) % 60),
          s: Math.floor((diff / 1000) % 60),
        });
      }

      setTick((t) => !t);
    };

    calc(); // run immediately
    const interval = setInterval(calc, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="countdown">
      {[['Days', time.d, false], ['Hours', time.h, false], ['Mins', time.m, false], ['Secs', time.s, true]].map(([l, v, isSeconds]) => (
        <div className="countdown-unit" key={l}>
          <span
            className={`countdown-num ${isSeconds ? (tick ? 'tick-a' : 'tick-b') : ''}`}
          >
            {String(v).padStart(2, '0')}
          </span>
          <span className="countdown-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Envelope Opening Animation ──────────────────────────────────────────────
function Envelope({ onOpen }) {
  const [state, setState] = useState('closed'); // closed → opening → open

  const handleTap = () => {
    if (state !== 'closed') return;
    setState('opening');
    setTimeout(() => { setState('open'); setTimeout(onOpen, 600); }, 1200);
  };

  return (
    <div className={`envelope-screen ${state}`} onClick={handleTap}>
      <div className="env-bg-pattern" />
      <div className="env-top-cross">✝</div>
      <div className="envelope-wrap">
        <div className="env-body">
          <div className="env-left-fold" />
          <div className="env-right-fold" />
          <div className="env-bottom-fold" />
          <div className={`env-flap ${state !== 'closed' ? 'open' : ''}`} />
          <div className="env-inner-card">
            <div className="env-inner-cross">✝</div>
            <p className="env-inner-names">John & Nancy</p>
          </div>
        </div>
        <div className="env-wax-seal">
          <div className="wax-seal-inner">✝</div>
        </div>
      </div>
      <div className="env-tap-hint">
        <span className="tap-ripple" />
        Tap to open your invitation
      </div>
      <div className="env-flowers env-flowers-left">🌸🌿🌺</div>
      <div className="env-flowers env-flowers-right">🌺🌿🌸</div>
    </div>
  );
}

// ── Section Wrapper ─────────────────────────────────────────────────────────
function Section({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`section-reveal ${visible ? 'visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [opened, setOpened] = useState(false);

  return (
    <div className="app">
      {!opened && <Envelope onOpen={() => setOpened(true)} />}
      {opened && (
        <div className="invitation-scroll">

          {/* ── HERO ── */}
          <section className="hero">
            <div className="hero-mandala" />
            <div className="hero-cross-top">✝</div>
            <div className="hero-content">
              <p className="hero-blessing">By the Grace of God</p>
              <div className="hero-divider"><span /><span className="div-diamond">✦</span><span /></div>
              <h1 className="hero-names">
                <span className="name-groom">John Pelix</span>
                <span className="name-amp">&amp;</span>
                <span className="name-bride">Nancy</span>
              </h1>
              <p className="hero-subtitle">Request the honour of your presence</p>
              <p className="hero-subtitle">at their Holy Matrimony</p>
              <div className="hero-divider"><span /><span className="div-diamond">✦</span><span /></div>
            </div>
            <div className="hero-scroll-hint">
              <span className="scroll-arrow">↓</span>
              <span>Scroll to explore</span>
            </div>
            <div className="hero-flowers-bl">🌸</div>
            <div className="hero-flowers-br">🌺</div>
            <div className="hero-flowers-tl">🌿</div>
            <div className="hero-flowers-tr">🌸</div>
          </section>

          {/* Wedding Video */}

          <section>
            <video
              autoPlay
              loop
              muted
              playsInline
              className="wedding-video"
            >
              <source src="/video/wedding.mp4" type="video/mp4" />
            </video>
          </section>

          {/* ── PARENTS ── */}
          <section className="parents-section">
            <Section>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>With Blessings of Our Parents</h2>
                <div className="section-rule" />
              </div>
              <div className="parents-grid">
                <div className="parents-card">
                  <div className="parents-cross">✝</div>
                  <h3 className="parents-side">Groom's Family</h3>
                  <p className="parent-name">Mr. Joseph Raj</p>
                  <p className="parent-and">&amp;</p>
                  <p className="parent-name">Mrs. Arokiyamary</p>
                  <p className="parent-location">Palayanur, Tamil Nadu</p>
                </div>
                <div className="parents-divider">
                  <div className="parents-divider-line" />
                  <div className="parents-divider-cross">✝</div>
                  <div className="parents-divider-line" />
                </div>
                <div className="parents-card">
                  <div className="parents-cross">✝</div>
                  <h3 className="parents-side">Bride's Family</h3>
                  <p className="parent-name">Mr. Arokiyasamy</p>
                  <p className="parent-and">&amp;</p>
                  <p className="parent-name">Mrs. Lourdumagimaimary</p>
                  <p className="parent-location">Kallakurichi, Tamil Nadu</p>
                </div>
              </div>
            </Section>
          </section>

          {/* ── SCRATCH REVEAL: COUPLE ── */}
          <section className="scratch-section">
            <Section>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>The Blessed Couple</h2>
                <p className="section-hint">✨ Scratch the golden cards to reveal ✨</p>
                <div className="section-rule" />
              </div>
              <div className="scratch-grid">
                <ScratchCard label="Groom" revealText="John Pelix" subtext="Son of Joseph Raj & Arokiyamary" />
                <ScratchCard label="Bride" revealText="Nancy" subtext="Daughter of Arokiyasamy & Lourdumagimaimary" />
              </div>
            </Section>
          </section>

          {/* ── SCRATCH REVEAL: DATE & VENUE ── */}
          <section className="scratch-section scratch-section-alt">
            <Section delay={100}>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>When &amp; Where</h2>
                <p className="section-hint">✨ Scratch to reveal the details ✨</p>
                <div className="section-rule" />
              </div>
              <div className="scratch-grid">
                <ScratchCard label="Wedding Date" revealText="18th May 2026" subtext="Monday · 7:00 AM onwards" />
                <ScratchCard label="Venue" revealText="St. Joseph Chruch" subtext="Palayanur, Tamil Nadu - 606402" />
              </div>
            </Section>
          </section>

          {/* ── COUNTDOWN ── */}
          <section className="countdown-section">
            <Section>
              <div className="section-header light">
                <div className="ornament light-ornament">✦ ✝ ✦</div>
                <h2 className="light-heading">Counting Down to Forever</h2>
                <div className="section-rule light-rule" />
              </div>
              <Countdown targetDate="2026-05-18T06:00:00" />
            </Section>
          </section>

          {/* ── EVENTS ── */}
          <section className="events-section">
            <Section>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>Celebration Events</h2>
                <div className="section-rule" />
              </div>
              <div className="events-timeline">
                {[
                  { icon: '🌅', title: 'Engagement Ceremony', time: '06:00 PM', desc: 'Gangaiamman Marriage Mahal, Kallakurichi', date: 'May 17' },
                  { icon: '💒', title: 'Holy Matrimony', time: '07:00 AM', desc: 'St. Joseph Chruch, Palayanur', date: 'May 18' },
                  { icon: '🍽️', title: 'Wedding Reception', time: '8:30 AM', desc: 'Home, Palayanur', date: 'May 18' },
                ].map((ev, i) => (
                  <Section delay={i * 150} key={i}>
                    <div className="event-card">
                      <div className="event-date-badge">{ev.date}</div>
                      <div className="event-icon">{ev.icon}</div>
                      <div className="event-info">
                        <h3>{ev.title}</h3>
                        <p className="event-time">⏰ {ev.time}</p>
                        <p className="event-place">📍 {ev.desc}</p>
                      </div>
                    </div>
                  </Section>
                ))}
              </div>
            </Section>
          </section>

          {/* ── LOCATION ── */}
          <section className="location-section">
            <Section>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>Find Us Here</h2>
                <div className="section-rule" />
              </div>
              <div className="location-card">
                <div className="location-map-placeholder">
                  <div className="map-pin-anim">📍</div>
                  <p className="map-venue-name">St. Joseph Chruch</p>
                  <p className="map-address">Palayanur, Kallakurichi – 606 402<br />Tamil Nadu, India</p>
                </div>
                <div className="location-details">
                  <div className="location-info-row">
                    <span className="loc-icon">🅿️</span>
                    <span>Parking Available</span>
                  </div>
                  <div className="location-info-row">
                    <span className="loc-icon">🛕</span>
                    <span>Landmark: Near Puncture Shop</span>
                  </div>
                </div>
              </div>
            </Section>
          </section>

          <a
                    href="https://maps.app.goo.gl/U4Rs6gopgk2KhERf9?g_st=ic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-btn"
                  >
                    Open Location →
                  </a>

          {/* ── CONTACT ── */}
          <section className="contact-section">
            <Section>
              <div className="section-header">
                <div className="ornament">✦ ✝ ✦</div>
                <h2>Get in Touch</h2>
                <div className="section-rule" />
              </div>
              <div className="contact-cards">
                {[
                  { name: 'Arokiyasamy', phone: '+91 9843415767', role: "Bride's Father" },
                  { name: 'Joseph Raj', phone: '+91 8248835760', role: "Groom's Father" },
                  { name: 'Nishanth', phone: '+91 7339635493', role: "Bride's Brother" },
                  { name: 'Ronce Pinto', phone: '+91 6382386679', role: "Groom's Brother" },
                ].map((c, i) => (
                  <Section delay={i * 100} key={i}>
                    <a href={`tel:${c.phone}`} className="contact-card">
                      <div className="contact-role">{c.role}</div>
                      <div className="contact-name">{c.name}</div>
                      <div className="contact-phone">📞 {c.phone}</div>
                    </a>
                  </Section>
                ))}
              </div>
            </Section>
          </section>

          {/* ── FOOTER ── */}
          <section className="footer-section">
            <div className="footer-mandala" />
            <div className="footer-cross">✝</div>
            <h2 className="footer-names">John & Nancy</h2>
            <p className="footer-verse">"What God has joined together, let no one separate."</p>
            <p className="footer-verse-ref">— Mark 10:9</p>
            <div className="footer-ornament">✦ ✝ ✦</div>
            <p className="footer-date">18 · 05 · 2026</p>
            <div className="footer-flowers">🌸 🌿 🌺 🌿 🌸</div>
          </section>

        </div>
      )}
    </div>
  );
}