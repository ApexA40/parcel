/**
 * Dummy Data Generator for Admin Financial Dashboard
 * Generates realistic mock data for statistics and analytics
 */

export interface DashboardKPI {
  totalRevenue: number;
  totalCollected: number;
  outstanding: number;
  totalParcels: number;
  deliveredParcels: number;
  failedParcels: number;
  successRate: number;
  activeRiders: number;
  avgDeliveryTime: number; // in hours
  customerSatisfaction: number; // percentage
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  collected: number;
  outstanding: number;
  parcels: number;
}

export interface RevenueBreakdown {
  category: string;
  value: number;
  percentage: number;
}

export interface StationPerformance {
  stationId: string;
  stationName: string;
  revenue: number;
  parcels: number;
  deliveryRate: number;
  riders: number;
}

export interface RiderPerformance {
  riderId: string;
  riderName: string;
  deliveries: number;
  failed: number;
  revenue: number;
  reconciled: number;
  outstanding: number;
  rating: number;
  avgDeliveryTime: number;
}

export interface ParcelStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PaymentMethodTrend {
  date: string;
  cash: number;
  momo: number;
  other: number;
}

export interface StationEarningsPeriod {
  periodLabel: string;
  revenue: number;
  collected: number;
  parcels: number;
  riders: Array<{ riderId: string; riderName: string; revenue: number; parcels: number; collected: number }>;
}

export interface RiderDeliveryRecord {
  parcelId: string;
  recipientName: string;
  recipientPhone: string;
  itemDescription: string;
  itemValue: number;
  deliveryFee: number;
  amountCollected: number;
  deliveryAddress: string;
  status: 'delivered' | 'delivery-failed';
  failureReason?: string;
  date: string;
  timeSlot: string;
  paymentMethod: 'Cash' | 'MoMo' | 'Other';
}

export interface RiderHistoryGroup {
  label: string;
  dateRange: string;
  deliveries: number;
  failed: number;
  revenue: number;
  records: RiderDeliveryRecord[];
}

export interface RiderFullProfile {
  riderId: string;
  riderName: string;
  phone: string;
  stationName: string;
  joinDate: string;
  status: 'active' | 'inactive';
  currentLocation: { lat: number; lng: number; address: string; lastSeen: string };
  totalDeliveries: number;
  totalFailed: number;
  totalRevenue: number;
  totalOutstanding: number;
  rating: number;
  historyByDay: RiderHistoryGroup[];
  historyByWeek: RiderHistoryGroup[];
  historyByMonth: RiderHistoryGroup[];
  heatmapData: Array<{ day: string; hour: number; count: number; revenue: number }>;
}

class DummyDataGenerator {
  private stations = [
    { id: '1', name: 'Accra Central' },
    { id: '2', name: 'Kumasi Hub' },
    { id: '3', name: 'Takoradi Station' },
    { id: '4', name: 'Tamale Office' },
    { id: '5', name: 'Cape Coast' },
  ];

  private riderNames = [
    'Kwame Mensah', 'Ama Serwaa', 'Kofi Asante', 'Akua Boateng', 'Yaw Owusu',
    'Abena Osei', 'Kwesi Appiah', 'Efua Agyeman', 'Kojo Darko', 'Adjoa Frimpong',
    'Fiifi Ansah', 'Esi Amoah', 'Kwabena Ofori', 'Adwoa Mensah', 'Yaa Asare',
    'Kobby Nkrumah', 'Akosua Boakye', 'Nana Agyei', 'Maame Yeboah', 'Paa Kwesi'
  ];

