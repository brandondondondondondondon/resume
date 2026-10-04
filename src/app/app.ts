import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Bullet, Resume, Role } from './resume.model';

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
  protected readonly activeTags = signal<string[]>(this.params.get('tags')?.split(',').filter(Boolean) ?? []);
  private readonly initialRole = this.params.get('role');

  protected readonly dark = signal(
    localStorage.getItem(THEME_KEY)
      ? localStorage.getItem(THEME_KEY) === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  protected readonly tags = computed(() =>
    [...new Set(this.bullets().flatMap((b) => b.tags))].sort(),
  );

  protected readonly activeRole = computed(() => {
    const active = [...this.activeTags()].sort().join();
    return this.resume()?.roles?.find((r) => [...r.tags].sort().join() === active) ?? null;
  });

  // Null for custom tag selections, which have no pre-generated PDF.
  protected readonly pdfHref = computed(() => {
    const role = this.activeRole();
    if (role) return `resume-${role.id}.pdf`;
    return this.activeTags().length === 0 ? 'resume.pdf' : null;
  });

  protected readonly jobs = computed(() => {
    const active = this.activeTags();
    const bullets = this.bullets().filter(
      (b) => active.length === 0 || b.tags.some((t) => active.includes(t)),
    );
    return (this.resume()?.jobs ?? [])
      .map((job) => ({ job, bullets: bullets.filter((b) => b.jobId === job.id) }))
      .filter((entry) => entry.bullets.length > 0);
  });

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

    // Resolve ?role=<id> once the role list has loaded.
    effect(() => {
      const role = this.resume()?.roles?.find((r) => r.id === this.initialRole);
      if (role && this.activeTags().length === 0) this.activeTags.set(role.tags);
    });
  }

  protected toggleTag(tag: string) {
    this.activeTags.update((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]));
  }

  protected selectRole(role: Role) {
    this.activeTags.set(this.activeRole()?.id !== role.id ? role.tags : []);
  }

  protected toggleTheme() {
    this.dark.update((d) => !d);
    localStorage.setItem(THEME_KEY, this.dark() ? 'dark' : 'light');
  }

  protected print() {
    window.print();
  }
}
