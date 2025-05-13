export type ShortLinkDto = {
  id: string;
  longLink: string;
  shortKey: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
};

export type ShortLinkWithPermissionsDto = ShortLinkDto & {
  role: 'viewer' | 'editor' | 'admin';
  user: {
    login: string;
    id: string;
    accessToken: string | null;
  };
};

export type CreateShortLinkDto = {
  login: string;
  longLink: string;
  description: string;
};

export type UpdateShortLinkDto = {
  longLink: string;
  description: string;
};
