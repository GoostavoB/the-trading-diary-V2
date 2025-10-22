/**
 * SEO Validation Utilities
 * Client-side validation for SEO best practices
 */

interface SEOValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tips: string[];
}

/**
 * Validate page title
 */
export function validateTitle(title: string): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  if (!title || title.trim().length === 0) {
    result.errors.push('Title is required');
    result.isValid = false;
    return result;
  }

  if (title.length > 60) {
    result.warnings.push(`Title is ${title.length} characters (recommended: ≤60)`);
    result.tips.push('Shorter titles are more likely to be fully displayed in search results');
  }

  if (title.length < 30) {
    result.warnings.push(`Title is ${title.length} characters (recommended: 30-60)`);
    result.tips.push('Longer, descriptive titles tend to perform better');
  }

  if (!/[|:-]/.test(title)) {
    result.tips.push('Consider using separators (| - :) for better readability');
  }

  return result;
}

/**
 * Validate meta description
 */
export function validateDescription(description: string): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  if (!description || description.trim().length === 0) {
    result.warnings.push('Meta description is missing');
    result.tips.push('Meta descriptions help improve click-through rates');
    return result;
  }

  if (description.length > 160) {
    result.warnings.push(`Description is ${description.length} characters (recommended: ≤160)`);
    result.tips.push('Longer descriptions may be truncated in search results');
  }

  if (description.length < 120) {
    result.warnings.push(`Description is ${description.length} characters (recommended: 120-160)`);
    result.tips.push('Longer descriptions provide more context to users');
  }

  return result;
}

/**
 * Validate image alt text
 */
export function validateImageAlt(alt: string, src: string): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  if (!alt || alt.trim().length === 0) {
    result.errors.push(`Image missing alt text: ${src}`);
    result.isValid = false;
    result.tips.push('All images must have descriptive alt text for accessibility and SEO');
    return result;
  }

  if (alt.length > 125) {
    result.warnings.push(`Alt text is ${alt.length} characters (recommended: ≤125)`);
  }

  if (/image of|picture of|photo of/i.test(alt)) {
    result.tips.push('Avoid phrases like "image of" - describe what is shown directly');
  }

  if (alt.toLowerCase() === 'image' || alt.toLowerCase() === 'photo') {
    result.warnings.push('Alt text is not descriptive enough');
    result.tips.push('Use specific descriptions that provide context');
  }

  return result;
}

/**
 * Validate canonical URL
 */
export function validateCanonical(canonical: string): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  if (!canonical) {
    result.warnings.push('Canonical URL is missing');
    result.tips.push('Canonical URLs help prevent duplicate content issues');
    return result;
  }

  try {
    const url = new URL(canonical);
    
    if (url.protocol !== 'https:') {
      result.warnings.push('Canonical URL should use HTTPS');
    }

    if (url.hash) {
      result.warnings.push('Canonical URL should not contain hash fragments');
    }

    if (url.search) {
      result.warnings.push('Canonical URL contains query parameters - ensure this is intentional');
    }
  } catch (e) {
    result.errors.push('Canonical URL is not a valid URL');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate heading structure
 */
export function validateHeadings(headings: { level: number; text: string }[]): SEOValidationResult {
  const result: SEOValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    tips: [],
  };

  const h1Count = headings.filter((h) => h.level === 1).length;

  if (h1Count === 0) {
    result.errors.push('Page must have exactly one H1 heading');
    result.isValid = false;
  }

  if (h1Count > 1) {
    result.errors.push(`Page has ${h1Count} H1 headings (should have exactly 1)`);
    result.isValid = false;
  }

  // Check for skipped heading levels
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = headings[i - 1].level;
    const currLevel = headings[i].level;

    if (currLevel > prevLevel + 1) {
      result.warnings.push(`Heading structure skips from H${prevLevel} to H${currLevel}`);
      result.tips.push('Maintain proper heading hierarchy (H1 → H2 → H3, etc.)');
    }
  }

  return result;
}

/**
 * Run all validations on current page
 */
export function validateCurrentPage(): {
  title: SEOValidationResult;
  description: SEOValidationResult;
  images: SEOValidationResult[];
  canonical: SEOValidationResult;
  headings: SEOValidationResult;
  overallValid: boolean;
} {
  const title = document.title;
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const canonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

  const images = Array.from(document.querySelectorAll('img')).map((img) =>
    validateImageAlt(img.alt, img.src)
  );

  const headingElements = Array.from(
    document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );
  const headings = headingElements.map((el) => ({
    level: parseInt(el.tagName[1]),
    text: el.textContent || '',
  }));

  const titleResult = validateTitle(title);
  const descriptionResult = validateDescription(description);
  const canonicalResult = validateCanonical(canonical);
  const headingsResult = validateHeadings(headings);

  const overallValid =
    titleResult.isValid &&
    descriptionResult.isValid &&
    canonicalResult.isValid &&
    headingsResult.isValid &&
    images.every((result) => result.isValid);

  return {
    title: titleResult,
    description: descriptionResult,
    images,
    canonical: canonicalResult,
    headings: headingsResult,
    overallValid,
  };
}

/**
 * Log validation results to console (for development)
 */
export function logSEOValidation(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const results = validateCurrentPage();

  console.group('🔍 SEO Validation Results');
  
  console.log('Overall:', results.overallValid ? '✅ Valid' : '❌ Issues Found');
  
  console.group('Title');
  console.log(results.title);
  console.groupEnd();
  
  console.group('Description');
  console.log(results.description);
  console.groupEnd();
  
  console.group('Canonical');
  console.log(results.canonical);
  console.groupEnd();
  
  console.group('Headings');
  console.log(results.headings);
  console.groupEnd();
  
  if (results.images.length > 0) {
    console.group(`Images (${results.images.length})`);
    results.images.forEach((result, index) => {
      if (!result.isValid) {
        console.log(`Image ${index + 1}:`, result);
      }
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}
