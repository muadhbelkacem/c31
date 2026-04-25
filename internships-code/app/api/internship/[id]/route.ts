import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// MUST MATCH THE SAME FUNCTION IN data.ts
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
    const skillKeywords = ['javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'figma', 'communication', 'teamwork', 'excel', 'bilingual', 'french', 'java', 'c++', 'marketing', 'design', 'pharmacy', 'healthcare', 'medical', 'customer service', 'leadership', 'management'];
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public', 'intern_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    
    const seenIds = new Set<string>();
    const internships = data
      .map((item: any) => {
        const cleanTitleText = cleanTitle(item.title);
        const cleanCompanyText = cleanCompany(item.company);
        const cleanLocationText = cleanLocation(item.location);
        
        // Skip if both title and company are not specified
        if (cleanTitleText === 'Position Not Specified' && cleanCompanyText === 'Company Not Specified') {
          return null;
        }
        
        // Generate ID using the same logic as data.ts
        let generatedId = generateId(cleanTitleText, cleanCompanyText);
        
        // Handle duplicates same as data.ts
        let finalId = generatedId;
        let counter = 1;
        while (seenIds.has(finalId)) {
            finalId = `${generatedId}-${counter}`;
            counter++;
        }
        seenIds.add(finalId);
        
        return {
          ...item,
          id: finalId,
          title: cleanTitleText,
          company: cleanCompanyText,
          location: cleanLocationText,
          skills: extractSkills(item.description || ''),
          category: categorizeJob(cleanTitleText),
          salary: cleanSalary(item.salary),
          description: cleanDescription(item.description || ''),
          link: item.platform_link || item.link || "#",
          job_age: item.date_posted || item.job_age || "",
          duration: item.duration || undefined,
        };
      })
      .filter((item): item is any => item !== null); // Remove null items
    
    const internship = internships.find(item => item.id === id);
    
    if (!internship) {
      return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
    }
    
    return NextResponse.json(internship);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}