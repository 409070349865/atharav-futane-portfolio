import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const vite = await createServer({
  configFile: resolve("vite.config.ts"),
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true }
});

try {
  const { profile, projects, skillGroups, certifications, education, learningAreas, articles } =
    await vite.ssrLoadModule("/src/data.ts");
  const context = {
    profile: {
      fullName: profile.fullName,
      role: profile.role,
      location: profile.location,
      summary: profile.summary,
      availability: profile.availability
    },
    projects: projects.map(({ id, title, category, year, status, summary, description, stack, challenge, solution, highlights }) =>
      ({ id, title, category, year, status, summary, description, stack, challenge, solution, highlights })),
    skills: skillGroups,
    certifications,
    education,
    learningAreas,
    articles,
    experienceNote: "Work experience details are not currently listed in the portfolio."
  };
  await mkdir(resolve("server/generated"), { recursive: true });
  await writeFile(resolve("server/generated/portfolio-context.json"), JSON.stringify(context, null, 2));
} finally {
  await vite.close();
}
