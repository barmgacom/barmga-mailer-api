export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Strict Global CORS Configuration
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://barmga.com", 
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };

  // 1. Intercept HTTP OPTIONS Preflight Instantly
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // 2. DYNAMIC FIRST-PARTY SENDER OPEN TRACKING PIXEL ENGINE
  if (request.method === "GET" && url.pathname.startsWith("/track/open/")) {
    const pathParts = url.pathname.split("/");
    const campaignId = pathParts[3];
    const recipientId = pathParts[4]?.replace(".png", "");

    if (campaignId && recipientId) {
      console.log(`Open Registered -> Campaign: ${campaignId}, User: ${recipientId}`);
      // Asynchronous database tracking logic triggers here safely
    }

    // High-deliverability raw transparent 1x1 GIF byte array asset
    const transparentPixelBytes = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ]);

    return new Response(transparentPixelBytes, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  }

  // Block non-POST traffic
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const body = await request.json();

    // 3. ROUTE A: Brevo HTTP REST API Engine Optimization
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

    // 4. ROUTE B: Universal Security-Upgraded TCP Sockets Handshake Engine
    const smtpHost = body.Host;
    const smtpPort = parseInt(body.Port) || 587;
    
    const { connect } = await import("cloudflare:sockets");
    
    let transportOption = "off";
    if (smtpPort === 465) {
      transportOption = "on";
    } else if (smtpPort === 587) {
      transportOption = "starttls";
    }

    let socket = connect(
      { hostname: smtpHost, port: smtpPort },
      { secureTransport: transportOption }
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

    // Read the server's initial greeting
    const { value: initVal } = await reader.read();
    let initialResponse = decoder.decode(initVal);
    
    // ⚡ SAFE ISOLATED INJECTION FOR ZOHO DATA BUFFER DRAIN
    if (smtpHost.toLowerCase().includes("zoho")) {
      while (!/^\d{3}\s/.test(initialResponse.trim().split("\r\n").pop())) {
        const { value: extraVal } = await reader.read();
        initialResponse += decoder.decode(extraVal);
      }
    }
    
    // Say hello to the mail server
    await sendCommand("EHLO barmga-mailer");
    
    // If we are on port 587, negotiate the STARTTLS handshake upgrade safely
    if (smtpPort === 587) {
      await writer.write(encoder.encode("STARTTLS\r\n"));
      const { value: tlsVal } = await reader.read();
      const tlsResp = decoder.decode(tlsVal);
      
      if (tlsResp.startsWith("220")) {
        writer.releaseLock();
        reader.releaseLock();
        
        // Upgrade active socket to encrypted TLS
        socket = socket.startTls({ hostname: smtpHost });
        
        writer = socket.writable.getWriter();
        reader = socket.readable.getReader();
        
        // Re-greet the server over the newly secured line
        let ehloTlsResp = await sendCommand("EHLO barmga-mailer");

        // ⚡ SAFE ISOLATED INJECTION FOR ZOHO TLS BUFFER DRAIN
        if (smtpHost.toLowerCase().includes("zoho")) {
          while (!/^\d{3}\s/.test(ehloTlsResp.trim().split("\r\n").pop())) {
            const { value: extraTlsVal } = await reader.read();
            ehloTlsResp += decoder.decode(extraTlsVal);
          }
        }
      }
    }
    
    // Base64 Authorization Exchanges
    const base64User = btoa(body.Username);
    const base64Pass = btoa(body.Password);
    
    await sendCommand("AUTH LOGIN");
    await sendCommand(base64User);
    const authPassResp = await sendCommand(base64Pass);
    
    if (authPassResp.startsWith("535") || authPassResp.toLowerCase().includes("denied")) {
      throw new Error("SMTP Authentication Rejected by Provider");
    }

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
