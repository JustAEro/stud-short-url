import { ShortLinkDto } from './link.dto';

export type CreateReportBodyDto = {
  name: string;
  shortLinkIds: string[];
  timeScale?: 'hour' | 'day' | 'month';
  chartType?: 'line' | 'bar';
  periodType?:
    | 'last24h'
    | 'last7d'
    | 'last30d'
    | 'last365d'
    | 'allTime'
    | 'custom';
  customStart?: string; // ISO date
  customEnd?: string; // ISO date
};

export type UpdateReportBodyDto = CreateReportBodyDto;

export type ReportsPaginatedDto = {
  data: ReportDto[];
  totalPages: number;
  currentPage: number;
};

export type ReportDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
  customStart?: string; // ISO date
  customEnd?: string; // ISO date
};

export type ReportModelDto = {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
  timeScale: 'hour' | 'day' | 'month';
  chartType: 'line' | 'bar';
  periodType:
    | 'last24h'
    | 'last7d'
    | 'last30d'
    | 'last365d'
    | 'allTime'
    | 'custom';
  customStart?: string; // ISO date
  customEnd?: string; // ISO date
};

export type ReportWithPermissionsDto = ReportDto & {
  role: 'viewer' | 'editor' | 'admin';
  creatorUser: {
    login: string;
    id: string;
  };
};
