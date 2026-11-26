import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ProjectDetail } from "@/lib/view-models/types";

/** 自定义正文拿到的东西：和模板一样是规范化之后的项目、当前语言和字典，不直接读 Sanity */
export type CustomBodyProps = {
  project: ProjectDetail;
  locale: Locale;
  dictionary: Dictionary;
};
