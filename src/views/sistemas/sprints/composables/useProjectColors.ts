import type { ProjectEffort } from '../types/types';

const colorMap: Record<string, string> = {
    '🟢': '#3fb950',
    '🔵': '#58a6ff',
    '🔴': '#f85149',
    '🟡': '#f0883e',
    '🟣': '#8957e5',
    '🟠': '#d29922',
    '⚫': '#8b949e',
    '📋': '#79c0ff',
};

export const getProjectColor = (projectName: string): string => {
    for (const [emoji, color] of Object.entries(colorMap)) {
        if (projectName.includes(emoji)) {
            return color;
        }
    }
    return '#8b949e';
};

export const getProjectColors = (projects: ProjectEffort[]): Record<string, string> => {
    const colors: Record<string, string> = {};
    projects.forEach(project => {
        colors[project.projectName] = getProjectColor(project.projectName);
    });
    return colors;
};
