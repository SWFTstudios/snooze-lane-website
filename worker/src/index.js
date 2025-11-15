/**
 * Snooze Lane Forms Worker
 * Handles waitlist and contact form submissions
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Route to appropriate handler
    if (url.pathname === '/waitlist' && request.method === 'POST') {
      return handleWaitlist(request, env);
    }
    
    if (url.pathname === '/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Handle waitlist form submission
 */
async function handleWaitlist(request, env) {
  try {
    const formData = await request.formData();
    const email = formData.get('Waitlist-Member-Email');
    
    if (!email) {
      return errorResponse('Email is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const airtableToken = env.AIRTABLE_ACCESS_TOKEN;
    const airtableBaseId = env.AIRTABLE_BASE_ID;
    const resendApiKey = env.RESEND_API_KEY;

    if (!airtableToken || !airtableBaseId) {
      return errorResponse('Server configuration error', 500);
    }

    // Check if email already exists
    const checkUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups?filterByFormula={Email}="${encodeURIComponent(email)}"`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkResponse.ok) {
      throw new Error('Failed to check existing signups');
    }

    const checkData = await checkResponse.json();
    
    if (checkData.records && checkData.records.length > 0) {
      return successResponse('You are already on the waitlist!', '/');
    }

    // Get current signup count
    const countUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups?maxRecords=100`;
    const countResponse = await fetch(countUrl, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!countResponse.ok) {
      throw new Error('Failed to get signup count');
    }

    const countData = await countResponse.json();
    const currentCount = countData.records ? countData.records.length : 0;
    const signupNumber = currentCount + 1;
    const isPremiumEligible = signupNumber <= 100;
    const couponCode = isPremiumEligible 
      ? `SNOOZE100-${String(signupNumber).padStart(4, '0')}`
      : null;

    // Create record in Airtable
    const fields = {
      'Email': email,
      'Signup Number': signupNumber,
      'Premium Eligible': isPremiumEligible,
    };
    
    if (couponCode) {
      fields['Coupon Code'] = couponCode;
    }
    
    // Add date field with timestamp (ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ)
    const now = new Date();
    fields['Date Signed Up'] = now.toISOString();
    
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!createResponse.ok) {
      let errorData;
      try {
        errorData = await createResponse.json();
      } catch (e) {
        errorData = { 
          error: 'Failed to parse error response', 
          status: createResponse.status, 
          statusText: createResponse.statusText 
        };
      }
      console.error('Airtable API Error:', JSON.stringify(errorData, null, 2));
      console.error('Attempted fields:', JSON.stringify(fields, null, 2));
      throw new Error(`Airtable error: ${JSON.stringify(errorData)}`);
    }

    // Send email via Resend
    if (resendApiKey) {
      try {
        await sendWaitlistEmail(email, signupNumber, isPremiumEligible, couponCode, resendApiKey);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return successResponse('Successfully joined waitlist!', '/');

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return errorResponse(error.message || 'Failed to process signup', 500);
  }
}

/**
 * Handle contact form submission
 */
async function handleContact(request, env) {
  try {
    const formData = await request.formData();
    const name = formData.get('Name');
    const email = formData.get('Email');
    const message = formData.get('Message');
    
    if (!name || !email || !message) {
      return errorResponse('All fields are required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const airtableToken = env.AIRTABLE_ACCESS_TOKEN;
    const airtableBaseId = env.AIRTABLE_BASE_ID;

    if (!airtableToken || !airtableBaseId) {
      return errorResponse('Server configuration error', 500);
    }

    // Create record in Airtable
    const fields = {
      'Name': name,
      'Email': email,
      'Message': message,
    };
    
    // Add date field with timestamp (ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ)
    const now = new Date();
    fields['Date Submitted'] = now.toISOString();
    
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/General%20Inquiries`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!createResponse.ok) {
      let errorData;
      try {
        errorData = await createResponse.json();
      } catch (e) {
        errorData = { 
          error: 'Failed to parse error response', 
          status: createResponse.status, 
          statusText: createResponse.statusText 
        };
      }
      console.error('Airtable API Error:', JSON.stringify(errorData, null, 2));
      console.error('Attempted fields:', JSON.stringify(fields, null, 2));
      throw new Error(`Airtable error: ${JSON.stringify(errorData)}`);
    }

    return successResponse('Thank you for your message! We will get back to you soon.', '/contact-us.html');

  } catch (error) {
    console.error('Contact form error:', error);
    return errorResponse(error.message || 'Failed to send message', 500);
  }
}

/**
 * Send waitlist email via Resend
 */
async function sendWaitlistEmail(email, signupNumber, isPremiumEligible, couponCode, resendApiKey) {
  const emailSubject = isPremiumEligible
    ? `🎉 Welcome to Snooze Lane! You're #${signupNumber} of 100`
    : 'Thank You for Joining Snooze Lane!';

  const emailHtml = isPremiumEligible
    ? generatePremiumEmailHtml(signupNumber, couponCode)
    : generateStandardEmailHtml();

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Snooze Lane <hello@snoozelaneapp.com>',
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.json();
    throw new Error(`Resend error: ${JSON.stringify(resendError)}`);
  }
}

/**
 * Send contact form notification email
 */
async function sendContactNotificationEmail(name, email, message, resendApiKey) {
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
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
          <div class="value">${escapeHtml(name)}</div>
        </div>
        <div class="field">
          <div class="label">Email:</div>
          <div class="value">${escapeHtml(email)}</div>
        </div>
        <div class="field">
          <div class="label">Message:</div>
          <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
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
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Snooze Lane Contact <hello@snoozelaneapp.com>',
      to: ['elombe@swftstudios.com'],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: adminEmailHtml,
    }),
  });
}

/**
 * Generate premium email HTML
 */
function generatePremiumEmailHtml(signupNumber, couponCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .coupon-box { background: white; border: 3px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .coupon-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; margin: 10px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Congratulations!</h1>
        <p>You're one of the first 100!</p>
      </div>
      <div class="content">
        <h2>Welcome to Snooze Lane!</h2>
        <p>Thank you for joining our waitlist! We're thrilled to have you on board.</p>
        <p><strong>You're signup #${signupNumber} of 100</strong>, which means you've secured lifetime premium access to Snooze Lane!</p>
        <div class="coupon-box">
          <p style="margin: 0; font-size: 14px; color: #666;">Your Premium Access Code:</p>
          <div class="coupon-code">${couponCode}</div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Save this code! You'll use it when the app launches.</p>
        </div>
        <p>When Snooze Lane launches, simply enter this code in the app to unlock all premium features <strong>forever</strong> - no subscription required!</p>
        <p>We'll notify you as soon as the app is available for download. In the meantime, follow us for updates!</p>
        <div style="text-align: center;">
          <a href="https://snoozelaneapp.com" class="button">Visit Our Website</a>
        </div>
        <div class="footer">
          <p>Questions? Reply to this email or visit <a href="https://snoozelaneapp.com/contact-us.html">our contact page</a>.</p>
          <p>© ${new Date().getFullYear()} Snooze Lane. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate standard email HTML
 */
function generateStandardEmailHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thank You!</h1>
        <p>You're on the Snooze Lane waitlist</p>
      </div>
      <div class="content">
        <h2>Welcome to Snooze Lane!</h2>
        <p>Thank you for joining our waitlist! We're excited to have you on board.</p>
        <p>While the first 100 spots for lifetime premium access have been claimed, we're still thrilled to have you as part of the Snooze Lane community!</p>
        <p>We'll notify you as soon as the app is available for download. Stay tuned for updates!</p>
        <div style="text-align: center;">
          <a href="https://snoozelaneapp.com" class="button">Visit Our Website</a>
        </div>
        <div class="footer">
          <p>Questions? Reply to this email or visit <a href="https://snoozelaneapp.com/contact-us.html">our contact page</a>.</p>
          <p>© ${new Date().getFullYear()} Snooze Lane. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Return success response
 */
function successResponse(message, redirectUrl) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Success</title>
      <script>
        setTimeout(function() {
          window.location.href = '${redirectUrl}';
        }, 2000);
      </script>
    </head>
    <body>
      <p>${escapeHtml(message)} Redirecting...</p>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Return error response
 */
function errorResponse(message, status = 500) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Error</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 40px; 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          color: #333333;
          line-height: 1.6;
        }
        .error { 
          background: #fff3cd; 
          padding: 20px; 
          border-radius: 8px; 
          border: 2px solid #ffc107;
          color: #856404;
          margin: 20px 0;
        }
        .error strong {
          color: #721c24;
          font-weight: 600;
        }
        code { 
          background: #f8f9fa; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.9em;
          color: #d63384;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          border: 1px solid #dee2e6;
          display: block;
          margin-top: 10px;
          white-space: pre-wrap;
          word-break: break-all;
        }
        h1 {
          color: #212529;
          margin-bottom: 20px;
        }
        a {
          color: #0d6efd;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <h1>Form Submission Error</h1>
      <div class="error">
        <p><strong>Error:</strong> Failed to process submission.</p>
        <p><strong>Details:</strong> <code>${escapeHtml(message)}</code></p>
      </div>
      <p><a href="/">← Go back</a></p>
    </body>
    </html>
  `, {
    status,
    headers: { 
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

