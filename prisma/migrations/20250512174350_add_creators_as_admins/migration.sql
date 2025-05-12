-- Вставляем новые строки в EditPermission для создателей ссылок
INSERT INTO "EditPermission" ("id", "userId", "shortLinkId", "role")
SELECT
  gen_random_uuid(),            -- UUID для новой записи
  sl."createdByUserId",
  sl."id",
  'admin'
FROM "ShortLink" sl
LEFT JOIN "EditPermission" ep
  ON ep."userId" = sl."createdByUserId" AND ep."shortLinkId" = sl."id"
WHERE ep."id" IS NULL;
