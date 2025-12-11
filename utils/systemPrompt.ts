/**
 * Utility function to generate system prompt for product assistant
 * Optimized for small models with limited context windows
 */

import { ParsedProductData } from './productParser';

// Helper function to truncate text to a maximum length
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function generateSystemPrompt(productData: ParsedProductData): string {
  const {
    productName,
    shortDescription,
    description,
    destination,
    location,
    price,
    rating,
    reviewCount,
    confirmationType,
    cancellationPolicy,
    availability,
    faqs,
    reviews,
  } = productData;

  // Truncate description to keep it concise (max 200 chars)
  const desc = truncateText(description || shortDescription || '', 200);

  // Format availability date safely
  let availableDate = availability.nextAvailableDate || 'Check dates';
  if (availability.nextAvailableDate) {
    try {
      const date = new Date(availability.nextAvailableDate);
      if (!isNaN(date.getTime())) {
        availableDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {
      // Keep original date string if parsing fails
    }
  }

  // Build concise product information section
  let productInfo = `Product: ${productName}
Description: ${desc}
Location: ${location.address || destination}
Price: ${price.currency} ${price.from}${price.from !== price.to ? `-${price.to}` : ''}
Rating: ${rating}/5 (${reviewCount} reviews)
Confirmation: ${confirmationType}
Cancellation: ${cancellationPolicy}
Available: ${availableDate}`;

  // Add only top 2 FAQs to keep prompt short
  if (faqs && faqs.length > 0) {
    productInfo += '\n\nFAQs:';
    faqs.slice(0, 2).forEach((faq) => {
      const q = truncateText(faq.question, 80);
      const a = truncateText(faq.answer, 120);
      productInfo += `\nQ: ${q}\nA: ${a}`;
    });
  }

  // Add only 1 review summary to save tokens
  if (reviews && reviews.length > 0) {
    const topReview = reviews[0];
    const reviewText = truncateText(topReview.comment, 100);
    productInfo += `\n\nReview: [${topReview.rating}/5] ${reviewText}`;
  }

  // Concise system prompt optimized for small models
  const systemPrompt = `You are a Product Assistant for "${productName}". Answer ONLY about this product. Be concise and helpful.

${productInfo}

Rules:
- Only answer about this product
- If asked about other topics, say: "I only help with ${productName}. Contact support for other questions."
- Use the product info above to answer questions
- Be friendly and concise`;

  // Log prompt length for debugging (rough token estimate: ~4 chars per token)
  const estimatedTokens = Math.ceil(systemPrompt.length / 4);
  if (estimatedTokens > 500) {
    console.warn(`System prompt is long (estimated ${estimatedTokens} tokens). Consider reducing content.`);
  }

  return systemPrompt;
}
