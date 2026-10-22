import { Head } from "fresh/runtime";
import { StoryFrame } from "../components/StoryFrame.tsx";
import { StoryGallery } from "../components/StoryGallery.tsx";
import { asterCover, asterTimeline } from "./aster-story.ts";
import type { StoryChapter } from "./aster-story.ts";
import gallery from "./aster-gallery.json" with { type: "json" };

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={up ? "M12 19V5m-6 6 6-6 6 6" : "M19 12H5m6 6-6-6 6-6"} />
    </svg>
  );
}

function ChapterFrames({ chapter }: { chapter: StoryChapter }) {
  return (
    <div class="story-frame-groups">
      {chapter.groups.map((group, index) => (
        <div
          class={group.layout === "pair"
            ? "story-frame-pair"
            : "story-frame-stack"}
          key={index}
        >
          {group.frames.map((frame) => (
            <StoryFrame
              {...frame}
              key={frame.number}
              image={frame.image && {
                ...frame.image,
                sizes: group.layout === "pair"
                  ? "(min-width: 1280px) 620px, (min-width: 1024px) calc((100vw - 400px) / 2), (min-width: 640px) calc((100vw - 136px) / 2), calc(100vw - 76px)"
                  : "(min-width: 1280px) 620px, (min-width: 1024px) calc(100vw - 400px), (min-width: 640px) calc(100vw - 136px), calc(100vw - 76px)",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AsterStoryPage() {
  return (
    <>
      <Head>
        <title>Aster — A BeamNG.drive build journal</title>
        <meta
          name="description"
          content="Aster, my first 3D model for BeamNG.drive. Follow the house, its hillside roads, and the revisions in between, from the first silhouette through version 8."
        />
      </Head>
      <main>
        <article
          id="story-top"
          class="story-page"
          aria-labelledby="story-title"
        >
          <div class="story-topline">
            <a href="/archives" class="story-back focus-ring">
              <Arrow /> Archives
            </a>
            <span class="story-status">Continuing through version 8</span>
          </div>

          <header class="story-header">
            <p class="story-eyebrow">Build journal / 001</p>
            <h1 id="story-title" class="story-title">
              Aster<span class="story-asterisk" aria-hidden="true">*</span>
            </h1>
            <p class="story-deck">
              My first 3D model for BeamNG.drive. A house takes shape, finds its
              way into the hillside, and keeps changing as the road home is
              worked out.
            </p>
            <div class="story-meta">
              <div class="story-author">
                <span class="story-avatar" aria-hidden="true">TA</span>
                <div>
                  <span>Tejas A. M.</span>
                  <span class="story-author-note">Story & screenshots</span>
                </div>
              </div>
              <div class="story-topics" aria-label="Topics">
                <span>3D modelling</span>
                <span>BeamNG.drive</span>
                <span>Small Island</span>
              </div>
            </div>
          </header>

          <StoryFrame {...asterCover} />

          <div class="story-body">
            <nav class="story-index" aria-label="Build timeline">
              <p class="story-eyebrow">The build, in order</p>
              <ol class="story-index-phases">
                {asterTimeline.map((phase) => (
                  <li key={phase.id}>
                    <a
                      href={`#${phase.id}`}
                      class="story-index-phase focus-ring"
                    >
                      <span>{phase.number}</span>
                      {phase.title}
                    </a>
                    <ol class="story-index-chapters">
                      {phase.chapters.map((chapter) => (
                        <li key={chapter.id}>
                          <a href={`#${chapter.id}`} class="focus-ring">
                            {chapter.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
                <li class="story-index-gallery">
                  <a href="#all-screenshots" class="focus-ring">
                    <span>↗</span> All {gallery.imageCount} screenshots
                  </a>
                </li>
              </ol>
            </nav>

            <ol class="story-timeline" aria-label="Aster development timeline">
              {asterTimeline.map((phase) => (
                <li class="story-phase" key={phase.id}>
                  <section
                    id={phase.id}
                    aria-labelledby={`${phase.id}-title`}
                  >
                    <header class="story-phase-heading">
                      <p class="story-eyebrow">
                        {phase.number} / {phase.label}
                      </p>
                      <h2 id={`${phase.id}-title`}>{phase.title}</h2>
                      <p class="story-prose">{phase.description}</p>
                    </header>
                    <ol class="story-milestones">
                      {phase.chapters.map((chapter) => (
                        <li class="story-milestone" key={chapter.id}>
                          <section
                            class="story-chapter"
                            id={chapter.id}
                            aria-labelledby={`${chapter.id}-title`}
                          >
                            <header class="story-chapter-heading">
                              <p class="story-eyebrow">
                                {chapter.number} / {chapter.stage}
                              </p>
                              <h3 id={`${chapter.id}-title`}>
                                {chapter.title}
                              </h3>
                              {chapter.subtitle && (
                                <p class="story-chapter-subtitle">
                                  {chapter.subtitle}
                                </p>
                              )}
                            </header>
                            <div class="story-chapter-layout">
                              <div class="story-chapter-copy">
                                {chapter.paragraphs.map((paragraph, index) => (
                                  <p class="story-prose" key={index}>
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                              <ChapterFrames chapter={chapter} />
                            </div>
                          </section>
                        </li>
                      ))}
                    </ol>
                  </section>
                </li>
              ))}
            </ol>
          </div>

          <StoryGallery groups={gallery.groups} />

          <footer class="story-footer">
            <p class="story-eyebrow">Still taking shape</p>
            <h2>The house is only half the story.</h2>
            <p>
              Aster began with a silhouette. Making it belong to the island
              meant working through the ground beneath it: entrances, gradients,
              surfaces, and the marks left by earlier attempts. The versions
              record that slower work too. Each return to the hillside makes the
              house a little more of a place.
            </p>
            <a href="#story-top" class="story-back focus-ring">
              Back to the beginning <Arrow up />
            </a>
          </footer>
        </article>
      </main>
    </>
  );
}
