export interface Job {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string | null;
}

export interface Resume {
  name: string;
  title: string;
  contact: { email: string; location: string; links: { label: string; url: string }[] };
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: Job[];
  additionalExperience: Job[];
  education: { school: string; degree: string; year: string; gpa?: string }[];
  certifications: string[];
  awards: string[];
}

export interface Bullet {
  jobId: string;
  text: string;
  tags: string[];
  skills?: string[];
}
