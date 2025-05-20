import { ShortLinkDto } from '@stud-short-url/common';

export type ReportApi = {
  id: string;
  name: string;
  createdAt: Date;
  createdByUserId: string;
  shortLinks: Array<{
    shortLink: ShortLinkDto;
  }>;
};
