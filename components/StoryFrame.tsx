export interface StoryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  fullSrc?: string;
}

export interface StoryFrameProps {
  number: string;
  title: string;
  caption: string;
  image?: StoryImage;
  cover?: boolean;
}

export function StoryFrame({
  number,
  title,
  caption,
  image,
  cover = false,
}: StoryFrameProps) {
  return (
    <figure class={`story-frame${cover ? " story-frame-cover" : ""}`}>
      {image
        ? (
          <a
            href={image.fullSrc ?? image.src}
            target="_blank"
            rel="noopener noreferrer"
            class="story-image-link focus-ring"
            aria-label={`Open ${title} at full size (opens in a new tab)`}
          >
            <img
              class="story-frame-image"
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes ??
                (cover
                  ? "(min-width: 1344px) 1280px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)"
                  : "(min-width: 1344px) 1024px, (min-width: 1024px) calc(100vw - 280px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)")}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading={cover ? "eager" : "lazy"}
              decoding="async"
            />
          </a>
        )
        : (
          <div
            class="story-frame-blank"
            role="img"
            aria-label={`Placeholder for screenshot ${number}: ${title}`}
          >
            <div class="story-frame-grid" aria-hidden="true" />
            <span class="story-frame-counter" aria-hidden="true">
              Aster / Frame {number}
            </span>
            <div class="story-frame-center" aria-hidden="true">
              <span class="story-frame-number">{number}</span>
              <span class="story-frame-label">{title}</span>
            </div>
            <span class="story-frame-hint" aria-hidden="true">
              Screenshot placeholder
            </span>
          </div>
        )}
      <figcaption class="story-frame-caption">
        <span class="story-caption-number">{number}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
