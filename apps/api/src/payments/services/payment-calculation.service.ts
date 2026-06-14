import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentRate,
  PaymentRateDocument,
} from '../schemas/payment-rate.schema';
import {
  MatchPayment,
  MatchPaymentDocument,
} from '../schemas/match-payment.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Match, MatchDocument } from '../../matches/schemas/match.schema';
import {
  Referee,
  RefereeDocument,
} from '../../referees/schemas/referee.schema';
import { RefereeRole, PaymentStatus, MatchStatus } from '../../common/enums';

@Injectable()
export class PaymentCalculationService {
  constructor(
    @InjectModel(PaymentRate.name)
    private paymentRateModel: Model<PaymentRateDocument>,
    @InjectModel(MatchPayment.name)
    private matchPaymentModel: Model<MatchPaymentDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
  ) { }

  /**
   * Look up the tariff for a given match + referee + role.
   * Returns 0 if no active rate is found (no error thrown).
   */
  async calculateMatchPayment(
    matchId: string,
    refereeId: string,
    role: RefereeRole,
  ): Promise<{ amount: number; rateFound: boolean }> {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${matchId} est introuvable`);
    }

    const referee = await this.refereeModel.findById(refereeId);
    if (!referee) {
      throw new NotFoundException(`L'arbitre avec l'ID ${refereeId} est introuvable`);
    }

    const rate = await this.paymentRateModel
      .findOne({
        category: referee.category,
        competition: match.competition,
        role,
        saison: match.saison,
        effectiveFrom: { $lte: match.date },
        $or: [{ effectiveTo: { $gte: match.date } }, { effectiveTo: null }],
      })
      .exec();

    return { amount: rate ? rate.amount : 0, rateFound: !!rate };
  }

  /**
   * Calculate the total amount of validated MatchPayments for a referee
   * within a date range. Filtering is done in MongoDB for efficiency.
   */
  async calculateRangeTotal(
    refereeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.matchPaymentModel.aggregate([
      {
        $match: {
          refereeId: new Types.ObjectId(refereeId),
          status: PaymentStatus.VALIDATED,
        },
      },
      {
        $lookup: {
          from: 'matches',
          localField: 'matchId',
          foreignField: '_id',
          as: 'match',
        },
      },
      { $unwind: '$match' },
      {
        $match: {
          'match.date': { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async applyBonus(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    payment.bonuses = (payment.bonuses || 0) + amount;
    payment.totalAmount =
      payment.baseAmount + payment.bonuses - payment.deductions;
    payment.notes = payment.notes
      ? `${payment.notes}\nBonus: ${amount} - ${reason}`
      : `Bonus: ${amount} - ${reason}`;

    return payment.save();
  }

  async applyDeduction(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    payment.deductions = (payment.deductions || 0) + amount;
    payment.totalAmount =
      payment.baseAmount + payment.bonuses - payment.deductions;
    payment.notes = payment.notes
      ? `${payment.notes}\nDeduction: ${amount} - ${reason}`
      : `Deduction: ${amount} - ${reason}`;

    return payment.save();
  }

  /**
   * Auto-generate MatchPayment records for all COMPLETED matches in [startDate, endDate).
   * Skips matches that already have a MatchPayment for the given referee.
   * Returns: { created, warnings } where warnings list designations with no matching rate.
   */
  async autoCalculateMatchPayments(
    startDate: Date,
    endDate: Date,
  ): Promise<{ created: number; warnings: string[] }> {
    const matches = await this.matchModel
      .find({
        status: MatchStatus.COMPLETED,
        date: { $gte: startDate, $lt: endDate },
      })
      .exec();

    let created = 0;
    const warnings: string[] = [];

    for (const match of matches) {
      if (!match.designations) continue;

      for (const designation of match.designations) {
        const existingPayment = await this.matchPaymentModel.findOne({
          matchId: match._id,
          refereeId: designation.refereeId,
        });

        if (existingPayment) continue;

        const { amount: baseAmount, rateFound } =
          await this.calculateMatchPayment(
            match._id.toString(),
            designation.refereeId.toString(),
            designation.role,
          );

        if (!rateFound) {
          warnings.push(
            `No rate found for match ${match._id} referee ${designation.refereeId} role ${designation.role} — baseAmount set to 0`,
          );
        }

        await this.matchPaymentModel.create({
          matchId: match._id,
          refereeId: designation.refereeId,
          role: designation.role,
          baseAmount,
          totalAmount: baseAmount,
          status: PaymentStatus.PENDING,
        });

        created++;
      }
    }

    return { created, warnings };
  }
}
