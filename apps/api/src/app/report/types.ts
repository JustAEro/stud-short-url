import { ShortLinkDto } from '@stud-short-url/common';

export type ReportApi = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  shortLinks: Array<{
    shortLink: ShortLinkDto;
  }>;
  timeScale: 'hour' | 'day' | 'month';
  chartType: 'line' | 'bar';
  periodType:
    | 'last24h'
    | 'last7d'
    | 'last30d'
    | 'last365d'
    | 'allTime'
    | 'custom';
  customStart?: Date; // ISO date
  customEnd?: Date; // ISO date
};
