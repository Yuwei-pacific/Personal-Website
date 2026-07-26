import { project } from "./project";
import { skillCategory } from "./skill-category";
import { resume } from "./resume";
import { sectionTypes } from "./sections";

export const schemaTypes = [project, skillCategory, resume, ...sectionTypes];
