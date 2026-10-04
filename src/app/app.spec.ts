import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    window.matchMedia ??= (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should render name and bullets from JSON', async () => {
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('data/resume.json').flush({
      name: 'Test Person',
      title: 'Dev',
      contact: { email: 'a@b.c', location: 'X', links: [] },
      summary: 's',
      jobs: [{ id: 'j', company: 'C', role: 'R', start: '2020-01', end: null }],
      education: [],
    });
    http.expectOne('data/bullets.json').flush([{ id: 1, jobId: 'j', text: 'Did a thing', tags: ['t'] }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent).toContain('Test Person');
    expect(el.querySelector('li')?.textContent).toContain('Did a thing');
  });
});
