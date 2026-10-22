import type { StoryFrameProps, StoryImage } from "../components/StoryFrame.tsx";

export interface StoryChapter {
  number: string;
  id: string;
  title: string;
  stage: string;
  subtitle?: string;
  paragraphs: string[];
  groups: { layout: "pair" | "wide"; frames: StoryFrameProps[] }[];
}

export interface StoryPhase {
  id: string;
  number: string;
  label: string;
  title: string;
  description: string;
  chapters: StoryChapter[];
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
// V7.5/V8 continue that record with their own READMEs, physical truck-test logs,
// and final cap/matte/reclamation audits. V8 was not vehicle-tested.
// docs/aster-story-sources.md records the editorial evidence and caveats.
// static/aster/images.json retains the screenshot filenames and source hashes.
export const asterCover: StoryFrameProps = {
  number: "01",
  title: "Aster, with both approaches in place",
  caption:
    "V8, after the final reload — The familiar white wings above two matte asphalt approaches. Below them, a retired shortcut has been folded back into the hillside.",
  image: screenshot(
    "v8-overview-cap-final",
    2528,
    1490,
    "Aster's white cantilevered wings and glass crown above a matte asphalt hairpin on a rocky coastal hillside.",
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
      "The Piccolina could reach the door, but that was only the first test of the approach. The next revision would ask more of the bend, the junction, and a much longer truck.",
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
  {
    number: "07",
    id: "room-for-the-turn",
    title: "Room for the turn",
    stage: "V7.5 / The lower connection",
    subtitle: "A wider sweep, a quieter meeting with the road",
    paragraphs: [
      "The first connection reached the hairpin. The next needed to arrive with it. In V7.5, the lower bend moved outward and met the existing road farther down the slope, giving the approach room to turn before it began the climb.",
      "A new 46-metre sweep brought the full link to 106.6 metres, with a minimum planned radius of 15.8 metres. At the junction, direction, height, and grade were matched; the final six metres borrowed the existing road’s crossfall. The upper V7 route and its narrow rock shoulder stayed in place. Most of the change sits in that last, easily overlooked moment where two roads become one.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "16",
        title: "The earlier hairpin connection",
        caption:
          "Before V7.5 — The tighter lower turn, before the road was given a broader sweep.",
        image: screenshot(
          "v75-bend-before",
          2528,
          1490,
          "The earlier gravel hairpin bending tightly below Aster's central pillar.",
        ),
      }, {
        number: "17",
        title: "The sweeping bend",
        caption:
          "V7.5 — The longer lower curve follows the hillside into a new junction farther down the road.",
        image: screenshot(
          "v75-bend",
          2528,
          1490,
          "A broader gravel bend sweeping around the preserved rocky bank below Aster.",
        ),
      }],
    }],
  },
  {
    number: "08",
    id: "the-scar-that-remained",
    title: "The scar that remained",
    stage: "V7.5 / Landscape repair",
    subtitle: "The terrain had changed; its old image had not",
    paragraphs: [
      "Filling an abandoned road cut did not make its pale trace disappear. The line was baked into Small Island’s shared ground-colour texture, so changing the terrain material beneath it could never finish the repair. The hill had two records of the road, and both needed attention.",
      "A natural-ground texture patch was blended through a narrow, feathered mask over the retired corridors. Only 0.6675% of the atlas changed; pixels outside the mask stayed identical. It was a reconstruction from neighbouring ground, since the terrain from before the road was unavailable. The aim was a slope that read continuously again, with its rocks still in place.",
    ],
    groups: [{
      layout: "wide",
      frames: [{
        number: "18",
        title: "Closing the pale trace",
        caption:
          "V7.5 — The retired track is blended into the natural ground below the rebuilt bend.",
        image: screenshot(
          "v75-scar",
          2528,
          1490,
          "The repaired hillside below Aster, where the pale retired track blends into the rocky ground.",
        ),
      }],
    }],
  },
  {
    number: "09",
    id: "the-climb-in-both-directions",
    title: "The climb, in both directions",
    stage: "V7.5 / Percheron trials",
    subtitle: "A useful failure before a useful result",
    paragraphs: [
      "The Percheron made the limits harder to overlook. An early basement placement failed before the road run began. On a separate uphill attempt, rear drive and open differentials lost traction; the AI then reversed off the road. A continuous-looking surface was not enough to explain what the truck needed from the climb.",
      "The successful return used the truck’s existing 8×8 drive, 2.2:1 low range, and differential locks, without changing its hardware. The downhill run took 69 seconds and the climb 73, with no recorded damage, broken beams, or triggered deformation in either successful run. Those checks covered the driveway and merge, not basement clearance. Afterwards, the truck returned to its original parking place and normal driving settings.",
    ],
    groups: [{
      layout: "wide",
      frames: [{
        number: "19",
        title: "The Percheron on the bend",
        caption:
          "V7.5 — The long flatbed on the lower connection during the truck trials. The successful runs tested the route, not the garage interior.",
        image: screenshot(
          "v75-truck",
          2528,
          1490,
          "A blue Percheron flatbed truck following the gravel bend beside the rocky hillside.",
        ),
      }],
    }],
  },
  {
    number: "10",
    id: "finding-the-real-edge",
    title: "Finding the real edge",
    stage: "V8 / Pavement and contact",
    subtitle: "The visible road and its grip needed the same boundary",
    paragraphs: [
      "V8 began with asphalt, then spent much of its effort at the shoulder. Terrain paint, cloned materials, and an asphalt-atlas experiment all appear in the working record. They were steps along the way; the final scene instead uses a pavement mesh bounded by the two original road ribbons. The early surface checks, including the broken patchwork visible here, belong to that unfinished search.",
      "The resolved cap sits eight centimetres above the original terrain. A 30-centimetre rolled edge falls to a nine-millimetre lip, while short fades meet the existing junctions. The bends and underlying terrain heights remain intact. Crucially, the grey surface and asphalt collision end at the same line, leaving the natural shoulder with its own ground behaviour.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "20",
        title: "An unfinished surface check",
        caption:
          "V8, intermediate — The patchwork edge records a surface experiment before the final pavement cap.",
        image: screenshot(
          "v8-edge-exact-surface",
          2528,
          1490,
          "An intermediate asphalt bend with irregular pale checker-like patches across its outer edge.",
        ),
      }, {
        number: "21",
        title: "The rolled edge",
        caption:
          "V8, final — A low, rolled pavement edge settles into the natural shoulder.",
        image: screenshot(
          "v8-rolled-edge-final",
          2528,
          1490,
          "Close view of the final matte asphalt edge tapering down to the rocky natural shoulder.",
        ),
      }],
    }],
  },
  {
    number: "11",
    id: "letting-the-hillside-close",
    title: "Letting the hillside close",
    stage: "V8 / Reclaimed south face",
    subtitle: "The route that no longer needed to be there",
    paragraphs: [
      "Once the two approaches had a clear purpose, the U-shaped shortcut across the south face became a leftover. Retiring its 259.51 metres meant more than hiding a line: the shelf it had cut into the hillside still caught the light and interrupted the slope.",
      "About 435 cubic metres of fill softened that cut without lowering the ground elsewhere. Existing rocks stayed fixed; fifteen foliage items were reseated vertically. A second masked ground-texture repair removed the baked pale trace. The result follows the neighbouring slopes rather than claiming to recover a lost original. From this side of Aster, the biggest change is the road that gradually stops drawing the eye.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "22",
        title: "The shortcut before reclamation",
        caption:
          "Before V8 — The pale U-shaped alternate trail crosses the face of the hill.",
        image: screenshot(
          "v8-shortcut-before",
          2528,
          1490,
          "A pale U-shaped dirt shortcut cut across the south-facing slope beneath Aster.",
        ),
      }, {
        number: "23",
        title: "The reclaimed south face",
        caption:
          "V8, final — The former shelf is filled and its pale trace blended into the reconstructed slope.",
        image: screenshot(
          "v8-reclaimed-final",
          2528,
          1490,
          "The same south-facing hillside after the shortcut has been filled and blended into natural rocky terrain.",
        ),
      }],
    }],
  },
  {
    number: "12",
    id: "taking-the-shine-out",
    title: "Taking the shine out",
    stage: "V8 / The matte refinement",
    subtitle: "The last correction was in the light",
    paragraphs: [
      "Even after the pavement had a proper edge, the garage approach caught a broad, bright reflection. It made the new road feel out of place beside the dry rock and quiet white walls. This pass returned to the material rather than reshaping the route again.",
      "The stock asphalt colour, normal detail, and ambient-occlusion maps stayed. The roughness texture gave way to a constant 0.94 roughness, with metallic and clear coat set to zero. The final surface keeps its fine grain while the reflection settles down. Its asphalt physics stay unchanged: a visual refinement, checked separately from the contact boundary beneath it.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "24",
        title: "The reflective garage approach",
        caption:
          "V8, earlier material — A bright reflection stretches across the garage apron.",
        image: screenshot(
          "v8-garage",
          2528,
          1490,
          "An earlier asphalt approach to Aster's arched garage with a strong bright surface reflection.",
        ),
      }, {
        number: "25",
        title: "The final matte approach",
        caption:
          "V8, final — The same arrival with a subdued, finely textured matte surface.",
        image: screenshot(
          "v8-garage-cap-final",
          2528,
          1490,
          "The final matte asphalt apron entering Aster's catenary garage opening without the earlier bright reflection.",
        ),
      }],
    }],
  },
  {
    number: "13",
    id: "what-survived-the-reload",
    title: "What survived the reload",
    stage: "V8 / Final saved state",
    subtitle: "Two approaches, one checked result",
    paragraphs: [
      "The final views were recaptured after saving and reloading the matte material. Across both approaches, 7,035 static contact queries checked the pavement and the natural ground beyond it, with no recorded boundary failures. Preservation checks retained all 221 primary house pieces, the original mesh and material assets, and the full forest inventory.",
      "No vehicle runs were made for V8. Its evidence is the saved geometry, contact probes, appearance, and reload persistence; the physical driving trials belong to V6, V7, and V7.5. That distinction is part of the story too. Aster still has its first asterisk-shaped ambition, but the work now reaches all the way down to the few centimetres where a road meets the soil.",
    ],
    groups: [{
      layout: "pair",
      frames: [{
        number: "26",
        title: "The sweeping approach, paved",
        caption:
          "V8, final — The V7.5 bend keeps its alignment and gains the finished matte asphalt cap.",
        image: screenshot(
          "v8-v7-cap-final",
          2528,
          1490,
          "A continuous matte asphalt hairpin sweeping around the rocky bank below Aster.",
        ),
      }, {
        number: "27",
        title: "The original approach, continued",
        caption:
          "V8, final — The V6 approach remains a second route to the same garage, with the matching pavement treatment.",
        image: screenshot(
          "v8-v6-cap-final",
          2528,
          1490,
          "The earlier V6 approach resurfaced in matte asphalt beneath Aster's cantilevered white wings.",
        ),
      }],
    }],
  },
];

