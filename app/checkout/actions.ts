"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type TicketInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGender: string;
  ticketCategoryId: string;
  price: number;
};

type CheckoutInput = {
  eventId: string;
  totalPrice: number;
  adminFee: number;
  tickets: TicketInput[];
  refCode?: string;
};

export async function createOrderAction(input: CheckoutInput) {
  try {
    const orderId = `KRTJ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const date = new Date();

    // 1. Create the Order
    const order = await prisma.orders.create({
      data: {
        id: orderId,
        date: date,
        total_amount: BigInt(input.totalPrice),
        subtotal_amount: BigInt(input.totalPrice - input.adminFee),
        admin_fees: BigInt(input.adminFee),
        discount_amount: BigInt(0),
        order_status_id: 2, // Success directly (skipping payment configuration in dev)
      },
    });

    // 2. Create the Tickets
    for (const ticket of input.tickets) {
      const ticketId = crypto.randomUUID();
      const ticketCode = `TCK-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

      await prisma.tickets.create({
        data: {
          id: ticketId,
          code: ticketCode,
          customer_name: ticket.customerName,
          customer_email: ticket.customerEmail,
          customer_phone_number: ticket.customerPhone,
          customer_gender: ticket.customerGender,
          event_id: input.eventId,
          order_id: orderId,
          ticket_category_id: ticket.ticketCategoryId,
          price: ticket.price,
        },
      });

      // 3. Deduct stock from the ticket category
      await prisma.ticket_categories.update({
        where: { id: ticket.ticketCategoryId },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });
    }

    return {
      success: true,
      orderId: order.id,
      message: "Order successfully created!",
    };
  } catch (error) {
    console.error("❌ Error creating order in checkout:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan internal saat memproses order.",
    };
  }
}
