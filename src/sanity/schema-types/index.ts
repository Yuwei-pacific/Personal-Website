import { project } from "./project";
import { skillCategory } from "./skill-category";
import { resume } from "./resume";
import { sectionTypes } from "./sections";
import { localizedContentTypes } from "./localized-content";

export const schemaTypes = [
  project,
  skillCategory,
  resume,
  ...localizedContentTypes,
  ...sectionTypes,
];