export const asterTimeline: StoryPhase[] = [
  {
    id: "first-shape",
    number: "01",
    label: "Early captures → V3",
    title: "Finding the silhouette",
    description: "A mark in plan becomes a building with a centre of its own.",
    chapters: asterChapters.slice(0, 2),
  },
  {
    id: "curved-envelope",
    number: "02",
    label: "V4 → V5",
    title: "A softer envelope",
    description:
      "The crown, canopy, glass, and openings begin to share a language.",
    chapters: asterChapters.slice(2, 4),
  },
  {
    id: "hillside-arrival",
    number: "03",
    label: "V6 → V7",
    title: "Learning the hillside",
    description:
      "A basement door becomes an arrival, with two ways up the slope.",
    chapters: asterChapters.slice(4, 6),
  },
  {
    id: "sweeping-bend",
    number: "04",
    label: "V7.5 / 21 October 2026",
    title: "A bend earned both ways",
    description:
      "A wider turn, a persistent scar, and a truck that tests the connection.",
    chapters: asterChapters.slice(6, 9),
  },
  {
    id: "exact-surface",
    number: "05",
    label: "V8 / 22 October 2026",
    title: "Where the road meets the ground",
    description:
      "The work moves to the edges: grip, light, and the traces left behind.",
    chapters: asterChapters.slice(9),
  },
];
