# Snooze Lane Website Setup Guide

## Overview
This website uses Cloudflare Pages Functions to handle form submissions, store data in Airtable, and send emails via Resend.

## Required Setup

### 1. Airtable Setup

You need to create two tables in your Airtable base (`appYT7C2POhuNDsDs`):

#### Table 1: "Waitlist Signups"
Create a table with the following fields:
- **Email** (Single line text) - Required
- **Signup Number** (Number) - Auto-calculated
- **Premium Eligible** (Checkbox) - Auto-set
- **Coupon Code** (Single line text) - Format: SNOOZE100-XXXX
- **Date Signed Up** (Date) - Auto-set

#### Table 2: "Contact Submissions"
Create a table with the following fields:
- **Name** (Single line text) - Required
- **Email** (Email) - Required
- **Message** (Long text) - Required
- **Date Submitted** (Date) - Auto-set

### 2. Cloudflare Pages Environment Variables

Add the following environment variables in Cloudflare Pages Settings:

1. **AIRTABLE_ACCESS_TOKEN** (Secret)
   - Value: Your Airtable Personal Access Token
   - Already configured in Cloudflare ✓

2. **AIRTABLE_BASE_ID** (Text)
   - Value: `appYT7C2POhuNDsDs`
   - Already configured ✓

3. **RESEND_API_KEY** (Secret)
   - Value: Your Resend API key (get from https://resend.com/api-keys)
   - ⚠️ **NEEDS TO BE ADDED**

### 3. Resend Setup

1. Get your Resend API key from https://resend.com/api-keys
2. Add it to Cloudflare Pages environment variables as `RESEND_API_KEY`
3. Make sure your domain `snoozelaneapp.com` is verified in Resend
4. The email will be sent from `hello@snoozelaneapp.com`

### 4. Email Templates

The waitlist signup endpoint automatically sends emails:
- **First 100 signups**: Receive a premium coupon code (SNOOZE100-XXXX) and welcome message
- **After 100 signups**: Receive a thank you message with download link (when app launches)

## API Endpoints

### `/api/waitlist`
- **Method**: POST
- **Form Field**: `Waitlist-Member-Email`
- **Functionality**:
  - Checks for duplicate emails
  - Counts current signups
  - Generates coupon code for first 100
  - Stores in Airtable
  - Sends email via Resend

### `/api/contact`
- **Method**: POST
- **Form Fields**: `Name`, `Email`, `Message`
- **Functionality**:
  - Validates all fields
  - Stores in Airtable
  - Sends notification email to admin (elombe@swftstudios.com)

## Testing

After deployment:
1. Test the waitlist form on the homepage
2. Test the contact form on the contact page
3. Verify records appear in Airtable
4. Check that emails are sent (check spam folder)

## Troubleshooting

- **Forms not submitting**: Check browser console for errors
- **Emails not sending**: Verify RESEND_API_KEY is set in Cloudflare
- **Airtable errors**: Check table names match exactly (case-sensitive)
- **CORS errors**: The endpoints include CORS headers, should work from any domain

## Notes

- The signup counter is based on records in Airtable, so it will work correctly even if the function is called multiple times
- Duplicate email submissions are prevented
- Email sending failures don't block form submission (errors are logged but don't fail the request)

