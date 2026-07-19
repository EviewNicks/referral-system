import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";

const DATA_FILE_PATH = path.join(__dirname, "seed-data.json");

async function main() {
  console.log("Reading seed data from seed-data.json...");
  const rawData = fs.readFileSync(DATA_FILE_PATH, "utf8");
  const data = JSON.parse(rawData);

  console.log("Seeding Master Event Statuses...");
  for (const status of data.event_statuses) {
    await prisma.event_statuses.upsert({
      where: { id: status.id },
      update: { name: status.name },
      create: status,
    });
  }

  console.log("Seeding Master Ticket Category Statuses...");
  for (const status of data.ticket_category_statuses) {
    await prisma.ticket_category_statuses.upsert({
      where: { id: status.id },
      update: { name: status.name },
      create: status,
    });
  }

  console.log("Seeding Master Order Statuses...");
  for (const status of data.order_statuses) {
    await prisma.order_statuses.upsert({
      where: { id: status.id },
      update: { name: status.name },
      create: status,
    });
  }

  console.log("Seeding Events and Ticket Categories...");
  for (const eventData of data.events) {
    const { ticket_categories, ...eventFields } = eventData;

    // Seed Event
    await prisma.events.upsert({
      where: { id: eventFields.id },
      update: {
        name: eventFields.name,
        code: eventFields.code,
        category: eventFields.category,
        city: eventFields.city,
        province: eventFields.province,
        location: eventFields.location,
        location_link: eventFields.location_link,
        description: eventFields.description,
        start_date: new Date(eventFields.start_date),
        end_date: new Date(eventFields.end_date),
        start_date_offset: eventFields.start_date_offset,
        end_date_offset: eventFields.end_date_offset,
        copy_data_setting: eventFields.copy_data_setting,
        approved: eventFields.approved,
        event_status_id: eventFields.event_status_id,
        admin_fee: eventFields.admin_fee,
        thumbnail_image: eventFields.thumbnail_image,
        detail_image: eventFields.detail_image,
        slide_image: eventFields.slide_image ?? null,
        contact_person: eventFields.contact_person,
      },
      create: {
        id: eventFields.id,
        name: eventFields.name,
        code: eventFields.code,
        category: eventFields.category,
        city: eventFields.city,
        province: eventFields.province,
        location: eventFields.location,
        location_link: eventFields.location_link,
        description: eventFields.description,
        start_date: new Date(eventFields.start_date),
        end_date: new Date(eventFields.end_date),
        start_date_offset: eventFields.start_date_offset,
        end_date_offset: eventFields.end_date_offset,
        copy_data_setting: eventFields.copy_data_setting,
        approved: eventFields.approved,
        event_status_id: eventFields.event_status_id,
        admin_fee: eventFields.admin_fee,
        thumbnail_image: eventFields.thumbnail_image,
        detail_image: eventFields.detail_image,
        slide_image: eventFields.slide_image ?? null,
        contact_person: eventFields.contact_person,
      },
    });

    console.log(`- Seeded event: ${eventFields.name} (${eventFields.code})`);

    // Seed Ticket Categories for this Event
    for (const tc of ticket_categories) {
      await prisma.ticket_categories.upsert({
        where: { id: tc.id },
        update: {
          name: tc.name,
          price: tc.price,
          stock: tc.stock,
          sales_start_time: tc.sales_start_time ? new Date(tc.sales_start_time) : null,
          sales_end_time: new Date(tc.sales_end_time),
          sales_start_time_offset: tc.sales_start_time_offset,
          sales_end_time_offset: tc.sales_end_time_offset,
          ticket_category_status_id: tc.ticket_category_status_id,
          maximum_tickets_per_transaction: tc.maximum_tickets_per_transaction,
        },
        create: {
          id: tc.id,
          name: tc.name,
          price: tc.price,
          stock: tc.stock,
          sales_start_time: tc.sales_start_time ? new Date(tc.sales_start_time) : null,
          sales_end_time: new Date(tc.sales_end_time),
          sales_start_time_offset: tc.sales_start_time_offset,
          sales_end_time_offset: tc.sales_end_time_offset,
          ticket_category_status_id: tc.ticket_category_status_id,
          maximum_tickets_per_transaction: tc.maximum_tickets_per_transaction,
          event_id: eventFields.id,
        },
      });
      console.log(`  * Seeded ticket category: ${tc.name} (${tc.id})`);
    }
  }

  console.log("✅ Seeding database completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
