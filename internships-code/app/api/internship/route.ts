import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Cache for processed data (in-memory cache for production)
let cachedInternships: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Helper functions (identical to data.ts)
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
  const skillKeywords = [
    'javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'figma', 
    'communication', 'teamwork', 'excel', 'bilingual', 'french', 'java', 
    'c++', 'marketing', 'design', 'pharmacy', 'healthcare', 'medical', 
    'customer service', 'leadership', 'management', 'ai', 'machine learning',
    'data science', 'data analysis', 'cloud', 'azure', 'gcp', 'docker',
    'kubernetes', 'typescript', 'html', 'css', 'mongodb', 'postgresql',
    'mysql', 'nosql'
  ];
  const foundSkills = new Set<string>();
  const descLower = description.toLowerCase();

  skillKeywords.forEach(skill => {
    if (descLower.includes(skill)) {
      foundSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  return Array.from(foundSkills).slice(0, 5);
}

function cleanSalary(salaryText: string): string {
  if (!salaryText || salaryText === 'Not specified') return 'Salary not specified';
  
  const salaryMatch = salaryText.match(/\$[\d\.,]+[KMB]?\s*[–\-]\s*\$[\d\.,]+[KMB]?(?:\/[a-z]+)?/i);
  if (salaryMatch) {
    return salaryMatch[0].trim();
  }
  
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

// Validate internship entry
function isValidInternship(item: any): boolean {
  const hasTitle = item.title && item.title.trim() !== '';
  const hasCompany = item.company && item.company.trim() !== '';
  return hasTitle && hasCompany;
}

// Process data (cached)
async function getProcessedData(): Promise<any[]> {
  const now = Date.now();
  
  // Return cached data if valid
  if (cachedInternships && (now - lastFetchTime) < CACHE_TTL) {
    return cachedInternships;
  }
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'intern_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format');
      return [];
    }
    
    const seenIds = new Set<string>();
    const processedData = data
      .filter(isValidInternship) // Filter out bad entries
      .map((item: any) => {
        const cleanTitleText = cleanTitle(item.title);
        const cleanCompanyText = cleanCompany(item.company);
        const cleanLocationText = cleanLocation(item.location);
        
        // Generate stable ID
        let generatedId = generateId(cleanTitleText, cleanCompanyText);
        
        // Handle potential duplicates
        let finalId = generatedId;
        let counter = 1;
        while (seenIds.has(finalId)) {
          finalId = `${generatedId}-${counter}`;
          counter++;
        }
        seenIds.add(finalId);
        
        return {
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
        };
      });
    
    // Cache the results
    cachedInternships = processedData;
    lastFetchTime = now;
    
    return processedData;
  } catch (error) {
    console.error('Error processing data:', error);
    return [];
  }
}

export async function GET() {
  try {
    const internships = await getProcessedData();
    
    // Return empty array instead of error for no data
    return NextResponse.json(internships);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}

// For development: allow cache clearing
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'clear-cache') {
    cachedInternships = null;
    lastFetchTime = 0;
    return NextResponse.json({ message: 'Cache cleared' });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}