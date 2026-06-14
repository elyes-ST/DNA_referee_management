import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Role, RefereeCategory } from '../../common/enums';

@Injectable()
export class FinancialVisibilityService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  /**
   * Check if user has permission to validate payments
   * ADDON 2: Only A/B referees can validate A/B categories
   * Note: This checks by referee category in user's metadata, not role
   */
  checkValidationPermission(
    userRole: Role,
    userCategory: RefereeCategory,
    paymentCategory: RefereeCategory,
  ): boolean {
    // Admin DNA, Finance DNA, CRA can validate all
    if ([Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CRA].includes(userRole)) {
      return true;
    }

    // Arbitres can validate their own category
    if (userRole === Role.ARBITRE) {
      return userCategory === paymentCategory;
    }

    return false;
  }

  /**
   * Get payments across all categories
   * ADDON 2: Category-based access control
   */
  async getAllCategoriesPayments(
    userRole: Role,
    filters?: {
      refereeId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    },
  ): Promise<any> {
    // Build query
    const query: any = {};

    if (filters?.refereeId) {
      query.refereeId = filters.refereeId;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('refereeId', 'firstName lastName category')
      .populate('matchIds', 'homeTeam awayTeam matchDate competition')
      .sort({ createdAt: -1 })
      .exec();

    // Group by category for better visualization
    const grouped = {
      A: payments.filter((p) => p.category === RefereeCategory.A),
      B: payments.filter((p) => p.category === RefereeCategory.B),
      C: payments.filter((p) => p.category === RefereeCategory.C),
      totals: {
        A: payments
          .filter((p) => p.category === RefereeCategory.A)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        B: payments
          .filter((p) => p.category === RefereeCategory.B)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        C: payments
          .filter((p) => p.category === RefereeCategory.C)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        overall: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      },
    };

    return grouped;
  }

  /**
   * Get read-only view of category payment
   * ADDON 2: Cross-category visibility
   */
  async getReadOnlyCategory(
    category: RefereeCategory,
    userRole: Role,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<any> {
    const query: any = { category };

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('refereeId', 'firstName lastName category')
      .populate('matchIds', 'homeTeam awayTeam matchDate competition')
      .sort({ createdAt: -1 })
      .exec();

    return {
      category,
      isReadOnly: userRole === Role.ARBITRE,
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
      payments,
    };
  }

  /**
   * Generate cross-category financial report
   * ADDON 2: Comprehensive cross-category analytics
   */
  async generateCrossCategoryReport(
    userRole: Role,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      region?: string;
    },
  ): Promise<any> {
    if (![Role.ADMIN_DNA, Role.FINANCE_DNA, Role.CRA].includes(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions for cross-category reports',
      );
    }

    const query: any = {};

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    if (filters?.region) {
      query.region = filters.region;
    }

    const allPayments = await this.paymentModel
      .find(query)
      .populate('refereeId', 'firstName lastName category region')
      .populate('matchIds', 'homeTeam awayTeam matchDate competition')
      .exec();

    // Category breakdown
    const categoryBreakdown = {
      A: {
        count: allPayments.filter((p) => p.category === RefereeCategory.A)
          .length,
        total: allPayments
          .filter((p) => p.category === RefereeCategory.A)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        pending: allPayments.filter(
          (p) => p.category === RefereeCategory.A && p.status === 'PENDING',
        ).length,
        validated: allPayments.filter(
          (p) => p.category === RefereeCategory.A && p.status === 'VALIDATED',
        ).length,
      },
      B: {
        count: allPayments.filter((p) => p.category === RefereeCategory.B)
          .length,
        total: allPayments
          .filter((p) => p.category === RefereeCategory.B)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        pending: allPayments.filter(
          (p) => p.category === RefereeCategory.B && p.status === 'PENDING',
        ).length,
        validated: allPayments.filter(
          (p) => p.category === RefereeCategory.B && p.status === 'VALIDATED',
        ).length,
      },
      C: {
        count: allPayments.filter((p) => p.category === RefereeCategory.C)
          .length,
        total: allPayments
          .filter((p) => p.category === RefereeCategory.C)
          .reduce((sum, p) => sum + p.totalAmount, 0),
        pending: allPayments.filter(
          (p) => p.category === RefereeCategory.C && p.status === 'PENDING',
        ).length,
        validated: allPayments.filter(
          (p) => p.category === RefereeCategory.C && p.status === 'VALIDATED',
        ).length,
      },
    };

    return {
      period: {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
      region: filters?.region || 'ALL',
      categoryBreakdown,
      grandTotal: allPayments.reduce((sum, p) => sum + p.totalAmount, 0),
      totalPayments: allPayments.length,
      generatedAt: new Date(),
      generatedBy: userRole,
    };
  }
}
