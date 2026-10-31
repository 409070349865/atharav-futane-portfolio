import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownRight, ArrowUpRight, BookOpen, Check, ChevronRight, Command,
  Download, ExternalLink, Github, GraduationCap, Layers3, Search, Terminal,
  X
} from "lucide-react";
import {
  articles, certifications, education, learningAreas, profile, projects, skillGroups,
  type Article, type ArticleBlock, type Project
} from "./data";

type PublicRepository = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  archived: boolean;
};

type PublicEvent = { type: string; created_at: string; repo?: { name: string } };
type GitHubData = { repositories: PublicRepository[]; events: PublicEvent[] | null; fetchedAt: number };
const githubCacheKey = "portfolio.github.public.v1";

async function fetchGitHubData(): Promise<GitHubData> {
  let cachedText: string | null = null;
  try { cachedText = localStorage.getItem(githubCacheKey); }
  catch { /* Continue with a live request when storage is disabled. */ }
  if (cachedText) {
    try {
      const cached = JSON.parse(cachedText) as GitHubData;
      if (Date.now() - cached.fetchedAt < 10 * 60 * 1000) return cached;
    } catch {
      try { localStorage.removeItem(githubCacheKey); }
      catch { /* Ignore malformed cache when storage is unavailable. */ }
    }
  }
  const username = new URL(profile.github).pathname.split("/").filter(Boolean).pop();
  if (!username) throw new Error("A GitHub profile URL is required to load repositories.");
  const headers = { Accept: "application/vnd.github+json" };
  const [repositoriesResponse, eventsResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`, { headers })
  ]);
  if (!repositoriesResponse.ok) {
    if (repositoriesResponse.status === 403 || repositoriesResponse.status === 429) {
      throw new Error("GitHub's public API rate limit was reached. Please try again later.");
    }
    if (repositoriesResponse.status === 404) throw new Error("The configured GitHub profile was not found.");
    throw new Error(`Could not load repositories (HTTP ${repositoriesResponse.status}).`);
  }
  const repositories = await repositoriesResponse.json() as PublicRepository[];
  let events: PublicEvent[] | null = null;
  if (eventsResponse.ok) events = await eventsResponse.json() as PublicEvent[];
  const data = { repositories, events, fetchedAt: Date.now() };
  try {
    localStorage.setItem(githubCacheKey, JSON.stringify(data));
  } catch {
    // The view still works when browser storage is disabled or full.
  }
  return data;
}

export function GitHubShowcase() {
  const [data, setData] = useState<GitHubData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const didLoad = useRef(false);

  const load = () => {
    setLoading(true);
    setError("");
    fetchGitHubData().then(setData).catch(reason => setError(reason instanceof Error ? reason.message : "Could not load GitHub data.")).finally(() => setLoading(false));
  };
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, []);

  const visibleRepos = useMemo(() => (data?.repositories || []).filter(repo =>
    `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query]);
  const recentEvents = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    if (!data.events) return [];
    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (34 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, count: data.events?.filter(event => event.created_at.slice(0, 10) === key).length || 0, label: date.toLocaleDateString() };
    });
  }, [data]);

  return <section id="github" className="section-wrap section-block">
    <FeatureHeading eyebrow="LIVE FROM GITHUB" title={<>Open source, <span>in real time.</span></>} text="Public repositories and public GitHub activity loaded directly from GitHub. Private contribution data is not available here."/>
    {loading && <p className="feature-state" role="status">Loading public GitHub data…</p>}
    {error && <div className="feature-error" role="alert"><p>{error}</p><button className="filter" onClick={load}>Try again</button></div>}
    {data && <>
      <div className="github-overview"><div className="github-count"><strong>{data.repositories.length}</strong><span>public repositories</span></div><div className="github-count"><strong>{data.repositories.reduce((total, repo) => total + repo.stargazers_count, 0)}</strong><span>stars across listed repositories</span></div><a className="button button-secondary" href={profile.github} target="_blank" rel="noreferrer">Open GitHub profile <Github size={16}/></a></div>
      <div className="activity-panel"><div className="feature-card-heading"><div><span className="eyebrow">PUBLIC ACTIVITY</span><h3>Recent activity, last 35 days</h3></div><span className="mono">PUBLIC EVENTS ONLY</span></div>
        {data.events ? <>
          <div className="activity-grid" role="img" aria-label="Daily public GitHub event counts for the last 35 days">{recentEvents.map(day => <span key={day.key} title={`${day.label}: ${day.count} public events`} className={`activity-cell activity-level-${Math.min(day.count, 4)}`}/>)}</div>
          <p className="form-note">Based on GitHub’s public events API (limited to the latest 100 events); this is not a complete contribution graph and excludes private activity.</p>
          {data.events.length > 0 && <div className="recent-events">{data.events.slice(0, 5).map((event, index) => <p key={`${event.created_at}-${index}`}><span>{event.type.replace(/Event$/, "")}</span><span>{event.repo?.name || "GitHub activity"}</span><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString()}</time></p>)}</div>}
        </> : <p className="form-note">GitHub repository data loaded, but public activity is currently unavailable.</p>}
      </div>
      <label className="search-field"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search public repositories" aria-label="Search public repositories"/></label>
      <div className="repository-grid">{visibleRepos.map(repo => <article className="repository-card" key={repo.id}>
        <div className="repository-title"><h3>{repo.name}</h3><a href={repo.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.name} on GitHub`}><ExternalLink size={16}/></a></div>
        <p>{repo.description || "No public description provided."}</p>
        <div className="repository-meta"><span>{repo.language || "Language not specified"}</span><span>★ {repo.stargazers_count}</span><span>⑂ {repo.forks_count}</span></div>
        <small>Last pushed {new Date(repo.pushed_at).toLocaleDateString()}{repo.archived ? " · Archived" : ""}</small>
      </article>)}</div>
      {!visibleRepos.length && <p className="feature-state">No repositories match that search.</p>}
    </>}
  </section>;
}

export function ProjectShowcase({ onOpenProject }: { onOpenProject: (project: Project) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(projects.map(project => project.category))];
  const visibleProjects = projects.filter(project =>
    (category === "All" || project.category === category) &&
    `${project.title} ${project.summary} ${project.stack.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );
  return <section id="projects" className="section-wrap section-block">
    <FeatureHeading eyebrow="SELECTED WORK" title={<>Projects that turn <span>ideas into systems.</span></>} text="Explore the project context and technical approach. Architecture views are explicitly marked conceptual where implementation diagrams were not supplied."/>
    <label className="search-field"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects or technologies" aria-label="Search projects"/></label>
    <div className="filter-row project-filters" aria-label="Filter projects by category">{categories.map(item => <button key={item} className={category === item ? "filter active" : "filter"} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="projects-grid">{visibleProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} onOpen={() => onOpenProject(project)}/>)}</div>
    {!visibleProjects.length && <p className="feature-state">No projects match that search.</p>}
  </section>;
}

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  return <article className={`project-card project-${index + 1}`}>
    <div className={`project-art art-${project.id}`}><div className="art-top"><span>CASE STUDY / {String(index + 1).padStart(2, "0")}</span><span>{project.year}</span></div>
      <div className="art-graphic">{project.id === "signalsync" ? <div className="traffic-graphic"><div className="road road-h"/><div className="road road-v"/><div className="signal signal-one"><i/><i/><i/></div><div className="signal signal-two"><i/><i/><i/></div><div className="car car-a"/><div className="car car-b"/></div> : project.id === "awaz" ? <div className="wave-graphic">{Array.from({ length: 30 }, (_, n) => <i key={n} style={{ height: `${18 + Math.abs(Math.sin(n * .75)) * 70}%` }}/>)}</div> : <div className="abstract-graphic"><span>{project.title.slice(0, 1)}</span><i/><i/><i/></div>}</div>
      <div className="art-bottom"><span>{project.category.toUpperCase()}</span><span>{project.status.toUpperCase()}</span></div>
    </div>
    <div className="project-content"><div className="project-title-row"><div><span className="project-number">0{index + 1} / FEATURED PROJECT</span><h3>{project.title}</h3></div><button className="round-arrow" onClick={onOpen} aria-label={`View ${project.title} case study`}><ArrowUpRight/></button></div>
      <p>{project.summary}</p><div className="project-stack">{project.stack.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>
      <div className="project-links"><button onClick={onOpen}>Explore case study <ChevronRight size={15}/></button>{project.github && <a href={project.github} target="_blank" rel="noreferrer">Inspect GitHub repository <ExternalLink size={13}/></a>}</div>
      {project.demo && <a className="text-link" href={project.demo} target="_blank" rel="noreferrer">Open live deployment <ArrowUpRight size={14}/></a>}
    </div>
  </article>;
}

export function ArchitectureDiagram({ project }: { project: Project }) {
  const [selectedStep, setSelectedStep] = useState(0);
  return <div className="architecture-panel">
    <div className="feature-card-heading"><div><span className="eyebrow">SYSTEM OVERVIEW</span><h3>Architecture flow</h3></div><Layers3 size={18}/></div>
    <div className="architecture-flow" aria-label={project.architecture.join(" then ")}>
      {project.architecture.map((step, index) => <button className={`architecture-step ${selectedStep === index ? "selected" : ""}`} aria-pressed={selectedStep === index} onClick={() => setSelectedStep(index)} key={step}><span className="architecture-index">0{index + 1}</span><strong>{step}</strong>{index < project.architecture.length - 1 && <ChevronRight className="architecture-arrow" size={17}/>}</button>)}
    </div>
    <p className="architecture-description" aria-live="polite"><strong>Step {selectedStep + 1}: {project.architecture[selectedStep]}.</strong> {project.architectureNote}</p>
  </div>;
}

export function RecruiterMode({ onClose }: { onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="recruiter-modal" role="dialog" aria-modal="true" aria-labelledby="recruiter-title">
      <button ref={closeButton} className="modal-close icon-button" onClick={onClose} aria-label="Close recruiter mode"><X/></button>
      <span className="eyebrow">RECRUITER MODE</span><h2 id="recruiter-title">{profile.shortName}</h2><p>{profile.role} · {profile.location}</p>
      <p className="muted-copy">{profile.summary}</p>
      <h3>Skills overview</h3><div className="skill-tags">{skillGroups.flatMap(group => group.items).map(skill => <span key={skill}>{skill}</span>)}</div>
      <h3>Education</h3>{education.map(item => <div className="recruiter-education" key={item.institution}><GraduationCap size={19}/><div><strong>{item.degree}</strong><span>{item.institution}</span><span>{item.period} · {item.result}</span></div></div>)}
      <div className="recruiter-actions"><a className="button button-primary" href="/api/resume" download>Download resume <Download size={16}/></a><a className="button button-secondary" href={`mailto:${profile.email}`}>Contact Atharav <ArrowUpRight size={16}/></a></div>
      <details className="resume-preview"><summary>Preview resume</summary><iframe title="Resume PDF preview" src={`${profile.resumePath}#toolbar=0`} loading="lazy"/></details>
      <p className="form-note">Download counts are recorded by the portfolio backend. Skills and education reflect the portfolio content.</p>
    </section>
  </div>;
}

type CommandEntry = { command: string; description: string; action: () => void };
const terminalSuggestions = ["help", "about", "skills", "projects", "github", "resume", "contact"];
const syntheticObservations = [
  { studyHours: 1, practiceScore: 38 }, { studyHours: 2, practiceScore: 45 },
  { studyHours: 3, practiceScore: 51 }, { studyHours: 4, practiceScore: 63 },
  { studyHours: 5, practiceScore: 66 }, { studyHours: 6, practiceScore: 78 }
];

export function DeveloperTerminal() {
  const [history, setHistory] = useState<Array<{ command: string; output: ReactNode }>>([]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commands: Record<string, CommandEntry> = {
    about: { command: "about", description: "About Atharav", action: () => {} },
    skills: { command: "skills", description: "Show skill areas", action: () => {} },
    projects: { command: "projects", description: "Jump to projects", action: () => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }) },
    github: { command: "github", description: "Open GitHub profile", action: () => window.open(profile.github, "_blank", "noopener,noreferrer") },
    resume: { command: "resume", description: "Open resume PDF", action: () => window.open("/api/resume", "_blank", "noopener,noreferrer") },
    contact: { command: "contact", description: "Jump to contact", action: () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }) }
  };

  const runCommand = (input: string) => {
    const command = input.trim().toLowerCase();
    if (!command) return;
    let output: ReactNode;
    if (command === "help") output = <span>Available commands: {terminalSuggestions.join(", ")}</span>;
    else if (commands[command]) {
      commands[command].action();
      if (command === "about") output = <span>{profile.summary}</span>;
      else if (command === "skills") output = <span>{skillGroups.map(group => `${group.category}: ${group.items.join(", ")}`).join(" · ")}</span>;
      else if (command === "projects") output = <span>Opening project showcase…</span>;
      else if (command === "github") output = <span>Opening {profile.github}…</span>;
      else if (command === "resume") output = <span>Opening resume…</span>;
      else output = <span>Opening contact section…</span>;
    } else output = <span>Unknown command. Try <button className="inline-command" onClick={() => runCommand("help")}>help</button>.</span>;
    setHistory(items => [...items, { command: input, output }].slice(-8));
    setValue("");
  };
  const submit = (event: FormEvent) => { event.preventDefault(); runCommand(value); };

  return <section id="terminal" className="section-wrap section-block">
    <FeatureHeading eyebrow="DEVELOPER TERMINAL" title={<>A small command line, <span>for curious minds.</span></>} text="Try the supported shortcuts below. Commands navigate to real portfolio sections and links."/>
    <div className="terminal-window"><div className="terminal-title"><span><i/><i/><i/></span><span><Terminal size={14}/> atharav@portfolio:~</span><button onClick={() => setHistory([])} aria-label="Clear terminal output">Clear</button></div>
      <div className="terminal-output" aria-live="polite"><p className="terminal-welcome">Type <button className="inline-command" onClick={() => runCommand("help")}>help</button> to see available commands.</p>
        {history.map((item, index) => <div className="terminal-entry" key={`${index}-${item.command}`}><p><span>$</span> {item.command}</p><div>{item.output}</div></div>)}
      </div>
      <form className="terminal-input-row" onSubmit={submit}><label htmlFor="terminal-command">$</label><input id="terminal-command" ref={inputRef} value={value} onChange={event => setValue(event.target.value)} autoComplete="off" spellCheck={false} aria-label="Terminal command"/><button type="submit" className="sr-only">Run command</button></form>
      <div className="terminal-suggestions">{terminalSuggestions.map(command => <button key={command} onClick={() => runCommand(command)}>{command}</button>)}</div>
    </div>
  </section>;
}

