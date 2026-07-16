- Environments: .env.local, .env
✓ Ready in 4.0s

prisma:query SELECT "public"."events"."id", "public"."events"."name", "public"."events"."code", "public"."events"."category", "public"."events"."city", "public"."events"."location", "public"."events"."thumbnail_image", "public"."events"."slide_image", "public"."events"."start_date" FROM "public"."events" WHERE "public"."events"."event_status_id" = $1 ORDER BY "public"."events"."start_date" ASC OFFSET $2
prisma:query SELECT "public"."ticket_categories"."id", "public"."ticket_categories"."price", "public"."ticket_categories"."event_id" FROM "public"."ticket_categories" WHERE ("public"."ticket_categories"."ticket_category_status_id" = $1 AND "public"."ticket_categories"."event_id" IN ($2,$3,$4,$5,$6)) ORDER BY "public"."ticket_categories"."price" ASC OFFSET $7
 GET /images/slide-mars9.png 404 in 722ms (next.js: 329ms, application-code: 393ms)
⨯ The requested resource isn't a valid image for /images/slide-mars9.png received null
 GET / 200 in 8.6s (next.js: 900ms, application-code: 7.7s)
 GET /images/thumbnail-iceskating.png 404 in 1334ms (next.js: 101ms, application-code: 1233ms)
 GET /images/thumbnail-mars9.png 404 in 1347ms (next.js: 187ms, application-code: 1159ms)
 GET /images/thumbnail-sharingtime.png 404 in 1358ms (next.js: 281ms, application-code: 1077ms)
⨯ The requested resource isn't a valid image for /images/thumbnail-iceskating.png received null
⨯ The requested resource isn't a valid image for /images/thumbnail-mars9.png received null
⨯ The requested resource isn't a valid image for /images/thumbnail-sharingtime.png received null
 GET /images/thumbnail-prologfest.png 404 in 1392ms (next.js: 578ms, application-code: 814ms)
 GET /images/thumbnail-berpesta.png 404 in 1403ms (next.js: 745ms, application-code: 658ms)
⨯ The requested resource isn't a valid image for /images/thumbnail-prologfest.png received null
⨯ The requested resource isn't a valid image for /images/thumbnail-berpesta.png received null




