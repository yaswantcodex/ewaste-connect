/* E-Waste Connect full-stack page: the work order now persists posts and stores device photos through the typed backend. */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, FileCheck, ImagePlus, Loader2, LogIn, MapPin, Menu, X } from "lucide-react";

type DeviceType = "laptop" | "phone" | "other";
type UploadPurpose = "device-photo" | "collection-evidence";

const deviceOptions: Array<{ id: DeviceType; label: string; icon: string; description: string }> = [
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
  { id: 1, type: "Repair / reuse", title: "Old laptop for a student studio", body: "Needs a new battery. Everything else powers on.", distance: "1.2 km away", user: "Mira K.", initials: "MK", databaseBacked: false },
  { id: 2, type: "Responsible recycling", title: "Three phones, wiped and ready", body: "Looking for a verified drop-off this weekend.", distance: "2.7 km away", user: "Jon R.", initials: "JR", databaseBacked: false },
  { id: 3, type: "Parts recovery", title: "Box of mixed cables + chargers", body: "Sorted by type, happy for a maker or recycler to collect.", distance: "4.1 km away", user: "Asha P.", initials: "AP", databaseBacked: false },
];

const maxUploadBytes = 8 * 1024 * 1024;
const allowedUploadTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const postListInput = useMemo(() => ({ limit: 12 }), []);
  const postsQuery = trpc.posts.list.useQuery(postListInput);
  const utils = trpc.useUtils();
  const uploadMutation = trpc.files.upload.useMutation();
  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: async () => {
      await utils.posts.list.invalidate();
    },
  });
  const acceptMutation = trpc.posts.accept.useMutation({
    onSuccess: async () => {
      await utils.posts.list.invalidate();
    },
  });
  const evidenceMutation = trpc.posts.attachEvidence.useMutation({
    onSuccess: async () => {
      await utils.posts.list.invalidate();
    },
  });

  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("laptop");
  const [currentStage, setCurrentStage] = useState(0);
  const [acceptedRequest, setAcceptedRequest] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDetails, setPostDetails] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photoFile || !photoFile.type.startsWith("image/")) {
      setPhotoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  };

  const scrollTo = (id: string) => {
    setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const selectDevice = (id: DeviceType) => {
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

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedUploadTypes.has(file.type)) {
      showToast("Please choose a JPG, PNG, WEBP, or PDF file.");
      event.target.value = "";
      return;
    }
    if (file.size > maxUploadBytes) {
      showToast("Files must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPostSuccess(false);
    showToast(`${file.name} is ready to attach to this work order.`);
  };

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (postTitle.trim().length < 3) {
      showToast("Add a short title so the right helper can recognize the device.");
      return;
    }

    setIsSubmitting(true);
    setPostSuccess(false);
    try {
      let storedPhoto: { key: string; url: string; name: string; mimeType: string; size: number } | undefined;
      if (photoFile) {
        const dataUrl = await fileToDataUrl(photoFile);
        const stored = await uploadMutation.mutateAsync({
          filename: photoFile.name,
          contentType: photoFile.type,
          size: photoFile.size,
          purpose: "device-photo" satisfies UploadPurpose,
          dataUrl,
        });
        storedPhoto = { key: stored.key, url: stored.url, name: stored.name, mimeType: stored.mimeType, size: stored.size };
      }

      await createPostMutation.mutateAsync({
        deviceType: selectedDevice,
        title: postTitle.trim(),
        details: postDetails.trim() || undefined,
        photo: storedPhoto,
      });
      setPostTitle("");
      setPostDetails("");
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPostSuccess(true);
      setCurrentStage(2);
      showToast("Your device post is live. Nearby helpers can now find it.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not save this device post yet.";
      showToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const liveRequests = (postsQuery.data ?? []).map((post) => ({
    id: post.id,
    type: `${post.deviceType} / community post`,
    title: post.title,
    body: post.details || "A local device is ready for a responsible next step.",
    distance: "nearby",
    user: "E-Waste member",
    initials: "EW",
    databaseBacked: true,
  }));
  const requestCards = liveRequests.length > 0 ? liveRequests : initialRequests;

  const handleEvidenceChange = async (event: ChangeEvent<HTMLInputElement>, postId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!allowedUploadTypes.has(file.type)) {
      showToast("Please choose a JPG, PNG, WEBP, or PDF file for collection evidence.");
      event.target.value = "";
      return;
    }
    if (file.size > maxUploadBytes) {
      showToast("Evidence files must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const stored = await uploadMutation.mutateAsync({ filename: file.name, contentType: file.type, size: file.size, purpose: "collection-evidence", dataUrl });
      await evidenceMutation.mutateAsync({ postId, file: { key: stored.key, url: stored.url } });
      setEvidenceFileName(file.name);
      setCurrentStage(4);
      showToast("Collection evidence attached. This device is now marked collected.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "We could not attach collection evidence yet.");
    } finally {
      event.target.value = "";
    }
  };

  const acceptRequest = async (id: number, title: string, databaseBacked: boolean) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (databaseBacked) {
      try {
        await acceptMutation.mutateAsync({ postId: id });
      } catch (error) {
        showToast(error instanceof Error ? error.message : "We could not record that handoff yet.");
        return;
      }
    }
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
            <button className="ghost-button" onClick={() => { if (isAuthenticated) { void logout(); showToast("You’re signed out."); } else { startLogin(); } }}>{isAuthenticated ? "Sign out" : "Sign in"}</button>
            <button className="signal-button" onClick={startPost}>Post e-waste <span className="button-arrow"><ArrowRight size={14} /></span></button>
            <button className="mobile-nav-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label={mobileNavOpen ? "Close menu" : "Open menu"}>{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button>
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
              <div className="hero-proof"><div className="avatar-stack" aria-hidden="true"><span className="avatar">MK</span><span className="avatar">AP</span><span className="avatar">JR</span></div><span>Already moving devices in your neighborhood</span></div>
            </div>
            <div className="hero-media"><img className="hero-image" src="/manus-storage/ewaste-hero_e8987857.jpg" alt="Old laptop and electronics arranged on a warm workbench" /><div className="hero-image-caption"><span className="caption-number">01</span><span>Every device carries a little more life than we think.</span></div><span className="hero-side-note">Dispatch no. 004 — keep useful things moving</span></div>
          </div>
        </section>

        <section className="dispatch-section" id="how-it-works">
          <div className="container dispatch-layout">
            <aside className="dispatch-rail" aria-label="Recovery dispatch stages"><span className="mono-label dispatch-rail-kicker">Dispatch / 004</span><div className="dispatch-rail-list">{dispatchSteps.map((step, index) => <button key={step.title} className={`dispatch-rail-step ${index === currentStage ? "active" : ""} ${index < currentStage ? "done" : ""}`} onClick={() => { setCurrentStage(index); if (index === 0) scrollTo("post"); if (index >= 2) scrollTo("nearby"); }}><span className="rail-marker">{index < currentStage ? <Check size={13} /> : `0${index + 1}`}</span><span className="rail-step-copy"><strong>{step.title}</strong><small>{index === currentStage ? "current handoff" : step.sub}</small></span></button>)}</div><span className="dispatch-rail-foot mono-label">one device / one local route</span></aside>
            <div className="dispatch-body"><div className="dispatch-head"><div><span className="eyebrow mono-label" style={{ color: "rgba(244,240,231,0.68)" }}>One clear handoff</span><h2 className="display">From drawer to <span>next chapter.</span></h2></div><p>No mystery status screens. Just a visible chain of people and places moving one device forward.</p></div><div className="dispatch-track" aria-label="E-waste recovery stages summary">{dispatchSteps.map((step, index) => <div key={step.title} className={`dispatch-step ${index === currentStage ? "active" : ""} ${index < currentStage ? "done" : ""}`}><div className="step-marker">{index < currentStage ? <Check size={14} /> : `0${index + 1}`}</div><div className="step-label">{step.title}</div><div className="step-sub">{step.sub}</div></div>)}</div></div>
          </div>
        </section>

        <section className="work-section" id="post">
          <div className="container work-layout"><aside className="section-rail"><div className="rail-number">02</div><div><h3>Start with what’s close.</h3><p>Describe one device. We’ll do the local legwork from there.</p></div></aside>
            <div className="work-order soft-shadow"><div className="order-visual"><img src="/manus-storage/ewaste-repair-stilllife_15768986.jpg" alt="Old laptop being repaired next to tools and a parts tray" /></div><div className="order-copy"><span className="mono-label eyebrow">Create a work order</span><h3 className="display">What needs a new route?</h3><p>Select the closest match, add a little context, and attach a photo if it helps a local helper recognize the device.</p>
              <div className="device-select" role="group" aria-label="Select device type">{deviceOptions.map((device) => <button key={device.id} className={`device-card ${selectedDevice === device.id ? "selected" : ""}`} onClick={() => selectDevice(device.id)} aria-pressed={selectedDevice === device.id}><span className="device-icon" aria-hidden="true">{device.icon}</span><span>{device.label}</span></button>)}</div>
              <form className="post-form" onSubmit={handlePostSubmit}><label className="field-label" htmlFor="post-title">Work order title<input id="post-title" value={postTitle} onChange={(event) => { setPostTitle(event.target.value); setPostSuccess(false); }} placeholder="e.g. Old laptop for a student studio" maxLength={160} /></label><label className="field-label" htmlFor="post-details">Pickup note <span>optional</span><textarea id="post-details" value={postDetails} onChange={(event) => setPostDetails(event.target.value)} placeholder="Condition, accessories, or a useful pickup detail" maxLength={4000} rows={3} /></label>
                <div className="upload-panel"><div><span className="upload-title"><ImagePlus size={14} /> Attach a device photo</span><p>Stored securely with this post · JPG, PNG, WEBP, or PDF · max 8 MB</p></div><input ref={fileInputRef} className="visually-hidden" id="device-photo" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handlePhotoChange} /><button type="button" className="ghost-button upload-button" onClick={() => fileInputRef.current?.click()}>{photoFile ? "Replace file" : "Choose file"}</button>{photoFile && <div className="selected-file">{photoPreview ? <img src={photoPreview} alt="Selected device preview" /> : <FileCheck size={18} />}<span>{photoFile.name}<small>{formatFileSize(photoFile.size)}</small></span><button type="button" onClick={() => { setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} aria-label="Remove selected file">×</button></div>}</div>
                <div className="order-actions"><button className="signal-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={14} className="spin" /> Saving work order</> : <>{isAuthenticated ? "Publish work order" : "Sign in to publish"} <span className="button-arrow">{isAuthenticated ? <ArrowRight size={14} /> : <LogIn size={13} />}</span></>}</button><span className="order-note">Selected: {deviceOptions.find((device) => device.id === selectedDevice)?.label}</span></div>{postSuccess && <div className="inline-success" role="status"><Check size={14} /> Saved to the community network. Your post is now visible in nearby requests.</div>}</form>
            </div></div>
          </div>
        </section>

        <section className="network-section" id="network"><div className="container network-layout"><div className="network-copy"><span className="eyebrow mono-label">A network with a human face</span><h2 className="display">The right hands are often <em>nearby.</em></h2><p>Local repairers, verified recyclers, community groups, and people who know what to do next. E-Waste Connect makes that useful knowledge easier to find.</p><ul className="network-list"><li><span className="list-index">01</span><div><strong>Repair before recycle</strong><span>Keep working parts and good devices in circulation.</span></div></li><li><span className="list-index">02</span><div><strong>Clear chain of custody</strong><span>Know where a device is going and who is taking it there.</span></div></li><li><span className="list-index">03</span><div><strong>Neighborhood scale</strong><span>Shorter journeys, more useful introductions, less guesswork.</span></div></li></ul></div><div className="network-media"><img className="network-image" src="/manus-storage/ewaste-neighborhood_0d0dc05f.jpg" alt="Volunteer receiving a box of electronics at a neighborhood collection point" /><div className="network-stamp"><span>Keep it in use<br />keep it local</span></div></div></div></section>

        <section className="nearby-section" id="nearby"><div className="container"><div className="nearby-header"><div><span className="eyebrow mono-label">Live near you</span><h2 className="display">Open requests, <br />ready for a handoff.</h2></div><div className="location-pill"><MapPin size={13} /><span className="location-dot" /> Bengaluru · 5 km</div></div><div className="nearby-grid"><div className="map-card" aria-label="Illustrated map showing nearby e-waste requests"><span className="map-label one">Indiranagar</span><span className="map-label two">Ulsoor lake</span><span className="map-label three">Domlur</span><div className="map-route" /><div className="map-pin origin">you</div><div className="map-pin destination">♻</div><span className="map-note">{postsQuery.isLoading ? "Checking local requests…" : `${requestCards.length} request${requestCards.length === 1 ? "" : "s"} inside 5 km`}</span></div><div className="request-list">{requestCards.map((request) => <article className={`request-card ${acceptedRequest === request.id ? "accepted" : ""}`} key={request.id}><div className="request-top"><span className="request-kind"><span className="kind-dot" />{request.type}</span><span className="request-distance">{request.distance}</span></div><h3>{acceptedRequest === request.id ? "Handoff accepted" : request.title}</h3><p>{acceptedRequest === request.id ? "Thank you. The owner has been notified and will share a pickup window." : request.body}</p><div className="request-foot"><span className="request-user"><span className="request-avatar">{request.initials}</span>posted by {request.user}</span>{acceptedRequest === request.id ? <span className="mono-label request-status"><Check size={13} /> In motion</span> : <button className="accept-button" onClick={() => void acceptRequest(request.id, request.title, request.databaseBacked)} disabled={acceptMutation.isPending}>Accept request <ArrowRight size={12} /></button>}</div>{acceptedRequest === request.id && request.databaseBacked && <div className="evidence-panel"><input ref={evidenceInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => void handleEvidenceChange(event, request.id)} /><span><FileCheck size={13} /> Add collection evidence</span><button type="button" className="ghost-button evidence-button" onClick={() => evidenceInputRef.current?.click()} disabled={uploadMutation.isPending || evidenceMutation.isPending}>{uploadMutation.isPending || evidenceMutation.isPending ? "Saving…" : evidenceFileName ? "Replace file" : "Choose proof"}</button>{evidenceFileName && <small>{evidenceFileName}</small>}</div>}</article>)}</div></div></div></section>
      </main>

      <footer className="footer"><div className="container footer-grid"><div className="footer-brand"><div className="brand"><span className="brand-seal"><img className="brand-mark" src="/manus-storage/ewaste-connect-mark_9d8ca29a.png" alt="" /></span><span className="brand-name"><strong>E-Waste Connect</strong><span>local recovery network</span></span></div><p>A calmer, closer way to keep electronics out of landfill and in the hands of people who can use them.</p></div><div><h3>Explore</h3><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#nearby">Nearby requests</a><a href="#network">For repairers</a></div></div><div><h3>Good to know</h3><div className="footer-links"><button onClick={() => showToast("The care guide is being assembled with local repairers.")}>Device care guide</button><button onClick={() => showToast("Community standards will be shared when your network opens.")}>Community standards</button><button onClick={() => showToast("We’ll bring the network to your city soon.")}>Bring it to my city</button></div></div></div><div className="container footer-bottom"><span>© 2026 E-Waste Connect</span><span>Designed for the next useful life of things.</span></div></footer>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification">×</button></div>}
      <button className="scroll-cue" onClick={() => scrollTo("how-it-works")} aria-label="Scroll to how it works"><ArrowDown size={16} /></button>
    </div>
  );
}
