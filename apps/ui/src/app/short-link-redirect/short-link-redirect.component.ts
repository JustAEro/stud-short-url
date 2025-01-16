import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortLinkRedirectService } from '../short-link-service/short-link-redirect.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-short-link-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './short-link-redirect.component.html',
  styleUrl: './short-link-redirect.component.scss',
})
export class ShortLinkRedirectComponent implements OnInit, OnDestroy {
  shortLinkKey!: string;
  error: Error | null = null;
  isLoading = false;

  private sub!: Subscription;

  @Input()
  set id(shortLinkKey: string) {
    // router input (:id param)
    this.shortLinkKey = shortLinkKey;
  }

  constructor(
    private readonly shortLinkRedirectService: ShortLinkRedirectService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.sub = this.shortLinkRedirectService
      .getLink(this.shortLinkKey)
      .subscribe({
        next: (linkData) => {
          const longLink = linkData.longLink;

          this.error = null;

          window.location.replace(longLink);
        },
        error: (err: Error) => {
          this.error = err;
          this.isLoading = false;

          console.error('Error caught in component:', err);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
