export const longUrlFromShortKey = (shortKey: string): string => {
  const baseUiUrl = process.env['SHORT_LINKS_WEB_APP_URL'];

  if (!baseUiUrl) {
    throw new Error('Base UI URL is not defined in environment variables');
  }

  return `${baseUiUrl}/${shortKey}`;
}
