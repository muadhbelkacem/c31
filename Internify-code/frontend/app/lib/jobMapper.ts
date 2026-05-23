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
  is_real_internship?: boolean;
  internship_probability?: number;
  needs_manual_review?: boolean;
  source_id?: string;
  platform_link?: string;
  original_apply_link?: string;
  scrape_date?: string;
  scraped_date?: string;
}

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateStableRoleId(item: any, title: string, company: string, location = ''): string {
  const sourceId = String(item?.id || item?.job_id || item?.source_id || '').trim();
  if (sourceId) return sourceId;

  const base = [title, company, location]
    .filter(Boolean)
    .map(slugify)
    .filter(Boolean)
    .join('-');

  return base || 'role-not-specified';
}

function firstNonEmpty(...values: any[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value);
    const cleaned = text.trim();
    if (cleaned && !['n/a', 'none', 'null', 'nan'].includes(cleaned.toLowerCase())) {
      return cleaned;
    }
  }
  return '';
}

function cleanText(value: any): string {
  return firstNonEmpty(value)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanTitle(value: any): string {
  const title = cleanText(value);
  return title || 'Position Not Specified';
}

function cleanCompany(value: any): string {
  const company = cleanText(value);
  return company || 'Company Not Specified';
}

function cleanLocation(value: any): string {
  const location = cleanText(value);
  return location || 'Location Not Specified';
}

function cleanSalary(value: any): string {
  const salaryText = cleanText(value);
  if (!salaryText || salaryText.toLowerCase() === 'not specified') return 'Salary not specified';

  const range = salaryText.match(/\$[\d\.,]+[KMB]?\s*[–\-]\s*\$[\d\.,]+[KMB]?(?:\s*\/\s*[a-z]+)?/i);
  if (range) return range[0].replace(/\s+/g, ' ').trim();

  const hourlyRange = salaryText.match(/\$[\d\.,]+\s*[–\-]\s*\$[\d\.,]+\s*\/\s*(?:hour|hr)/i);
  if (hourlyRange) return hourlyRange[0].replace(/\s+/g, ' ').trim();

  const single = salaryText.match(/\$[\d\.,]+[KMB]?(?:\s*\/\s*[a-z]+)?/i);
  if (single) return single[0].replace(/\s+/g, ' ').trim();

  return salaryText === 'N/A' ? 'Salary not specified' : salaryText;
}

function cleanDescription(value: any): string {
  return cleanText(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

function prettifySkill(skill: string): string {
  const custom: Record<string, string> = {
    'c++': 'C++',
    'c#': 'C#',
    'node.js': 'Node.js',
    'ui/ux': 'UI/UX',
    'tcp/ip': 'TCP/IP',
    'aws': 'AWS',
    'gcp': 'GCP',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'gis': 'GIS',
    'autocad': 'AutoCAD',
    'power bi': 'Power BI',
  };
  return custom[skill] || skill.replace(/\b\w/g, char => char.toUpperCase());
}

function extractSkillsFromDescription(description: string): string[] {
  if (!description) return [];
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'sql', 'mysql', 'postgresql', 'mongodb',
    'react', 'node.js', 'html', 'css', 'php', 'git', 'jira', 'linux', 'aws', 'azure', 'gcp', 'docker',
    'kubernetes', 'machine learning', 'ai', 'data analysis', 'data science', 'excel', 'powerpoint',
    'power bi', 'sap', 'agile', 'scrum', 'communication', 'problem solving', 'leadership', 'customer service',
    'project management', 'marketing', 'finance', 'accounting', 'pharmacy', 'healthcare', 'medical',
    'gis', 'autocad', 'civil engineering', 'environmental', 'pcb', 'fpga', 'vhdl', 'embedded systems',
    'cybersecurity', 'networking', 'tcp/ip', 'figma', 'ui/ux', 'design'
  ];
  const found = new Set<string>();
  const lower = description.toLowerCase();
  for (const skill of skillKeywords) {
    if (lower.includes(skill)) found.add(prettifySkill(skill));
  }
  return Array.from(found).slice(0, 10);
}

function categorizeJob(title: string, description = ''): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/pharmacist|pharmacy|medical|healthcare|nurse|clinical|patient/.test(text)) return 'Healthcare';
  if (/software|developer|programming|programmer|frontend|backend|full stack|web|embedded|qa|quality assurance/.test(text)) return 'Software';
  if (/data scientist|machine learning|artificial intelligence|\bai\b|analytics|data analysis|statistics|statistical/.test(text)) return 'Data/AI';
  if (/cybersecurity|security|vulnerability|threat|penetration|malware|network security/.test(text)) return 'Cybersecurity';
  if (/civil engineering|mechanical|electrical|aerospace|industrial engineering|technologist|autocad|blueprints|field survey/.test(text)) return 'Engineering';
  if (/design|graphic|creative|ui|ux|figma|visual/.test(text)) return 'Design';
  if (/marketing|sales|finance|accounting|investment|business|human resources|operations|project coordinator|management/.test(text)) return 'Business';
  return 'General';
}

