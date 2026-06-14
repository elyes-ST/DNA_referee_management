import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Referee, RefereeDocument } from './schemas/referee.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CreateRefereeDto,
  UpdateRefereeDto,
  FilterRefereesDto,
  UpdateMyRefereeProfileDto,
} from './dto';
import { PaginatedResult } from '../common/dto';
import { ExcelService, ImportResult } from '../common/services';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { getAllowedCategoriesForRole } from '../common/helpers';

@Injectable()
export class RefereesService {
  private readonly logger = new Logger(RefereesService.name);

  constructor(
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private excelService: ExcelService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) { }

  async create(createRefereeDto: CreateRefereeDto, userRole?: string): Promise<Referee> {
    // Enforce category scope — same guard used by update()/remove() so a
    // restricted admin cannot create a referee outside their allowed categories.
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(createRefereeDto.category)) {
      throw new ForbiddenException(
        `Vous n'êtes pas autorisé à créer un arbitre pour la catégorie ${createRefereeDto.category}`,
      );
    }

    // Check if matricule already exists
    const existingReferee = await this.refereeModel.findOne({
      matricule: createRefereeDto.matricule,
    });
    if (existingReferee) {
      throw new ConflictException('Ce matricule existe déjà');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: createRefereeDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create User account with ARBITRE role
    const hashedPassword = await bcrypt.hash(createRefereeDto.password, 10);
    const user = await this.userModel.create({
      email: createRefereeDto.email,
      password: hashedPassword,
      firstName: createRefereeDto.firstName,
      lastName: createRefereeDto.lastName,
      phoneNumber: createRefereeDto.phoneNumber,
      role: Role.ARBITRE,
      isActive: true,
    });

    // Create Referee linked to the User
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      ...refereeData
    } = createRefereeDto;
    const createdReferee = await this.refereeModel.create({
      ...refereeData,
      userId: user._id,
    });

    // Send welcome email with credentials (async, don't block)
    this.sendWelcomeEmail(
      createRefereeDto.email,
      createRefereeDto.firstName,
      createRefereeDto.lastName,
      createRefereeDto.password, // Plain password before hashing
    );

