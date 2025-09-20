// Quick test for Facebook App Parser functionality
import { validateFacebookAppData, parseJSON, generateCSVTemplate, generateJSONTemplate } from '../facebookAppParser';

// Test data
const validAppData = [
  {
    appName: "Test App 1",
    appId: "1234567890123456",
    appSecret: "abcd1234567890abcd1234567890abcd12345678",
    environment: "development",
    description: "Test description"
  },
  {
    appName: "Test App 2",
    appId: "9876543210987654",
    appSecret: "zyxw9876543210zyxw9876543210zyxw12345678",
    environment: "production",
    description: ""
  }
];

const invalidAppData = [
  {
    appName: "", // Invalid: empty name
    appId: "123", // Invalid: too short
    appSecret: "short", // Invalid: too short
    environment: "invalid", // Invalid environment
    description: "Test"
  },
  {
    appName: "Valid App",
    appId: "1234567890123456",
    // Missing appSecret
    environment: "development"
  }
];

// Test validation function
console.log('🧪 Testing validation with valid data...');
const validResult = validateFacebookAppData(validAppData);
console.log(`✅ Valid data test: ${validResult.validRows}/${validResult.totalRows} rows valid, ${validResult.errors.length} errors`);
console.log('Valid apps:', validResult.data.map(app => ({ name: app.appName, id: app.appId })));

console.log('\n🧪 Testing validation with invalid data...');
const invalidResult = validateFacebookAppData(invalidAppData);
console.log(`❌ Invalid data test: ${invalidResult.validRows}/${invalidResult.totalRows} rows valid, ${invalidResult.errors.length} errors`);
console.log('Errors found:', invalidResult.errors.map(err => `Row ${err.row}: ${err.message}`));

// Test JSON parsing
console.log('\n🧪 Testing JSON parsing...');
const jsonData = JSON.stringify({ apps: validAppData });
const jsonResult = parseJSON(jsonData);
console.log(`📋 JSON parsing: ${jsonResult.validRows}/${jsonResult.totalRows} rows valid, ${jsonResult.errors.length} errors`);

const invalidJsonResult = parseJSON('invalid json');
console.log(`📋 Invalid JSON parsing: ${invalidJsonResult.validRows}/${invalidJsonResult.totalRows} rows valid, ${invalidJsonResult.errors.length} errors`);

// Test template generation
console.log('\n🧪 Testing template generation...');
const csvTemplate = generateCSVTemplate();
const jsonTemplate = generateJSONTemplate();
console.log(`📄 CSV template generated (${csvTemplate.length} chars)`);
console.log(`📋 JSON template generated (${jsonTemplate.length} chars)`);

console.log('\n✅ All parser tests completed!');

export {}; // Make this a module