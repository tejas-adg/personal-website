import type { StoryFrameProps, StoryImage } from "../components/StoryFrame.tsx";

export interface StoryChapter {
  number: string;
  id: string;
  title: string;
  stage: string;
  paragraphs: string[];
  groups: { layout: "pair" | "wide"; frames: StoryFrameProps[] }[];
}

function screenshot(
  slug: string,
  width: number,
  height: number,
  alt: string,
): StoryImage {
  return {
    src: `/aster/${slug}-1440.webp`,
    srcSet:
      `/aster/${slug}-800.webp 800w, /aster/${slug}-1440.webp 1440w, /aster/${slug}-full.webp ${width}w`,
    fullSrc: `/aster/${slug}-full.webp`,
    width,
    height,
    alt,
  };
}

// Earlier geometry is documented in the retained v2–v5 README/metadata files
// under aster_v6/saved-level/small_island/art. The unversioned early captures
// are deliberately not labelled v1. Later changes and the limited drive tests
// are documented by the v6/v7 READMEs and saved-state verification reports.
// static/aster/images.json retains the screenshot filenames and source hashes.
export const asterCover: StoryFrameProps = {
  number: "01",
  title: "Aster on the hillside",
  caption:
    "V7 — The latest overview: five staggered wings, a cylindrical centre, and a gravel approach winding up the hillside.",
  image: screenshot(
    "v7-house",
    2528,
    1490,
    "Aster's white cantilevered wings around a cylindrical core on a rocky hillside overlooking the sea.",
  ),
  cover: true,
};

