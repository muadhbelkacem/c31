import { promises as fs } from 'fs';
import path from 'path';
import { Internship, normalizeRoleArray, isProductionAcceptedInternship } from './jobMapper';

export type { Internship } from './jobMapper';

let cachedInternships: Internship[] | null = null;

export async function getInternships(): Promise<Internship[]> {
  if (cachedInternships) return cachedInternships;

  const filePath = path.join(process.cwd(), 'public', 'intern_data.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    if (!fileContents.trim() || fileContents.trim().startsWith('<')) return [];

    const data = JSON.parse(fileContents);
    if (!Array.isArray(data)) {
      console.error('Data is not an array. Please check public/intern_data.json');
      return [];
    }

    cachedInternships = normalizeRoleArray(data).filter(role => isProductionAcceptedInternship(role));
    console.log(`Loaded ${cachedInternships.length} accepted internships from production intern_data.json`);
    return cachedInternships;
  } catch (error) {
    console.error('Error reading or parsing intern_data.json:', error);
    return [];
  }
}

export async function getInternshipById(id: string): Promise<Internship | undefined> {
  const internships = await getInternships();
  return internships.find(internship => internship.id === id);
}

export function findSimilarInternships(currentInternship: Internship, allInternships: Internship[], maxResults: number = 5): Internship[] {
  if (!currentInternship || allInternships.length <= 1) return [];

  const sameCategory = allInternships.filter(role => role.id !== currentInternship.id && role.category === currentInternship.category);
  const overlappingSkills = allInternships.filter(role =>
    role.id !== currentInternship.id &&
    role.category !== currentInternship.category &&
    role.skills.some(skill => currentInternship.skills.includes(skill))
  );

  const combined = [...sameCategory, ...overlappingSkills];
  if (combined.length >= maxResults) return combined.slice(0, maxResults);

  const fallback = allInternships.filter(role => role.id !== currentInternship.id && !combined.some(existing => existing.id === role.id));
  return [...combined, ...fallback].slice(0, maxResults);
}
