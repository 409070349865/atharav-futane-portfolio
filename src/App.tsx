import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowDown, ArrowDownRight, ArrowUpRight, Github, Linkedin,
  Mail, MapPin, Menu, Moon, Sun, X, Code2, Database, BrainCircuit,
  GraduationCap, Award, ExternalLink, Copy, Check, Search, BriefcaseBusiness,
  Send, Sparkles, Terminal, Layers3, ChevronRight
} from "lucide-react";
import { profile, navigation, stats, skillGroups, certifications, education, contactTopics, type Project } from "./data";
import {
  AdminPanel, ArchitectureDiagram, CommandPalette, DeveloperTerminal, EngineeringLab,
  FeatureNavigation, GitHubShowcase, LearningDashboard, ProjectShowcase, RecruiterMode,
  TechnicalBlog, type PaletteAction
} from "./FeatureSections";
import PortfolioAssistant from "./PortfolioAssistant";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text?: string }) {
  return <motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="section-heading">
    <span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span>
    <h2>{title}</h2>{text && <p>{text}</p>}
  </motion.div>;
}

function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("portfolio.theme") !== "light"; }
    catch { return true; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState("All");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [recruiterModeOpen, setRecruiterModeOpen] = useState(false);
  const pageViewTracked = useRef(false);
  const projectCloseButton = useRef<HTMLButtonElement>(null);
  const roles = ["Python Developer", "AI & Data Science Enthusiast", "Full-Stack Developer", "Problem Solver"];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setRoleIndex(i => (i + 1) % roles.length), 2600);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("portfolio.theme", dark ? "dark" : "light"); }
    catch { /* The theme remains available for this session without storage. */ }
  }, [dark]);
  useEffect(() => {
    if (pageViewTracked.current) return;
    pageViewTracked.current = true;
    const trackPageView = async () => {
      try {
        const response = await fetch("/api/analytics", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "page_view" })
        });
        if (!response.ok) throw new Error(`Analytics endpoint returned HTTP ${response.status}.`);
      } catch (error) {
        console.warn("Portfolio page analytics could not be recorded.", error);
      }
    };
    void trackPageView();
  }, []);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  useEffect(() => {
    if (!activeProject) return;
    projectCloseButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveProject(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeProject]);

  const skillCategories = ["All", ...skillGroups.map(g => g.category)];
  const visibleSkills = useMemo(() => activeSkill === "All" ? skillGroups : skillGroups.filter(g => g.category === activeSkill), [activeSkill]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch { window.location.href = `mailto:${profile.email}`; }
  };

  const handleContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const subject = String(form.get("subject") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (!name || !email || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormStatus("Please complete every field with a valid email address."); return;
    }
    setFormStatus("Submitting your message…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website: String(form.get("website") || "") })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be submitted.");
      setFormStatus(result.message || "Your message was saved.");
      formElement.reset();
    } catch (error) {
      setFormStatus(error instanceof Error ? error.message : "Your message could not be submitted. Please email me directly.");
    }
  };

  const openProject = (project: Project) => {
    setActiveProject(project);
    void fetch("/api/analytics", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project_view", projectId: project.id })
    }).then(response => {
      if (!response.ok) throw new Error(`Analytics endpoint returned HTTP ${response.status}.`);
    }).catch(error => console.warn("Project engagement could not be recorded.", error));
  };

  const closeMenu = () => setMenuOpen(false);
  const paletteActions: PaletteAction[] = [
    ...navigation.map(item => ({ label: `Go to ${item.label}`, detail: item.href, action: () => { window.location.hash = item.href; document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" }); } })),
    ...[["GitHub", "github"], ["Engineering Lab", "lab"], ["Terminal", "terminal"], ["Learning Dashboard", "learning"], ["Technical Blog", "blog"]].map(([label, id]) => ({
      label: `Go to ${label}`, detail: `#${id}`, action: () => { window.location.hash = id; document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }
    })),
    { label: "Recruiter mode", detail: "Resume, skills and education", action: () => setRecruiterModeOpen(true) },
    { label: "Download resume", detail: "Open the PDF resume", action: () => window.open("/api/resume", "_blank", "noopener,noreferrer") },
    { label: "Open terminal", detail: "Interactive portfolio commands", action: () => document.getElementById("terminal")?.scrollIntoView({ behavior: "smooth" }) }
  ];

  return <MotionConfig reducedMotion="user"><div className="site-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className={`site-header ${scrolled ? "header-scrolled" : ""}`}>
      <a className="brand" href="#home" onClick={closeMenu}><span className="brand-mark">AF<span>.</span></span><span className="brand-name">ATHARAV FUTANE</span></a>
      <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
        {navigation.map(item => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>)}
        <button className="nav-palette-link" onClick={() => { closeMenu(); setCommandPaletteOpen(true); }}><Search size={14}/> Search portfolio <kbd>Ctrl K</kbd></button>
      </nav>
      <div className="header-actions">
        <button className="icon-button command-trigger" aria-label="Open command palette (Control or Command K)" onClick={() => setCommandPaletteOpen(true)}><Search size={16}/></button>
        <button className="icon-button theme-toggle" aria-label="Toggle color theme" onClick={() => setDark(v => !v)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <a className="header-cta" href="#contact">Let's talk <ArrowUpRight size={15}/></a>
        <button className="icon-button menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X/> : <Menu/>}</button>
      </div>
    </header>

    <main>
      <section id="home" className="hero section-wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }} className="availability"><span className="pulse-dot"/>{profile.availability}</motion.div>
            <motion.p className="hero-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}>HELLO, I'M</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .8 }}>{profile.fullName.split(" ").slice(0, 2).join(" ")}<br/><span>{profile.fullName.split(" ").slice(2).join(" ")}</span></motion.h1>
            <div className="role-line"><span className="role-prefix">I work as a</span><AnimatePresence mode="wait"><motion.span key={roleIndex} className="rotating-role" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .25 }}>{roles[roleIndex]}</motion.span></AnimatePresence></div>
            <p className="hero-description">{profile.headline} {profile.summary}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">Explore my work <ArrowUpRight size={17}/></a>
              <a className="button button-secondary" href={profile.resumePath} target="_blank" rel="noreferrer">View resume <ArrowDownRight size={17}/></a>
              <button className="button button-secondary" onClick={() => setRecruiterModeOpen(true)}>Recruiter mode <BriefcaseBusiness size={16}/></button>
            </div>
            <div className="hero-socials">
              <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17}/><span>GitHub</span></a>
              {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17}/><span>LinkedIn</span></a>}
              <button onClick={copyEmail} aria-label="Copy email"><Mail size={17}/><span>{copied ? "Copied!" : "Email"}</span></button>
            </div>
          </div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .45, duration: .8 }}>
            <div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/>
            <div className="visual-card">
              <div className="visual-card-top"><span>PERSONAL PROFILE / 001</span><span className="live-indicator">● AVAILABLE</span></div>
              {profile.portrait ? <img className="profile-photo" src={profile.portrait} alt={`${profile.fullName} portrait`}/> :
                <div className="monogram-art"><div className="monogram-grid"/><span>AF</span><i>BUILD<br/>THINK<br/>CREATE</i></div>}
              <div className="visual-card-bottom"><div><strong>{profile.shortName}</strong><span>{profile.role}</span></div><span className="visual-index">01 / 04</span></div>
            </div>
            <div className="floating-chip chip-code"><Terminal size={15}/> Python / AI</div>
            <div className="floating-chip chip-data"><Database size={15}/> Data-driven</div>
            <div className="visual-caption">ENGINEERING IDEAS INTO REALITY <ArrowDownRight size={15}/></div>
          </motion.div>
        </div>
        <div className="hero-bottom"><span><MapPin size={14}/> {profile.location}</span><a href="#about">SCROLL TO EXPLORE <ArrowDown size={14}/></a><span>PORTFOLIO — 2026</span></div>
      </section>

      <section id="about" className="section-wrap section-block">
        <SectionHeading eyebrow="A LITTLE ABOUT ME" title={<>Curiosity into code.<br/><span>Ideas into impact.</span></>} text="A builder's mindset, a learner's curiosity, and a constant drive to make technology useful."/>
        <div className="about-layout">
          <div className="about-main"><span className="large-quote">“</span><p className="about-lead">{profile.summary}</p><p className="muted-copy">I enjoy exploring how software, data and intelligent systems can solve practical problems. I value clean implementation, continuous learning and building projects that move beyond theory into working prototypes.</p><a className="text-link" href="#contact">Let's create something meaningful <ArrowUpRight size={16}/></a></div>
          <div className="about-side">
            <div className="about-info-card"><span className="card-icon"><Code2/></span><div><small>FOCUS AREAS</small><strong>Python · AI · Data Science</strong><p>Building practical, data-informed applications.</p></div></div>
            <div className="about-info-card"><span className="card-icon"><GraduationCap/></span><div><small>EDUCATION</small><strong>B.Tech, Computer Science</strong><p>SGGS Institute of Engineering & Technology, Nanded.</p></div></div>
            <div className="about-info-card"><span className="card-icon"><MapPin/></span><div><small>BASED IN</small><strong>{profile.location}</strong><p>Interested in opportunities and collaboration.</p></div></div>
          </div>
        </div>
        <div className="stats-row">{stats.map((stat, i) => <div className="stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.note}</small></div>)}</div>
      </section>

      <section id="skills" className="section-wrap section-block">
        <SectionHeading eyebrow="MY TOOLKIT" title={<>Skills built through <span>practice.</span></>} text="A growing toolkit across software engineering, data analytics and intelligent applications."/>
        <div className="filter-row skill-filters">{skillCategories.map(category => <button key={category} className={activeSkill === category ? "filter active" : "filter"} onClick={() => setActiveSkill(category)}>{category}</button>)}</div>
        <div className="skills-grid">{visibleSkills.map((group, index) => <motion.article layout key={group.category} className="skill-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }}>
          <div className="skill-card-head"><span className="skill-icon">{index % 3 === 0 ? <Code2/> : index % 3 === 1 ? <BrainCircuit/> : <Layers3/>}</span><span className="mono">0{skillGroups.findIndex(g => g.category === group.category) + 1}</span></div>
          <h3>{group.category}</h3><div className="skill-tags">{group.items.map(item => <span key={item}>{item}</span>)}</div>
        </motion.article>)}</div>
        <p className="note-line"><Sparkles size={14}/> Skills are listed as areas of experience and exploration; no unverified proficiency percentages are displayed.</p>
      </section>

      <ProjectShowcase onOpenProject={openProject}/>
      <GitHubShowcase/>
      <EngineeringLab/>

      <section id="certifications" className="section-wrap section-block">
        <SectionHeading eyebrow="CONTINUOUS LEARNING" title={<>Credentials & <span>certifications.</span></>} text="Courses and credentials that support my ongoing learning in AI, analytics and programming."/>
        <div className="cert-grid">{certifications.map((cert, i) => <article className="cert-card" key={cert.name}><div className="cert-top"><span className="cert-icon"><Award/></span><span className="mono">{cert.year}</span></div><h3>{cert.name}</h3><p className="cert-issuer">{cert.issuer}</p><p>{cert.detail}</p>{cert.url ? <a href={cert.url} target="_blank" rel="noreferrer" className="text-link">Verify credential <ExternalLink size={14}/></a> : <span className="verify-pending">Verification link not added</span>}</article>)}</div>
        {profile.linkedin && <a className="text-link" href={profile.linkedin} target="_blank" rel="noreferrer">View my LinkedIn certifications <ExternalLink size={14}/></a>}
      </section>

      <section id="education" className="section-wrap section-block">
        <SectionHeading eyebrow="ACADEMIC FOUNDATION" title={<>Learning with a <span>strong foundation.</span></>}/>
        {education.map((edu, i) => <div className="education-card" key={edu.institution}><div className="education-symbol"><GraduationCap size={28}/></div><div className="education-details"><span className="eyebrow">UNDERGRADUATE EDUCATION</span><h3>{edu.degree}</h3><h4>{edu.institution}</h4><p><MapPin size={14}/>{edu.location}</p><div className="education-meta"><span>{edu.period}</span><span>{edu.minor} minor</span><strong>{edu.result}</strong></div></div></div>)}
      </section>
      <LearningDashboard/>
      <TechnicalBlog/>
      <DeveloperTerminal/>

      <section id="contact" className="section-wrap section-block contact-section">
        <div className="contact-heading"><SectionHeading eyebrow="LET'S CONNECT" title={<>Have an idea?<br/><span>Let's build it.</span></>} text="I'm open to discussing internship opportunities, interesting projects and meaningful collaborations."/></div>
        <div className="contact-layout"><div className="contact-details"><a className="contact-line" href={`mailto:${profile.email}`}><span className="contact-icon"><Mail/></span><span><small>EMAIL ME</small><strong>{profile.email}</strong></span><ArrowUpRight/></a><div className="contact-line"><span className="contact-icon"><MapPin/></span><span><small>LOCATION</small><strong>{profile.location}</strong></span></div><a className="contact-line" href={profile.github} target="_blank" rel="noreferrer"><span className="contact-icon"><Github/></span><span><small>CODE & PROJECTS</small><strong>GitHub profile</strong></span><ArrowUpRight/></a>
          {profile.linkedin && <a className="contact-line" href={profile.linkedin} target="_blank" rel="noreferrer"><span className="contact-icon"><Linkedin/></span><span><small>PROFESSIONAL NETWORK</small><strong>LinkedIn profile</strong></span><ArrowUpRight/></a>}
          <button className="copy-email" onClick={copyEmail}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Email copied" : "Copy email address"}</button>
        </div>
        <form className="contact-form" onSubmit={handleContact}>
          <label className="honeypot-field" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <div className="form-row"><label>Your name<input name="name" placeholder="Name" required minLength={2}/></label><label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label></div>
          <label>What would you like to discuss?<select name="subject" defaultValue="" required><option value="" disabled>Select a topic</option>{contactTopics.map(topic => <option key={topic}>{topic}</option>)}</select></label>
          <label>Your message<textarea name="message" rows={5} placeholder="Tell me a little about your idea..." required minLength={10}/></label>
          <button className="button button-primary submit-button" type="submit">Send message securely <Send size={16}/></button>
          {formStatus && <p className="form-status" role="status">{formStatus}</p>}
          <p className="form-note">Messages are stored in the private portfolio database and visible only in the authenticated admin panel. You can email me directly instead.</p>
        </form></div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="footer-main"><div><a className="brand footer-brand" href="#home"><span className="brand-mark">AF<span>.</span></span><span className="brand-name">ATHARAV FUTANE</span></a><p>{profile.tagline}</p></div>
        <div className="footer-links"><div><small>EXPLORE</small><a href="#about">About</a><a href="#skills">Skills</a><a href="#projects">Projects</a><a href="#certifications">Certifications</a></div>
          <div><small>CONNECT</small><a href={profile.github} target="_blank" rel="noreferrer"><Github size={14}/> GitHub</a>{profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={14}/> LinkedIn</a>}<a href={`mailto:${profile.email}`}><Mail size={14}/> Email</a></div></div>
      </div>
      <div className="footer-feature-links"><span>MORE TO EXPLORE</span><FeatureNavigation/><a href="#admin">Private admin</a><button onClick={() => setCommandPaletteOpen(true)}>Open command palette <kbd>Ctrl K</kbd></button></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {profile.fullName}. All rights reserved.</span><a href="#home">BACK TO TOP <ArrowUpRight size={13}/></a><span>BUILT WITH INTENTION.</span></div>
    </footer>

    <button className={`back-top ${scrolled ? "show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ArrowUpRight/></button>

    <AnimatePresence>{activeProject && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) setActiveProject(null); }}>
      <motion.div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 25, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: .98 }} transition={{ duration: .25 }}>
        <button ref={projectCloseButton} className="modal-close icon-button" onClick={() => setActiveProject(null)} aria-label="Close project details"><X/></button><span className="eyebrow">PROJECT / {activeProject.year} / {activeProject.status}</span><h2 id="modal-title">{activeProject.title}</h2><p className="modal-description">{activeProject.description}</p>
        <div className="modal-columns"><div><h3>The challenge</h3><p>{activeProject.challenge}</p></div><div><h3>Approach</h3><p>{activeProject.solution}</p></div></div>
        <h3 className="modal-subhead">Key highlights</h3><ul className="highlight-list">{activeProject.highlights.map(item => <li key={item}><ChevronRight size={15}/>{item}</li>)}</ul>
        <div className="project-stack modal-stack">{activeProject.stack.map(tag => <span key={tag}>{tag}</span>)}</div>
        <ArchitectureDiagram project={activeProject}/>
        <h3 className="modal-subhead">Screenshots and code</h3>
        {activeProject.screenshots?.length ? <div className="case-study-screenshots">{activeProject.screenshots.map(source => <img key={source} src={source} alt={`${activeProject.title} project screenshot`} loading="lazy"/>)}</div> : <p className="form-note">No project screenshots have been supplied.</p>}
        {activeProject.codeExamples?.map((example, index) => <pre className="code-sample" key={index}><span>{example.language}</span><code>{example.code}</code></pre>)}
        {!activeProject.codeExamples?.length && <p className="form-note">No code examples have been supplied.</p>}
        <div className="project-modal-actions">
          {activeProject.github && <a className="button button-primary" href={activeProject.github} target="_blank" rel="noreferrer">Inspect GitHub repository <Github size={16}/></a>}
          {activeProject.demo && <a className="button button-secondary" href={activeProject.demo} target="_blank" rel="noreferrer">Open live deployment <ExternalLink size={15}/></a>}
          {!activeProject.demo && <span className="form-note">No verified live deployment URL has been supplied.</span>}
        </div>
      </motion.div>
    </motion.div>}</AnimatePresence>
    {recruiterModeOpen && <RecruiterMode onClose={() => setRecruiterModeOpen(false)}/>}
    <PortfolioAssistant/>
    <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} actions={paletteActions}/>
    <AdminPanel/>
  </div></MotionConfig>;
}

export default App;
