export interface GalleryImage {
  title: string;
  alt: string;
  thumbnail: string;
  fullSrc: string;
  width: number;
  height: number;
}

export interface GalleryGroup {
  id: string;
  label: string;
  images: GalleryImage[];
}

export function StoryGallery({ groups }: { groups: GalleryGroup[] }) {
  const count = groups.reduce((total, group) => total + group.images.length, 0);

  return (
    <section
      class="story-gallery"
      id="all-screenshots"
      aria-labelledby="gallery-title"
    >
      <header class="story-chapter-heading">
        <p class="story-eyebrow">The complete contact sheet</p>
        <h2 id="gallery-title">Every iteration.</h2>
      </header>
      <p class="story-prose">
        All {count}{" "}
        screenshots from the build, including the close inspections, alternate
        views, and terrain work. Open a collection, then select any image to see
        the uncropped frame at full resolution in a new tab.
      </p>
      <p class="story-gallery-note">
        Native game captures, including the unfinished inspections. Generated
        ground textures were used within the game for the landscape repairs; the
        screenshots themselves have not been retouched.
      </p>
      <div class="story-gallery-groups">
        {groups.map((group) => (
          <details key={group.id} open={group.id === "early"}>
            <summary>
              <span>{group.label}</span>
              <span class="story-gallery-count">
                {group.images.length}{" "}
                {group.images.length === 1 ? "frame" : "frames"}
              </span>
            </summary>
            <ul class="story-gallery-grid">
              {group.images.map((image) => (
                <li key={image.fullSrc}>
                  <a
                    class="story-gallery-item focus-ring"
                    href={image.fullSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${image.title} at full size (opens in a new tab)`}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      decoding="async"
                    />
                    <span class="story-gallery-label">
                      {image.title}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
