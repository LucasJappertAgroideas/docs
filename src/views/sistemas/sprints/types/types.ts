export interface ProjectEffort {
    projectName: string;
    totalHours: number;
    percentage: number;
    itemCount: number;
    taskCount: number;
}

export interface SprintInfo {
    id: string;
    titulo: string;
    fechaDesde: string;
    fechaHasta: string;
    workingDays?: boolean[];
    items?: any[];
}

export interface SprintData {
    prompt: string;
    projectEffortSummary: ProjectEffort[];
    totalSprintHours: number;
    sprint: SprintInfo;
}

export interface Sprint {
    id: string;
    titulo: string;
    fechaDesde: string;
    fechaHasta: string;
    projectEffortSummary: ProjectEffort[];
    totalSprintHours: number;
}
