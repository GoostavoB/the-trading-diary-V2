/**
 * Schema Validation Script
 * Validates JSON-LD structured data before deployment
 * Run: node scripts/validateSchema.ts
 */

interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const requiredArticleFields = [
  'headline',
  'author',
  'datePublished',
  'mainEntityOfPage',
];

const requiredOfferFields = [
  'name',
  'price',
  'priceCurrency',
  'availability',
];

/**
 * Validate Article Schema
 */
function validateArticleSchema(schema: any): SchemaValidationResult {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (schema['@type'] !== 'Article') {
    result.errors.push('Schema type must be "Article"');
    result.isValid = false;
  }

  requiredArticleFields.forEach((field) => {
    if (!schema[field]) {
      result.errors.push(`Missing required field: ${field}`);
      result.isValid = false;
    }
  });

  if (schema.headline && schema.headline.length > 110) {
    result.warnings.push('Headline should be less than 110 characters');
  }

  if (schema.description && schema.description.length > 200) {
    result.warnings.push('Description should be less than 200 characters');
  }

  if (!schema.image) {
    result.warnings.push('Image is recommended for Article schema');
  }

  return result;
}

/**
 * Validate Offer Schema
 */
function validateOfferSchema(schema: any): SchemaValidationResult {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (schema['@type'] !== 'Offer') {
    result.errors.push('Schema type must be "Offer"');
    result.isValid = false;
  }

  requiredOfferFields.forEach((field) => {
    if (!schema[field]) {
      result.errors.push(`Missing required field: ${field}`);
      result.isValid = false;
    }
  });

  if (schema.price && typeof schema.price !== 'string' && typeof schema.price !== 'number') {
    result.errors.push('Price must be a string or number');
    result.isValid = false;
  }

  if (!schema.url) {
    result.warnings.push('URL is recommended for Offer schema');
  }

  return result;
}

/**
 * Validate Breadcrumb Schema
 */
function validateBreadcrumbSchema(schema: any): SchemaValidationResult {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (schema['@type'] !== 'BreadcrumbList') {
    result.errors.push('Schema type must be "BreadcrumbList"');
    result.isValid = false;
  }

  if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
    result.errors.push('itemListElement must be an array');
    result.isValid = false;
    return result;
  }

  schema.itemListElement.forEach((item: any, index: number) => {
    if (item.position !== index + 1) {
      result.errors.push(`Item at index ${index} has incorrect position`);
      result.isValid = false;
    }

    if (!item.name || !item.item) {
      result.errors.push(`Item at index ${index} missing name or item`);
      result.isValid = false;
    }
  });

  return result;
}

/**
 * Main validation function
 */
export function validateSchema(schema: any, type: 'Article' | 'Offer' | 'BreadcrumbList'): SchemaValidationResult {
  switch (type) {
    case 'Article':
      return validateArticleSchema(schema);
    case 'Offer':
      return validateOfferSchema(schema);
    case 'BreadcrumbList':
      return validateBreadcrumbSchema(schema);
    default:
      return {
        isValid: false,
        errors: [`Unknown schema type: ${type}`],
        warnings: [],
      };
  }
}

/**
 * Pretty print validation results
 */
export function printValidationResults(results: SchemaValidationResult, schemaName: string): void {
  console.log(`\n=== ${schemaName} Validation ===`);
  
  if (results.isValid) {
    console.log('✅ Schema is valid');
  } else {
    console.log('❌ Schema validation failed');
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('\nWarnings:');
    results.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }
}

// Example usage (for testing)
if (require.main === module) {
  const exampleArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Test Article',
    author: { '@type': 'Person', name: 'John Doe' },
    datePublished: '2025-10-22',
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://example.com/article' },
  };

  const result = validateSchema(exampleArticle, 'Article');
  printValidationResults(result, 'Example Article');
}
