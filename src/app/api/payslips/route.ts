import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PayslipInput {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  month: string;
  year?: string;
  generationDate: string;
  basicSalary?: number;
  hra?: number;
  specialAllowance?: number;
  daAllowance?: number;
  taAllowance?: number;
  foodAllowance?: number;
  grossSalary: number;
  pfDeduction?: number;
  taxDeduction?: number;
  unpaidLeaveDeduction?: number;
  profTaxDeduction?: number;
  netPay: number;
  breakdown?: any;
  status?: string;
}

// GET /api/payslips
export async function GET() {
  try {
    const rawPayslips = await prisma.payslip.findMany({ orderBy: { generationDate: 'desc' } });
    const payslips = rawPayslips.map((p) => {
      let breakdown: any = undefined;
      try {
        if (p.breakdownJson && p.breakdownJson !== '{}') {
          breakdown = JSON.parse(p.breakdownJson);
        }
      } catch {
        breakdown = undefined;
      }
      return {
        ...p,
        breakdown,
      };
    });
    return NextResponse.json({ payslips });
  } catch (error) {
    console.error('GET /api/payslips error:', error);
    return NextResponse.json({ error: 'Failed to load payslips' }, { status: 500 });
  }
}

// POST /api/payslips — bulk create or replace payslips for selected criteria
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payslips: PayslipInput[] = body.payslips;

    for (const p of payslips) {
      const breakdownJson = p.breakdown ? JSON.stringify(p.breakdown) : '{}';

      await prisma.payslip.upsert({
        where: { id: p.id },
        update: {
          userName: p.userName,
          userRole: p.userRole,
          month: p.month,
          year: p.year || p.month.split(' ')[1] || '2026',
          generationDate: p.generationDate,
          basicSalary: p.basicSalary ?? 0,
          hra: p.hra ?? 0,
          specialAllowance: p.specialAllowance ?? 0,
          daAllowance: p.daAllowance ?? 0,
          taAllowance: p.taAllowance ?? 0,
          foodAllowance: p.foodAllowance ?? 0,
          grossSalary: p.grossSalary,
          pfDeduction: p.pfDeduction ?? 0,
          taxDeduction: p.taxDeduction ?? 0,
          unpaidLeaveDeduction: p.unpaidLeaveDeduction ?? 0,
          profTaxDeduction: p.profTaxDeduction ?? 0,
          netPay: p.netPay,
          breakdownJson,
          status: p.status ?? 'PAID',
        },
        create: {
          id: p.id,
          userId: p.userId,
          userName: p.userName,
          userRole: p.userRole,
          month: p.month,
          year: p.year || p.month.split(' ')[1] || '2026',
          generationDate: p.generationDate,
          basicSalary: p.basicSalary ?? 0,
          hra: p.hra ?? 0,
          specialAllowance: p.specialAllowance ?? 0,
          daAllowance: p.daAllowance ?? 0,
          taAllowance: p.taAllowance ?? 0,
          foodAllowance: p.foodAllowance ?? 0,
          grossSalary: p.grossSalary,
          pfDeduction: p.pfDeduction ?? 0,
          taxDeduction: p.taxDeduction ?? 0,
          unpaidLeaveDeduction: p.unpaidLeaveDeduction ?? 0,
          profTaxDeduction: p.profTaxDeduction ?? 0,
          netPay: p.netPay,
          breakdownJson,
          status: p.status ?? 'PAID',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/payslips error:', error);
    return NextResponse.json({ error: 'Failed to generate payslips' }, { status: 500 });
  }
}
