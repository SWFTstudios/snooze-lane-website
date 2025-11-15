/**
 * Waitlist Signup API Endpoint
 * Handles waitlist form submissions, stores in Airtable, and sends emails via Resend
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Parse form data
    const formData = await request.formData();
    const email = formData.get('Waitlist-Member-Email');
    
    if (!email) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Error</title></head>
        <body><p>Email is required. <a href="/">Go back</a></p></body>
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
        <body><p>Invalid email format. <a href="/">Go back</a></p></body>
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
        <body><p>Server configuration error. Please try again later. <a href="/">Go back</a></p></body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Check if email already exists in Airtable
    const checkUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups?filterByFormula={Email}="${encodeURIComponent(email)}"`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error('Failed to check existing signups');
    }

    const checkData = await checkResponse.json();
    
    // If email already exists, return success (don't duplicate)
    if (checkData.records && checkData.records.length > 0) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Already Registered</title>
          <script>
            setTimeout(function() {
              window.location.href = '/';
            }, 2000);
          </script>
        </head>
        <body>
          <p>You are already on the waitlist! Redirecting...</p>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get current signup count
    const countUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups?maxRecords=100`;
    const countResponse = await fetch(countUrl, {
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!countResponse.ok) {
      throw new Error('Failed to get signup count');
    }

    const countData = await countResponse.json();
    const currentCount = countData.records ? countData.records.length : 0;
    const signupNumber = currentCount + 1;
    const isPremiumEligible = signupNumber <= 100;

    // Generate coupon code for first 100 (format: SNOOZE100-XXXX)
    const couponCode = isPremiumEligible 
      ? `SNOOZE100-${String(signupNumber).padStart(4, '0')}`
      : null;

    // Create record in Airtable
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/Waitlist%20Signups`;
    
    // Build fields object, only including non-null values
    const fields = {
      'Email': email,
      'Signup Number': signupNumber,
      'Premium Eligible': isPremiumEligible
    };
    
    // Only add Coupon Code if it exists
    if (couponCode) {
      fields['Coupon Code'] = couponCode;
    }
    
    // Add date field
    // If Airtable field has "Include time" enabled, use ISO timestamp
    // If not, use date-only format
    // Try timestamp first - if field doesn't accept it, Airtable will error and you can enable time in the field
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm:ss.sssZ (ISO 8601 with time)
    // If your field doesn't have time enabled, change to: now.toISOString().split('T')[0]
    fields['Date Signed Up'] = now.toISOString();
    
    const airtableData = { fields };

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });

    if (!createResponse.ok) {
      let errorData;
      try {
        errorData = await createResponse.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response', status: createResponse.status, statusText: createResponse.statusText };
      }
      console.error('Airtable API Error:', JSON.stringify(errorData, null, 2));
      console.error('Attempted to create record with fields:', JSON.stringify(fields, null, 2));
      console.error('Airtable URL:', createUrl);
      throw new Error(`Airtable error: ${JSON.stringify(errorData)}`);
    }

    const createdRecord = await createResponse.json();

    // Send email via Resend if API key is configured
    if (resendApiKey) {
      try {
        const emailSubject = isPremiumEligible
          ? `🎉 Welcome to Snooze Lane! You're #${signupNumber} of 100`
          : 'Thank You for Joining Snooze Lane!';

        const emailHtml = isPremiumEligible
          ? `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
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
          `
          : `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
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

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Snooze Lane <hello@snoozelaneapp.com>',
            to: [email],
            subject: emailSubject,
            html: emailHtml
          })
        });

        if (!resendResponse.ok) {
          const resendError = await resendResponse.json();
          console.error('Resend error:', resendError);
          // Don't fail the request if email fails, just log it
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Return HTML response for Webflow form handling
    // Webflow forms expect HTML response to show success message
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Success</title>
        <script>
          // Trigger Webflow form success
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'form-success' }, '*');
          }
          // Redirect back to homepage after a moment
          setTimeout(function() {
            window.location.href = '/';
          }, 2000);
        </script>
      </head>
      <body>
        <p>Successfully joined waitlist! Redirecting...</p>
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
    console.error('Waitlist signup error:', error);
    const errorMessage = error.message || 'Unknown error';
    
    // Return more detailed error for debugging (remove in production)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Error</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
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
          ul {
            color: #495057;
          }
        </style>
      </head>
      <body>
        <h1>Form Submission Error</h1>
        <div class="error">
          <p><strong>Error:</strong> Failed to process signup.</p>
          <p><strong>Details:</strong> <code>${errorMessage}</code></p>
        </div>
        <p><a href="/">← Go back</a></p>
        <p style="font-size: 0.9em; color: #666; margin-top: 40px;">
          If this error persists, please check:
          <ul>
            <li>Airtable table name matches exactly: "Waitlist Signups"</li>
            <li>Field names match exactly (case-sensitive)</li>
            <li>Cloudflare environment variables are set</li>
            <li>Check Cloudflare Functions logs for more details</li>
          </ul>
        </p>
      </body>
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

