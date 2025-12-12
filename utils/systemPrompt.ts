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

export function generateSystemPrompt(productData: ParsedProductData, maxTokens: number = 500): string {
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
    productOptions,
    loyaltyRewardsBanner,
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

  // Format availableDates array smartly
  let availableDatesInfo = '';
  if (availability.availableDates && availability.availableDates.length > 0) {
    const dates = availability.availableDates;
    if (dates.length <= 10) {
      // Show all dates if 10 or fewer
      const formattedDates = dates.map(date => {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        } catch (e) {
          // Keep original format if parsing fails
        }
        return date;
      }).join(', ');
      availableDatesInfo = `\nAvailable Dates: ${formattedDates}`;
    } else {
      // Show first few, last few, and count for large arrays
      const firstFew = dates.slice(0, 3).map(date => {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        } catch (e) {}
        return date;
      }).join(', ');
      
      const lastFew = dates.slice(-2).map(date => {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        } catch (e) {}
        return date;
      }).join(', ');
      
      availableDatesInfo = `\nAvailable Dates: ${firstFew} ... ${lastFew} (${dates.length} total dates available)`;
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
Next Available: ${availableDate}${availableDatesInfo}`;

  // Add loyalty rewards banner if available
  if (loyaltyRewardsBanner) {
    productInfo += `\nRewards: ${loyaltyRewardsBanner}`;
  }

  // Add product options (package options/variants)
  if (productOptions && productOptions.length > 0) {
    productInfo += '\n\nPackage Options:';
    // Limit to first 5 options to save tokens
    const optionsToShow = productOptions.slice(0, 5);
    optionsToShow.forEach((option, index) => {
      const optionName = truncateText(option.optionName, 60);
      const priceStr = `${option.currency} ${option.priceFrom}${option.priceTo && option.priceTo !== option.priceFrom ? `-${option.priceTo}` : ''}`;
      const badges: string[] = [];
      if (option.bestSeller) badges.push('Best Seller');
      if (option.isKfExclusive) badges.push(option.kfExclusiveLabel || 'Exclusive');
      
      productInfo += `\n${index + 1}. ${optionName} - ${priceStr}`;
      if (badges.length > 0) {
        productInfo += ` [${badges.join(', ')}]`;
      }
      if (option.minimumQuantity > 1) {
        productInfo += ` (Min: ${option.minimumQuantity}${option.maximumQuantity ? `, Max: ${option.maximumQuantity}` : ''})`;
      }
      if (option.nextAvailableDate) {
        try {
          const date = new Date(option.nextAvailableDate);
          if (!isNaN(date.getTime())) {
            productInfo += ` - Available: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          }
        } catch (e) {
          // Skip date if parsing fails
        }
      }
    });
    if (productOptions.length > 5) {
      productInfo += `\n... and ${productOptions.length - 5} more options`;
    }
  }

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
let systemPrompt = `You are PocketGuideAi, an expert travel assistant for Pelago by Singapore Airlines.
Your goal is to help a traveler understand the product "${productName}" and nothing else.

### PRODUCT CONTEXT
${productInfo}

### INSTRUCTIONS
1. **Source of Truth:** Prioritize the "PRODUCT CONTEXT" above for facts (timings, inclusions, prices).
2. **General Knowledge:** You may use your own general knowledge to clarify context (e.g., "Is this location near the city center?"), but NEVER contradict the provided product info.
3. **Scope:** Answer ONLY questions related to "${productName}".
   - If asked about the weather, answer only regarding the location of this product.
   - If asked about other tour providers (e.g., Klook, Viator), politely ignore them and focus on why THIS product is great.
   - If asked about general life advice or coding, say: "I’m here to help you with your trip to ${productName}. Let's stick to that!"
4. **Tone:** Be inspiring, helpful, and concise. Write like a knowledgeable local guide. Use emojis sparingly.
5. **Formatting:** Keep answers short (under 3 sentences) unless asked for a detailed itinerary. Use bullet points for lists.

### CRITICAL RULES
- NEVER recommend booking anywhere other than Pelago.
- If the user asks for a refund or support, say: "For support queries, please contact the Pelago Help Center directly."
`;

  // Check prompt length and truncate if needed
  let estimatedTokens = Math.ceil(systemPrompt.length / 4);
  
  if (estimatedTokens > maxTokens) {
    console.warn(`System prompt too long (${estimatedTokens} tokens). Truncating...`);
    
    // Remove less critical sections if prompt is too long
    if (reviews && reviews.length > 0) {
      // Remove reviews first
      systemPrompt = systemPrompt.replace(/\n\nReview:.*$/, '');
      estimatedTokens = Math.ceil(systemPrompt.length / 4);
    }
    
    if (estimatedTokens > maxTokens && faqs && faqs.length > 0) {
      // Remove FAQs if still too long
      systemPrompt = systemPrompt.replace(/\n\nFAQs:.*$/, '');
      estimatedTokens = Math.ceil(systemPrompt.length / 4);
    }
    
    if (estimatedTokens > maxTokens && availability.availableDates && availability.availableDates.length > 0) {
      // Simplify availableDates if still too long - show only count
      const datesCount = availability.availableDates.length;
      systemPrompt = systemPrompt.replace(/Available Dates:[\s\S]*?(?=\n\n|$)/, `Available Dates: ${datesCount} dates available (check calendar for specific dates)`);
      estimatedTokens = Math.ceil(systemPrompt.length / 4);
    }
    
    if (estimatedTokens > maxTokens && productOptions && productOptions.length > 0) {
      // Reduce product options to top 2
      const optionsMatch = systemPrompt.match(/Package Options:[\s\S]*?(?=\n\n|$)/);
      if (optionsMatch) {
        const limitedOptions = productOptions.slice(0, 2).map((option, index) => {
          const optionName = truncateText(option.optionName, 50);
          return `${index + 1}. ${optionName} - ${option.currency} ${option.priceFrom}`;
        }).join('\n');
        systemPrompt = systemPrompt.replace(/Package Options:[\s\S]*?(?=\n\n|$)/, `Package Options:\n${limitedOptions}`);
        estimatedTokens = Math.ceil(systemPrompt.length / 4);
      }
    }
    
    // Final fallback: truncate description if still too long
    if (estimatedTokens > maxTokens) {
      const maxLength = (maxTokens * 4) - 200; // Leave room for other content
      systemPrompt = systemPrompt.substring(0, maxLength) + '...';
    }
  }

  console.log(`System prompt: ${systemPrompt.length} chars, ~${Math.ceil(systemPrompt.length / 4)} tokens`);

  return systemPrompt;
}
