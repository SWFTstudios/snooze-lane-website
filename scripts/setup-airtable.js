/**
 * Airtable Setup Script
 * Checks and validates Airtable table structure
 * Run with: node scripts/setup-airtable.js
 */

// Get credentials from environment variables
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appYT7C2POhuNDsDs';
const AIRTABLE_ACCESS_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;

if (!AIRTABLE_ACCESS_TOKEN) {
  console.error('❌ Error: AIRTABLE_ACCESS_TOKEN environment variable is required');
  console.log('   Set it with: export AIRTABLE_ACCESS_TOKEN="your-token"');
  process.exit(1);
}

// Expected table structures
const EXPECTED_TABLES = {
  'Waitlist Signups': {
    fields: [
      { name: 'Email', type: 'email', required: true },
      { name: 'Signup Number', type: 'number', required: false },
      { name: 'Premium Eligible', type: 'checkbox', required: false },
      { name: 'Coupon Code', type: 'singleLineText', required: false },
      { name: 'Date Signed Up', type: 'dateTime', required: false }
    ]
  },
  'General Inquiries': {
    fields: [
      { name: 'Name', type: 'singleLineText', required: true },
      { name: 'Email', type: 'email', required: true },
      { name: 'Message', type: 'multilineText', required: true },
      { name: 'Date Submitted', type: 'dateTime', required: false }
    ]
  }
};

async function checkTableStructure() {
  console.log('🔍 Checking Airtable table structure...\n');

  for (const [tableName, expectedStructure] of Object.entries(EXPECTED_TABLES)) {
    console.log(`📋 Checking table: "${tableName}"`);
    
    try {
      // Try to fetch records to see if table exists
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`   ✅ Table exists`);
        
        // Get table schema to check fields
        const schemaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
        const schemaResponse = await fetch(schemaUrl, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          const table = schemaData.tables.find(t => t.name === tableName);
          
          if (table) {
            console.log(`   📊 Found ${table.fields.length} fields:`);
            const existingFieldNames = table.fields.map(f => f.name);
            
            expectedStructure.fields.forEach(expectedField => {
              const exists = existingFieldNames.includes(expectedField.name);
              const status = exists ? '✅' : '❌ MISSING';
              console.log(`      ${status} ${expectedField.name} (${expectedField.type})`);
            });

            // Check for missing fields
            const missingFields = expectedStructure.fields.filter(
              ef => !existingFieldNames.includes(ef.name)
            );

            if (missingFields.length > 0) {
              console.log(`\n   ⚠️  Missing ${missingFields.length} field(s). Please add:`);
              missingFields.forEach(field => {
                console.log(`      - ${field.name} (${field.type})${field.required ? ' - REQUIRED' : ''}`);
              });
            } else {
              console.log(`   ✅ All required fields exist!`);
            }
          }
        } else {
          console.log(`   ⚠️  Could not fetch schema (may need different permissions)`);
        }
      } else if (response.status === 404) {
        console.log(`   ❌ Table does NOT exist`);
        console.log(`\n   📝 To create this table:`);
        console.log(`      1. Go to your Airtable base: https://airtable.com/${AIRTABLE_BASE_ID}`);
        console.log(`      2. Click "+ Add a table"`);
        console.log(`      3. Name it: "${tableName}"`);
        console.log(`      4. Add these fields:`);
        expectedStructure.fields.forEach(field => {
          console.log(`         - ${field.name} (${field.type})${field.required ? ' - REQUIRED' : ''}`);
        });
      } else {
        const errorData = await response.json();
        console.log(`   ❌ Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking table: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('\n✨ Setup check complete!');
  console.log('\n📚 Field Type Reference:');
  console.log('   - email: Email field');
  console.log('   - singleLineText: Single line text');
  console.log('   - multilineText: Long text');
  console.log('   - number: Number field');
  console.log('   - checkbox: Checkbox (true/false)');
  console.log('   - dateTime: Date with time');
}

// Run the check
checkTableStructure().catch(console.error);

