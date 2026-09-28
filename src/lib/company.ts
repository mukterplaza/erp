export const COMPANY_DB_IDS = {
  IBDC: 1,
  IREL: 2,
} as const;

export type CompanyCode = keyof typeof COMPANY_DB_IDS;

export function companyCodeToDbId(company: string | null | undefined): number {
  return company === 'IREL' ? COMPANY_DB_IDS.IREL : COMPANY_DB_IDS.IBDC;
}

export function companyDbIdToCode(companyId: number | null | undefined): CompanyCode {
  return companyId === COMPANY_DB_IDS.IREL ? 'IREL' : 'IBDC';
}