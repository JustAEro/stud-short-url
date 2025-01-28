export type ShortLinkDto = {
  id: string;
  longLink: string;
  shortKey: string;
  createdByUserId: string;
  createdAt: Date;
  description: string;
};

export type CreateShortLinkDto = { 
  login: string; 
  longLink: string; 
  description: string;
};