  /**
   * Generate KPI summary data
   */
  generateKPIs(stationId?: string, dateRange?: { from: Date; to: Date }): DashboardKPI {
    const baseMultiplier = stationId ? 0.2 : 1; // Single station vs all stations
    
    const totalRevenue = Math.round(150000 + Math.random() * 50000) * baseMultiplier;
    const collectionRate = 0.75 + Math.random() * 0.15; // 75-90%
    const totalCollected = Math.round(totalRevenue * collectionRate);
    const outstanding = totalRevenue - totalCollected;
    
    const totalParcels = Math.round(800 + Math.random() * 400) * baseMultiplier;
    const successRate = 85 + Math.random() * 10; // 85-95%
    const deliveredParcels = Math.round(totalParcels * (successRate / 100));
    const failedParcels = totalParcels - deliveredParcels;
    
    const activeRiders = Math.round((stationId ? 4 : 20) + Math.random() * (stationId ? 2 : 5));
    const avgDeliveryTime = 2 + Math.random() * 2; // 2-4 hours
    const customerSatisfaction = 88 + Math.random() * 10; // 88-98%

    return {
      totalRevenue,
      totalCollected,
      outstanding,
      totalParcels,
      deliveredParcels,
      failedParcels,
      successRate: Math.round(successRate * 10) / 10,
      activeRiders,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
    };
  }

