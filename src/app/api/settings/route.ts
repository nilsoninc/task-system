import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'global-settings' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    let payslipConfig = undefined;
    try {
      if (settings.payslipConfigJson) {
        payslipConfig = JSON.parse(settings.payslipConfigJson);
      }
    } catch {
      payslipConfig = undefined;
    }

    const formattedSettings = {
      morningPunchInThreshold: settings.morningPunchInThreshold,
      minDailyWorkingHours: settings.minDailyWorkingHours || '08:00',
      lateArrivalFlagLimit: settings.lateArrivalFlagLimit ?? 3,
      currencySymbol: settings.currencySymbol,
      currencyCode: settings.currencyCode,
      smtpConfig: JSON.parse(settings.smtpJson),
      companyInfo: JSON.parse(settings.companyInfoJson),
      themeConfig: JSON.parse(settings.themeConfigJson),
      payslipConfig: payslipConfig,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      maxConsecutiveLeaveGroup: settings.maxConsecutiveLeaveGroup,
      sandwichRule: JSON.parse(settings.sandwichRuleJson),
      probationPaidLeaveEligibilityMonths: settings.probationPaidLeaveEligibilityMonths,
      minNoticeDaysRequired: settings.minNoticeDaysRequired,
    };

    return NextResponse.json({ settings: formattedSettings });
  } catch (error: unknown) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updated = await prisma.systemSettings.upsert({
      where: { id: 'global-settings' },
      update: {
        morningPunchInThreshold: body.morningPunchInThreshold,
        minDailyWorkingHours: body.minDailyWorkingHours ?? '08:00',
        lateArrivalFlagLimit: Number(body.lateArrivalFlagLimit ?? 3),
        currencySymbol: body.currencySymbol ?? '₹',
        currencyCode: body.currencyCode ?? 'INR',
        smtpJson: JSON.stringify(body.smtpConfig),
        companyInfoJson: JSON.stringify(body.companyInfo),
        themeConfigJson: JSON.stringify(body.themeConfig),
        payslipConfigJson: body.payslipConfig ? JSON.stringify(body.payslipConfig) : '{}',
        dateFormat: body.dateFormat,
        timeFormat: body.timeFormat,
        maxConsecutiveLeaveGroup: body.maxConsecutiveLeaveGroup,
        sandwichRuleJson: JSON.stringify(body.sandwichRule),
        probationPaidLeaveEligibilityMonths: body.probationPaidLeaveEligibilityMonths,
        minNoticeDaysRequired: body.minNoticeDaysRequired,
      },
      create: {
        id: 'global-settings',
        morningPunchInThreshold: body.morningPunchInThreshold,
        minDailyWorkingHours: body.minDailyWorkingHours ?? '08:00',
        lateArrivalFlagLimit: Number(body.lateArrivalFlagLimit ?? 3),
        currencySymbol: body.currencySymbol ?? '₹',
        currencyCode: body.currencyCode ?? 'INR',
        smtpJson: JSON.stringify(body.smtpConfig),
        companyInfoJson: JSON.stringify(body.companyInfo),
        themeConfigJson: JSON.stringify(body.themeConfig),
        payslipConfigJson: body.payslipConfig ? JSON.stringify(body.payslipConfig) : '{}',
        dateFormat: body.dateFormat,
        timeFormat: body.timeFormat,
        maxConsecutiveLeaveGroup: body.maxConsecutiveLeaveGroup,
        sandwichRuleJson: JSON.stringify(body.sandwichRule),
        probationPaidLeaveEligibilityMonths: body.probationPaidLeaveEligibilityMonths,
        minNoticeDaysRequired: body.minNoticeDaysRequired,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: unknown) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
