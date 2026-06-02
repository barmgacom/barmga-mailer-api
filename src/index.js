import { SMTPClient } from 'workers-smtp-client';

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 1. Handle CORS Preflight Options Request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      // 2. ROUTE A: Brevo Web REST API Optimization Check
      if (body.Password.startsWith("xkeysib-") || body.Host.includes("brevo.com")) {
        let fromName = "Sender";
        let fromEmail = body.Username;
        
        // Parse "Name <email@domain.com>" headers cleanly
        if (body.From && body.From.includes("<")) {
          const match = body.From.match(/^(.*?)\s*<(.*?)>/);
          if (match) {
            fromName = match[1].trim();
            fromEmail = match[2].trim();
          }
        }

        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': body.Password,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: body.To }],
            subject: body.Subject,
            htmlContent: body.Body
          })
        });

        const brevoData = await brevoResponse.json();
        if (!brevoResponse.ok) throw new Error(brevoData.message || "Brevo API Error");
        
        return new Response(JSON.stringify({ status: "OK" }), { headers: corsHeaders });
      }

      // 3. ROUTE B: Universal SMTP Sockets Engine (Gmail, Custom Relays, etc.)
      const client = new SMTPClient({
        host: body.Host,
        port: parseInt(body.Port) || 587,
        username: body.Username,
        password: body.Password,
      });

      // Triggers outbound raw TCP socket handshake over Cloudflare infrastructure
      await client.send({
        from: body.From,
        to: body.To,
        subject: body.Subject,
        html: body.Body,
      });

      return new Response(JSON.stringify({ status: "OK" }), { headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ status: "Error", message: err.message }), { status: 400, headers: corsHeaders });
    }
  },
};
