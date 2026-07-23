import { ScrollTrigger } from "gsap/ScrollTrigger";

import { gsap, prefersReducedMotion, useGSAP } from "./gsap-react";

gsap.registerPlugin(ScrollTrigger);

export { gsap, prefersReducedMotion, ScrollTrigger, useGSAP };
