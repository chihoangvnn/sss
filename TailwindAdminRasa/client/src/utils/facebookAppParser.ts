import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Facebook App data structure for CSV/JSON import
export interface FacebookAppData {
  appName: string;
  appId: string;
  appSecret: string;
  environment?: 'development' | 'production' | 'staging';
  description?: string;
}

// Validation error interface
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

// Parser result interface
export interface ParseResult {
  data: FacebookAppData[];
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
}

// 🔒 SECURITY: Validate Facebook App data structure
export function validateFacebookAppData(data: any[], strict: boolean = true): ParseResult {
  const validApps: FacebookAppData[] = [];
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Required field validation
    const requiredFields = ['appName', 'appId', 'appSecret'];
    const missingFields = requiredFields.filter(field => !row[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      errors.push({
        row: rowNumber,
        field: missingFields.join(', '),
        message: `Missing required fields: ${missingFields.join(', ')}`,
        value: `Row ${rowNumber}` // 🔒 SECURITY FIX: No raw data in error
      });
      return;
    }

    // Trim and validate each field
    const appName = row.appName?.toString().trim();
    const appId = row.appId?.toString().trim();
    const appSecret = row.appSecret?.toString().trim();
    const environment = row.environment?.toString().trim()?.toLowerCase() || 'development';
    const description = row.description?.toString().trim() || '';

    // Validate appName
    if (!appName || appName.length < 2) {
      errors.push({
        row: rowNumber,
        field: 'appName',
        message: 'App name must be at least 2 characters long',
        value: appName
      });
      return;
    }

    if (appName.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'appName',
        message: 'App name too long (max 100 characters)',
        value: appName
      });
      return;
    }

    // Validate appId (should be numeric Facebook App ID)
    if (!/^\d+$/.test(appId)) {
      errors.push({
        row: rowNumber,
        field: 'appId',
        message: 'App ID must be a valid Facebook App ID (numeric)',
        value: appId
      });
      return;
    }

    if (appId.length < 10 || appId.length > 20) {
      errors.push({
        row: rowNumber,
        field: 'appId',
        message: 'App ID must be between 10-20 digits',
        value: appId
      });
      return;
    }

    // Validate appSecret
    if (!appSecret || appSecret.length < 32) {
      errors.push({
        row: rowNumber,
        field: 'appSecret',
        message: 'App secret must be at least 32 characters long',
        value: appSecret ? `redacted (length: ${appSecret.length})` : 'empty' // 🔒 SECURITY FIX: No secret content
      });
      return;
    }

    // Validate environment
    if (!['development', 'production', 'staging'].includes(environment)) {
      errors.push({
        row: rowNumber,
        field: 'environment',
        message: 'Environment must be development, production, or staging',
        value: environment
      });
      return;
    }

    // Validate description length
    if (description.length > 500) {
      errors.push({
        row: rowNumber,
        field: 'description',
        message: 'Description too long (max 500 characters)',
        value: description.substring(0, 50) + '...'
      });
      return;
    }

    // If all validations pass, add to valid apps
    validApps.push({
      appName,
      appId,
      appSecret,
      environment: environment as 'development' | 'production' | 'staging',
      description
    });
  });

  return {
    data: validApps,
    errors,
    totalRows: data.length,
    validRows: validApps.length
  };
}

// 📄 CSV Parser for Facebook Apps
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers to match expected fields
        const normalizedHeaders: Record<string, string> = {
          'app_name': 'appName',
          'app name': 'appName',
          'name': 'appName',
          'app_id': 'appId',
          'app id': 'appId',
          'id': 'appId',
          'app_secret': 'appSecret',
          'app secret': 'appSecret',
          'secret': 'appSecret',
          'env': 'environment',
          'desc': 'description'
        };
        
        return normalizedHeaders[header.toLowerCase()] || header;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of rejecting
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'CSV Parser',
              message: `CSV parsing failed: ${results.errors.map(e => e.message).join(', ')}`,
              value: 'CSV format error'
            }],
            totalRows: 0,
            validRows: 0
          });
          return;
        }

        const parseResult = validateFacebookAppData(results.data as any[]);
        resolve(parseResult);
      },
      error: (error) => {
        // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of rejecting
        resolve({
          data: [],
          errors: [{
            row: 0,
            field: 'CSV Parser',
            message: `CSV parsing error: ${error.message}`,
            value: 'CSV parse failure'
          }],
          totalRows: 0,
          validRows: 0
        });
      }
    });
  });
}

