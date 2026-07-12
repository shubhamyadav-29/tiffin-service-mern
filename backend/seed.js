// Seeds the database with sample data for local testing.
// Run with: node seed.js   (make sure MONGO_URI in .env is set and reachable)

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Provider = require('./models/Provider');
const Menu = require('./models/Menu');
const Subscription = require('./models/Subscription');
const Review = require('./models/Review');
const Address = require('./models/Address');
const Payment = require('./models/Payment');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const foodImg = (seed) => `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=80`;

const MEAL_POOL = {
  breakfast: [
    ['Poha', 'Chutney', 'Tea'],
    ['Idli', 'Sambar', 'Coconut Chutney'],
    ['Paratha', 'Curd', 'Pickle'],
    ['Upma', 'Coconut Chutney'],
  ],
  lunch: [
    ['Dal', 'Rice', 'Roti', 'Aloo Sabzi', 'Salad'],
    ['Rajma', 'Rice', 'Roti', 'Papad'],
    ['Chole', 'Rice', 'Roti', 'Raita'],
    ['Dal Fry', 'Jeera Rice', 'Roti', 'Bhindi Sabzi'],
  ],
  dinner: [
    ['Khichdi', 'Kadhi', 'Papad'],
    ['Paneer Sabzi', 'Roti', 'Dal', 'Rice'],
    ['Mix Veg', 'Roti', 'Rice', 'Curd'],
    ['Dal Palak', 'Roti', 'Jeera Rice'],
  ],
};

const pick = (arr, i) => arr[i % arr.length];

