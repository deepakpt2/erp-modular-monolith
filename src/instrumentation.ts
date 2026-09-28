/**
 * Next.js Instrumentation - Startup hook for enterprise background workers
 * Starts job queue worker polling for PAYROLL_RUN, COSTING_RUN, MRP_RUN
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[INSTRUMENTATION] Node.js runtime - checking enterprise mode');

    if (process.env.ENTERPRISE_MODE === 'true' || process.env.AUTO_START_JOB_WORKER === 'true' || process.env.MVP_NO_AUTH === 'false') {
      console.log('[INSTRUMENTATION] Enterprise mode detected - starting job worker in 5s');
      
      // Dynamic import to avoid issues in edge runtime
      setTimeout(async () => {
        try {
          const { startJobWorker } = await import('@/shared/kernel/enterprise/jobWorker');
          startJobWorker(10000); // Poll every 10s
          console.log('[INSTRUMENTATION] Job worker started - polling ent_job_queue every 10s');
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
    console.log('  - OBYC Auto Account table-driven');
    console.log('  - WORM Audit Logs via DB triggers prevent_audit_update()');
    console.log('  - Job Queue ent_job_queue async for PAYROLL_RUN/COSTING_RUN/MRP_RUN');
    console.log('  - Exchange Rates TCURR ent_exchange_rate + convertCurrency() for KWD/INR/USD/EUR');
    console.log('  - RBAC 12 roles 26 permissions + 500 employees hierarchical 10% app access');
  }
}
