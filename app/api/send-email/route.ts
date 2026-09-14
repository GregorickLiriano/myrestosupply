import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, customerName, customerEmail, orderId, items, total, transactionId } = body;

    // Configuración del transportador SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true para puerto 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const adminEmailEnv = process.env.ADMIN_EMAIL || 'sales@myrestosupply.com';
    const senderEmail = adminEmailEnv; 
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 🔴 CASO 1: ERROR EN EL PAGO
    if (type === 'error') {
      await transporter.sendMail({
        from: `"My Resto Supply" <${senderEmail}>`,
        to: customerEmail,
        subject: 'Hubo un problema con tu orden - Pago no completado',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #e50027;">Hola, el pago no pudo procesarse.</h2>
            <p>Te escribimos para informarte que tu orden no pudo ser completada porque el pago fue rechazado o no pudo procesarse correctamente.</p>
            <p>Por favor, intenta nuevamente con otro método de pago en nuestra tienda.</p>
            <a href="${siteUrl}/checkout" style="display: inline-block; background-color: #e50027; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">Volver al Checkout</a>
          </div>
        `,
      });
      return NextResponse.json({ success: true });
    }

    // 🟢 CASO 2: PAGO EXITOSO
    if (type === 'success') {
      const itemsListHtml = items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <a href="${siteUrl}/product/${item.slug || item.id}" style="color: #0056b3; text-decoration: none; font-weight: bold;">${item.name}</a>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

      const orderDetailsHtml = `
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Correo:</strong> ${customerEmail}</p>
        <p><strong>Orden #:</strong> ${orderId.split('-')[0].toUpperCase()}</p>
        <p><strong>ID Transacción (Stripe):</strong> ${transactionId}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">TOTAL PAGADO:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #e50027;">$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;

      // 🚀 BUSCAR A TODOS LOS ADMINISTRADORES EN LA BASE DE DATOS
      let adminEmails: string[] = [];
      try {
        const { data: adminProfiles, error: adminError } = await supabase
          .from('profiles')
          .select('email')
          .eq('role', 'admin');
          
        if (!adminError && adminProfiles && adminProfiles.length > 0) {
          adminEmails = adminProfiles.map(p => p.email).filter(Boolean);
        }
      } catch (err) {
        console.error('Error buscando admins:', err);
      }

      // 🚀 FORZAMOS A QUE EL CORREO DEL .env SIEMPRE ESTÉ
      if (!adminEmails.includes(adminEmailEnv)) {
        adminEmails.push(adminEmailEnv);
      }

      // 🔥 AGREGAMOS TU GMAIL DIRECTAMENTE A LA LISTA DE DESTINATARIOS ADMIN
      const personalEmail = 'gregorick.liriano@gmail.com';
      if (!adminEmails.includes(personalEmail)) {
        adminEmails.push(personalEmail);
      }

      // 👀 ESTO APARECERÁ EN TU TERMINAL PARA CONFIRMAR A QUIÉNES SE ESTÁ ENVIANDO
      console.log("🚀 Enviando copia de orden a estos administradores:", adminEmails);

      // 📩 1. CORREO PARA EL CLIENTE
      await transporter.sendMail({
        from: `"My Resto Supply" <${senderEmail}>`,
        to: customerEmail,
        subject: '¡Gracias por tu compra! Confirmación de Orden',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #22c55e;">¡Gracias por tu compra, ${customerName}!</h2>
            <p>Hemos recibido tu orden y el pago se ha procesado correctamente. Aquí tienes los detalles de tu compra:</p>
            ${orderDetailsHtml}
          </div>
        `,
      });

      // 📩 2. CORREO PARA TODOS LOS ADMINISTRADORES (INCLUIDO TU GMAIL)
      await transporter.sendMail({
        from: `"Tienda Automática" <${senderEmail}>`, 
        to: adminEmails, 
        subject: `⚠️ NUEVA ORDEN RECIBIDA - #${orderId.split('-')[0].toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #e50027; border-radius: 8px;">
            <h2 style="color: #e50027; text-transform: uppercase;">Nueva Orden Recibida</h2>
            <p>Se acaba de confirmar un pago exitoso en la tienda.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            ${orderDetailsHtml}
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    }

  } catch (error: any) {
    console.error("Error enviando correos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}