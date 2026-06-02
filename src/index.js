export async function onRequestPost(context) {
  const { request } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();

    // 1. ROUTE A: Brevo HTTP REST API Engine Optimization
    if (body.Password.startsWith("xkeysib-") || body.Host.includes("brevo.com")) {
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
      return new Response(JSON.stringify({ status: "OK" }), { headers: corsHeaders });
    }

    // 2. ROUTE B: Native Infrastructure TCP Sockets Handshake Engine (Gmail, Mailgun, Relays)
    const smtpHost = body.Host;
    const smtpPort = parseInt(body.Port) || 587;
    
    // Dynamically load Cloudflare's low-level sockets runtime core
    const { connect } = await import("cloudflare:sockets");
    const socket = connect({ hostname: smtpHost, port: smtpPort });
    
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    async function sendCommand(cmd) {
      if (cmd) await writer.write(encoder.encode(cmd + "\r\n"));
      const { value } = await reader.read();
      return decoder.decode(value);
    }

    // Interactive SMTP Protocol State Machine Handshake Loops
    await readInitialResponse(reader, decoder); // Read initial server greeting banner
    await sendCommand("EHLO barmga-mailer");
    
    // Handle SMTP Authentication Login Exchange
    const base64User = btoa(body.Username);
    const base64Pass = btoa(body.Password);
    
    await sendCommand("AUTH LOGIN");
    await sendCommand(base64User);
    const authPassResp = await sendCommand(base64Pass);
    
    if (authPassResp.startsWith("535") || authPassResp.toLowerCase().includes("denied")) {
      throw new Error("SMTP Authentication Rejected by Provider");
    }

    // Build Payload Envelopes Data Map
    await sendCommand(`MAIL FROM:<${body.Username}>`);
    await sendCommand(`RCPT TO:<${body.To}>`);
    await sendCommand("DATA");

    // Construct Clean IMF Production Mail Block Header Content Strings
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

    // Release Socket Writers
    writer.releaseLock();
    reader.releaseLock();
    await socket.close();

    if (finalDeliveryResult.startsWith("5")) {
      throw new Error(`SMTP Relay Transaction Fault: ${finalDeliveryResult}`);
    }

    return new Response(JSON.stringify({ status: "OK" }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ status: "Error", message: err.message }), { status: 400, headers: corsHeaders });
  }
}

// Read asynchronous stream chunks until initial SMTP server connection block settles
async function readInitialResponse(reader, decoder) {
  const { value } = await reader.read();
  return decoder.decode(value);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
