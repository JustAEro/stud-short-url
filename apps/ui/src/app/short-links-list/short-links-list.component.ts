import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShortLinkDto } from '@stud-short-url/common';

@Component({
  selector: 'app-short-links-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <ng-container *ngIf="loading; else content">
        <p>Loading...</p>
      </ng-container>

      <ng-template #content>
        <div *ngIf="shortLinks.length === 0">
          <p>No short links found.</p>
        </div>
        <ul *ngIf="shortLinks.length > 0" class="short-links-list">
          <li *ngFor="let link of shortLinks" class="short-link-item">
            <a [routerLink]="['/short-links', link.id]">
              <h3>{{ link.shortKey }}</h3>
            </a>
            <p>Short path: <a href="{{ origin + '/' + link.shortKey }}">{{ origin + '/' + link.shortKey }}</a></p>
            <p>Full Path: <a href="{{ link.longLink }}">{{ link.longLink }}</a></p>
            <p>Created: {{ link.createdAt | date: 'medium' }}</p>
          </li>
        </ul>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
      }

      .short-links-list {
        list-style: none;
        padding: 0;
      }

      .short-link-item {
        padding: 1rem;
        margin: 0.5rem 0;
        border: 1px solid #ccc;
        border-radius: 8px;
      }

      .short-link-item a {
        text-decoration: none;
        color: #007bff;
      }

      .short-link-item a:hover {
        text-decoration: underline;
      }

      p {
        margin: 0.2rem 0;
      }
    `,
  ],
})
export class ShortLinksListComponent implements OnInit {
  shortLinks: ShortLinkDto[] = [];
  loading = false;
  origin = window.location.origin;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadShortLinks();
  }

  loadShortLinks(): void {
    this.loading = true;

    this.http.get<ShortLinkDto[]>('/api/v1/short-links').subscribe({
      next: (data) => {
        this.shortLinks = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load short links:', err);
        this.loading = false;
      },
    });
  }
}
