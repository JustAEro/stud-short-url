import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShortLinkDto } from '@stud-short-url/common';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShortLinkRedirectService {
  constructor(private readonly httpClient: HttpClient) {}

  getLink(shortLinkKey: string): Observable<ShortLinkDto> {
    const link$ = this.httpClient
      .get<ShortLinkDto>(`/api/v1/short-links/${shortLinkKey}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error occurred:', error.message);

          return throwError(
            () => error
          );
        })
      );

    return link$;
  }
}
