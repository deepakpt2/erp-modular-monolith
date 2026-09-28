export function getMockCcaData() {
  const costCenters = [
    { id: 'cc-1', code: 'CC-KITCHEN-01', name: 'Main Kitchen' },
    { id: 'cc-2', code: 'CC-COLD-01', name: 'Cold Storage' },
    { id: 'cc-3', code: 'CC-SALES-01', name: 'Sales / Shop Floor' },
    { id: 'cc-4', code: 'CC-ADMIN-01', name: 'Administration' },
    { id: 'cc-5', code: 'CC-PURCH-01', name: 'Purchasing' },
  ];

  const glAccounts = [
    { id: 'gl-1', number: '300000', name: 'COGS - Food', type: 'EXPENSE', source: 'COGS' as const },
    { id: 'gl-2', number: '500000', name: 'Salary Expense', type: 'EXPENSE', source: 'PAYROLL' as const },
    { id: 'gl-3', number: '500001', name: 'Freight Expense', type: 'EXPENSE', source: 'DIRECT_FI' as const },
    { id: 'gl-4', number: '500002', name: 'Customs Expense', type: 'EXPENSE', source: 'DIRECT_FI' as const },
    { id: 'gl-5', number: '500003', name: 'Utility - Electricity', type: 'EXPENSE', source: 'AP_INVOICE' as const },
    { id: 'gl-6', number: '500004', name: 'Utility - Water', type: 'EXPENSE', source: 'AP_INVOICE' as const },
  ];

  const hierarchical = costCenters.map(cc => {
    const ccGlAccounts = glAccounts.map(gl => {
      const baseAmount = cc.code === 'CC-KITCHEN-01' ? 1500 : cc.code === 'CC-SALES-01' ? 800 : 300;
      const variance = Math.random() * 500;
      const amount = baseAmount + variance + (gl.source === 'PAYROLL' ? 900 : 0);
      
      return {
        glAccountId: gl.id,
        glAccountNumber: gl.number,
        glAccountName: gl.name,
        source: gl.source,
        amount,
        count: Math.floor(Math.random() * 20 + 5),
        details: [] as any[],
      };
    });

    return {
      costCenterId: cc.id,
      costCenterCode: cc.code,
      costCenterName: cc.name,
      totalAmount: ccGlAccounts.reduce((sum, g) => sum + g.amount, 0),
      transactionCount: ccGlAccounts.reduce((sum, g) => sum + g.count, 0),
      glAccounts: ccGlAccounts,
    };
  });

  const summary = {
    totalCostCenters: hierarchical.length,
    totalAmount: hierarchical.reduce((sum, cc) => sum + cc.totalAmount, 0),
    totalTransactions: hierarchical.reduce((sum, cc) => sum + cc.transactionCount, 0),
    bySource: {
      COGS: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'COGS').reduce((s, g) => s + g.amount, 0), 0),
      PAYROLL: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'PAYROLL').reduce((s, g) => s + g.amount, 0), 0),
      DIRECT_FI: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'DIRECT_FI').reduce((s, g) => s + g.amount, 0), 0),
      AP_INVOICE: hierarchical.reduce((sum, cc) => sum + cc.glAccounts.filter(g => g.source === 'AP_INVOICE').reduce((s, g) => s + g.amount, 0), 0),
    },
    period: { year: 2026, month: 9 },
  };

  return { hierarchical, summary };
}
