import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CRAPresident,
  CRAPresidentDocument,
} from './schemas/cra-president.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateCRAPresidentDto, UpdateCRAPresidentDto, FilterCRAPresidentDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums';
import { EmailService } from '../email/email.service';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class CraPresidentsService {
  private readonly logger = new Logger(CraPresidentsService.name);

  constructor(
    @InjectModel(CRAPresident.name)
    private craPresidentModel: Model<CRAPresidentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) { }

  async create(
    createCRAPresidentDto: CreateCRAPresidentDto,
  ): Promise<CRAPresident> {
    const existingPresident = await this.craPresidentModel.findOne({
      region: createCRAPresidentDto.region,
    });
    if (existingPresident) {
      throw new ConflictException('Un président existe déjà pour cette région');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: createCRAPresidentDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Cet email existe déjà');
    }

    // Create User account with CRA role (CRA President)
    const hashedPassword = await bcrypt.hash(
      createCRAPresidentDto.password,
      10,
    );
    const user = await this.userModel.create({
      email: createCRAPresidentDto.email,
      password: hashedPassword,
      firstName: createCRAPresidentDto.firstName,
      lastName: createCRAPresidentDto.lastName,
      phoneNumber: createCRAPresidentDto.phoneNumber,
      role: Role.CRA,
      isActive: true,
    });

    // Create CRA President linked to the User
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      ...presidentData
    } = createCRAPresidentDto;
    const createdPresident = await this.craPresidentModel.create({
      ...presidentData,
      userId: user._id,
    });

    // Send welcome email with credentials (async, don't block)
    this.sendWelcomeEmail(
      createCRAPresidentDto.email,
      createCRAPresidentDto.firstName,
      createCRAPresidentDto.lastName,
      createCRAPresidentDto.password,
    );

    // Return president with populated user data
    return this.craPresidentModel
      .findById(createdPresident._id)
      .populate('userId', '-password')
      .exec() as Promise<CRAPresident>;
  }

  /**
   * Send welcome email to new CRA president with credentials
   */
  private async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
  ): Promise<void> {
    try {
      const result = await this.emailService.sendWelcomeEmail({
        email,
        firstName,
        lastName,
        password,
        role: Role.CRA,
        loginUrl: process.env.FRONTEND_URL,
      });

      if (result.success) {
        this.logger.log(`Welcome email sent to CRA president: ${email}`);
      } else {
        this.logger.warn(
          `Failed to send welcome email to ${email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
    }
  }

  async findAll(filterDto: FilterCRAPresidentDto = {}): Promise<PaginatedResult<CRAPresident>> {
    const { page = 1, limit = 10, search, region, isActive } = filterDto;
    const skip = (page - 1) * limit;

    const presidentFilter: any = {};
    if (region) presidentFilter.region = { $regex: region, $options: 'i' };

    // Search by name/email on the linked User
    if (search || isActive !== undefined) {
      const userFilter: any = { role: Role.CRA };
      if (isActive !== undefined) userFilter.isActive = isActive;
      if (search) {
        userFilter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      const matchingUsers = await this.userModel.find(userFilter).select('_id').exec();
      presidentFilter.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    const [data, total] = await Promise.all([
      this.craPresidentModel
        .find(presidentFilter)
        .populate('userId', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.craPresidentModel.countDocuments(presidentFilter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CRAPresident> {
    const president = await this.craPresidentModel
      .findById(id)
      .populate('userId', '-password')
      .exec();
    if (!president) {
      throw new NotFoundException(`Le président CRA avec l'ID ${id} est introuvable`);
    }
    return president;
  }

  async findByRegion(region: string): Promise<CRAPresident> {
    const president = await this.craPresidentModel
      .findOne({ region })
      .populate('userId', '-password')
      .exec();
    if (!president) {
      throw new NotFoundException(
        `Le président CRA pour la région ${region} est introuvable`,
      );
    }
    return president;
  }

  async update(
    id: string,
    updateCRAPresidentDto: UpdateCRAPresidentDto,
  ): Promise<CRAPresident> {
    if (updateCRAPresidentDto.region) {
      const existingPresident = await this.craPresidentModel.findOne({
        region: updateCRAPresidentDto.region,
        _id: { $ne: id },
      });
      if (existingPresident) {
        throw new ConflictException(
          'Un président existe déjà pour cette région',
        );
      }
    }

    const updatedPresident = await this.craPresidentModel
      .findByIdAndUpdate(id, updateCRAPresidentDto, { new: true })
      .populate('userId', '-password')
      .exec();

    if (!updatedPresident) {
      throw new NotFoundException(`Le président CRA avec l'ID ${id} est introuvable`);
    }

    return updatedPresident;
  }

  async remove(id: string): Promise<void> {
    const result = await this.craPresidentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Le président CRA avec l'ID ${id} est introuvable`);
    }
  }
}
