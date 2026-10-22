# Aster journal: editorial sources

The `/test` journal follows five phases from the early silhouette to V8. Its
milestones and selected frames are defined in `data/aster-story.ts`; the gallery
preserves all 109 unique game screenshots. `static/aster/images.json` records
original filenames, source SHA-256 hashes, dimensions, and the uncropped WebP
variants. New entries also record source-relative paths and versions.

The second update was reviewed from the extracted `aster_v7`, `aster_v75`, and
`aster_v8` folders supplied on 22 October 2026. All nine V7 screenshots match
existing gallery images. The update adds nine V7.5 and 32 V8 captures. Terrain
atlases, generated texture sources, masks, comparison panels, and the route
survey are construction evidence rather than native game screenshots.

## V7.5: Sweeping Bend

`aster_v75/README.md` establishes the saved revision and chronology. Relevant
supporting records:

- `final-route-audit.json`: the new 46 m bend, full 106.6 m route, 15.8 m
  planned minimum radius, and matching junction crossfall.
- `terrain-texture-repair.json`: the masked natural-ground repair, changing
  0.6675% of atlas pixels while preserving pixels outside the mask.
- `truck-traction-diagnosis.json` and `truck-tests-verification.json`: initial
  placement/traction failures and successful 69-second downhill and 73-second
  uphill runs using the existing truck's drive, low range, and locks.
- `independent-save-verification.json` and `completion-verification.json`:
  preservation, truck reset, and saved-state checks.

The successful runs cover the driveway and merge. They do not certify the
Percheron's basement clearance. The truck's hardware was not modified.

## V8: Asphalt & Reclaimed Slopes

`aster_v8/README.md` distinguishes the final matte pavement from earlier paint,
material-clone, and asphalt-atlas experiments. Final evidence:

- `exact-surface-geometry-verification.json`,
  `exact-surface-save-verification.json`, and `exact-surface-loaded-audit.json`:
  bounded pavement geometry, 80 mm interior lift, 0.30 m rolled edge, 9 mm lip,
  junction fades, and 7,035 static contact queries across inside/outside
  positions with no recorded boundary failures.
- `matte-update.json`: constant roughness 0.94, metallic/clear coat zero,
  retained stock color/normal/AO maps, and unchanged asphalt physics.
- `reclamation-save-verification.json` and `reclamation-reloaded-audit.json`:
  reconstruction of the retired 259.51 m shortcut, approximately 435.22 cubic
  metres of fill, 1,586 height cells, and 760 material cells. The earlier 1,774
  road-paint cells were restored and are not part of that final total.
- `preservation-verification.json`, `completion-verification.json`, and
  `console-final-reload-verification.json`: final saved/reloaded state and
  preserved house, scene objects, forest, and original assets.

No vehicle tests were run for V8. Its final verification uses geometry, static
contact/material checks, appearance, and reload persistence. Earlier files such
as `asphalt-save-verification.json` and `independent-exact-surface-review.json`
document intermediate stages and must not be presented as final-state results.

Both landscape repair stages reconstruct adjacent natural slopes; the original
pre-road terrain was unavailable. ImageGen produced ground-texture assets used
inside the game. The native evidence screenshots remain unretouched, with
intermediate and final V8 gallery groups clearly identified.
