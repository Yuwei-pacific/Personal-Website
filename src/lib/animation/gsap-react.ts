import { useGSAP } from "@gsap/react";

import { gsap, prefersReducedMotion } from "./gsap";

gsap.registerPlugin(useGSAP);

export { gsap, prefersReducedMotion, useGSAP };
