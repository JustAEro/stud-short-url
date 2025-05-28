import { ReportDto } from './report.dto';

export type LinkStatClicksDto = {
  labels: string[];
  values: number[];
};

export type ByDeviceDto = Array<{
  _count: {
    _all: number;
  };
  deviceType: string;
}>;

export type ByBrowserDto = Array<{
  _count: {
    _all: number;
  };
  browser: string;
}>;

export type ByReferrerDto = Array<{
  _count: {
    _all: number;
  };
  referrer: string | null;
}>;

export type LinkDetailedStatsDto = {
  total: number;
  byDevice: ByDeviceDto;
  byBrowser: ByBrowserDto;
  byReferrer: ByReferrerDto;
};

export type LinkStatReportDto = LinkStatClicksDto &
  LinkDetailedStatsDto & {
    shortLinkId: string;
    shortKey: string;
    description: string;
  };

export type FullReportDto = ReportDto & {
  role: 'viewer' | 'editor' | 'admin';
  aggregate: LinkDetailedStatsDto;
  linksStats: LinkStatReportDto[];
};
