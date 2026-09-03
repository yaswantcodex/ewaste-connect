/* Civic Repair Ledger: this page turns the recovery network into a tactile, readable work order. */
import { useState } from "react";
import { ArrowDown, ArrowRight, Check, MapPin, Menu, X } from "lucide-react";

const deviceOptions = [
  { id: "laptop", label: "Laptop", icon: "▱", description: "Working or ready for parts" },
  { id: "phone", label: "Phone", icon: "▯", description: "Smartphones and tablets" },
  { id: "other", label: "Other", icon: "◌", description: "Cables, screens, small tech" },
];

const dispatchSteps = [
  { title: "Post e-waste", sub: "Tell us what is waiting in your drawer." },
  { title: "Select device", sub: "A quick condition and device check." },
  { title: "Nearby request", sub: "See who can help within reach." },
  { title: "Accepted", sub: "A recycler or volunteer takes the handoff." },
  { title: "Collected", sub: "The device starts its next useful life." },
];

const initialRequests = [
  { id: 1, type: "Repair / reuse", title: "Old laptop for a student studio", body: "Needs a new battery. Everything else powers on.", distance: "1.2 km away", user: "Mira K.", initials: "MK" },
  { id: 2, type: "Responsible recycling", title: "Three phones, wiped and ready", body: "Looking for a verified drop-off this weekend.", distance: "2.7 km away", user: "Jon R.", initials: "JR" },
  { id: 3, type: "Parts recovery", title: "Box of mixed cables + chargers", body: "Sorted by type, happy for a maker or recycler to collect.", distance: "4.1 km away", user: "Asha P.", initials: "AP" },
];

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState("laptop");
  const [currentStage, setCurrentStage] = useState(0);
  const [acceptedRequest, setAcceptedRequest] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  };

  const scrollTo = (id: string) => {
    setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const selectDevice = (id: string) => {
    setSelectedDevice(id);
    setCurrentStage(1);
    const selected = deviceOptions.find((device) => device.id === id);
    showToast(`${selected?.label} selected — ready to find a nearby handoff.`);
  };

  const startPost = () => {
    scrollTo("post");
    setCurrentStage(0);
  };

  const findNearby = () => {
    setCurrentStage(2);
    scrollTo("nearby");
    showToast("Nearby requests are ready. Choose a handoff that feels right.");
  };

  const acceptRequest = (id: number, title: string) => {
    setAcceptedRequest(id);
    setCurrentStage(3);
    showToast(`You accepted “${title}”. The handoff is now in motion.`);
  };

  return (
    <div className="site-shell">
      <header className="nav-wrap">
        <div className="container nav">
          <button className="brand" onClick={() => scrollTo("top")} aria-label="E-Waste Connect home">
            <span className="brand-seal"><img className="brand-mark" src="/manus-storage/ewaste-connect-mark_9d8ca29a.png" alt="" /></span>
            <span className="brand-name"><strong>E-Waste Connect</strong><span>local recovery network</span></span>
          </button>
          <nav className={`nav-links ${mobileNavOpen ? "nav-links-open" : ""}`} aria-label="Primary navigation">
            <button onClick={() => scrollTo("how-it-works")}>How it works</button>
            <button onClick={() => scrollTo("nearby")}>Nearby requests</button>
            <button onClick={() => scrollTo("network")}>For repairers</button>
          </nav>
          <div className="nav-actions">
            <button className="ghost-button" onClick={() => showToast("Sign-in will be available when your local network opens.")}>Sign in</button>
            <button className="signal-button" onClick={startPost}>Post e-waste <span className="button-arrow"><ArrowRight size={14} /></span></button>
            <button className="mobile-nav-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label={mobileNavOpen ? "Close menu" : "Open menu"}>
              {mobileNavOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow mono-label">The local recovery network</span>
              <h1 className="display">Make room for a <em>next</em> useful life.</h1>
              <p className="hero-description">E-Waste Connect helps old electronics move from forgotten drawers to the people, repairers, and recyclers who can keep them in use.</p>
              <button className="signal-button" onClick={startPost}>Find a responsible handoff <span className="button-arrow"><ArrowRight size={14} /></span></button>
              <div className="hero-proof">
                <div className="avatar-stack" aria-hidden="true"><span className="avatar">MK</span><span className="avatar">AP</span><span className="avatar">JR</span></div>
                <span>Already moving devices in your neighborhood</span>
              </div>
            </div>
            <div className="hero-media">
              <img className="hero-image" src="/manus-storage/ewaste-hero_e8987857.jpg" alt="Old laptop and electronics arranged on a warm workbench" />
              <div className="hero-image-caption"><span className="caption-number">01</span><span>Every device carries a little more life than we think.</span></div>
              <span className="hero-side-note">Dispatch no. 004 — keep useful things moving</span>
            </div>
          </div>
        </section>

        <section className="dispatch-section" id="how-it-works">
          <div className="container dispatch-layout">
            <aside className="dispatch-rail" aria-label="Recovery dispatch stages">
              <span className="mono-label dispatch-rail-kicker">Dispatch / 004</span>
              <div className="dispatch-rail-list">
                {dispatchSteps.map((step, index) => (
                  <button key={step.title} className={`dispatch-rail-step ${index === currentStage ? "active" : ""} ${index < currentStage ? "done" : ""}`} onClick={() => { setCurrentStage(index); if (index === 0) scrollTo("post"); if (index >= 2) scrollTo("nearby"); }}>
                    <span className="rail-marker">{index < currentStage ? <Check size={13} /> : `0${index + 1}`}</span>
                    <span className="rail-step-copy"><strong>{step.title}</strong><small>{index === currentStage ? "current handoff" : step.sub}</small></span>
                  </button>
                ))}
              </div>
              <span className="dispatch-rail-foot mono-label">one device / one local route</span>
            </aside>
            <div className="dispatch-body">
              <div className="dispatch-head">
                <div><span className="eyebrow mono-label" style={{ color: "rgba(244,240,231,0.68)" }}>One clear handoff</span><h2 className="display">From drawer to <span>next chapter.</span></h2></div>
                <p>No mystery status screens. Just a visible chain of people and places moving one device forward.</p>
              </div>
              <div className="dispatch-track" aria-label="E-waste recovery stages summary">
                {dispatchSteps.map((step, index) => (
                  <div key={step.title} className={`dispatch-step ${index === currentStage ? "active" : ""} ${index < currentStage ? "done" : ""}`}>
                    <div className="step-marker">{index < currentStage ? <Check size={14} /> : `0${index + 1}`}</div>
                    <div className="step-label">{step.title}</div>
                    <div className="step-sub">{step.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="work-section" id="post">
          <div className="container work-layout">
            <aside className="section-rail">
              <div className="rail-number">02</div>
              <div><h3>Start with what’s close.</h3><p>Describe one device. We’ll do the local legwork from there.</p></div>
            </aside>
            <div className="work-order soft-shadow">
              <div className="order-visual"><img src="/manus-storage/ewaste-repair-stilllife_15768986.jpg" alt="Old laptop being repaired next to tools and a parts tray" /></div>
              <div className="order-copy">
                <span className="mono-label eyebrow">Create a work order</span>
                <h3 className="display">What needs a new route?</h3>
                <p>Select the closest match. You can add condition, photos, and pickup notes after this first step.</p>
                <div className="device-select" role="group" aria-label="Select device type">
                  {deviceOptions.map((device) => (
                    <button key={device.id} className={`device-card ${selectedDevice === device.id ? "selected" : ""}`} onClick={() => selectDevice(device.id)} aria-pressed={selectedDevice === device.id}>
                      <span className="device-icon" aria-hidden="true">{device.icon}</span><span>{device.label}</span>
                    </button>
                  ))}
                </div>
                <div className="order-actions">
                  <button className="signal-button" onClick={findNearby}>Show nearby requests <span className="button-arrow"><ArrowRight size={14} /></span></button>
                  <span className="order-note">Selected: {deviceOptions.find((device) => device.id === selectedDevice)?.label}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="network-section" id="network">
          <div className="container network-layout">
            <div className="network-copy">
              <span className="eyebrow mono-label">A network with a human face</span>
              <h2 className="display">The right hands are often <em>nearby.</em></h2>
              <p>Local repairers, verified recyclers, community groups, and people who know what to do next. E-Waste Connect makes that useful knowledge easier to find.</p>
              <ul className="network-list">
                <li><span className="list-index">01</span><div><strong>Repair before recycle</strong><span>Keep working parts and good devices in circulation.</span></div></li>
                <li><span className="list-index">02</span><div><strong>Clear chain of custody</strong><span>Know where a device is going and who is taking it there.</span></div></li>
                <li><span className="list-index">03</span><div><strong>Neighborhood scale</strong><span>Shorter journeys, more useful introductions, less guesswork.</span></div></li>
              </ul>
            </div>
            <div className="network-media"><img className="network-image" src="/manus-storage/ewaste-neighborhood_0d0dc05f.jpg" alt="Volunteer receiving a box of electronics at a neighborhood collection point" /><div className="network-stamp"><span>Keep it in use<br />keep it local</span></div></div>
          </div>
        </section>

        <section className="nearby-section" id="nearby">
          <div className="container">
            <div className="nearby-header"><div><span className="eyebrow mono-label">Live near you</span><h2 className="display">Open requests, <br />ready for a handoff.</h2></div><div className="location-pill"><MapPin size={13} /><span className="location-dot" /> Bengaluru · 5 km</div></div>
            <div className="nearby-grid">
              <div className="map-card" aria-label="Illustrated map showing nearby e-waste requests">
                <span className="map-label one">Indiranagar</span><span className="map-label two">Ulsoor lake</span><span className="map-label three">Domlur</span><div className="map-route" /><div className="map-pin origin">you</div><div className="map-pin destination">♻</div><span className="map-note">3 active requests inside 5 km</span>
              </div>
              <div className="request-list">
                {initialRequests.map((request) => (
                  <article className={`request-card ${acceptedRequest === request.id ? "accepted" : ""}`} key={request.id}>
                    <div className="request-top"><span className="request-kind"><span className="kind-dot" />{request.type}</span><span className="request-distance">{request.distance}</span></div>
                    <h3>{acceptedRequest === request.id ? "Handoff accepted" : request.title}</h3>
                    <p>{acceptedRequest === request.id ? "Thank you. The owner has been notified and will share a pickup window." : request.body}</p>
                    <div className="request-foot"><span className="request-user"><span className="request-avatar">{request.initials}</span>posted by {request.user}</span>{acceptedRequest === request.id ? <span className="mono-label" style={{ color: "#17352d" }}><Check size={13} /> In motion</span> : <button className="accept-button" onClick={() => acceptRequest(request.id, request.title)}>Accept request <ArrowRight size={12} /></button>}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand"><div className="brand"><span className="brand-seal"><img className="brand-mark" src="/manus-storage/ewaste-connect-mark_9d8ca29a.png" alt="" /></span><span className="brand-name"><strong>E-Waste Connect</strong><span>local recovery network</span></span></div><p>A calmer, closer way to keep electronics out of landfill and in the hands of people who can use them.</p></div>
          <div><h3>Explore</h3><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#nearby">Nearby requests</a><a href="#network">For repairers</a></div></div>
          <div><h3>Good to know</h3><div className="footer-links"><button onClick={() => showToast("The care guide is being assembled with local repairers.")}>Device care guide</button><button onClick={() => showToast("Community standards will be shared when your network opens.")}>Community standards</button><button onClick={() => showToast("We’ll bring the network to your city soon.")}>Bring it to my city</button></div></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 E-Waste Connect</span><span>Designed for the next useful life of things.</span></div>
      </footer>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification">×</button></div>}
      <button className="scroll-cue" onClick={() => scrollTo("how-it-works")} aria-label="Scroll to how it works"><ArrowDown size={16} /></button>
    </div>
  );
}
