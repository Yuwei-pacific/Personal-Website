# Design decisions

Variants that were built and rejected, and why. One line each. Add to it when something is removed on purpose;
do not describe the current design here — that is the brand manual and `CLAUDE.md`.

## Structure

- **Stacked sheets** (`position: sticky` sections sliding over each other): cut the ink lines at every paper
  edge, and on project pages the next sheet covered half the cover.
- **A root layout reading `headers()`**: made the whole tree dynamic; `revalidate` silently stopped working.
- **`<SanityLive />`**: shipped ~33 KB and a persistent connection to every visitor for live refresh nobody needs.

## Hero

- **Scroll Down badge** (centered rotating ring): the only centered, only rotating thing on the page, sitting on
  the seam to the next section.
- **Narrow screens without the mark** (a glowing band between slogan and identity): the bloom pressed on the text.
- **Dark-mode word with an ink core** ("eclipse"): replaced by a paper core, matching the mark.

## Home About

- **Portrait in this section**: the photo belongs to the About page only.
- **A long thread wrapping the portrait into Work**: cluttered.
- **A full underline entering from the left edge**: read as scrap paper and clashed with the hero line.

## Work

- **Full-bleed pools with wide blooms**: too loud; the cover is the subject.
- **Straight, even-width thread**: read as a cable or neon tube.
- **Card grid**: formulaic.
- **Thread entering from the section's top edge**: read as a line cut by the paper.
- **Thread hugging the left screen edge on phones**: read as a border.
- **Horizontal wipe revealing pools on scroll**: looked like a gradient mask cutting the cover; pools now bloom
  from the thread's entry point.

- **Phone thread with the ink core scaled like its bloom** (0.62): under 2px beside the text, too thin. The core
  is now scaled on its own (0.85); the bloom keeps the narrow scale so the line gains weight, not colour.
- **Featured focus that ignored the Index**: the last featured cover stayed in full bloom, half off screen,
  while the Index filled the viewport. Featured covers now all collapse once the Index heading is in the
  upper three quarters of the viewport.

- **Sticky viewport-high canvas redrawn on every scroll frame**: on iOS Safari the ink lagged behind the text
  (scrolling is off the main thread). The canvas now scrolls natively and is only repositioned near its edges.

## About page

- **Origin story on the page** (vertical 墨分五色 and its explanation, first alone, then as small text): visitors
  come for the person; the origin is the identity's rationale and belongs in a case study.
- **"I combine design and frontend…" headline**: templated, and already said on the home page.
- **Headline in 8 columns, large portrait right, full-width fact rows**: empty lower left.
- **Full-width headline over portrait / statement / facts side by side**: three unequal heights, nothing aligned.
- **Cut-out portrait standing on a rule with ink around the silhouette**: lost the comparison with the pool.
- **An ink drop that opened on scroll**: a second bloom on the screen.
- **Photo visible until the canvas is ready**: flashed the plain photo on every reload.

## Project page

- **Cover inside an ink pool**: cropped the image; the project must be shown whole.
- **Five-row meta table beside the summary, above the cover**: pushed the cover out of the first screen.
- **Facts left, summary from column 4**: right third empty.
- **Shared-element cover morph into the page**: disliked; replaced by the ink transition.
- **Ink transition with a foreground-colored core**: flipped the whole screen dark and back.
- **Scaling the transition `<svg>` with CSS**: turned the five-color rim into fat rainbow bands.
- **"Next project" thumbnail always in bloom**: the coloured rim competed with the title beside it. It now rests
  as an ink rim in greyscale and blooms on hover or keyboard focus.
- **Print figures placed as they were** (thesis project): a diagram at full bleed had type three times the body
  size, and a portrait poster ran two screens high. Figures are remade for the web and placed at reading width.
- **Gallery on the thesis project**: three images of very different ratios made one unreadable row; they moved
  into the chapters.
- **Text beside a portrait clip** (media-text with phone recordings, thesis project): three rows, each a
  screen high with three lines of text and a void under them, and unlike every other project page. The clips
  became one media group on a shared plate.
- **A third "narrow" media width**: one more left/right edge on the page for no gain. Two widths, both running
  to the right edge; small figures are padded to the plate width before upload.

## Footer, menu, identity

- **Blooming, stirrable footer**: cluttered; ink only where it has a job.
- **Uppercase sans menu items**: the old brand; now Fraunces in sentence case.
- **Share image with a dot-matrix prism**: the old brand.
- **Rainbow or color-chip motifs**: rejected early in favour of a single glowing body.
- **Instagram among the social links**: a private account.
