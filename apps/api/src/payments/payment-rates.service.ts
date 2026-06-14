import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaymentRate,
  PaymentRateDocument,
} from './schemas/payment-rate.schema';
import {
  CreatePaymentRateDto,
  UpdatePaymentRateDto,
  FilterPaymentRatesDto,
  CalculatePaymentDto,
} from './dto/payment-rate.dto';
import { Match, MatchDocument } from '../matches/schemas/match.schema';

@Injectable()
export class PaymentRatesService {
  constructor(
    @InjectModel(PaymentRate.name)
    private paymentRateModel: Model<PaymentRateDocument>,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async create(
    createDto: CreatePaymentRateDto,
    userId: string,
  ): Promise<PaymentRate> {
    const existing = await this.paymentRateModel.findOne({
      category: createDto.category,
      competition: createDto.competition,
      role: createDto.role,
      saison: createDto.saison,
      effectiveTo: null,
    });

    if (existing) {
      throw new ConflictException(
        'An active rate already exists for this category/competition/role combination',
      );
    }

    return this.paymentRateModel.create({
      ...createDto,
      effectiveFrom: new Date(createDto.effectiveFrom),
      effectiveTo: createDto.effectiveTo
        ? new Date(createDto.effectiveTo)
        : undefined,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findAll(filterDto: FilterPaymentRatesDto): Promise<{
    rates: PaymentRate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, category, competition, saison } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (category) filter.category = category;
    if (competition) filter.competition = competition;
    if (saison) filter.saison = saison;

    const [rates, total] = await Promise.all([
      this.paymentRateModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'nom prenom')
        .sort({ createdAt: -1 })
        .exec(),
      this.paymentRateModel.countDocuments(filter),
    ]);

    return { rates, total, page, limit };
  }

  async findOne(id: string): Promise<PaymentRate> {
    const rate = await this.paymentRateModel
      .findById(id)
      .populate('createdBy', '-password')
      .exec();

    if (!rate) {
      throw new NotFoundException(`Payment rate with ID ${id} not found`);
    }

    return rate;
  }

  async findActive(): Promise<PaymentRate[]> {
    const now = new Date();
    return this.paymentRateModel
      .find({
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: { $gte: now } }, { effectiveTo: null }],
      })
      .sort({ category: 1, competition: 1, role: 1 })
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdatePaymentRateDto,
  ): Promise<PaymentRate> {
    const rate = await this.paymentRateModel.findById(id);
    if (!rate) {
      throw new NotFoundException(`Payment rate with ID ${id} not found`);
    }

    if (updateDto.amount !== undefined) {
      rate.amount = updateDto.amount;
    }
    if (updateDto.effectiveTo) {
      rate.effectiveTo = new Date(updateDto.effectiveTo);
    }

    return rate.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentRateModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Payment rate with ID ${id} not found`);
    }
  }

  async calculatePayment(dto: CalculatePaymentDto): Promise<number> {
    const match = await this.matchModel.findById(dto.matchId);
    if (!match) {
      throw new NotFoundException(`Le match avec l'ID ${dto.matchId} est introuvable`);
    }

    const rate = await this.paymentRateModel
      .findOne({
        category: dto.category,
        competition: match.competition,
        role: dto.role,
        saison: match.saison,
        effectiveFrom: { $lte: match.date },
        $or: [{ effectiveTo: { $gte: match.date } }, { effectiveTo: null }],
      })
      .exec();

    return rate ? rate.amount : 0;
  }
}
