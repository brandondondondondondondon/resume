import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';

const RESUME = {
  name: 'Test Person',
  title: 'Dev',
  contact: { email: 'a@b.c', location: 'X', links: [{ label: 'GitHub', url: 'https://example.com/gh' }] },
  summary: 'sum',
  roles: [
    { id: 'fe', label: 'Frontend', tags: ['frontend'] },
    { id: 'be', label: 'Backend', tags: ['backend'] },
  ],
  jobs: [
    { id: 'j1', company: 'Acme', role: 'Lead', start: '2021-01', end: null },
    { id: 'j2', company: 'Globex', role: 'Dev', start: '2018-01', end: '2020-12' },
  ],
  education: [{ school: 'Uni', degree: 'BS', year: '2018' }],
};

const BULLETS = [
  { id: 1, jobId: 'j1', text: 'Front thing', tags: ['frontend'] },
  { id: 2, jobId: 'j1', text: 'Back thing', tags: ['backend'] },
  { id: 3, jobId: 'j2', text: 'Both thing', tags: ['frontend', 'backend'] },
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

  const bulletTexts = () => [...el.querySelectorAll('li')].map((li) => li.textContent?.trim());
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
    expect(bulletTexts()).toEqual(['Front thing', 'Back thing', 'Both thing']);
    expect(el.textContent).toContain('2021-01 – Present');
    expect(el.textContent).toContain('2018-01 – 2020-12');
    expect(el.textContent).toContain('BS');
    expect(el.textContent).toContain('GitHub');
  });

  it('filters bullets by tag and clears the filter when toggled off', async () => {
    await setup();
    const chip = () => byText('mat-chip-option', 'backend');
    await click(chip());
    expect(bulletTexts()).toEqual(['Back thing', 'Both thing']);
    await click(chip());
    expect(bulletTexts()).toHaveLength(3);
  });

  it('selects and deselects a role', async () => {
    await setup();
    const role = () => byText('.roles button', 'Backend');
    await click(role());
    expect(bulletTexts()).toEqual(['Back thing', 'Both thing']);
    expect(role()?.getAttribute('aria-pressed')).toBe('true');
    await click(role());
    expect(bulletTexts()).toHaveLength(3);
  });

  it('applies ?role= from the URL', async () => {
    await setup('?role=fe');
    expect(bulletTexts()).toEqual(['Front thing', 'Both thing']);
  });

  it('applies ?tags= from the URL and keeps the URL in sync', async () => {
    await setup('?tags=backend');
    expect(bulletTexts()).toEqual(['Back thing', 'Both thing']);
    await click(byText('mat-chip-option', 'frontend'));
    expect(window.location.search).toBe('?tags=backend%2Cfrontend');
    await click(byText('.roles button', 'Frontend'));
    await click(byText('.roles button', 'Frontend'));
    expect(window.location.search).toBe('');
  });

  it('ignores an unknown ?role=', async () => {
    await setup('?role=nope');
    expect(bulletTexts()).toHaveLength(3);
  });

  it('works when the resume has no roles', async () => {
    await setup('', { ...RESUME, roles: undefined });
    expect(el.querySelector('.roles')).toBeNull();
    expect(bulletTexts()).toHaveLength(3);
  });

  describe('PDF button', () => {
    it('links to resume.pdf with no filter', async () => {
      await setup();
      expect(pdf()?.getAttribute('href')).toBe('resume.pdf');
    });

    it('links to the role PDF when a role is selected', async () => {
      await setup('?role=be');
      expect(pdf()?.getAttribute('href')).toBe('resume-be.pdf');
    });

    it('prints the current view for a custom tag selection', async () => {
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
