import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShortLinkRedirectService {
  constructor(private readonly httpClient: HttpClient) {}

  getLink(shortLinkKey: string) {
    const link$ = this.httpClient.get(`/api/v1/short-links/${shortLinkKey}`);

    return link$;
  }
}