const demoPoints = [
  { x: 15, y: 25, group: "A" }, { x: 22, y: 42, group: "A" }, { x: 34, y: 18, group: "A" }, { x: 29, y: 31, group: "A" },
  { x: 66, y: 73, group: "B" }, { x: 75, y: 62, group: "B" }, { x: 83, y: 81, group: "B" }, { x: 72, y: 87, group: "B" }
];

export function EngineeringLab() {
  const [neighborCount, setNeighborCount] = useState(3);
  const [queryPoint, setQueryPoint] = useState({ x: 53, y: 48 });
  const [imageUrl, setImageUrl] = useState("");
  const [visionError, setVisionError] = useState("");
  const [edgeImageUrl, setEdgeImageUrl] = useState("");
  const [streamValues, setStreamValues] = useState<number[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nearest = [...demoPoints].sort((a, b) =>
    Math.hypot(a.x - queryPoint.x, a.y - queryPoint.y) - Math.hypot(b.x - queryPoint.x, b.y - queryPoint.y)
  ).slice(0, neighborCount);
  const predictedGroup = nearest.filter(point => point.group === "A").length > nearest.filter(point => point.group === "B").length ? "A" : "B";
  const meanHours = syntheticObservations.reduce((total, point) => total + point.studyHours, 0) / syntheticObservations.length;
  const meanScore = syntheticObservations.reduce((total, point) => total + point.practiceScore, 0) / syntheticObservations.length;
  const covariance = syntheticObservations.reduce((total, point) => total + (point.studyHours - meanHours) * (point.practiceScore - meanScore), 0);
  const varianceHours = syntheticObservations.reduce((total, point) => total + (point.studyHours - meanHours) ** 2, 0);
  const varianceScore = syntheticObservations.reduce((total, point) => total + (point.practiceScore - meanScore) ** 2, 0);
  const correlation = covariance / Math.sqrt(varianceHours * varianceScore);

  useEffect(() => {
    const timer = window.setInterval(() => setStreamValues(values => [...values.slice(-23), 25 + Math.round(Math.random() * 70)]), 1200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !imageRef.current) return;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 520 / image.naturalWidth, 300 / image.naturalHeight);
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) { setVisionError("This browser could not create an image-processing canvas."); return; }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const source = context.getImageData(0, 0, canvas.width, canvas.height);
    const output = context.createImageData(canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const gray = new Float32Array(width * height);
    for (let index = 0; index < gray.length; index += 1) {
      const pixel = index * 4;
      gray[index] = .299 * source.data[pixel] + .587 * source.data[pixel + 1] + .114 * source.data[pixel + 2];
    }
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const gx = -gray[index - width - 1] + gray[index - width + 1] - 2 * gray[index - 1] + 2 * gray[index + 1] - gray[index + width - 1] + gray[index + width + 1];
        const gy = -gray[index - width - 1] - 2 * gray[index - width] - gray[index - width + 1] + gray[index + width - 1] + 2 * gray[index + width] + gray[index + width + 1];
        const edge = Math.min(255, Math.hypot(gx, gy));
        const pixel = index * 4;
        output.data[pixel] = edge;
        output.data[pixel + 1] = edge;
        output.data[pixel + 2] = edge;
        output.data[pixel + 3] = 255;
      }
    }
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = width;
    outputCanvas.height = height;
    outputCanvas.getContext("2d")?.putImageData(output, 0, 0);
    setEdgeImageUrl(outputCanvas.toDataURL("image/png"));
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setVisionError("Choose an image file under 8 MB.");
      return;
    }
    setVisionError("");
    setEdgeImageUrl("");
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { imageRef.current = image; setImageUrl(objectUrl); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); setVisionError("The selected image could not be opened."); };
    image.src = objectUrl;
  };

  const selectQuery = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setQueryPoint({
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    });
  };

  return <section id="lab" className="section-wrap section-block">
    <FeatureHeading eyebrow="ENGINEERING LAB" title={<>Small experiments, <span>real code.</span></>} text="Interactive browser-only demonstrations. The generated examples are synthetic and are not project performance claims."/>
    <div className="lab-grid">
      <article className="lab-card"><span className="eyebrow">MACHINE LEARNING · SYNTHETIC DATA</span><h3>Nearest-neighbor classifier</h3><p>Click the plot to move a query point and adjust k to classify it against the fixed sample points.</p>
        <svg className="knn-chart" viewBox="0 0 100 100" role="application" aria-label="Click to classify a point among synthetic samples" onClick={selectQuery}>
          <rect x="0" y="0" width="100" height="100" rx="4" fill="var(--surface2)"/>
          {demoPoints.map((point, index) => <circle key={index} cx={point.x} cy={100 - point.y} r="3" fill={point.group === "A" ? "var(--accent)" : "var(--accent-2)"}/>)}
          <circle cx={queryPoint.x} cy={100 - queryPoint.y} r="5" fill="none" stroke="var(--text)" strokeWidth="1.5"/><text x="5" y="10" fill="var(--accent)" fontSize="4">CLASS A</text><text x="73" y="95" fill="var(--accent-2)" fontSize="4">CLASS B</text>
        </svg>
        <label className="range-label">Neighbors (k): {neighborCount}<input type="range" min="1" max="7" step="2" value={neighborCount} onChange={event => setNeighborCount(Number(event.target.value))}/></label>
        <p className="lab-result">Predicted class: <strong>Class {predictedGroup}</strong></p>        <CodeSample language="typescript" code={`const nearest = points\n  .sort((a, b) => distance(a, query) - distance(b, query))\n  .slice(0, k);`} />
      </article>
      <article className="lab-card"><span className="eyebrow">COMPUTER VISION · LOCAL IMAGE</span><h3>Sobel edge detection</h3><p>Select an image to run a basic Sobel filter in this browser. The image is not uploaded.</p>
        <input ref={uploadRef} className="sr-only" type="file" accept="image/*" onChange={handleImage}/>
        <button className="button button-secondary" onClick={() => uploadRef.current?.click()}>Choose local image <ArrowDownRight size={15}/></button>
        {visionError && <p className="feature-error" role="alert">{visionError}</p>}
        {imageUrl ? <div className="vision-results"><img src={imageUrl} alt="Your selected image"/>{edgeImageUrl && <img src={edgeImageUrl} alt="Sobel edge detection result"/>}</div> : <div className="vision-placeholder">Image preview and edge map appear here</div>}
        <canvas ref={canvasRef} className="sr-only"/>
      </article>
      <article className="lab-card"><span className="eyebrow">DATA SCIENCE · SIMULATED</span><h3>Live synthetic data stream</h3><p>Illustrative generated values update locally; they are not sourced from a sensor or external system.</p>
        <svg className="stream-chart" viewBox="0 0 300 100" role="img" aria-label={`Synthetic streaming values: ${streamValues.join(", ")}`}><polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={streamValues.map((value, index) => `${index * 13},${95 - value * .8}`).join(" ")}/></svg>
        <div className="stream-caption"><span className="pulse-dot"/> Simulated · {streamValues.length} recent samples</div>
      </article>
      <article className="lab-card"><span className="eyebrow">DATA SCIENCE · SYNTHETIC DATA</span><h3>Correlation exploration</h3><p>Descriptive statistics over a small, fixed illustrative dataset (study hours and practice scores).</p>
        <svg className="stream-chart" viewBox="0 0 300 110" role="img" aria-label="Scatter plot of six synthetic study-hour and practice-score examples">
          <line x1="30" y1="88" x2="285" y2="88" stroke="var(--line)"/><line x1="30" y1="10" x2="30" y2="88" stroke="var(--line)"/>
          {syntheticObservations.map(point => <circle key={point.studyHours} cx={30 + point.studyHours * 35} cy={88 - point.practiceScore * .8} r="4" fill="var(--accent)"/>)}
          <text x="110" y="105" fill="var(--muted)" fontSize="8">Study hours</text><text x="3" y="9" fill="var(--muted)" fontSize="7">Score</text>
        </svg>
        <p className="lab-result">Pearson correlation: <strong>{correlation.toFixed(2)}</strong> · {syntheticObservations.length} illustrative records</p>
        <p className="form-note">Correlation is not evidence of causation; these are synthetic values, not personal or real-world data.</p>
      </article>
      <article className="lab-card"><span className="eyebrow">CODING EXPERIMENT</span><h3>Distance function</h3><p>The Euclidean distance function used by the nearest-neighbor example above.</p>
        <CodeSample language="typescript" code={`function distance(a: Point, b: Point) {\n  const dx = a.x - b.x;\n  const dy = a.y - b.y;\n  return Math.hypot(dx, dy);\n}`} />
        <p className="form-note">The plot uses an explicit, fixed synthetic sample set so the result is reproducible.</p>
      </article>
    </div>
  </section>;
}

