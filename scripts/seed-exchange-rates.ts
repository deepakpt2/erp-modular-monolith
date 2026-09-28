import { db } from '@/shared/kernel/db/client';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('=== SEED EXCHANGE RATES TCURR - KWD/INR/USD/EUR ===');

  const rates = [
    // KWD base rates - KWD is strong
    { from: 'KWD', to: 'INR', rate: 270.0, validFrom: '2024-01-01' },
    { from: 'KWD', to: 'USD', rate: 3.25, validFrom: '2024-01-01' },
    { from: 'KWD', to: 'EUR', rate: 3.0, validFrom: '2024-01-01' },
    // Updated rates for 2025
    { from: 'KWD', to: 'INR', rate: 272.5, validFrom: '2025-01-01' },
    { from: 'KWD', to: 'USD', rate: 3.27, validFrom: '2025-01-01' },
    // Current 2026 rates
    { from: 'KWD', to: 'INR', rate: 275.0, validFrom: '2026-01-01' },
    { from: 'KWD', to: 'USD', rate: 3.30, validFrom: '2026-01-01' },
    { from: 'KWD', to: 'EUR', rate: 3.05, validFrom: '2026-01-01' },
    { from: 'KWD', to: 'INR', rate: 278.0, validFrom: '2026-09-01' },

    // USD base rates
    { from: 'USD', to: 'KWD', rate: 0.307, validFrom: '2024-01-01' },
    { from: 'USD', to: 'INR', rate: 83.0, validFrom: '2024-01-01' },
    { from: 'USD', to: 'EUR', rate: 0.92, validFrom: '2024-01-01' },
    { from: 'USD', to: 'INR', rate: 84.5, validFrom: '2025-01-01' },
    { from: 'USD', to: 'INR', rate: 86.0, validFrom: '2026-01-01' },
    { from: 'USD', to: 'KWD', rate: 0.303, validFrom: '2026-01-01' },

    // INR base rates
    { from: 'INR', to: 'KWD', rate: 0.0037, validFrom: '2024-01-01' },
    { from: 'INR', to: 'USD', rate: 0.012, validFrom: '2024-01-01' },
    { from: 'INR', to: 'EUR', rate: 0.011, validFrom: '2024-01-01' },
    { from: 'INR', to: 'KWD', rate: 0.00363, validFrom: '2026-01-01' },
    { from: 'INR', to: 'USD', rate: 0.0116, validFrom: '2026-01-01' },

    // EUR rates
    { from: 'EUR', to: 'KWD', rate: 0.333, validFrom: '2024-01-01' },
    { from: 'EUR', to: 'INR', rate: 90.0, validFrom: '2024-01-01' },
    { from: 'EUR', to: 'USD', rate: 1.08, validFrom: '2024-01-01' },
    { from: 'EUR', to: 'INR', rate: 92.0, validFrom: '2026-01-01' },
  ];

  for (const r of rates) {
    try {
      await db.execute(sql`
        INSERT INTO ent_exchange_rate (from_currency, to_currency, valid_from, rate, rate_type)
        VALUES (${r.from}, ${r.to}, ${new Date(r.validFrom)}, ${r.rate}, 'M')
        ON CONFLICT (from_currency, to_currency, valid_from, rate_type) DO UPDATE SET rate = ${r.rate}
      `);
      console.log(`Rate ${r.from}->${r.to} ${r.rate} valid ${r.validFrom}`);
    } catch (e: any) {
      console.warn(`Failed ${r.from}->${r.to}:`, e.message);
    }
  }

  console.log('=== EXCHANGE RATES SEEDED ===');
  
  // Test conversion
  const { convertCurrency } = await import('@/shared/kernel/enterprise/exchangeRate');
  const test1 = await convertCurrency(100, 'KWD', 'INR', new Date('2026-09-28'));
  console.log(`Test: 100 KWD -> INR on 2026-09-28: ${test1.convertedAmount} @ rate ${test1.rate}`);
  const test2 = await convertCurrency(1000, 'USD', 'INR', new Date('2026-09-28'));
  console.log(`Test: 1000 USD -> INR: ${test2.convertedAmount} @ rate ${test2.rate}`);
  const test3 = await convertCurrency(50000, 'INR', 'KWD', new Date('2026-09-28'));
  console.log(`Test: 50000 INR -> KWD: ${test3.convertedAmount} @ rate ${test3.rate}`);
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
