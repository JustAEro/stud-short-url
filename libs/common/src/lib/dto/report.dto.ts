import { ShortLinkDto } from './link.dto';

export type CreateReportBodyDto = {
  name: string;
  shortLinkIds: string[];
};

export type UpdateReportBodyDto = CreateReportBodyDto;

export type ReportDto = {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
  shortLinks: Array<{
    shortLink: ShortLinkDto;
  }>;
};

export type ReportModelDto = {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
};

export type ReportWithPermissionsDto = ReportDto & {
  role: 'viewer' | 'editor' | 'admin';
  creatorUser: {
    login: string;
    id: string;
  };
};