export function LearningDashboard() {
  return <section id="learning" className="section-wrap section-block">
    <FeatureHeading eyebrow="LEARNING DASHBOARD" title={<>Always learning, <span>building with intent.</span></>} text="Current focus areas are editable portfolio content; no completion percentages or unverified milestones are implied."/>
    <div className="learning-grid">{learningAreas.map(area => <article className="learning-card" key={area.title}><span className="eyebrow">{area.status}</span><h3>{area.title}</h3><p>{area.detail}</p></article>)}</div>
    <h3 className="subsection-title">Project status</h3><div className="progress-list">{projects.map(project =>     <div className="progress-row" key={project.id}><span>{project.title}</span><span className="progress-state"><i/>{project.status}</span><small>Portfolio status</small></div>)}</div>
    <h3 className="subsection-title">Credential links</h3><div className="milestone-list">{certifications.filter(cert => cert.url).map(cert => <a key={cert.name} href={cert.url} target="_blank" rel="noreferrer"><Check size={16}/><span>{cert.name}</span><small>Verification link available</small><ExternalLink size={14}/></a>)}</div>
    {!certifications.some(cert => cert.url) && <p className="feature-state">No certificate verification links have been added.</p>}
  </section>;
}

function highlightCode(code: string, language: string): ReactNode[] {
  const escaped = code;
  const tokenPattern = /(\/\/[^\n]*|#[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|def|print|True|False|None|type|interface)\b|\b\d+(?:\.\d+)?\b)/g;
  return escaped.split(tokenPattern).filter(Boolean).map((part, index) => {
    const className = /^(\/\/|#)/.test(part) ? "code-comment"
      : /^(["'`])/.test(part) ? "code-string"
      : /^\d/.test(part) ? "code-number"
      : /^(const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|def|print|True|False|None|type|interface)$/.test(part) ? "code-keyword" : "";
    return className ? <span className={className} key={index}>{part}</span> : part;
  });
}

function CodeSample({ language, code }: { language: string; code: string }) {
  return <pre className="code-sample"><span>{language}</span><code>{highlightCode(code, language)}</code></pre>;
}

export function TechnicalBlog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedSlug, setSelectedSlug] = useState("");
  const categories = ["All", ...new Set(articles.map(article => article.category))];
  const filtered = articles.filter(article =>
    (category === "All" || article.category === category) &&
    `${article.title} ${article.excerpt} ${article.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  );
  const activeArticle = articles.find(article => article.slug === selectedSlug);

  useEffect(() => {
    const syncHash = () => setSelectedSlug(window.location.hash.startsWith("#blog/") ? decodeURIComponent(window.location.hash.slice(6)) : "");
    syncHash();
    window.addEventListener("popstate", syncHash);
    window.addEventListener("hashchange", syncHash);
    return () => { window.removeEventListener("popstate", syncHash); window.removeEventListener("hashchange", syncHash); };
  }, []);
  useEffect(() => {
    if (!activeArticle) return;
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") || "";
    document.title = `${activeArticle.title} | ${profile.shortName}`;
    description?.setAttribute("content", activeArticle.excerpt);
    return () => {
      document.title = previousTitle;
      description?.setAttribute("content", previousDescription);
    };
  }, [activeArticle]);

  const openArticle = (article: Article) => {
    setSelectedSlug(article.slug);
    window.history.pushState(null, "", `#blog/${encodeURIComponent(article.slug)}`);
  };
  const closeArticle = () => {
    setSelectedSlug("");
    window.history.pushState(null, "", "#blog");
  };

  return <section id="blog" className="section-wrap section-block">
    <FeatureHeading eyebrow="TECHNICAL BLOG" title={<>Notes from the <span>build process.</span></>} text="Articles will appear here when you add them to the central portfolio data. No placeholder posts are published."/>
    {activeArticle ? <ArticleView article={activeArticle} onBack={closeArticle}/> : <>
      <label className="search-field"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles, categories, or tags" aria-label="Search blog articles"/></label>
      {articles.length > 0 && <div className="filter-row">{categories.map(item => <button key={item} className={category === item ? "filter active" : "filter"} onClick={() => setCategory(item)}>{item}</button>)}</div>}
      {filtered.length ? <div className="article-grid">{filtered.map(article => <button className="article-card" key={article.slug} onClick={() => openArticle(article)}><span className="eyebrow">{article.category}</span><h3>{article.title}</h3><p>{article.excerpt}</p><div><span>{readingTime(article)} min read</span><span>{new Date(article.publishedAt).toLocaleDateString()}</span><ArrowUpRight size={15}/></div></button>)}</div>
        : <div className="blog-empty"><BookOpen size={24}/><h3>No articles published yet</h3><p>Add an article to the <code>articles</code> array in <code>src/data.ts</code>. Search, categories, reading time, individual article pages and code highlighting are ready.</p></div>}
    </>}
  </section>;
}

function readingTime(article: Article) {
  const words = article.blocks.reduce((total, block) => total + ("text" in block ? block.text : "code" in block ? block.code : "").split(/\s+/).length, 0);
  return Math.max(1, Math.ceil(words / 220));
}

function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  return <article className="article-view"><button className="filter" onClick={onBack}>← All articles</button><span className="eyebrow">{article.category} · {readingTime(article)} min read</span><h3>{article.title}</h3><p className="article-meta">{new Date(article.publishedAt).toLocaleDateString()} · {article.tags.join(" · ")}</p>
    {article.blocks.map((block, index) => <ArticleContent key={index} block={block}/>)}
  </article>;
}

function ArticleContent({ block }: { block: ArticleBlock }) {
  if (block.type === "heading") return <h4>{block.text}</h4>;
  if (block.type === "code") return <CodeSample language={block.language} code={block.code}/>;
  return <p>{block.text}</p>;
}

export type PaletteAction = { label: string; detail: string; action: () => void };
export function CommandPalette({ open, onClose, actions }: { open: boolean; onClose: () => void; actions: PaletteAction[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQuery(""); inputRef.current?.focus(); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  if (!open) return null;
  const matches = actions.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="modal-backdrop palette-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
      <label><Search size={17}/><input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search sections and actions…" aria-label="Search commands"/><kbd>ESC</kbd><button className="palette-close" onClick={onClose} aria-label="Close command palette"><X size={15}/></button></label>
      <div className="palette-results">{matches.map(item => <button key={item.label} onClick={() => { onClose(); item.action(); }}><Command size={15}/><span>{item.label}<small>{item.detail}</small></span><ChevronRight size={15}/></button>)}</div>
      {!matches.length && <p className="feature-state">No matching actions.</p>}
    </div>
  </div>;
}

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<{
    eventCounts: Array<{ type: string; count: number }>;
    projectEngagement: Array<{ projectId: string; views: number }>;
    submissions: Array<{ id: number; name: string; email: string; subject: string; message: string; createdAt: string }>;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) throw new Error(response.status === 401 ? "Admin session expired. Sign in again." : "Could not load analytics.");
      setDashboard(await response.json());
      setAuthenticated(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load analytics.");
      setAuthenticated(false);
    } finally { setLoading(false); }
  };

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Admin sign-in failed.");
      setPassword("");
      await loadDashboard();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Admin sign-in failed.");
    } finally { setLoading(false); }
  };

  const signOut = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setDashboard(null);
    } catch {
      setError("Sign-out failed. Close the browser to clear the secure session.");
    }
  };

  const deleteSubmission = async (id: number) => {
    if (!window.confirm("Delete this contact submission permanently?")) return;
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not delete the submission.");
      }
      setDashboard(current => current ? { ...current, submissions: current.submissions.filter(item => item.id !== id) } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete the submission.");
    } finally { setDeletingId(null); }
  };

  return <section id="admin" className="section-wrap admin-section">
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary>Private admin · analytics and contact submissions</summary>
      <p className="form-note">Private metrics are visible only after server-side authentication. Event totals cover the last 30 days; contact details are private.</p>
      {!authenticated ? <form className="admin-login" onSubmit={signIn}><label>Admin password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required/></label><button className="button button-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form>
        : <div className="admin-dashboard"><div className="feature-card-heading"><h3>Private dashboard</h3><button className="filter" onClick={signOut}>Sign out</button></div>
          {loading && <p role="status">Refreshing private data…</p>}
          {dashboard && <>
            <div className="analytics-counts">{dashboard.eventCounts.map(item => <div key={item.type}><strong>{item.count}</strong><span>{item.type.replace(/_/g, " ")}</span></div>)}</div>
            <h4>Project engagement · 30 days</h4>{dashboard.projectEngagement.map(item => <p className="admin-row" key={item.projectId}><span>{projects.find(project => project.id === item.projectId)?.title || item.projectId}</span><strong>{item.views} views</strong></p>)}
            {!dashboard.projectEngagement.length && <p className="form-note">No project views recorded yet.</p>}
            <h4>Contact submissions</h4>            {dashboard.submissions.map(item => <article className="submission-card" key={item.id}><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><time>{new Date(item.createdAt).toLocaleString()}</time><button className="filter" disabled={deletingId === item.id} onClick={() => deleteSubmission(item.id)}>{deletingId === item.id ? "Deleting…" : "Delete"}</button></div><b>{item.subject}</b><p>{item.message}</p></article>)}
            {!dashboard.submissions.length && <p className="form-note">No contact submissions received yet.</p>}
          </>}
        </div>}
      {error && <p className="feature-error" role="alert">{error}</p>}
    </details>
  </section>;
}

function FeatureHeading({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text?: string }) {
  return <div className="section-heading feature-heading"><span className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

export function FeatureNavigation() {
  const items = [
    ["github", "GitHub"], ["lab", "Engineering Lab"], ["terminal", "Terminal"],
    ["learning", "Learning"], ["blog", "Blog"]
  ];
  return <div className="feature-navigation">{items.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</div>;
}