const seed = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Provider.deleteMany({}),
    Menu.deleteMany({}),
    Subscription.deleteMany({}),
    Review.deleteMany({}),
    Address.deleteMany({}),
    Payment.deleteMany({}),
  ]);

  console.log('Creating admin...');
  await User.create({
    name: 'Admin',
    email: 'admin@tiffinhub.com',
    password: 'admin123',
    phone: '9000000000',
    role: 'admin',
  });

  console.log('Creating customers...');
  const customers = await User.create([
    {
      name: 'Zeke Fernandes',
      email: 'zeke@example.com',
      password: 'user1234',
      phone: '9111111111',
      role: 'user',
      address: { street: '12 Sea View Rd', area: 'Kharghar', city: 'Navi Mumbai', pincode: '410210' },
    },
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'user1234',
      phone: '9222222222',
      role: 'user',
      address: { street: '45 Lake Rd', area: 'Panvel', city: 'Navi Mumbai', pincode: '410206' },
    },
  ]);

  console.log('Creating saved delivery addresses...');
  await Address.create([
    {
      user: customers[0]._id,
      fullName: 'Zeke Fernandes',
      mobileNumber: '9111111111',
      houseNumber: 'B-204',
      street: '12 Sea View Rd',
      area: 'Kharghar',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '410210',
      landmark: 'Near Central Park',
      deliveryInstructions: 'Ring the bell twice',
    },
    {
      user: customers[1]._id,
      fullName: 'Priya Sharma',
      mobileNumber: '9222222222',
      houseNumber: 'A-12',
      street: '45 Lake Rd',
      area: 'Panvel',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '410206',
      landmark: '',
      deliveryInstructions: 'Leave at the door',
    },
  ]);

  console.log('Creating provider accounts + businesses...');
  const providerUsersData = [
    {
      name: 'Sunita Ghar Ka Khana',
      email: 'sunita.provider@example.com',
      businessName: "Sunita's Ghar Ka Khana",
      foodType: 'Veg',
      city: 'Navi Mumbai',
      area: 'Kharghar',
      pricing: { daily: 100, weekly: 650, monthly: 2400 },
      profileImage: foodImg('1546833999-b9f581a1996d'),
      description: 'Pure vegetarian home-style tiffins, made fresh every morning with no onion-garlic option available.',
    },
    {
      name: 'Ramesh Tiffin Corner',
      email: 'ramesh.provider@example.com',
      businessName: 'Ramesh Tiffin Corner',
      foodType: 'Veg & Non-Veg',
      city: 'Mumbai',
      area: 'Andheri',
      pricing: { daily: 120, weekly: 780, monthly: 2800 },
      profileImage: foodImg('1567337710282-00832b415979'),
      description: 'Multi-cuisine tiffin service with both veg and non-veg thalis, packed hygienically.',
    },
    {
      name: 'Jain Bhojanalay',
      email: 'jain.provider@example.com',
      businessName: 'Jain Bhojanalay',
      foodType: 'Jain',
      city: 'Navi Mumbai',
      area: 'Vashi',
      pricing: { daily: 110, weekly: 700, monthly: 2600 },
      profileImage: foodImg('1585937421612-70a008356fbe'),
      description: 'Strict Jain meals - no onion, no garlic, no root vegetables. Satvik and light.',
    },
  ];

  const providers = [];
  for (const p of providerUsersData) {
    const u = await User.create({
      name: p.name,
      email: p.email,
      password: 'provider123',
      phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
      role: 'provider',
      address: { area: p.area, city: p.city },
    });

    const provider = await Provider.create({
      user: u._id,
      businessName: p.businessName,
      description: p.description,
      foodType: p.foodType,
      deliveryAreas: [p.area, p.city],
      address: { area: p.area, city: p.city, pincode: '400001' },
      contactNumber: u.phone,
      profileImage: p.profileImage,
      pricing: p.pricing,
      approvalStatus: 'approved',
    });

    providers.push(provider);
  }

  const pendingUser = await User.create({
    name: 'New Tiffin Wale',
    email: 'newprovider@example.com',
    password: 'provider123',
    phone: '9999999999',
    role: 'provider',
    address: { area: 'Nerul', city: 'Navi Mumbai' },
  });
  await Provider.create({
    user: pendingUser._id,
    businessName: 'Fresh Start Tiffins',
    description: 'Newly registered, awaiting admin approval.',
    foodType: 'Veg',
    deliveryAreas: ['Nerul'],
    address: { area: 'Nerul', city: 'Navi Mumbai', pincode: '400706' },
    contactNumber: pendingUser.phone,
    pricing: { daily: 90, weekly: 600, monthly: 2200 },
    approvalStatus: 'pending',
  });

  console.log('Creating weekly menus for each approved provider...');
  for (const provider of providers) {
    for (let i = 0; i < DAYS.length; i++) {
      await Menu.create({
        provider: provider._id,
        day: DAYS[i],
        breakfast: { items: pick(MEAL_POOL.breakfast, i), price: 40, available: true },
        lunch: { items: pick(MEAL_POOL.lunch, i), price: 80, available: true },
        dinner: { items: pick(MEAL_POOL.dinner, i), price: 70, available: true },
      });
    }
  }

  console.log('Creating sample subscriptions + payments...');
  const now = new Date();
  const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
  const past = new Date(now); past.setDate(past.getDate() - 35);
  const pastEnd = new Date(now); pastEnd.setDate(pastEnd.getDate() - 5);

  const addr1 = await Address.findOne({ user: customers[0]._id });
  const addr2 = await Address.findOne({ user: customers[1]._id });
  const snapshot = (a) => ({
    fullName: a.fullName, mobileNumber: a.mobileNumber, houseNumber: a.houseNumber,
    street: a.street, area: a.area, city: a.city, state: a.state, pincode: a.pincode,
    landmark: a.landmark, deliveryInstructions: a.deliveryInstructions,
  });

  // Subscription 1: fully paid + accepted by provider (active)
  const sub1 = await Subscription.create({
    user: customers[0]._id,
    provider: providers[0]._id,
    planType: 'monthly',
    mealTypes: ['lunch', 'dinner'],
    startDate: now,
    endDate: in30Days,
    price: providers[0].pricing.monthly,
    status: 'active',
    paymentStatus: 'paid',
    deliveryAddress: snapshot(addr1),
  });
  const payment1 = await Payment.create({
    user: customers[0]._id,
    subscription: sub1._id,
    razorpayOrderId: 'order_sample1demo',
    razorpayPaymentId: 'pay_sample1demo',
    razorpaySignature: 'sample_signature_1',
    amount: sub1.price,
    currency: 'INR',
    paymentMethod: 'upi',
    status: 'paid',
    receiptNumber: `RCPT-${Date.now()}-A1`,
    transactionDate: now,
  });
  sub1.payment = payment1._id;
  await sub1.save();

  // Subscription 2: paid, awaiting provider accept (pending)
  const sub2 = await Subscription.create({
    user: customers[1]._id,
    provider: providers[1]._id,
    planType: 'weekly',
    mealTypes: ['lunch'],
    startDate: now,
    endDate: (() => { const d = new Date(now); d.setDate(d.getDate() + 7); return d; })(),
    price: providers[1].pricing.weekly,
    status: 'pending',
    paymentStatus: 'paid',
    deliveryAddress: snapshot(addr2),
  });
  const payment2 = await Payment.create({
    user: customers[1]._id,
    subscription: sub2._id,
    razorpayOrderId: 'order_sample2demo',
    razorpayPaymentId: 'pay_sample2demo',
    razorpaySignature: 'sample_signature_2',
    amount: sub2.price,
    currency: 'INR',
    paymentMethod: 'card',
    status: 'paid',
    receiptNumber: `RCPT-${Date.now()}-A2`,
    transactionDate: now,
  });
  sub2.payment = payment2._id;
  await sub2.save();

  // Subscription 3: completed + reviewed
  const completedSub = await Subscription.create({
    user: customers[0]._id,
    provider: providers[2]._id,
    planType: 'monthly',
    mealTypes: ['lunch'],
    startDate: past,
    endDate: pastEnd,
    price: providers[2].pricing.monthly,
    status: 'completed',
    paymentStatus: 'paid',
    deliveryAddress: snapshot(addr1),
    isReviewed: true,
  });
  await Payment.create({
    user: customers[0]._id,
    subscription: completedSub._id,
    razorpayOrderId: 'order_sample3demo',
    razorpayPaymentId: 'pay_sample3demo',
    razorpaySignature: 'sample_signature_3',
    amount: completedSub.price,
    currency: 'INR',
    paymentMethod: 'netbanking',
    status: 'paid',
    receiptNumber: `RCPT-${Date.now()}-A3`,
    transactionDate: past,
  });

  // Subscription 4: payment failed, still retryable (demo the retry flow)
  await Subscription.create({
    user: customers[1]._id,
    provider: providers[0]._id,
    planType: 'daily',
    mealTypes: ['lunch'],
    startDate: now,
    endDate: (() => { const d = new Date(now); d.setDate(d.getDate() + 1); return d; })(),
    price: providers[0].pricing.daily,
    status: 'pending_payment',
    paymentStatus: 'failed',
    deliveryAddress: snapshot(addr2),
  });

  console.log('Creating sample reviews...');
  await Review.create([
    {
      user: customers[0]._id,
      provider: providers[0]._id,
      subscription: sub1._id,
      rating: 5,
      comment: 'Bahut tasty aur ghar jaisa khana hai! Highly recommend.',
    },
    {
      user: customers[0]._id,
      provider: providers[2]._id,
      subscription: completedSub._id,
      rating: 4,
      comment: 'Good Jain food, thoda spice kam tha but overall satisfied.',
    },
  ]);

  for (const provider of providers) {
    const revs = await Review.find({ provider: provider._id, isHidden: false });
    if (revs.length) {
      const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
      provider.avgRating = Math.round(avg * 10) / 10;
      provider.numReviews = revs.length;
      await provider.save();
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin    → admin@tiffinhub.com / admin123');
  console.log('  User 1   → zeke@example.com / user1234  (has saved address, active + completed subscriptions)');
  console.log('  User 2   → priya@example.com / user1234  (has saved address, pending + failed-payment subscriptions)');
  console.log("  Provider → sunita.provider@example.com / provider123");
  console.log('  Provider → ramesh.provider@example.com / provider123');
  console.log('  Provider → jain.provider@example.com / provider123');
  console.log('  Provider (pending approval) → newprovider@example.com / provider123');
  console.log('\nNote: seeded payments use fake Razorpay IDs for display purposes only - they were not verified through Razorpay.');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
