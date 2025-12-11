/**
 * Utility functions to parse product data from mockData.json
 * and extract only useful fields for the AI assistant
 */

export interface ProductOption {
  optionId: string;
  optionName: string;
  bestSeller?: boolean;
  currency: string;
  priceFrom: number;
  priceTo?: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  confirmationType: string;
  cancellationType: string;
  cancellationPolicy: string;
  nextAvailableDate?: string;
  loyaltyRewards?: Record<string, number>;
  isKfExclusive?: boolean;
  kfExclusiveLabel?: string;
}

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
    availableDates: string[];
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
  productOptions: ProductOption[];
  loyaltyRewardsBanner?: string;
}

export function parseProductData(data: any): ParsedProductData | null {
  try {
    const product = data?.product;
    const productOptionsData = data?.productOptionsData;

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

    // Parse all product options
    const productOptions: ProductOption[] = (productOptionsData?.productOptionsData || []).map((option: any) => {
      if (!option) return null;
      return {
        optionId: option.optionId || '',
        optionName: option.optionName || '',
        bestSeller: option.bestSeller || false,
        currency: option.currency || product.currency || '',
        priceFrom: option.nextAvailabilityData?.priceRangeFrom || option.priceRangeFrom || product.priceRangeFrom || 0,
        priceTo: option.priceRangeTo || product.priceRangeTo || product.priceRangeFrom || 0,
        minimumQuantity: option.minimumQuantity || 1,
        maximumQuantity: option.maximumQuantity || null,
        confirmationType: option.confirmationTypeText || product.confirmationTypeText || '',
        cancellationType: option.cancellationType || product.cancellationType || '',
        cancellationPolicy: option.cancellationPolicy?.callout || 
                           (option.cancellationType === 'NO_CANCELLATION' ? 'No cancellation' : 'Cancellation available'),
        nextAvailableDate: option.nextAvailabilityData?.nextAvailableDate || '',
        loyaltyRewards: option.loyaltyRewards || {},
        isKfExclusive: option.isKfExclusive || false,
        kfExclusiveLabel: option.kfExclusiveLabel || null,
      };
    }).filter((opt): opt is ProductOption => opt !== null);

    // Use first option as default for main product info, or fallback to product data
    const defaultOption = productOptions[0];
    const cancellationPolicy = defaultOption?.cancellationPolicy || 
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
        currency: defaultOption?.currency || product.currency || '',
        from: defaultOption?.priceFrom || product.priceRangeFrom || 0,
        to: defaultOption?.priceTo || product.priceRangeTo || product.priceRangeFrom || 0,
      },
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      confirmationType: defaultOption?.confirmationType || product.confirmationTypeText || '',
      cancellationPolicy,
      availability: {
        startDate: product.availabilityStartDate || '',
        endDate: product.availabilityEndDate || '',
        nextAvailableDate: defaultOption?.nextAvailableDate || '',
        availableDates: product.availableDates || [],
      },
      faqs,
      reviews: reviews.slice(0, 5), // Limit to 5 most recent reviews
      productOptions,
      loyaltyRewardsBanner: productOptionsData?.loyaltyRewardsBanner || null,
    };
  } catch (error) {
    console.error('Error parsing product data:', error);
    return null;
  }
}
