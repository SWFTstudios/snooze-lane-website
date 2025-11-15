/**
 * Contact Form API Endpoint
 * Handles contact form submissions and stores in Airtable
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Parse form data
    const formData = await request.formData();
    const name = formData.get('Name');
    const email = formData.get('Email');
    const message = formData.get('Message');
    
    // Validate required fields
    if (!name || !email || !message) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Error</title></head>
        <body><p>All fields are required. <a href="/contact-us.html">Go back</a></p></body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Error</title></head>
        <body><p>Invalid email format. <a href="/contact-us.html">Go back</a></p></body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const airtableToken = env.AIRTABLE_ACCESS_TOKEN;
    const airtableBaseId = env.AIRTABLE_BASE_ID;
    const resendApiKey = env.RESEND_API_KEY;

    if (!airtableToken || !airtableBaseId) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Error</title></head>
        <body><p>Server configuration error. Please try again later. <a href="/contact-us.html">Go back</a></p></body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Create record in Airtable
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/General%20Inquiries`;
    const airtableData = {
      fields: {
        'Name': name,
        'Email': email,
        'Message': message,
        'Date Submitted': new Date().toISOString()
      }
    };

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Airtable error: ${JSON.stringify(errorData)}`);
    }

    // Optionally send notification email to admin if Resend is configured
    if (resendApiKey) {
      try {
        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin: 15px 0; }
              .label { font-weight: bold; color: #667eea; }
              .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="field">
                <div class="label">Submitted:</div>
                <div class="value">${new Date().toLocaleString()}</div>
              </div>
            </div>
          </body>
          </html>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Snooze Lane Contact <hello@snoozelaneapp.com>',
            to: ['elombe@swftstudios.com'],
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            html: adminEmailHtml
          })
        });
      } catch (emailError) {
        console.error('Admin notification email error:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Return HTML response for Webflow form handling
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Message Sent</title>
        <script>
          // Trigger Webflow form success
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'form-success' }, '*');
          }
          // Redirect back to contact page after a moment
          setTimeout(function() {
            window.location.href = '/contact-us.html';
          }, 2000);
        </script>
      </head>
      <body>
        <p>Thank you for your message! We will get back to you soon. Redirecting...</p>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Error</title></head>
      <body><p>Failed to send message. Please try again later. <a href="/contact-us.html">Go back</a></p></body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

