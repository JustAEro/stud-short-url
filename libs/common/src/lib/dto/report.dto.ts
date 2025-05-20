import { ShortLinkDto } from './link.dto';

export type ReportDto = {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
  shortLinks: Array<{
    shortLink: ShortLinkDto;
  }>;
};
