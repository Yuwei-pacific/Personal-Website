export type Project = {
  _id: string;
  title: string;
  role?: string;
  description?: string;
};

type ProjectsSectionProps = {
  projects: Project[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section
      id="work"
      className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-16 sm:gap-8 sm:pb-20 scroll-mt-24"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
          My Projects
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
          Selected work across design and build.
        </h2>
        <p className="max-w-3xl text-base text-neutral-700 sm:text-lg">
          A snapshot of recent projects spanning design systems, interaction, and frontend delivery.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project._id || project.title}
            className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm backdrop-blur"
          >
            <p className="text-lg font-semibold text-neutral-900">{project.title}</p>
            <p className="text-sm font-medium text-neutral-600">{project.role}</p>
            <p className="mt-2 text-sm text-neutral-700">{project.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
