// ponytail: Non-blocking WhatsApp gateway menggunakan standard fetch ke Fonnte API
export async function sendWhatsAppMessage({ target, message }: { target: string; message: string }) {
  const token = process.env.FONNTE_TOKEN || process.env.FONNTE_API_TOKEN;
  
  // 1. Clean non-digit characters (+, -, space, etc.)
  let cleanTarget = target ? target.replace(/[^0-9]/g, "") : "";

  // 2. Normalize Indonesian phone number formats:
  //    - '08123456789' -> '628123456789'
  //    - '628123456789' -> stays '628123456789'
  //    - '+628123456789' -> (after clean) '628123456789'
  if (cleanTarget.startsWith("0")) {
    cleanTarget = "62" + cleanTarget.slice(1);
  }

  if (!token || !cleanTarget || cleanTarget.length < 9) {
    console.warn("⚠️ WhatsApp Warning: FONNTE_TOKEN tidak ditemukan atau nomor target tidak valid.", { tokenExists: !!token, target, cleanTarget });
    return { success: false, message: "Missing Fonnte token or target phone number" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("target", cleanTarget);
    formData.append("message", message);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await response.json();
    console.log("📲 [Fonnte WA Response]:", JSON.stringify(data));
    return { success: true, data };
  } catch (err) {
    // ponytail: Silent log agar error jaringan WA tidak merusak alur checkout utama
    console.error("❌ WhatsApp Send Error (Non-blocking):", err);
    return { success: false, error: err };
  }
}