    // Return referee with populated user data
    return this.refereeModel
      .findById(createdReferee._id)
      .populate('userId', '-password')
      .exec() as Promise<Referee>;
  }

  /**
   * Send welcome email to new referee with credentials
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
        role: Role.ARBITRE,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
      });

      if (result.success) {
        this.logger.log(`Welcome email sent to referee: ${email}`);
      } else {
        this.logger.warn(
          `Failed to send welcome email to ${email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
    }
  }

  async findAll(
    filterDto: FilterRefereesDto,
    userRole?: string,
  ): Promise<PaginatedResult<Referee>> {
    const {
      page = 1,
      limit = 10,
      category,
      league,
      region,
      isAvailable,
      isVARCertified,
      isActive,
      search,
      maxAge,
      minAge,
    } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (league) filter.league = league;
    if (region) filter.region = region;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (isVARCertified !== undefined) filter.isVARCertified = isVARCertified;

    if (maxAge !== undefined || minAge !== undefined) {
      filter.dateOfBirth = {};
      const today = new Date();
      if (maxAge !== undefined) {
        const minBirthDate = new Date();
        minBirthDate.setFullYear(today.getFullYear() - maxAge - 1);
        filter.dateOfBirth.$gt = minBirthDate;
      }
      if (minAge !== undefined) {
        const maxBirthDate = new Date();
        maxBirthDate.setFullYear(today.getFullYear() - minAge);
        filter.dateOfBirth.$lte = maxBirthDate;
      }
    }

    if (search || isActive !== undefined) {
      const userFilter: any = { role: Role.ARBITRE };
      if (isActive !== undefined) userFilter.isActive = isActive;
      if (search) {
        userFilter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const matchingUsers = await this.userModel
        .find(userFilter)
        .select('_id')
        .exec();

      const userIds = matchingUsers.map((u) => u._id);

      // Combine user match with direct matricule match via $or
      if (search) {
        filter.$or = [
          { userId: { $in: userIds } },
          { matricule: { $regex: search, $options: 'i' } },
        ];
      } else {
        filter.userId = { $in: userIds };
      }
    }

    // Category may be a single value or a list (e.g. C1,C2). Intersect any
    // requested categories with the role's allowed scope so RBAC is preserved.
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    const requestedCategories = category
      ? Array.isArray(category)
        ? category
        : [category]
      : null;
    if (requestedCategories && requestedCategories.length > 0) {
      filter.category = {
        $in: allowedCategories
          ? requestedCategories.filter((c) => allowedCategories.includes(c))
          : requestedCategories,
      };
    } else if (allowedCategories) {
      filter.category = { $in: allowedCategories };
    }

    const [data, total] = await Promise.all([
      this.refereeModel
        .find(filter)
        .populate('userId', '-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.refereeModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userRole?: string): Promise<Referee> {
    const referee = await this.refereeModel
      .findById(id)
      .populate('userId', '-password')
      .exec();
    if (!referee) {
      throw new NotFoundException(`L'arbitre avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(referee.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à accéder à cet arbitre");
    }

    return referee;
  }

  async findByUserId(userId: string): Promise<Referee> {
    const referee = await this.refereeModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', '-password')
      .exec();
    if (!referee) {
      throw new NotFoundException(`Referee profile not found for this user`);
    }
    return referee;
  }

  async updateMyProfile(
    userId: string,
    updateDto: UpdateMyRefereeProfileDto,
  ): Promise<Referee> {
    const referee = await this.refereeModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!referee) {
      throw new NotFoundException(`Referee profile not found for this user`);
    }

    // Update allowed fields only
    if (updateDto.address !== undefined) referee.address = updateDto.address;
    if (updateDto.emergencyContact !== undefined) {
      // Merge with existing emergency contact
      referee.emergencyContact = {
        name:
          updateDto.emergencyContact.name ??
          referee.emergencyContact?.name ??
          '',
        phone:
          updateDto.emergencyContact.phone ??
          referee.emergencyContact?.phone ??
          '',
      };
    }
    if (updateDto.notes !== undefined) referee.notes = updateDto.notes;

    await referee.save();

    return this.refereeModel
      .findById(referee._id)
      .populate('userId', '-password')
      .exec() as Promise<Referee>;
  }

  async findByCategory(category: string): Promise<Referee[]> {
    return this.refereeModel
      .find({ category })
      .populate('userId', '-password')
      .exec();
  }

  async update(
    id: string,
    updateRefereeDto: UpdateRefereeDto,
    userRole?: string,
  ): Promise<Referee> {
    // Get current referee to check for category change
    const refereeToUpdate = await this.refereeModel.findById(id).exec();
    if (!refereeToUpdate) {
      throw new NotFoundException(`Le profil arbitre avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(refereeToUpdate.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cet arbitre");
    }

    const oldCategory = refereeToUpdate.category;

    // If matricule is being updated, check for conflicts
    if (updateRefereeDto.matricule) {
      const existingReferee = await this.refereeModel.findOne({
        matricule: updateRefereeDto.matricule,
        _id: { $ne: id },
      });
      if (existingReferee) {
        throw new ConflictException('Ce matricule existe déjà');
      }
    }

    const updatedReferee = await this.refereeModel
      .findByIdAndUpdate(id, updateRefereeDto, { new: true })
      .populate('userId', '-password')
      .exec();

    if (!updatedReferee) {
      throw new NotFoundException(`L'arbitre avec l'ID ${id} est introuvable`);
    }

    // Notify referee if category changed
    if (
      updateRefereeDto.category &&
      updateRefereeDto.category !== oldCategory
    ) {
      this.notifyCategoryChange(
        updatedReferee,
        oldCategory,
        updateRefereeDto.category,
      ).catch((err) => {
        console.error('Error sending category change notification:', err);
      });
    }

    return updatedReferee;
  }

  /**
   * Notify referee about category change
   */
  private async notifyCategoryChange(
    referee: RefereeDocument,
    oldCategory: string,
    newCategory: string,
  ): Promise<void> {
    const userIdField = referee.userId as any;
    const userId = userIdField?._id?.toString() || userIdField?.toString();

    if (!userId) return;

    await this.notificationsService.notifyCategoryChange(userId, {
      oldCategory,
      newCategory,
    });
  }

  async remove(id: string, userRole?: string): Promise<void> {
    const refereeToDelete = await this.refereeModel.findById(id).exec();
    if (!refereeToDelete) {
      throw new NotFoundException(`Le profil arbitre avec l'ID ${id} est introuvable`);
    }

    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories && !allowedCategories.includes(refereeToDelete.category)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cet arbitre");
    }

    await this.refereeModel.findByIdAndDelete(id).exec();
  }

  async getStatistics(userRole?: string): Promise<any> {
    const matchFilter: any = {};
    const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
    if (allowedCategories) {
      matchFilter.category = { $in: allowedCategories };
    }

    const totalReferees = await this.refereeModel.countDocuments(matchFilter).exec();
    const availableReferees = await this.refereeModel
      .countDocuments({ ...matchFilter, isAvailable: true })
      .exec();

    const categoryCounts = await this.refereeModel.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const regionCounts = await this.refereeModel.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$region', count: { $sum: 1 } } },
    ]);

    return {
      total: totalReferees,
      available: availableReferees,
      byCategory: categoryCounts,
      byRegion: regionCounts,
    };
  }

  async importFromExcel(buffer: Buffer, userRole?: string): Promise<ImportResult> {
    const data = this.excelService.parseExcelFile(buffer);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const validation = this.excelService.validateRefereeData(row);

      if (!validation.isValid) {
        result.failed++;
        result.errors.push({
          row: i + 2, // Excel rows start at 1, and we have a header
          error: validation.errors.join(', '),
          data: row,
        });
        continue;
      }

      try {
        const rowCategory = row.category || 'A';
        const allowedCategories = userRole ? getAllowedCategoriesForRole(userRole) : null;
        if (allowedCategories && !allowedCategories.includes(rowCategory)) {
          throw new ForbiddenException(`Ligne ${i + 2}: Catégorie ${rowCategory} non autorisée`);
        }
        // Create user first
        const hashedPassword = await bcrypt.hash(
          row.password || 'default123',
          10,
        );
        const user = await this.userModel.create({
          email: row.email,
          password: hashedPassword,
          role: Role.ARBITRE,
          firstName: row.firstName,
          lastName: row.lastName,
          phoneNumber: row.phoneNumber,
        });

        // Create referee
        await this.refereeModel.create({
          userId: user._id,
          matricule: row.matricule,
          category: row.category,
          league: row.league,
          region: row.region,
          dateOfBirth: new Date(row.dateOfBirth),
          cin: row.cin,
          address: row.address,
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: error.message,
          data: row,
        });
      }
    }

    return result;
  }
}
