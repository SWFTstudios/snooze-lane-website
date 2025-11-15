# How to Create Forms Connected to Airtable

This guide explains how to set up forms that automatically save to Airtable using Cloudflare Pages Functions.

## Architecture Overview

```
HTML Form → Cloudflare Pages Function → Airtable API → Success Response
```

**Why Cloudflare Pages Functions?**
- Built into Cloudflare Pages (no separate service needed)
- Environment variables are managed in Pages settings
- Automatically deployed with your site
- No CORS issues
- Simple and reliable

## Step-by-Step Process

### 1. Create Your Airtable Table

1. Go to your Airtable base
2. Create a new table (or use existing)
3. Add fields matching your form:
   - Field names are **case-sensitive** (e.g., "Name" not "name")
   - Use appropriate field types (Text, Email, Long text, Date, etc.)

**Example Table Structure:**
- `Name` (Single line text)
- `Email` (Email)
- `Message` (Long text)
- `Date Submitted` (Date field, format: YYYY-MM-DD)

### 2. Create the HTML Form

In your HTML file, create a form with:
- `action="/api/your-endpoint-name"` (points to Pages Function)
- `method="post"`
- Input `name` attributes matching your Airtable field names

**Example:**
```html
<form action="/api/contact" method="post">
  <input type="text" name="Name" required>
  <input type="email" name="Email" required>
  <textarea name="Message" required></textarea>
  <button type="submit">Submit</button>
</form>
```

### 3. Create the Pages Function

Create a file: `functions/api/your-endpoint-name.js`

**Template Code:**
```javascript
/**
 * Your Form Name API Endpoint
 * Handles form submissions and stores in Airtable
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 1. Parse form data
    const formData = await request.formData();
    const field1 = formData.get('Field1'); // Match your form input names
    const field2 = formData.get('Field2');
    
    // 2. Validate required fields
    if (!field1 || !field2) {
      return errorResponse('All fields are required', 400);
    }

    // 3. Validate email format (if needed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (field2 && !emailRegex.test(field2)) {
      return errorResponse('Invalid email format', 400);
    }

    // 4. Get environment variables
    const airtableToken = env.AIRTABLE_ACCESS_TOKEN;
    const airtableBaseId = env.AIRTABLE_BASE_ID;

    if (!airtableToken || !airtableBaseId) {
      return errorResponse('Server configuration error', 500);
    }

    // 5. Prepare Airtable fields
    const fields = {
      'Field1': field1,  // Match your Airtable field names exactly
      'Field2': field2,
    };
    
    // 6. Add date field if needed (optional)
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    fields['Date Submitted'] = dateString;
    
    // 7. Create record in Airtable
    const createUrl = `https://api.airtable.com/v0/${airtableBaseId}/Your%20Table%20Name`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    // 8. Handle errors
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

    // 9. Return success response
    return successResponse('Thank you! Your submission was received.', '/your-page.html');

  } catch (error) {
    console.error('Form error:', error);
    return errorResponse(error.message || 'Failed to process submission', 500);
  }
}

// Helper function for success responses
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

// Helper function for error responses
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
        code { 
          background: #f8f9fa; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 0.9em;
          color: #d63384;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        }
        a { color: #0d6efd; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Form Submission Error</h1>
      <div class="error">
        <p><strong>Error:</strong> ${escapeHtml(message)}</p>
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

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
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
```

### 4. Set Environment Variables in Cloudflare Pages

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **snooze-lane-website**
2. Click **Settings** → **Environment Variables**
3. Add variables for **Production**:
   - `AIRTABLE_ACCESS_TOKEN` (Secret) - Your Airtable Personal Access Token
   - `AIRTABLE_BASE_ID` (Text) - Your Airtable Base ID
   - `RESEND_API_KEY` (Secret) - Optional, for email notifications

### 5. Deploy

1. Commit and push to GitHub
2. Cloudflare Pages automatically deploys
3. Wait 1-2 minutes for deployment
4. Test your form!

## Quick Checklist for New Forms

- [ ] Create Airtable table with matching field names
- [ ] Create HTML form with `action="/api/your-endpoint"`
- [ ] Create `functions/api/your-endpoint.js` file
- [ ] Match form input `name` attributes to Airtable field names
- [ ] Use exact field names (case-sensitive!)
- [ ] Set environment variables in Cloudflare Pages
- [ ] Test the form

## Common Patterns

### Pattern 1: Simple Form (Name, Email, Message)
```javascript
const fields = {
  'Name': formData.get('Name'),
  'Email': formData.get('Email'),
  'Message': formData.get('Message'),
};
```

### Pattern 2: With Date Field
```javascript
const fields = {
  'Name': formData.get('Name'),
  'Email': formData.get('Email'),
};
const now = new Date();
fields['Date Submitted'] = now.toISOString().split('T')[0];
```

### Pattern 3: With Checkbox/Boolean
```javascript
const fields = {
  'Name': formData.get('Name'),
  'Subscribed': formData.get('Subscribed') === 'on', // Checkbox
};
```

### Pattern 4: With Dropdown/Select
```javascript
const fields = {
  'Name': formData.get('Name'),
  'Category': formData.get('Category'), // Select dropdown value
};
```

## Important Notes

1. **Field Names Must Match Exactly**
   - Airtable field names are case-sensitive
   - "Name" ≠ "name" ≠ "NAME"
   - Use exact spelling and capitalization

2. **Date Format**
   - Airtable date fields need: `YYYY-MM-DD`
   - Use: `new Date().toISOString().split('T')[0]`

3. **Table Names**
   - URL encode spaces: `"My Table"` → `"My%20Table"`
   - Or use underscores: `"My_Table"`

4. **Environment Variables**
   - Set in **Cloudflare Pages** (not Workers)
   - Must be set for **Production** environment
   - Secrets are encrypted automatically

5. **Testing**
   - Test locally first if possible
   - Check Cloudflare Pages deployment logs
   - Verify records appear in Airtable

## Troubleshooting

**Form not submitting?**
- Check form `action` attribute matches function path
- Verify `method="post"`
- Check browser console for errors

**"Server configuration error"?**
- Environment variables not set in Cloudflare Pages
- Check Settings → Environment Variables

**"Unknown field name" error?**
- Field name doesn't exist in Airtable
- Check spelling and capitalization
- Verify field exists in the correct table

**Records not appearing?**
- Check Airtable table name matches (URL encoded)
- Verify environment variables are set
- Check Cloudflare Pages deployment logs

## Example: Complete Form Setup

**1. Airtable Table:** "Newsletter Signups"
- Fields: `Email`, `Date Signed Up`

**2. HTML Form:**
```html
<form action="/api/newsletter" method="post">
  <input type="email" name="Email" required>
  <button type="submit">Subscribe</button>
</form>
```

**3. Function:** `functions/api/newsletter.js`
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();
  const email = formData.get('Email');
  
  const fields = {
    'Email': email,
    'Date Signed Up': new Date().toISOString().split('T')[0]
  };
  
  // ... rest of code (see template above)
}
```

That's it! Follow this pattern for any new form you want to create.

