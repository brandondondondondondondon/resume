export interface Job {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string | null;
}

export interface Role {
  id: string;
  label: string;
  tags: string[];
}

export interface Resume {
  name: string;
  title: string;
  contact: { email: string; location: string; links: { label: string; url: string }[] };
  summary: string;
  roles?: Role[];
  jobs: Job[];
  education: { school: string; degree: string; year: string }[];
}

export interface Bullet {
  id: number;
  jobId: string;
  text: string;
  tags: string[];
}