  /**
   * Generate revenue trend data (daily)
   */
  generateRevenueTrend(days: number = 30, stationId?: string): RevenueDataPoint[] {
    const data: RevenueDataPoint[] = [];
    const today = new Date();
    const baseRevenue = stationId ? 5000 : 25000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add weekly pattern (lower on weekends)
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
      
      // Add some randomness and trend
      const trendFactor = 1 + (days - i) / (days * 10); // Slight upward trend
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const revenue = Math.round(baseRevenue * weekendFactor * trendFactor * randomFactor);
      const collectionRate = 0.7 + Math.random() * 0.2;
      const collected = Math.round(revenue * collectionRate);
      const parcels = Math.round(20 + Math.random() * 30) * (stationId ? 0.2 : 1);

      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
        collected,
        outstanding: revenue - collected,
        parcels,
      });
    }

    return data;
  }

  /**
   * Generate revenue breakdown by category
   */
  generateRevenueBreakdown(stationId?: string): {
    byType: RevenueBreakdown[];
    byPayment: RevenueBreakdown[];
  } {
    const totalRevenue = this.generateKPIs(stationId).totalRevenue;

    // POD vs Non-POD
    const podPercentage = 35 + Math.random() * 15; // 35-50%
    const podValue = Math.round(totalRevenue * (podPercentage / 100));
    const nonPodValue = totalRevenue - podValue;

    const byType: RevenueBreakdown[] = [
      { category: 'POD', value: podValue, percentage: Math.round(podPercentage * 10) / 10 },
      { category: 'Non-POD', value: nonPodValue, percentage: Math.round((100 - podPercentage) * 10) / 10 },
    ];

    // Cash vs Mobile Money vs Other
    const cashPercentage = 45 + Math.random() * 15; // 45-60%
    const momoPercentage = 30 + Math.random() * 15; // 30-45%
    const otherPercentage = 100 - cashPercentage - momoPercentage;

    const byPayment: RevenueBreakdown[] = [
      { category: 'Cash', value: Math.round(totalRevenue * (cashPercentage / 100)), percentage: Math.round(cashPercentage * 10) / 10 },
      { category: 'Mobile Money', value: Math.round(totalRevenue * (momoPercentage / 100)), percentage: Math.round(momoPercentage * 10) / 10 },
      { category: 'Other', value: Math.round(totalRevenue * (otherPercentage / 100)), percentage: Math.round(otherPercentage * 10) / 10 },
    ];

    return { byType, byPayment };
  }

  /**
   * Generate station performance comparison
   */
  generateStationPerformance(): StationPerformance[] {
    return this.stations.map(station => {
      const revenue = Math.round(20000 + Math.random() * 40000);
      const parcels = Math.round(150 + Math.random() * 250);
      const deliveryRate = 82 + Math.random() * 15; // 82-97%
      const riders = Math.round(3 + Math.random() * 5);

      return {
        stationId: station.id,
        stationName: station.name,
        revenue,
        parcels,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        riders,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Generate rider performance leaderboard
   */
  generateRiderPerformance(limit: number = 20, stationId?: string): RiderPerformance[] {
    const riderCount = stationId ? Math.min(limit, 8) : limit;
    const riders: RiderPerformance[] = [];

    for (let i = 0; i < riderCount; i++) {
      const deliveries = Math.round(30 + Math.random() * 120);
      const failRate = 0.05 + Math.random() * 0.15; // 5-20% fail rate
      const failed = Math.round(deliveries * failRate);
      const revenue = Math.round(deliveries * (80 + Math.random() * 120));
      const reconciliationRate = 0.6 + Math.random() * 0.3; // 60-90%
      const reconciled = Math.round(revenue * reconciliationRate);
      const outstanding = revenue - reconciled;
      const rating = 3.5 + Math.random() * 1.5; // 3.5-5.0
      const avgDeliveryTime = 1.5 + Math.random() * 2.5; // 1.5-4 hours

      riders.push({
        riderId: `R${String(i + 1).padStart(3, '0')}`,
        riderName: this.riderNames[i % this.riderNames.length],
        deliveries,
        failed,
        revenue,
        reconciled,
        outstanding,
        rating: Math.round(rating * 10) / 10,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      });
    }

    return riders.sort((a, b) => b.deliveries - a.deliveries);
  }

  /**
   * Generate parcel status distribution
   */
  generateParcelStatusDistribution(stationId?: string): ParcelStatusDistribution[] {
    const total = Math.round((stationId ? 200 : 1000) + Math.random() * (stationId ? 100 : 500));
    
    const distribution = [
      { status: 'Delivered', percentage: 65 + Math.random() * 10 },
      { status: 'Out for Delivery', percentage: 8 + Math.random() * 7 },
      { status: 'Assigned', percentage: 5 + Math.random() * 5 },
      { status: 'Ready for Delivery', percentage: 4 + Math.random() * 4 },
      { status: 'Contacted', percentage: 3 + Math.random() * 3 },
      { status: 'Registered', percentage: 2 + Math.random() * 3 },
      { status: 'Failed', percentage: 5 + Math.random() * 5 },
    ];

    // Normalize to 100%
    const sum = distribution.reduce((acc, item) => acc + item.percentage, 0);
    
    return distribution.map(item => {
      const normalizedPercentage = (item.percentage / sum) * 100;
      const count = Math.round((normalizedPercentage / 100) * total);
      return {
        status: item.status,
        count,
        percentage: Math.round(normalizedPercentage * 10) / 10,
      };
    });
  }

  /**
   * Generate payment method trend over time
   */
  generatePaymentMethodTrend(days: number = 30, stationId?: string): PaymentMethodTrend[] {
    const data: PaymentMethodTrend[] = [];
    const today = new Date();
    const baseAmount = stationId ? 5000 : 25000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
      
      const totalDaily = Math.round(baseAmount * weekendFactor * (0.8 + Math.random() * 0.4));
      
      // Cash trending down slightly, MoMo trending up
      const cashTrend = 1 - (i / (days * 5)); // Slight decrease
      const momoTrend = 1 + (i / (days * 5)); // Slight increase
      
      const cashPercentage = (0.5 + Math.random() * 0.15) * cashTrend;
      const momoPercentage = (0.35 + Math.random() * 0.15) * momoTrend;
      const otherPercentage = 1 - cashPercentage - momoPercentage;

      data.push({
        date: date.toISOString().split('T')[0],
        cash: Math.round(totalDaily * cashPercentage),
        momo: Math.round(totalDaily * momoPercentage),
        other: Math.round(totalDaily * Math.max(0, otherPercentage)),
      });
    }

    return data;
  }

  /**
   * Generate station earnings broken down by period with per-rider drill-down
   */
  generateStationEarningsByPeriod(
    period: 'day' | 'week' | 'month' | 'year',
    stationId?: string
  ): StationEarningsPeriod[] {
    const riderPool = this.riderNames.slice(0, stationId ? 5 : 10);
    const baseRevenue = stationId ? 8000 : 40000;
    let labels: string[];
    const today = new Date();

    if (period === 'day') {
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      });
    } else if (period === 'week') {
      labels = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (7 - i) * 7);
        return `Wk ${i + 1} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      });
    } else if (period === 'month') {
      labels = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), i, 1);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
    } else {
      const year = today.getFullYear();
      labels = [String(year - 2), String(year - 1), String(year)];
    }

    return labels.map((label) => {
      const factor = 0.7 + Math.random() * 0.6;
      const revenue = Math.round(baseRevenue * factor);
      const collected = Math.round(revenue * (0.72 + Math.random() * 0.2));
      const parcels = Math.round(revenue / (80 + Math.random() * 40));
      const riders = riderPool.map((name, i) => {
        const share = 0.05 + Math.random() * 0.25;
        const rRevenue = Math.round(revenue * share);
        return {
          riderId: `R${String(i + 1).padStart(3, '0')}`,
          riderName: name,
          revenue: rRevenue,
          parcels: Math.round(rRevenue / 100),
          collected: Math.round(rRevenue * (0.65 + Math.random() * 0.3)),
        };
      });
      return { periodLabel: label, revenue, collected, parcels, riders };
    });
  }

  /**
   * Generate full rider profile with delivery history
   */
  generateRiderFullProfile(riderId: string, riderName: string): RiderFullProfile {
    const ghanaAreas = [
      'Osu, Accra', 'Labone, Accra', 'East Legon, Accra', 'Spintex, Accra',
      'Tema Community 1', 'Tema Community 5', 'Adenta, Accra', 'Madina, Accra',
      'Adum, Kumasi', 'Bantama, Kumasi', 'Asokwa, Kumasi', 'Takoradi Market',
    ];
    const items = ['Electronics', 'Clothing', 'Documents', 'Food Items', 'Cosmetics', 'Books', 'Shoes', 'Jewelry', 'Mobile Phone', 'Laptop'];
    const failReasons = ['Recipient not available', 'Wrong address', 'Recipient refused delivery', 'Phone unreachable', 'Access denied'];
    const payMethods: Array<'Cash' | 'MoMo' | 'Other'> = ['Cash', 'MoMo', 'Other'];

    const today = new Date();
    const joinDate = new Date(today);
    joinDate.setMonth(joinDate.getMonth() - (6 + Math.floor(Math.random() * 18)));

    // Generate ~180 days of records
    const allRecords: RiderDeliveryRecord[] = [];
    for (let d = 180; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dow = date.getDay();
      if (dow === 0) continue; // no Sunday deliveries
      const dailyCount = Math.round((dow === 6 ? 3 : 6) + Math.random() * 8);
      for (let j = 0; j < dailyCount; j++) {
        const isFailed = Math.random() < 0.1;
        const itemValue = Math.round(50 + Math.random() * 1500);
        const deliveryFee = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
        const amountCollected = isFailed ? 0 : itemValue + deliveryFee;
        const hour = 8 + Math.floor(Math.random() * 10);
        allRecords.push({
          parcelId: `PAK-${date.toISOString().split('T')[0].replace(/-/g, '')}-${String(j + 1).padStart(3, '0')}`,
          recipientName: this.riderNames[Math.floor(Math.random() * this.riderNames.length)],
          recipientPhone: `+233 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
          itemDescription: items[Math.floor(Math.random() * items.length)],
          itemValue,
          deliveryFee,
          amountCollected,
          deliveryAddress: ghanaAreas[Math.floor(Math.random() * ghanaAreas.length)],
          status: isFailed ? 'delivery-failed' : 'delivered',
          failureReason: isFailed ? failReasons[Math.floor(Math.random() * failReasons.length)] : undefined,
          date: date.toISOString().split('T')[0],
          timeSlot: `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          paymentMethod: payMethods[Math.floor(Math.random() * payMethods.length)],
        });
      }
    }

    // Group by day (last 14 days)
    const historyByDay: RiderHistoryGroup[] = [];
    for (let d = 13; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const records = allRecords.filter(r => r.date === dateStr);
      historyByDay.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        dateRange: dateStr,
        deliveries: records.filter(r => r.status === 'delivered').length,
        failed: records.filter(r => r.status === 'delivery-failed').length,
        revenue: records.reduce((s, r) => s + r.amountCollected, 0),
        records,
      });
    }

    // Group by week (last 12 weeks)
    const historyByWeek: RiderHistoryGroup[] = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const records = allRecords.filter(r => {
        const rd = new Date(r.date);
        return rd >= weekStart && rd <= weekEnd;
      });
      historyByWeek.push({
        label: `Wk ${12 - w}`,
        dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        deliveries: records.filter(r => r.status === 'delivered').length,
        failed: records.filter(r => r.status === 'delivery-failed').length,
        revenue: records.reduce((s, r) => s + r.amountCollected, 0),
        records,
      });
    }

    // Group by month (last 6 months)
    const historyByMonth: RiderHistoryGroup[] = [];
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const records = allRecords.filter(r => {
        const rd = new Date(r.date);
        return rd.getFullYear() === monthDate.getFullYear() && rd.getMonth() === monthDate.getMonth();
      });
      historyByMonth.push({
        label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dateRange: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        deliveries: records.filter(r => r.status === 'delivered').length,
        failed: records.filter(r => r.status === 'delivery-failed').length,
        revenue: records.reduce((s, r) => s + r.amountCollected, 0),
        records,
      });
    }

    // Heatmap: day × hour (6am–8pm, 14 hours)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Build from actual records for realism
    const heatmapData = days.flatMap((day, di) =>
      Array.from({ length: 14 }, (_, hi) => {
        const hour = 6 + hi;
        // Morning rush 8-10, lunch lull 12-13, afternoon peak 14-16
        const hourWeight =
          hour >= 8 && hour <= 10 ? 0.9 :
          hour >= 14 && hour <= 16 ? 1.0 :
          hour >= 11 && hour <= 13 ? 0.5 :
          hour >= 17 ? 0.3 : 0.2;
        const dayWeight = di < 5 ? 1 : 0.5; // weekday vs Saturday
        const count = Math.round(Math.random() * 10 * hourWeight * dayWeight);
        const revenue = count * Math.round(80 + Math.random() * 120);
        return { day, hour, count, revenue };
      })
    );

    const totalDeliveries = allRecords.filter(r => r.status === 'delivered').length;
    const totalFailed = allRecords.filter(r => r.status === 'delivery-failed').length;
    const totalRevenue = allRecords.reduce((s, r) => s + r.amountCollected, 0);

    const accraLat = 5.55 + (Math.random() - 0.5) * 0.3;
    const accraLng = -0.2 + (Math.random() - 0.5) * 0.3;

    return {
      riderId,
      riderName,
      phone: `+233 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      stationName: this.stations[Math.floor(Math.random() * this.stations.length)].name,
      joinDate: joinDate.toISOString().split('T')[0],
      status: 'active',
      currentLocation: {
        lat: accraLat,
        lng: accraLng,
        address: ghanaAreas[Math.floor(Math.random() * ghanaAreas.length)],
        lastSeen: `${Math.floor(Math.random() * 30 + 1)} min ago`,
      },
      totalDeliveries,
      totalFailed,
      totalRevenue,
      totalOutstanding: Math.round(totalRevenue * (0.05 + Math.random() * 0.15)),
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      historyByDay,
      historyByWeek,
      historyByMonth,
      heatmapData,
    };
  }

  /**
   * Generate delivery performance over time
   */
  generateDeliveryPerformance(days: number = 30, stationId?: string): Array<{
    date: string;
    delivered: number;
    failed: number;
    successRate: number;
  }> {
    const data = [];
    const today = new Date();
    const baseParcels = stationId ? 20 : 100;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1;
      
      const totalParcels = Math.round(baseParcels * weekendFactor * (0.8 + Math.random() * 0.4));
      const successRate = 85 + Math.random() * 10; // 85-95%
      const delivered = Math.round(totalParcels * (successRate / 100));
      const failed = totalParcels - delivered;

      data.push({
        date: date.toISOString().split('T')[0],
        delivered,
        failed,
        successRate: Math.round(successRate * 10) / 10,
      });
    }

    return data;
  }
}

export default new DummyDataGenerator();
