import { promises as fs } from 'fs';
import path from 'path';

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  salary: string;
  description: string;
  rating: string;
  job_age: string;
  platform: string;
  skills: string[];
  category: string;
  duration?: string;
}

let cachedInternships: Internship[] | null = null;

// UPDATED: Stable ID without index dependency
function generateId(title: string, company: string): string {
    const cleanTitle = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
    
    const cleanCompany = company.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `${cleanTitle}-${cleanCompany}`;
}

function categorizeJob(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('software') || lowerTitle.includes('developer') || lowerTitle.includes('engineer')) return 'Software';
    if (lowerTitle.includes('data') || lowerTitle.includes('analyst') || lowerTitle.includes('ai') || lowerTitle.includes('scientist')) return 'Data/AI';
    if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) return 'Design';
    if (lowerTitle.includes('marketing')) return 'Marketing';
    if (lowerTitle.includes('pharmacist') || lowerTitle.includes('health') || lowerTitle.includes('medical')) return 'Healthcare';
    return 'Business';
}

function extractSkills(description: string): string[] {
    if (!description) return [];
    const skillKeywords = ['javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'figma', 'communication', 'teamwork', 'excel', 'bilingual', 'french', 'java', 'c++', 'marketing', 'design', 'pharmacy', 'healthcare', 'medical', 'customer service', 'leadership', 'management', 'ai', 'machine learning', 'data science', 'data analysis', 'cloud', 'azure', 'gcp', 'docker', 'kubernetes', 'typescript', 'html', 'css', 'mongodb', 'postgresql', 'mysql', 'nosql'];
    const foundSkills = new Set<string>();
    const descLower = description.toLowerCase();

    skillKeywords.forEach(skill => {
        if (descLower.includes(skill)) {
            foundSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    });
    return Array.from(foundSkills).slice(0, 5);
}

function cleanTitle(title: string): string {
  if (!title || title.trim() === '') return 'Position Not Specified';
  return title.trim();
}

function cleanCompany(company: string): string {
  if (!company || company.trim() === '') return 'Company Not Specified';
  return company.trim();
}

function cleanLocation(location: string): string {
  if (!location || location.trim() === '') return 'Location Not Specified';
  return location.trim();
}

function cleanSalary(salaryText: string): string {
    if (!salaryText || salaryText === 'Not specified') return 'Salary not specified';
    
    // Extract just the salary range part
    const salaryMatch = salaryText.match(/\$[\d\.,]+[KMB]?\s*[–\-]\s*\$[\d\.,]+[KMB]?(?:\/[a-z]+)?/i);
    if (salaryMatch) {
        return salaryMatch[0].trim();
    }
    
    // Try to find single salary
    const simpleSalaryMatch = salaryText.match(/\$[\d\.,]+[KMB]?(?:\/[a-z]+)?/i);
    if (simpleSalaryMatch) {
        return simpleSalaryMatch[0].trim();
    }
    
    return 'Salary not specified';
}

// FIXED: Removed 2000 character truncation
function cleanDescription(description: string): string {
    if (!description) return '';
    
    // Just clean line breaks, don't truncate
    return description
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
}

export async function getInternships(): Promise<Internship[]> {
  if (cachedInternships) {
    return cachedInternships;
  }

  const filePath = path.join(process.cwd(), 'public', 'intern_data.json');
  
  try {
    console.log('Reading file from:', filePath);
    const fileContents = await fs.readFile(filePath, 'utf8');
    
    // Check if file is empty
    if (!fileContents.trim()) {
      console.error('File is empty');
      return [];
    }
    
    // Check if it starts with HTML/XML
    if (fileContents.trim().startsWith('<')) {
      console.error('File appears to contain HTML/XML, not JSON');
      return [];
    }
    
    const data = JSON.parse(fileContents);
    console.log('Successfully parsed JSON, data type:', typeof data);

    if (!Array.isArray(data)) {
        console.error("Data is not an array. Please check intern_data.json");
        return [];
    }

    console.log(`Processing ${data.length} internships`);
    
    // Process all internships
    const validInternships: Internship[] = [];
    const seenIds = new Set<string>(); // To handle duplicates
    
    data.forEach((item: any) => {
        // Clean the data
        const cleanTitleText = cleanTitle(item.title);
        const cleanCompanyText = cleanCompany(item.company);
        const cleanLocationText = cleanLocation(item.location);
        
        // Skip if both title and company are not specified
        if (cleanTitleText === 'Position Not Specified' && cleanCompanyText === 'Company Not Specified') {
            return;
        }
        
        // Generate stable ID
        const id = generateId(cleanTitleText, cleanCompanyText);
        
        // Handle potential duplicates (same title-company combination)
        let finalId = id;
        let counter = 1;
        while (seenIds.has(finalId)) {
            finalId = `${id}-${counter}`;
            counter++;
        }
        seenIds.add(finalId);
        
        validInternships.push({
            id: finalId,
            title: cleanTitleText,
            company: cleanCompanyText,
            location: cleanLocationText,
            link: item.platform_link || item.link || "#",
            salary: cleanSalary(item.salary),
            description: cleanDescription(item.description || ""),
            rating: item.rating || "",
            job_age: item.date_posted || item.job_age || "",
            platform: item.platform || "",
            skills: extractSkills(item.description),
            category: categorizeJob(cleanTitleText),
            duration: item.duration || undefined,
        });
    });

    cachedInternships = validInternships;
    console.log(`Processed ${cachedInternships.length} valid internships`);
    return cachedInternships;

  } catch (error) {
    console.error("Error reading or parsing intern_data.json:", error);
    if (error instanceof SyntaxError) {
      console.error("JSON Syntax Error - file may be corrupted or not valid JSON");
    }
    return [];
  }
}

export async function getInternshipById(id: string): Promise<Internship | undefined> {
  const internships = await getInternships();
  return internships.find(internship => internship.id === id);
}

// Function to find similar internships
export function findSimilarInternships(currentInternship: Internship, allInternships: Internship[], maxResults: number = 5): Internship[] {
  if (!currentInternship || allInternships.length <= 1) return [];
  
  // Filter out the current role and find similar ones
  const similarInternships = allInternships
    .filter(internship => internship.id !== currentInternship.id)
    .slice(0, maxResults);
  
  return similarInternships;
}