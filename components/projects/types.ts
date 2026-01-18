// 项目类型定义

export type Project = {
    _id: string;
    title: string;
    summary?: string;
    year?: number;
    projectType?: string;
    description?: string;
    slug?: { current?: string } | string;
};
