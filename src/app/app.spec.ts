import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

const RESUME = {
  name: 'Test Person',
  title: 'Dev',
  contact: {
    email: 'a@b.c',
    location: 'X',
    links: [{ label: 'GitHub', url: 'https://example.com/gh' }],
  },
  summary: 'sum',
  skills: [{ category: 'Languages & Frameworks', items: ['Java', 'Spring Boot'] }],
  experience: [
    { id: 'j1', company: 'Acme', role: 'Lead', start: '2021-01', end: null },
    { id: 'j2', company: 'Globex', role: 'Dev', start: '2018-01', end: '2020-12' },
  ],
  additionalExperience: [],
  education: [{ school: 'Uni', degree: 'BS', year: '2018', gpa: '3.68' }],
  certifications: ['AWS Certified Developer – Associate'],
  awards: ['IPSO finalist, 2013 — Project Ripple'],
};

const BULLETS = [
  { id: 1, jobId: 'j1', text: 'Front thing', tags: ['frontend'], skills: ['Java'] },
  { id: 2, jobId: 'j1', text: 'Back thing', tags: ['backend'], skills: ['Spring Boot'] },
  {
    id: 3,
    jobId: 'j2',
    text: 'Both thing',
    tags: ['frontend', 'backend'],
    skills: ['Java', 'Spring Boot'],
  },
];

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let el: HTMLElement;

  async function setup(search = '', resume: object = RESUME) {
    window.history.replaceState(null, '', '/' + search);
    fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('data/resume.json').flush(resume);
    http.expectOne('data/bullets.json').flush(BULLETS);
    await fixture.whenStable();
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }

  const bulletTexts = () => [...el.querySelectorAll('.job li')].map((li) => li.textContent?.trim());
  const click = async (node: Element | null | undefined) => {
    (node as HTMLElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const byText = (selector: string, text: string) =>
    [...el.querySelectorAll(selector)].find((n) => n.textContent?.includes(text));
  const pdf = () => el.querySelector<HTMLElement>('.pdf');

  beforeEach(async () => {
    localStorage.clear();
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders header, jobs, bullets and education from JSON', async () => {
    await setup();
    expect(el.querySelector('.name')?.textContent).toContain('Test Person');
    expect(el.querySelector('mat-toolbar')?.textContent).not.toContain('Test Person');
    expect(bulletTexts()).toEqual(['Front thing', 'Back thing', 'Both thing']);
    expect(el.textContent).toContain('2021-01 – Present');
    expect(el.textContent).toContain('2018-01 – 2020-12');
    expect(el.textContent).toContain('BS');
    expect(el.textContent).toContain('GPA: 3.68');
    expect(el.textContent).toContain('GitHub');
    expect(el.textContent).toContain('Spring Boot');
    expect(el.textContent).toContain('AWS Certified Developer – Associate');
    expect(el.textContent).toContain('IPSO finalist, 2013 — Project Ripple');
    expect(el.textContent).toContain('Experience');
    expect(el.querySelector('#additional-experience-heading')).toBeNull();
  });

  it('renders additional experience separately from software engineering roles', async () => {
    await setup('', {
      ...RESUME,
      experience: [RESUME.experience[0]],
      additionalExperience: [RESUME.experience[1]],
    });
    expect(el.querySelector('#experience-heading')?.textContent).toContain('Experience');
    expect(el.querySelector('#additional-experience-heading')?.textContent).toContain(
      'Additional Experience',
    );
    expect(el.textContent).toContain('Globex');
  });

  it('filters bullets by tag and clears the filter when toggled off', async () => {
    await setup();
    const chip = () => byText('mat-chip-option', 'backend');
    await click(chip());
    expect(bulletTexts()).toEqual(['Back thing', 'Both thing']);
    await click(chip());
    expect(bulletTexts()).toHaveLength(3);
  });

  it('shows bullets matching any of the selected tags', async () => {
    await setup();
    await click(byText('mat-chip-option', 'frontend'));
    await click(byText('mat-chip-option', 'backend'));
    expect(bulletTexts()).toEqual(['Front thing', 'Back thing', 'Both thing']);
  });

  it('highlights bullets with selected skills without filtering other bullets', async () => {
    await setup();
    await click(byText('.skill-chip', 'Java'));
    expect(bulletTexts()).toEqual(['Front thing', 'Back thing', 'Both thing']);
    expect(el.querySelectorAll('.job li.skill-highlighted')).toHaveLength(2);
    expect(byText('.skill-chip', 'Java')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('clears highlights when a skill is selected again', async () => {
    await setup();
    const java = () => byText('.skill-chip', 'Java');
    await click(java());
    await click(java());
    expect(el.querySelectorAll('.job li.skill-highlighted')).toHaveLength(0);
    expect(java()?.getAttribute('aria-pressed')).toBe('false');
  });

  it('lists the selected tags in the print footer only when tags are selected', async () => {
    await setup();
    expect(el.querySelector('.print-tags')).toBeNull();
    await click(byText('mat-chip-option', 'frontend'));
    await click(byText('mat-chip-option', 'backend'));
    expect(el.querySelector('.print-tags')?.textContent).toContain('frontend, backend');
  });

  it('shows filter chips for tags used by bullets', async () => {
    await setup();
    expect(
      [...el.querySelectorAll('mat-chip-option')].map((chip) => chip.textContent?.trim()),
    ).toEqual(['backend', 'frontend']);
  });

  it('applies ?tags= from the URL and keeps the URL in sync', async () => {
    await setup('?tags=backend');
    expect(bulletTexts()).toEqual(['Back thing', 'Both thing']);
    await click(byText('mat-chip-option', 'frontend'));
    expect(window.location.search).toBe('?tags=backend%2Cfrontend');
    await click(byText('mat-chip-option', 'frontend'));
    await click(byText('mat-chip-option', 'backend'));
    expect(window.location.search).toBe('');
  });

  it('ignores legacy ?role= links', async () => {
    await setup('?role=fe');
    expect(bulletTexts()).toHaveLength(3);
    expect(window.location.search).toBe('');
  });

  it('does not render preset role controls', async () => {
    await setup();
    expect(el.querySelector('.roles')).toBeNull();
  });

  describe('PDF button', () => {
    it('links to resume.pdf with no filter', async () => {
      await setup();
      expect(pdf()?.getAttribute('href')).toBe('resume.pdf');
    });

    it('prints the current view when tags are selected', async () => {
      await setup('?tags=frontend,backend');
      const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
      expect(pdf()?.tagName).toBe('BUTTON');
      await click(pdf());
      expect(print).toHaveBeenCalledOnce();
    });
  });

  describe('theme', () => {
    it('follows the system preference by default', async () => {
      window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
      await setup();
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('uses the saved choice over the system preference', async () => {
      window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
      localStorage.setItem('theme', 'light');
      await setup();
      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('toggles and persists the choice', async () => {
      await setup();
      expect(document.documentElement.style.colorScheme).toBe('light');
      await click(el.querySelector('button[aria-label]'));
      expect(document.documentElement.style.colorScheme).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      await click(el.querySelector('button[aria-label]'));
      expect(localStorage.getItem('theme')).toBe('light');
    });
  });
});
