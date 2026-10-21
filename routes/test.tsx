import { Head } from "fresh/runtime";
import { StoryFrame } from "../components/StoryFrame.tsx";
import { StoryGallery } from "../components/StoryGallery.tsx";
import { asterChapters, asterCover } from "../data/aster-story.ts";
import gallery from "../static/aster/gallery.json" with { type: "json" };

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

export default function AsterStoryPage() {
  return (
    <>
      <Head>
        <title>Aster — A BeamNG.drive build journal</title>
        <meta
          name="description"
          content="My first 3D model for BeamNG.drive: Aster, an asterisk-shaped house. A visual build journal from the early wings to the garage and hillside roads."
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
            <span class="story-status">Story draft</span>
          </div>

          <header class="story-header">
            <p class="story-eyebrow">Build journal / 001</p>
            <h1 id="story-title" class="story-title">
              Aster<span class="story-asterisk" aria-hidden="true">*</span>
            </h1>
            <p class="story-deck">
              My first 3D model for BeamNG.drive, from an asterisk-shaped
              silhouette to a house connected to its hillside.
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
            <nav class="story-index" aria-label="Story chapters">
              <p class="story-eyebrow">In this story</p>
              <ol>
                {asterChapters.map((chapter) => (
                  <li key={chapter.id}>
                    <a href={`#${chapter.id}`} class="focus-ring">
                      <span>{chapter.number}</span>
                      {chapter.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#all-screenshots" class="focus-ring">
                    <span>↗</span> All {gallery.imageCount} screenshots
                  </a>
                </li>
              </ol>
            </nav>

            <div class="story-chapters">
              {asterChapters.map((chapter) => (
                <section class="story-chapter" id={chapter.id} key={chapter.id}>
                  <header class="story-chapter-heading">
                    <span class="story-eyebrow">
                      {chapter.number} / {chapter.stage}
                    </span>
                    <h2>{chapter.title}</h2>
                  </header>
                  {chapter.paragraphs.map((paragraph, index) => (
                    <p class="story-prose" key={index}>{paragraph}</p>
                  ))}
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
                                ? "(min-width: 1344px) 512px, (min-width: 1024px) calc((100vw - 304px) / 2), (min-width: 640px) calc((100vw - 88px) / 2), calc(100vw - 32px)"
                                : frame.image.sizes,
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <StoryGallery groups={gallery.groups} />

          <footer class="story-footer">
            <p class="story-eyebrow">The first build</p>
            <h2>A shape, then a place.</h2>
            <p>
              Aster began as a house that could be recognised from above. Across
              the versions, it gained a broader centre, a glass crown, curved
              wings, and an approach through the terrain. These screenshots keep
              the steps in view, from the first silhouette to the low-speed
              drive into the garage.
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
