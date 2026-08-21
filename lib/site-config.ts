export const siteConfig = {
  name: "Quality Works Light",
  shortName: "Quality Works Light",
  description:
    "Praktiskt ledningssystem för småföretag – kvalitet, miljö, arbetsmiljö och andra ISO-standarder.",
  links: {
    repository: "https://github.com/PaddeFTW/quality-works-light",
  },
  docs: [
    {
      title: "Project Brief",
      href: "/PROJECT_BRIEF.md",
      description: "Purpose, non-goals, and platform objectives.",
    },
    {
      title: "Design System",
      href: "/DESIGN_SYSTEM.md",
      description: "Token model, visual principles, and component guidance.",
    },
    {
      title: "Architecture",
      href: "/ARCHITECTURE.md",
      description: "Folder structure, layering, and extension rules.",
    },
    {
      title: "Roadmap",
      href: "/ROADMAP.md",
      description: "Planned evolution of the shared starter foundation.",
    },
  ],
} as const;
