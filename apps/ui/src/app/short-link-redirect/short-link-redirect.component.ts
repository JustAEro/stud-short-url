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
    this.sub = this.shortLinkRedirectService
      .getLink(this.shortLinkKey)
      .subscribe((linkData) => {
        console.log(linkData);

        const longLink = (linkData as any)?.longLink; // TODO: remove any, use dto type from common

        if (longLink) {
          window.location.replace(longLink);
        } else {
          console.error('Long link not found');
        }
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
