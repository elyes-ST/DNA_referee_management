import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

@Injectable()
export class ExcelService {
  parseExcelFile(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
    return rows;
  }

  /**
   * Safely convert an Excel date value to a JS Date.
   * Handles: JS Date objects, Excel serial numbers (number), and date strings.
   */
  parseExcelDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      // Excel serial → JS Date (xlsx epoch is 1899-12-30)
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + value * 86400000);
    }
    if (typeof value === 'string' && value.trim()) {
      const d = new Date(value.trim());
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  validateRefereeData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.matricule) errors.push('Matricule is required');
    if (!data.category) errors.push('Category is required');
    if (!data.region) errors.push('Region is required');
    if (!data.cin) errors.push('CIN is required');
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.email) errors.push('Email is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateMatchData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.matchNumber) errors.push('Match number is required');
    if (!data.journee) errors.push('Journee is required');
    if (!data.saison) errors.push('Saison is required');
    if (!data.date) errors.push('Date is required');
    if (!data.homeTeam) errors.push('Home team is required');
    if (!data.awayTeam) errors.push('Away team is required');
    if (!data.competition) errors.push('Competition is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
