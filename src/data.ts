/**
 * PORTFOLIO CONTENT CONTROL PANEL
 * Edit this file to update your portfolio without changing layout code.
 * Keep URLs empty ("") until you have a verified public profile/deployment.
 */
export const profile = {
  fullName: "Atharav Arun Futane",
  shortName: "Atharav Futane",
  role: "Computer Science Engineer",
  location: "Wardha, Maharashtra, India",
  email: "atharavfutane@gmail.com",
  phone: "7559183864",
  headline: "Building intelligent solutions through code, data & innovation.",
  summary:
    "I am a Computer Science and Engineering student passionate about building intelligent applications, developing scalable software, and transforming complex problems into meaningful digital experiences. My work sits at the intersection of Python development, AI, data science and full-stack engineering.",
  availability: "Open to internships & meaningful collaborations",
  github: "https://github.com/409070349865",
  linkedin: "", // Add your exact LinkedIn profile URL.
  resumePath: "/Atharav_Futane_CV.pdf",
  // Optional: add a portrait image at public/profile.webp and set this to "/profile.webp".
  portrait: "",
  tagline: "Designed with purpose. Developed with passion. Built for impact."
};

export const navigation = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Certifications", href: "#certifications" },
  { label: "Education", href: "#education" },
  { label: "Contact", href: "#contact" }
];

export const stats = [
  { value: "02", label: "Featured projects", note: "Editable project count" },
  { value: "15+", label: "Tools & technologies", note: "Across multiple domains" },
  { value: "04", label: "Certifications", note: "Listed credentials" }
];

export const skillGroups = [
  { category: "Languages", items: ["Python", "Java", "C++", "JavaScript", "SQL"] },
  { category: "Frontend", items: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "React"] },
  { category: "Backend", items: ["Flask", "FastAPI", "Node.js", "Express.js", "REST APIs"] },
  { category: "Data & AI", items: ["Pandas", "NumPy", "Matplotlib", "Scikit-learn", "TensorFlow", "OpenCV", "Machine Learning", "NLP", "Predictive Modeling"] },
  { category: "Data Platforms", items: ["MongoDB", "SQLite", "PostgreSQL", "Power BI", "Tableau", "Excel"] },
  { category: "Tools & Systems", items: ["Git", "GitHub", "Docker", "Apache Kafka", "Apache Spark", "Jupyter Notebook", "VS Code", "Figma"] }
];

export type Project = {
  id: string; title: string; category: string; year: string; status: string;
  summary: string; description: string; stack: string[]; github?: string; demo?: string;
  challenge: string; solution: string; highlights: string[];
  architecture: string[];
  architectureNote: string;
  screenshots?: string[];
  codeExamples?: { language: string; code: string }[];
};

export const projects: Project[] = [
  {
    id: "signalsync", title: "Smart Traffic Signal System", category: "AI / Computer Vision",
    year: "2026", status: "In development",
    summary: "An adaptive traffic-signal prototype exploring computer vision and data-driven signal timing.",
    description: "SignalSync is designed to estimate traffic density from video input and support more responsive traffic-signal decisions. The current project foundation includes a Python/FastAPI application and video input from files, webcams and IP cameras.",
    stack: ["Python", "FastAPI", "OpenCV", "Computer Vision"],
    github: "https://github.com/409070349865/smart-traffic-signal-system",
    challenge: "Fixed signal schedules cannot respond intelligently to changing traffic density.",
    solution: "Build a modular video-processing foundation that can support vehicle detection, tracking, density estimation and adaptive control as the system evolves.",
    highlights: ["Video input from files, webcams and IP cameras", "FastAPI application foundation", "Structured for future detection, tracking and adaptive-control modules"],
    architecture: ["Video file / webcam / IP camera", "FastAPI application", "Video processing foundation", "Future detection and signal control"],
    architectureNote: "Conceptual flow from the supplied project description; future detection and control stages are planned, not confirmed as implemented."
  },
  {
    id: "awaz", title: "Awaz — Real-Time AI Voice Translator", category: "AI / Full Stack",
    year: "2026", status: "Project",
    summary: "A voice translation platform combining speech recognition, translation services and text-to-speech.",
    description: "A full-stack real-time voice translation platform integrating multiple translation engines with speech recognition and text-to-speech. The backend uses REST APIs and MongoDB persistence for translation history.",
    stack: ["Node.js", "Express.js", "MongoDB", "Web Speech API", "REST APIs"],
    github: "https://github.com/409070349865/Awaz-app",
    challenge: "Bring speech recognition, translation providers and spoken output together in one workflow.",
    solution: "Create a service-oriented backend with configurable translation providers and persistent translation history.",
    highlights: ["Four translation engine integrations described in the resume", "Speech recognition and text-to-speech workflow", "MongoDB-backed translation history"],
    architecture: ["Microphone / text input", "Node.js + Express REST API", "Translation providers", "Speech output + MongoDB history"],
    architectureNote: "Conceptual flow based on the supplied project summary; provider names and deployment details have not been independently verified."
  },
];

export const learningAreas = [
  { title: "Computer vision", detail: "Exploring video input and computer-vision foundations through the traffic-signal project.", status: "Current focus" },
  { title: "AI and machine learning", detail: "Continuing to build knowledge in AI, machine learning and practical applications.", status: "Ongoing learning" },
  { title: "Data science", detail: "Developing skills in data analysis, visualization and predictive modeling.", status: "Ongoing learning" }
];

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "code"; language: string; code: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  blocks: ArticleBlock[];
};

export const articles: Article[] = [];

export const certifications = [
  {
    name: "Building with Artificial Intelligence (CS205)",
    issuer: "Saylor University", year: "2026",
    detail: "Credential ID: 6795763790AF",
    url: "https://learn.saylor.org/pluginfile.php/1/tool_certificate/issues/1789282096/6795763790AF.pdf"
  },
  {
    name: "Career Essentials in Data Analysis",
    issuer: "Microsoft & LinkedIn Learning", year: "2024",
    detail: "Data analysis fundamentals, Excel analytics, Power BI and data storytelling.",
    url: "https://www.linkedin.com/learning/certificates/20e3faee8d98e1ef23748747a55ca52c514fcd9f5a9d2a8a5042c8c0214b74d4"
  },
  {
    name: "Learning Data Analytics: Foundations",
    issuer: "LinkedIn Learning", year: "2023",
    detail: "Data types, visualization and analytical thinking.",
    url: "https://www.linkedin.com/learning/certificates/1800b3671208cc77116eea264f3554c2d6c35b6125379b8e298d43b2184b4d6b"
  },
  {
    name: "The Data Science Course: Complete Data Science Bootcamp 2025",
    issuer: "Udemy", year: "2025",
    detail: "Credential ID: UC-7cb1b6ff-d012-44df-a950-8492951cb520.",
    url: "https://www.udemy.com/certificate/UC-7cb1b6ff-d012-44df-a950-8492951cb520/"
  }
];

export const education = [
  {
    institution: "Shri Guru Gobind Singhji Institute of Engineering & Technology",
    degree: "B.Tech — Computer Science and Engineering",
    period: "August 2023 – May 2027",
    location: "Nanded, Maharashtra",
    result: "6.21 / 10 CGPA",
    minor: "Data Science"
  }
];

export const contactTopics = [
  "Internship opportunity", "Project collaboration", "Freelance / development", "Just saying hello"
];
