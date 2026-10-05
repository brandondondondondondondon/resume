import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Bullet, Resume } from './resume.model';

const THEME_KEY = 'theme';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, MatToolbarModule],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);

  // Relative URLs so they resolve under the GitHub Pages base href.
  protected readonly resume = toSignal(this.http.get<Resume>('data/resume.json'));
  private readonly bullets = toSignal(this.http.get<Bullet[]>('data/bullets.json'), {
    initialValue: [] as Bullet[],
  });

  private readonly params = new URLSearchParams(window.location.search);
  protected readonly activeTags = signal<string[]>(
    this.params.get('tags')?.split(',').filter(Boolean) ?? [],
  );
  protected readonly activeSkills = signal<string[]>([]);

  protected readonly dark = signal(
    localStorage.getItem(THEME_KEY)
      ? localStorage.getItem(THEME_KEY) === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  protected readonly tags = computed(() =>
    [...new Set(this.bullets().flatMap((b) => b.tags))].sort(),
  );

  protected readonly pdfHref = computed(() =>
    this.activeTags().length === 0 ? 'resume.pdf' : null,
  );

  private readonly visibleEntries = (entries: Resume['experience']) => {
    const active = this.activeTags();
    const bullets = this.bullets().filter(
      (b) => active.length === 0 || b.tags.some((t) => active.includes(t)),
    );
    return entries
      .map((job) => ({ job, bullets: bullets.filter((b) => b.jobId === job.id) }))
      .filter((entry) => entry.bullets.length > 0);
  };

  protected readonly experience = computed(() =>
    this.visibleEntries(this.resume()?.experience ?? []),
  );

  protected readonly additionalExperience = computed(() =>
    this.visibleEntries(this.resume()?.additionalExperience ?? []),
  );

  constructor() {
    effect(() => {
      document.documentElement.style.colorScheme = this.dark() ? 'dark' : 'light';
    });

    // Keep the URL shareable as filters change.
    effect(() => {
      const tags = this.activeTags();
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      if (tags.length) url.searchParams.set('tags', tags.join(','));
      else url.searchParams.delete('tags');
      window.history.replaceState(null, '', url);
    });
  }

  protected toggleTag(tag: string) {
    this.activeTags.update((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );
  }

  protected toggleSkill(skill: string) {
    this.activeSkills.update((cur) =>
      cur.includes(skill) ? cur.filter((item) => item !== skill) : [...cur, skill],
    );
  }

  protected hasSelectedSkill(bullet: Bullet) {
    return (bullet.skills ?? []).some((skill) => this.activeSkills().includes(skill));
  }

  protected toggleTheme() {
    this.dark.update((d) => !d);
    localStorage.setItem(THEME_KEY, this.dark() ? 'dark' : 'light');
  }

  protected print() {
    window.print();
  }
}
