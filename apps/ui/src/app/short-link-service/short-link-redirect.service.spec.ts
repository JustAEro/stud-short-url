import { TestBed } from '@angular/core/testing';

import { ShortLinkRedirectService } from './short-link-redirect.service';

describe('ShortLinkRedirectService', () => {
  let service: ShortLinkRedirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShortLinkRedirectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
