import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import mockData from './mockData4.json';

export default function ProductScreen() {
  const router = useRouter();
  const product = mockData.product;
  const option = mockData.productOptionsData?.productOptionsData?.[0];

  const availableDates: string[] = product.availableDates || [];
  const nextDates = availableDates.slice(0, 3);

  const heroImage =
    product.mediaData?.[0]?.sizes?.large ||
    product.mediaData?.[0]?.url ||
    'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80';

  const priceFrom = option?.nextAvailabilityData?.priceRangeFrom ?? product.priceRangeFrom ?? 0;
  const currency = option?.currency || product.currency || 'USD';

  const insets=useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={heroImage} style={styles.heroImage} contentFit="cover" />
          <View style={[styles.topIcons,{top:insets.top}]}>
            <IconButton icon="chevron-back" />
            <View style={styles.topRightIcons}>
              <IconButton icon="heart-outline" />
              <IconButton icon="cart-outline" />
              <IconButton icon="share-outline" />
            </View>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={18} color="#000" />
          </TouchableOpacity>
          <View style={styles.imageCount}>
            <Text style={styles.imageCountText}>1/10</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>👋 Sign up for an extra 10% off!</Text>
          <Link href="#" style={styles.bannerLink}>
            <Text style={styles.bannerLinkText}>T&Cs</Text>
          </Link>
        </View>

        <View style={styles.pillsRow}>
          <Pill label="Instant confirmation" />
          <Pill label="Flexible date" />
          <Pill label="No cancellation" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{product.productName}</Text>
          <View style={styles.row}>
            <Ionicons name="star" size={16} color="#f7b500" />
            <Text style={styles.ratingText}>
              {product.rating?.toFixed(1)} · {product.reviewCount} reviews · {product.destination?.destinationName}
            </Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Ionicons name="trophy" size={18} color="#d89614" />
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>Top 10</Text>
            <Text style={styles.badgeSubtitle}>Singapore · Most booked</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>

        <TouchableOpacity
          style={styles.askButton}
          onPress={() => router.push('/aiChat')}
          activeOpacity={0.8}>
          <Ionicons name="chatbubbles" size={18} color="#fff" />
          <Text style={styles.askButtonText}>Ask PocketGuide about this experience</Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Next available dates</Text>
          <View style={styles.dateRow}>
            {nextDates.map((date) => {
              const parsed = new Date(date);
              const day = parsed.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <View key={date} style={styles.dateCard}>
                  <Text style={styles.dateDay}>{day}</Text>
                  <Text style={styles.dateMonth}>{monthDay}</Text>
                </View>
              );
            })}
          </View>
          {availableDates.length > 3 && (
            <Text style={styles.dateFooter}>+ {availableDates.length - 3} more dates available</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.fromLabel}>From</Text>
            <Text style={styles.price}>
              {currency} {priceFrom?.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Select option</Text>
            <Ionicons name="sparkles-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function IconButton({ icon }: { icon: any }) {
  return (
    <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color="#000" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
  },
  hero: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 340,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  topIcons: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  playButton: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  imageCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  imageCountText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  banner: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eaf3ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    color: '#0a6cff',
    fontWeight: '600',
  },
  bannerLink: {
    paddingHorizontal: 6,
  },
  bannerLinkText: {
    color: '#0a6cff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginHorizontal: 16,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
  },
  pillText: {
    fontSize: 12,
    color: '#333',
  },
  titleBlock: {
    marginHorizontal: 16,
    marginTop: 14,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    color: '#555',
  },
  badge: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff5e6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeTitle: {
    fontWeight: '700',
    color: '#8c6d1f',
  },
  badgeSubtitle: {
    color: '#8c6d1f',
    fontSize: 12,
  },
  askButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#5a31f4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  askButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    marginTop: 18,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f2fbf5',
    gap: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2b7744',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 12,
    color: '#555',
  },
  dateMonth: {
    fontWeight: '700',
    color: '#222',
  },
  dateFooter: {
    color: '#2b7744',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fromLabel: {
    color: '#555',
    fontSize: 12,
  },
  price: {
    fontWeight: '800',
    fontSize: 18,
    color: '#111',
  },
  ctaButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1b1f3b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
  },
});