// 📊 Excel Parser for Facebook Apps  
export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) {
          // 🔧 CONSISTENCY FIX: Return ParseResult instead of rejecting
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'Excel Parser',
              message: 'Failed to read file buffer',
              value: 'File read error'
            }],
            totalRows: 0,
            validRows: 0
          });
          return;
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        
        if (!sheetName) {
          // 🔧 CONSISTENCY FIX: Return ParseResult instead of rejecting
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'Excel Parser',
              message: 'No sheets found in Excel file',
              value: 'Empty workbook'
            }],
            totalRows: 0,
            validRows: 0
          });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });

        if (data.length < 2) {
          // 🔧 CONSISTENCY FIX: Return ParseResult instead of rejecting
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'Excel Parser',
              message: 'Excel file must contain at least a header row and one data row',
              value: 'Insufficient data rows'
            }],
            totalRows: 0,
            validRows: 0
          });
          return;
        }

        // Convert to object array with headers
        const headers = (data[0] as string[]).map(h => h.toString().trim());
        const rows = data.slice(1) as any[][];
        
        const objectData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            // Normalize header names
            const normalizedHeaders: Record<string, string> = {
              'app_name': 'appName',
              'app name': 'appName', 
              'name': 'appName',
              'app_id': 'appId',
              'app id': 'appId',
              'id': 'appId',
              'app_secret': 'appSecret',
              'app secret': 'appSecret',
              'secret': 'appSecret',
              'env': 'environment',
              'desc': 'description'
            };
            
            const normalizedHeader = normalizedHeaders[header.toLowerCase()] || header;
            obj[normalizedHeader] = row[index]?.toString().trim() || '';
          });
          return obj;
        });

        const parseResult = validateFacebookAppData(objectData);
        resolve(parseResult);

      } catch (error) {
        // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of rejecting
        resolve({
          data: [],
          errors: [{
            row: 0,
            field: 'Excel Parser',
            message: `Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            value: 'Excel format error'
          }],
          totalRows: 0,
          validRows: 0
        });
      }
    };

    reader.onerror = () => {
      // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of rejecting
      resolve({
        data: [],
        errors: [{
          row: 0,
          field: 'Excel Parser',
          message: 'Failed to read Excel file',
          value: 'File read error'
        }],
        totalRows: 0,
        validRows: 0
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// 📋 JSON Parser for Facebook Apps
export function parseJSON(jsonString: string): ParseResult {
  try {
    const data = JSON.parse(jsonString);
    
    // Handle both array format and {apps: [...]} format
    let appsArray: any[];
    
    if (Array.isArray(data)) {
      appsArray = data;
    } else if (data.apps && Array.isArray(data.apps)) {
      appsArray = data.apps;
    } else {
      throw new Error('JSON must be an array of apps or an object with "apps" property containing an array');
    }

    if (appsArray.length === 0) {
      throw new Error('JSON contains no apps to import');
    }

    return validateFacebookAppData(appsArray);

  } catch (error) {
    return {
      data: [],
      errors: [{
        row: 0,
        field: 'JSON',
        message: error instanceof Error ? error.message : 'Invalid JSON format',
        value: 'JSON parsing failed' // 🔒 SECURITY FIX: No raw input in error
      }],
      totalRows: 0,
      validRows: 0
    };
  }
}

// 📥 Main file parser function
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSV(file);
    
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    
    case 'json':
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const result = parseJSON(content);
          resolve(result);
        };
        reader.onerror = () => {
          // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of rejecting
          resolve({
            data: [],
            errors: [{
              row: 0,
              field: 'JSON File Reader',
              message: 'Failed to read JSON file',
              value: 'File read error'
            }],
            totalRows: 0,
            validRows: 0
          });
        };
        reader.readAsText(file);
      });
    
    default:
      // 🔧 CONSISTENCY FIX: Return ParseResult with parser error instead of throwing
      return Promise.resolve({
        data: [],
        errors: [{
          row: 0,
          field: 'File Format',
          message: `Unsupported file format: ${extension}. Supported formats: CSV, Excel (xlsx/xls), JSON`,
          value: `File: ${file.name}`
        }],
        totalRows: 0,
        validRows: 0
      });
  }
}

// 📄 Generate CSV template for download
export function generateCSVTemplate(): string {
  return `appName,appId,appSecret,environment,description
"My Facebook App","1234567890123456","abcd1234567890abcd1234567890abcd","development","Development app for testing"
"Production App","9876543210987654","zyxw9876543210zyxw9876543210zyxw","production","Main production application"
"Staging App","5555666677778888","mnop5555666677778888mnop55556666","staging","Staging environment for testing"`;
}

// 📋 Generate JSON template for download
export function generateJSONTemplate(): string {
  return JSON.stringify({
    apps: [
      {
        appName: "My Facebook App",
        appId: "1234567890123456",
        appSecret: "abcd1234567890abcd1234567890abcd",
        environment: "development",
        description: "Development app for testing"
      },
      {
        appName: "Production App", 
        appId: "9876543210987654",
        appSecret: "zyxw9876543210zyxw9876543210zyxw",
        environment: "production",
        description: "Main production application"
      },
      {
        appName: "Staging App",
        appId: "5555666677778888", 
        appSecret: "mnop5555666677778888mnop55556666",
        environment: "staging",
        description: "Staging environment for testing"
      }
    ]
  }, null, 2);
}