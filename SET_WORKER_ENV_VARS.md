# Set Cloudflare Worker Environment Variables

## Quick Setup Guide

Your Worker needs these environment variables set in Cloudflare Dashboard:

### Step-by-Step Instructions

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com
   - Go to **Workers & Pages**
   - Click on **snooze-lane-forms**

2. **Open Settings**
   - Click **Settings** tab
   - Click **Variables and Secrets** (under Build section)

3. **Add Environment Variables**

   **Variable 1: AIRTABLE_ACCESS_TOKEN**
   - Click **"+ Add variable"**
   - **Type**: Select **"Secret"**
   - **Variable name**: `AIRTABLE_ACCESS_TOKEN`
   - **Value**: Your Airtable Personal Access Token
   - Click **"Save"**

   **Variable 2: AIRTABLE_BASE_ID**
   - Click **"+ Add variable"**
   - **Type**: Select **"Text"** (or "Plaintext")
   - **Variable name**: `AIRTABLE_BASE_ID`
   - **Value**: Your Airtable Base ID (e.g., `appYT7C2POhuNDsDs`)
   - Click **"Save"**

   **Variable 3: RESEND_API_KEY**
   - Click **"+ Add variable"**
   - **Type**: Select **"Secret"**
   - **Variable name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - Click **"Save"**

4. **Verify**
   - You should see all three variables listed:
     - ✅ `AIRTABLE_ACCESS_TOKEN` (Secret)
     - ✅ `AIRTABLE_BASE_ID` (Text)
     - ✅ `RESEND_API_KEY` (Secret)

5. **Test**
   - After saving, test your contact form again
   - It should now work!

## Important Notes

- ⚠️ Variable names are **case-sensitive** - must match exactly
- ⚠️ Make sure you're setting them in the **Worker** (snooze-lane-forms), not Pages
- ⚠️ Changes take effect immediately (no redeploy needed)
- ⚠️ Secret values are encrypted and cannot be viewed after saving

## Troubleshooting

If forms still don't work:
1. Double-check variable names match exactly (case-sensitive)
2. Verify you're in the correct Worker (snooze-lane-forms)
3. Check Worker logs for detailed error messages
4. Make sure all three variables are set (not just one or two)

