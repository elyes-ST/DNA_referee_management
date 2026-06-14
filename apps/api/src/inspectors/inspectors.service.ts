import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inspector, InspectorDocument } from './schemas/inspector.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateInspectorDto, UpdateInspectorDto, FilterInspectorDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums';
import { EmailService } from '../email/email.service';
import { PaginatedResult } from '../common/dto';

@Injectable()
export class InspectorsService {
  private readonly logger = new Logger(InspectorsService.name);

  constructor(
    @InjectModel(Inspector.name)
    private inspectorModel: Model<InspectorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) { }

  async create(createInspectorDto: CreateInspectorDto): Promise<Inspector> {
    const existingInspector = await this.inspectorModel.findOne({
      matricule: createInspectorDto.matricule,
    });
    if (existingInspector) {
      throw new ConflictException('Matricule already exists');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: createInspectorDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Cet email existe déjà');
    }

    // Create User account with INSPECTEUR role
    const hashedPassword = await bcrypt.hash(createInspectorDto.password, 10);
    const user = await this.userModel.create({
      email: createInspectorDto.email,
      password: hashedPassword,
      firstName: createInspectorDto.firstName,
      lastName: createInspectorDto.lastName,
      phoneNumber: createInspectorDto.phoneNumber,
      role: Role.INSPECTEUR,
      isActive: true,
    });

    // Create Inspector linked to the User
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      ...inspectorData
    } = createInspectorDto;
    const createdInspector = await this.inspectorModel.create({
      ...inspectorData,
      userId: user._id,
    });

    // Send welcome email with credentials (async, don't block)
    this.sendWelcomeEmail(
      createInspectorDto.email,
      createInspectorDto.firstName,
      createInspectorDto.lastName,
      createInspectorDto.password,
    );

    // Return inspector with populated user data
    return this.inspectorModel
      .findById(createdInspector._id)
      .populate('userId', '-password')
      .exec() as Promise<Inspector>;
  }

  /**
   * Send welcome email to new inspector with credentials
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
        role: Role.INSPECTEUR,
        loginUrl: process.env.FRONTEND_URL,
      });

      if (result.success) {
        this.logger.log(`Welcome email sent to inspector: ${email}`);
      } else {
        this.logger.warn(
          `Failed to send welcome email to ${email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
    }
  }

  async findAll(filterDto: FilterInspectorDto = {}): Promise<PaginatedResult<Inspector>> {
    const { page = 1, limit = 10, search, region, specialization, isActive } = filterDto;
    const skip = (page - 1) * limit;

    // Build inspector-level filter
    const inspectorFilter: any = {};
    if (region) inspectorFilter.region = { $regex: region, $options: 'i' };
    if (specialization) inspectorFilter.specialization = { $regex: specialization, $options: 'i' };

    // If searching by name/email/matricule, narrow down userIds first
    if (search || isActive !== undefined) {
      const userFilter: any = { role: Role.INSPECTEUR };
      if (isActive !== undefined) userFilter.isActive = isActive;
      if (search) {
        userFilter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      const matchingUsers = await this.userModel.find(userFilter).select('_id').exec();
      inspectorFilter.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    // Also search by matricule
    if (search) {
      const existingUserFilter = inspectorFilter.userId;
      const matriculeCondition = { matricule: { $regex: search, $options: 'i' } };
      if (existingUserFilter) {
        inspectorFilter.$or = [{ userId: existingUserFilter }, matriculeCondition];
        delete inspectorFilter.userId;
      } else {
        inspectorFilter.matricule = { $regex: search, $options: 'i' };
      }
    }

    const [data, total] = await Promise.all([
      this.inspectorModel
        .find(inspectorFilter)
        .populate('userId', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.inspectorModel.countDocuments(inspectorFilter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Inspector> {
    const inspector = await this.inspectorModel
      .findById(id)
      .populate('userId', '-password')
      .exec();
    if (!inspector) {
      throw new NotFoundException(`L'inspecteur avec l'ID ${id} est introuvable`);
    }
    return inspector;
  }

  async update(
    id: string,
    updateInspectorDto: UpdateInspectorDto,
  ): Promise<Inspector> {
    if (updateInspectorDto.matricule) {
      const existingInspector = await this.inspectorModel.findOne({
        matricule: updateInspectorDto.matricule,
        _id: { $ne: id },
      });
      if (existingInspector) {
        throw new ConflictException('Matricule already exists');
      }
    }

    const updatedInspector = await this.inspectorModel
      .findByIdAndUpdate(id, updateInspectorDto, { new: true })
      .populate('userId', '-password')
      .exec();

    if (!updatedInspector) {
      throw new NotFoundException(`L'inspecteur avec l'ID ${id} est introuvable`);
    }

    return updatedInspector;
  }

  async remove(id: string): Promise<void> {
    const result = await this.inspectorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`L'inspecteur avec l'ID ${id} est introuvable`);
    }
  }
}
