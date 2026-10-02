/**
 * Next.js Instrumentation - Startup hook for enterprise background workers
 * Starts job queue worker polling for PAYROLL_RUN, COSTING_RUN, MRP_RUN
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[INSTRUMENTATION] Node.js runtime - checking enterprise mode');

    // Auto-seed industry standard baseline (CA-IN-01, standard tax codes, currencies, uoms, doc types)
    // Runs in the background on startup so standard enterprise reference data is always present automatically
    setTimeout(async () => {
      try {
        console.log('[INSTRUMENTATION] Checking and ensuring standard reference baseline (CoA CA-IN-01, tax, currencies)...');
        const { seedIndustryStandardBaseline } = await import('@/shared/kernel/db/standardSystemDefaults');
        await seedIndustryStandardBaseline();
        console.log('[INSTRUMENTATION] ✅ Industry standard baseline auto-seed completed successfully.');
      } catch (err: any) {
        console.warn('[INSTRUMENTATION] ⚠️ Standard baseline check warning (non-fatal):', err.message);
      }
    }, 1500);

    if (process.env.ENTERPRISE_MODE === 'true' || process.env.AUTO_START_JOB_WORKER === 'true' || process.env.MVP_NO_AUTH === 'false') {
      console.log('[INSTRUMENTATION] Enterprise mode detected - starting job worker in 5s');
      
      // Dynamic import to avoid issues in edge runtime
      setTimeout(async () => {
        try {
          const { startJobWorker } = await import('@/shared/kernel/enterprise/jobWorker');
          startJobWorker(10000); // Poll every 10s
          console.log('[INSTRUMENTATION] Job worker started - polling core_job_queue every 10s');
        } catch (e: any) {
          console.warn('[INSTRUMENTATION] Job worker start failed (DB not available in build):', e.message);
        }
      }, 5000);
    }

    // Log enterprise config
    console.log('[INSTRUMENTATION] Enterprise features:');
    console.log('  - Posting Period OB52 enforced via validatePostingPeriod()');
    console.log('  - Field Status OBC4/OBC5 via validateFieldStatus()');
    console.log('  - Tolerance OBA0/OBA4 via validateTolerance()');
    console.log('  - Credit Check OB45/OB38 via checkCreditLimit()');
    console.log('  - ATP + PI Blocking + Expiry BLOCK via checkATP()');
    console.log('  - Number Ranges FBN1 FOR UPDATE locking via getNextNumberForUpdate()');
    console.log('  - FAUC (legacy OBYC) Auto Account own IP table-driven');
    console.log('  - WORM Audit Logs via DB triggers prevent_audit_update()');
    console.log('  - Job Queue core_job_queue async for PAYROLL_RUN/COSTING_RUN/MRP_RUN');
    console.log('  - Exchange Rates TCURR core_exchange_rate + convertCurrency() for KWD/INR/USD/EUR');
    console.log('  - RBAC 12 roles 26 permissions + 500 employees hierarchical 10% app access');
  }
}
