import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MatchPayment,
  MatchPaymentDocument,
} from './schemas/match-payment.schema';

@Injectable()
export class MatchPaymentsService {
  constructor(
    @InjectModel(MatchPayment.name)
    private matchPaymentModel: Model<MatchPaymentDocument>,
  ) { }

  async findByMatch(matchId: string): Promise<MatchPayment[]> {
    return this.matchPaymentModel
      .find({ matchId: new Types.ObjectId(matchId) })
      .populate('refereeId', '-password')
      .exec();
  }

  async findByReferee(refereeId: string): Promise<MatchPayment[]> {
    return this.matchPaymentModel
      .find({ refereeId: new Types.ObjectId(refereeId) })
      .populate('matchId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
