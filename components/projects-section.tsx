import Link from "next/link";

export type Project = {
  _id: string;
  title: string;
  summary?: string;
  year?: number;
  projectType?: string;
  description?: string;
  slug?: { current?: string } | string;
};

type ProjectsSectionProps = {
  projects: Project[];
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const hasProjects = projects && projects.length > 0;

  return (
    <section
      id="work"
      className="w-full bg-neutral-950 px-4 pb-14 pt-14 text-white sm:px-6 sm:pb-20 sm:pt-20 scroll-mt-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-300">
            Work
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Selected work across design and build.
              </h2>
              <p className="max-w-3xl text-base text-neutral-200 sm:text-lg">
                Interfaces, systems, and interaction stories that ship.
              </p>
            </div>
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs font-medium text-neutral-100 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Available for collaborations
            </div> */}
          </div>
        </header>

        {!hasProjects ? (
          <div className="mt-2 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-200">
            Projects will appear here once they are published in Sanity.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
            {projects.map((project, idx) => {
              const slug =
                typeof project.slug === "string" ? project.slug : project.slug?.current;

              const cardContent = (
                <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:p-6">
                  <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="absolute -top-16 right-0 h-40 w-40 rotate-12 bg-gradient-to-br from-sky-500/30 via-emerald-400/20 to-purple-500/20 blur-3xl" />
                  </div>
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {project.projectType && (
                        <span className="rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-semibold uppercase text-neutral-900 ">
                          {project.projectType}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white">{project.title}</p>
                        {project.year && (
                          <span className="rounded-full border border-neutral-800 bg-neutral-800/80 px-3 py-1 text-xs font-medium text-neutral-100">
                            {project.year}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold tracking-[0.15em] text-neutral-300">
                        {project.summary || project.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 text-sm font-semibold text-neutral-50">
                      <span className="transition-transform group-hover:translate-x-1">View project</span>
                      <span aria-hidden className="text-lg transition-transform group-hover:translate-x-1">↗</span>
                    </div>
                  </div>
                </div>
              );

              if (!slug) {
                return (
                  <div key={project._id || project.title || `project-${idx}`}>{cardContent}</div>
                );
              }

              return (
                <Link
                  key={project._id || slug}
                  href={`/projects/${slug}`}
                // className="block focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-neutral-950"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
