/**
 * Utility functions to parse product data from mockData.json
 * and extract only useful fields for the AI assistant
 */

export interface ParsedProductData {
  productName: string;
  productId: string;
  shortDescription: string;
  description: string;
  destination: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  price: {
    currency: string;
    from: number;
    to: number;
  };
  rating: number;
  reviewCount: number;
  confirmationType: string;
  cancellationPolicy: string;
  availability: {
    startDate: string;
    endDate: string;
    nextAvailableDate: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  highlights?: string[];
  reviews?: Array<{
    rating: number;
    comment: string;
    travellerType: string;
  }>;
}

export function parseProductData(data: any): ParsedProductData | null {
  try {
    const product = data?.product;
    const productOptions = data?.productOptionsData?.productOptionsData?.[0];

    if (!product) {
      return null;
    }

    // Extract description from content sections
    const descriptionText = product.content?.headerMap?.sections?.overview?.sections?.description?.text || '';
    // Remove HTML tags for cleaner text
    const cleanDescription = descriptionText.replace(/<[^>]*>/g, '').trim();

    // Extract FAQs
    const faqs = product.faqs?.sections?.map((faq: any) => ({
      question: faq.question || '',
      answer: faq.answer || '',
    })) || [];

    // Extract reviews
    const reviews = data?.productReviewsDetails?.reviews?.map((review: any) => ({
      rating: review.rating || 0,
      comment: review.comment || '',
      travellerType: review.travellerType || '',
    })) || [];

    // Extract cancellation policy
    const cancellationPolicy = productOptions?.cancellationPolicy?.callout || 
                               product.cancellationTypeText || 
                               (product.cancellationType === 'NO_CANCELLATION' ? 'No cancellation allowed' : 'Cancellation available');

    return {
      productName: product.productName || '',
      productId: product.productId || '',
      shortDescription: product.shortDescription || '',
      description: cleanDescription || product.shortDescription || '',
      destination: product.destination?.destinationName || '',
      location: {
        address: product.location?.address || product.content?.headerMap?.sections?.location?.sections?.address?.text || '',
        latitude: product.location?.latitude || 0,
        longitude: product.location?.longitude || 0,
      },
      price: {
        currency: productOptions?.currency || product.currency || '',
        from: productOptions?.nextAvailabilityData?.priceRangeFrom || product.priceRangeFrom || 0,
        to: product.priceRangeTo || product.priceRangeFrom || 0,
      },
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      confirmationType: productOptions?.confirmationTypeText || product.confirmationTypeText || '',
      cancellationPolicy,
      availability: {
        startDate: product.availabilityStartDate || '',
        endDate: product.availabilityEndDate || '',
        nextAvailableDate: productOptions?.nextAvailabilityData?.nextAvailableDate || '',
      },
      faqs,
      reviews: reviews.slice(0, 5), // Limit to 5 most recent reviews
    };
  } catch (error) {
    console.error('Error parsing product data:', error);
    return null;
  }
}
