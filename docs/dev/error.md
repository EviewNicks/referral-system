prisma:query SELECT "public"."ticket_categories"."id", "public"."ticket_categories"."maximum_tickets_per_transaction", "public"."ticket_categories"."name", "public"."ticket_categories"."price", "public"."ticket_categories"."sales_end_time", "public"."ticket_categories"."sales_end_time_offset", "public"."ticket_categories"."sales_start_time", "public"."ticket_categories"."sales_start_time_offset", "public"."ticket_categories"."stock", "public"."ticket_categories"."terms_and_conditions", "public"."ticket_categories"."event_id", "public"."ticket_categories"."created_at", "public"."ticket_categories"."updated_at", "public"."ticket_categories"."ticket_category_status_id", "public"."ticket_categories"."staff_only", "public"."ticket_categories"."position", "public"."ticket_categories"."valid_from", "public"."ticket_categories"."valid_until" FROM "public"."ticket_categories" WHERE ("public"."ticket_categories"."ticket_category_status_id" = $1 AND "public"."ticket_categories"."event_id" IN ($2)) ORDER BY "public"."ticket_categories"."price" ASC OFFSET $3
 GET /events/MARS9 200 in 6.7s (next.js: 1499ms, application-code: 5.2s)
○ Compiling /checkout ...
prisma:query SELECT "public"."events"."id", "public"."events"."name", "public"."events"."city", "public"."events"."location", "public"."events"."thumbnail_image", "public"."events"."admin_fee", "public"."events"."event_status_id" FROM "public"."events" WHERE ("public"."events"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."ticket_categories"."id", "public"."ticket_categories"."name", "public"."ticket_categories"."price", "public"."ticket_categories"."stock", "public"."ticket_categories"."maximum_tickets_per_transaction" FROM "public"."ticket_categories" WHERE ("public"."ticket_categories"."id" IN ($1) AND "public"."ticket_categories"."event_id" = $2 AND "public"."ticket_categories"."ticket_category_status_id" = $3) OFFSET $4
 GET /checkout?event=550e8400-e29b-41d4-a716-446655440001&tickets=tc-mars9-normal+++++++++++++++++++++%3A1 200 in 10.1s (next.js: 4.1s, application-code: 6.0s)
❌ Error creating order in checkout: Error [PrismaClientKnownRequestError]: Transaction API error: Unable to start a transaction in the given time.
    at async createOrderAction (app\checkout\actions.ts:29:19)
  27 |
  28 |     // Create the order and its associated tickets in a transaction
> 29 |     const order = await prisma.$transaction(async (tx) => {
     |                   ^
  30 |       // 1. Create the Order
  31 |       const newOrder = await tx.orders.create({
  32 |         data: { {
  code: 'P2028',
  meta: {},
  clientVersion: '7.8.0'
}
 POST /checkout?event=550e8400-e29b-41d4-a716-446655440001&tickets=tc-mars9-normal%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3A1 200 in 5.7s (next.js: 36ms, application-code: 5.6s)
  └─ ƒ createOrderAction({"adminFee":10000,"eventId":"550e8400-e29b-41d4-a716-446655440001","tickets":["[Object]"],"...":"1 item not stringified"}) in 5475ms app/checkout/actions.ts