export const asterChapters: StoryChapter[] = [
  {
    number: "01",
    id: "the-asterisk",
    title: "The asterisk",
    stage: "Early captures",
    paragraphs: [
      "I called the house Aster because of the shape it makes from above. Five wings radiate around a central spine; seen together in plan, they resemble an asterisk. That simple view is the clearest introduction to my first 3D model for BeamNG.drive.",
      "The early screenshots show the idea in its most direct form: white roof planes, dark glazing, and a narrow centre holding the staggered wings above the coast. From the side, the wings separate into different levels. From above, they come back together as one mark.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "02",
        title: "The early house",
        caption:
          "Early capture — Straight edges and stacked wings around a slender centre.",
        image: screenshot(
          "early-house",
          3840,
          2137,
          "Early Aster model with straight white roofs and a narrow central stack above the coast.",
        ),
      }, {
        number: "03",
        title: "The name from above",
        caption:
          "Early capture — The overhead silhouette that gives Aster its name.",
        image: screenshot(
          "early-overhead",
          3840,
          2137,
          "Overhead view of Aster's five white wings forming an asterisk against the rocky terrain.",
        ),
      }],
    }],
  },
  {
    number: "02",
    id: "a-larger-centre",
    title: "A larger centre",
    stage: "Versions 2–3",
    paragraphs: [
      "The next versions gave the centre more substance. In v2, the five wings rotated around a hollow cylindrical core at 72-degree intervals, with an 8.5-metre rise between levels. Straight glass panes and alternating floor and roof pieces gave the stack a more consistent rhythm.",
      "By v3, the core had grown to a 30-metre diameter. Ring-shaped floors surrounded an opening reserved for a future lift, and a glazed showcase sat beneath a solid dome. The change is visible even at a distance: the centre becomes a major part of the house's silhouette, while the wings keep their staggered arrangement.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "04",
        title: "The cylindrical spine",
        caption:
          "V2 — A hollow cylindrical core, straight glazing, and a small solid cap.",
        image: screenshot(
          "v2-house",
          2558,
          2128,
          "Version 2 of Aster with a slim cylindrical core, five straight-edged wings, and a white dome.",
        ),
      }, {
        number: "05",
        title: "The wider core",
        caption:
          "V3 — The enlarged centre and raised showcase change the balance of the whole building.",
        image: screenshot(
          "v3-house",
          3840,
          2137,
          "Version 3 of Aster with a noticeably broader central cylinder and a raised domed showcase.",
        ),
      }],
    }],
  },
  {
    number: "03",
    id: "following-the-curves",
    title: "Following the curves",
    stage: "Versions 4–5",
    paragraphs: [
      "The next change was at the top. In v4, the solid cap gave way to a thin glass crown shaped with an inverted catenary curve. An open base aperture kept the showcase beneath the shell free of an opaque ceiling. Extended terraces and paired Bézier roof ribbons began to soften the wings below it.",
      "V5 carried that refinement into the outline of the building. Roof material outside the ribbons was removed, leaving curved shoulders and rounded noses. The upper glass drum met the crown directly, without the white eave that had separated them before. A later update made the full-height glazing follow those same canopy curves, with matching head and sill frames. The screenshots show the glass and roof finally sharing one outline.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "06",
        title: "The glass crown",
        caption:
          "V4 — A thin glass crown replaces the solid cap above the showcase.",
        image: screenshot(
          "v4-crown",
          2558,
          2124,
          "Close view of Aster's version 4 glass crown above its circular glazed showcase.",
        ),
      }, {
        number: "07",
        title: "The roof outline",
        caption:
          "V5 — Curved roof shoulders and a rounded nose, seen from above the canopy.",
        image: screenshot(
          "v5-roof",
          3840,
          2137,
          "Close overhead view of a version 5 wing's white curved roof beside the circular crown.",
        ),
      }],
    }, {
      layout: "wide",
      frames: [{
        number: "08",
        title: "Glass that follows the canopy",
        caption:
          "V5, curved-glass update — The lower wing's glazing follows the canopy instead of cutting across its curves.",
        image: screenshot(
          "v5-curved-glass",
          2582,
          1747,
          "Aster's lowest wing with curved glass walls following the white roof and slender dark window posts.",
        ),
      }],
    }],
  },
  {
    number: "04",
    id: "opening-the-tips",
    title: "Opening the tips",
    stage: "Version 5 / refinements",
    paragraphs: [
      "The curved noses then gained openings of their own. An inverted catenary was cut through the glass and lower framing at the tip of each wing, bringing the same family of curves from the crown down into the façade.",
      "The first openings had an apex of roughly eight feet. A later pass enlarged them proportionally, reaching about 3.75 metres high and 14.75 metres across in front elevation. The frames and posts were adjusted around the cut while the canopy and terrace rails kept their existing design. The sequence includes front views, inside views, and checks after reloading the scene.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "09",
        title: "Before the tip opening",
        caption:
          "V5 — The curved glass nose before an opening was cut through it.",
        image: screenshot(
          "v5-opening-before",
          2528,
          1490,
          "Front view of Aster's lowest curved glass wing before its arched opening.",
        ),
      }, {
        number: "10",
        title: "The enlarged opening",
        caption:
          "V5, enlarged tip arch — The wider catenary opening under the same canopy.",
        image: screenshot(
          "v5-opening-after",
          2528,
          1490,
          "Front view of the enlarged catenary-shaped opening in Aster's lowest glass wing.",
        ),
      }],
    }],
  },
  {
    number: "05",
    id: "meeting-the-hillside",
    title: "Meeting the hillside",
    stage: "Version 6 / Grounded",
    paragraphs: [
      "V6 shifted the work toward the ground. The hillside was recessed around the central pillar and softly blended back into the surrounding slope. A basement floor and an east-facing entrance gave the centre a connection to the terrain beneath it.",
      "An approximately 89-metre gravel driveway curved in from the nearby access road. Vegetation was moved out of the recess and route, with the existing forest inventory preserved. The approach was checked in the game: an Autobello Piccolina completed a low-speed climb into the basement. At this stage, Aster had an arrival sequence as well as a silhouette.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "11",
        title: "The first basement entrance",
        caption:
          "V6 — The gravel approach reaches the rectangular entrance in the central pillar.",
        image: screenshot(
          "v6-entry",
          2528,
          1490,
          "Version 6 gravel driveway curving into a rectangular basement entrance beneath Aster.",
        ),
      }, {
        number: "12",
        title: "The view from inside",
        caption:
          "V6 — Looking back through the basement entrance toward the rocks and sea.",
        image: screenshot(
          "v6-interior",
          2528,
          1490,
          "View from Aster's version 6 basement through its entrance toward the rocky coast.",
        ),
      }],
    }],
  },
  {
    number: "06",
    id: "a-road-to-the-door",
    title: "A road to the door",
    stage: "Version 7 / Hillside Link",
    paragraphs: [
      "In v7, the basement entrance became an inverted-catenary arch. It widened to 11.6 metres at the sill while keeping the earlier 4.15-metre peak height. A second gravel route, roughly 85 metres long, connected the garage apron to the northern hairpin; the v6 driveway remained available.",
      "This pass also included the terrain around the route. Redundant road cuts were filled and blended into reconstructed slopes, while rocks and vegetation were repositioned. The final drive check followed the new route from the hairpin into the garage in a Piccolina at low speed, turning the road from a line on the hillside into a connection tested in the game.",
      "Looking across the screenshots, the asterisk remains recognisable through every change. The centre grows, the roofs soften, the glass opens, and eventually the hillside leads all the way to the door. That is the progression I wanted this journal to keep visible.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "13",
        title: "The hillside connection",
        caption:
          "V7 — The new gravel link curves up from the hairpin toward the garage.",
        image: screenshot(
          "v7-road",
          2528,
          1490,
          "The version 7 gravel road sweeping around the rocky hillside below Aster's garage.",
        ),
      }, {
        number: "14",
        title: "The catenary garage entrance",
        caption:
          "V7 — The rectangular entrance is replaced by a wider catenary opening.",
        image: screenshot(
          "v7-garage",
          2528,
          1490,
          "Wide catenary-shaped garage entrance in Aster's white central pillar at the top of the gravel driveway.",
        ),
      }],
    }, {
      layout: "wide",
      frames: [{
        number: "15",
        title: "The garage drive check",
        caption:
          "V7 — The Piccolina at the garage during the low-speed drive check.",
        image: screenshot(
          "v7-drive",
          2528,
          1490,
          "A small red Autobello Piccolina at Aster's arched garage entrance during a drive test.",
        ),
      }],
    }],
  },
];
