export async function onRequest(context) {
  const { request } = context;
  
  // Strict Global CORS Header Configuration Maps
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://barmga.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const body = await request.json();

    // 1. ROUTE A: Brevo HTTP REST API Engine Optimization
    if (body.Password.startsWith("xkeysib-") || (body.Host && body.Host.includes("brevo.com"))) {
      let fromName = "Sender";
      let fromEmail = body.Username;
      
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
      return new Response(JSON.stringify({ status: "OK" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. ROUTE B: Security-Upgraded TCP Sockets Handshake Engine
    const smtpHost = body.Host;
    const smtpPort = parseInt(body.Port) || 587;
    
    const { connect } = await import("cloudflare:sockets");
    
    // If port 465, activate secureTransport immediately. If port 587, connect in plain-text first.
    let socket = connect(
      { hostname: smtpHost, port: smtpPort },
      { secureTransport: smtpPort === 465 ? "on" : "off" }
    );
    
    let writer = socket.writable.getWriter();
    let reader = socket.readable.getReader();
    let decoder = new TextDecoder();
    let encoder = new TextEncoder();

    async function sendCommand(cmd) {
      if (cmd) await writer.write(encoder.encode(cmd + "\r\n"));
      const { value } = await reader.read();
      return decoder.decode(value);
    }

    // Read welcome banner
    const initialResp = await reader.read();
    let logBuffer = decoder.decode(initialResp.value);

    // Send the first greeting
    logBuffer = await sendCommand("EHLO barmga-mailer");

    // ⚠️ CRUCIAL FIX FOR PORT 587 (STARTTLS Handshake Upgrade)
    if (smtpPort === 587) {
      const startTlsResp = await sendCommand("STARTTLS");
      
      // Release existing locks before upgrading the connection stream
      writer.releaseLock();
      reader.releaseLock();
      
      // Upgrade the plain TCP socket to an encrypted TLS socket natively
      socket = socket.startTls({ hostname: smtpHost });
      
      // Re-initialize your readers and writers with the newly encrypted socket streams
      writer = socket.writable.getWriter();
      reader = socket.readable.getReader();
      
      // Repeat the greeting over the now secure channel as required by SMTP spec
      logBuffer = await sendCommand("EHLO barmga-mailer");
    }
    
    // Base64 Authorization Exchanges (Safe to pass over encrypted line)
    const base64User = btoa(body.Username);
    const base64Pass = btoa(body.Password);
    
    await sendCommand("AUTH LOGIN");
    await sendCommand(base64User);
    const authPassResp = await sendCommand(base64Pass);
    
    if (authPassResp.startsWith("535") || authPassResp.toLowerCase().includes("denied")) {
      throw new Error("SMTP Authentication Rejected by Provider");
    }

    // Delivery Boundaries
    await sendCommand(`MAIL FROM:<${body.Username}>`);
    await sendCommand(`RCPT TO:<${body.To}>`);
    await sendCommand("DATA");

    const emailData = [
      `From: ${body.From}`,
      `To: ${body.To}`,
      `Subject: ${body.Subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      body.Body,
      "."
    ].join("\r\n");

    const finalDeliveryResult = await sendCommand(emailData);
    await sendCommand("QUIT");

    writer.releaseLock();
    reader.releaseLock();
    await socket.close();

    if (finalDeliveryResult.startsWith("5")) {
      throw new Error(`SMTP Relay Transaction Fault: ${finalDeliveryResult}`);
    }

    return new Response(JSON.stringify({ status: "OK" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ status: "Error", message: err.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}