function inferDuration(description: string): string | undefined {
  const match = description.match(/(?:duration|durée|length|expected duration)\s*[:\-]?\s*([^\n.;]{2,60})/i);
  if (match) return match[1].trim();
  const months = description.match(/\b(\d{1,2}\s*(?:-|to)?\s*\d{0,2}\s*months?)\b/i);
  if (months) return months[1].replace(/\s+/g, ' ').trim();
  return undefined;
}

export function normalizeRoleItem(item: any, seenIds?: Set<string>): Internship | null {
  const title = cleanTitle(firstNonEmpty(item?.title, item?.job_title, item?.position, item?.role));
  const company = cleanCompany(firstNonEmpty(item?.company, item?.employer, item?.organization, item?.company_name));
  const location = cleanLocation(firstNonEmpty(item?.location, item?.city, item?.job_location, item?.place));

  if (title === 'Position Not Specified' && company === 'Company Not Specified') {
    return null;
  }

  const description = cleanDescription(firstNonEmpty(item?.description, item?.job_description, item?.summary, item?.details));
  const baseId = generateStableRoleId(item, title, company, location);
  let id = baseId;
  if (seenIds) {
    let counter = 1;
    while (seenIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter += 1;
    }
    seenIds.add(id);
  }

  const explicitSkills = Array.isArray(item?.skills) ? item.skills.filter(Boolean).map(String) : [];
  const skills = explicitSkills.length > 0 ? explicitSkills : extractSkillsFromDescription(description);
  const category = firstNonEmpty(item?.category, item?.domain, item?.domain_classification?.primary) || categorizeJob(title, description);

  return {
    id,
    source_id: firstNonEmpty(item?.id, item?.job_id, item?.source_id),
    title,
    company,
    location,
    link: firstNonEmpty(item?.original_apply_link, item?.apply_url, item?.link, item?.url, item?.platform_link) || '#',
    platform_link: firstNonEmpty(item?.platform_link),
    original_apply_link: firstNonEmpty(item?.original_apply_link),
    salary: cleanSalary(firstNonEmpty(item?.salary, item?.compensation, item?.pay, item?.wage)),
    description,
    rating: firstNonEmpty(item?.rating),
    job_age: firstNonEmpty(item?.job_age, item?.date_posted, item?.posted_date, item?.posted, item?.scrape_date, item?.scraped_date),
    scrape_date: firstNonEmpty(item?.scrape_date),
    scraped_date: firstNonEmpty(item?.scraped_date),
    platform: firstNonEmpty(item?.platform, item?.source, item?.site),
    skills,
    category,
    duration: firstNonEmpty(item?.duration) || inferDuration(description),
    is_real_internship: typeof item?.is_real_internship === 'boolean' ? item.is_real_internship : undefined,
    internship_probability: typeof item?.internship_probability === 'number' ? item.internship_probability : undefined,
    needs_manual_review: typeof item?.needs_manual_review === 'boolean' ? item.needs_manual_review : undefined,
  };
}

export function normalizeRoleArray(data: any[]): Internship[] {
  const seenIds = new Set<string>();
  return data
    .map(item => normalizeRoleItem(item, seenIds))
    .filter((item): item is Internship => item !== null);
}

export function isProductionAcceptedInternship(role: Internship, minProbability = 0.60): boolean {
  return role.is_real_internship === true &&
    typeof role.internship_probability === 'number' &&
    role.internship_probability >= minProbability;
}
