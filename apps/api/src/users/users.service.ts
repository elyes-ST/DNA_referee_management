import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, FilterUsersDto } from './dto';
import { PaginatedResult } from '../common/dto';
import { Role } from '../common/enums';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Cet email existe déjà');
    }

    // Store the plain password before hashing (for email)
    const plainPassword = createUserDto.password;

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await createdUser.save();
    const user = await this.userModel
      .findById(saved._id)
      .select('-password')
      .exec();

    if (!user) {
      throw new Error('Failed to retrieve created user');
    }

    // Send welcome email with credentials (async, don't await to not block response)
    void this.sendWelcomeEmail(user, plainPassword);

    return user;
  }

  /**
   * Send welcome email to new user with their credentials
   */
  private async sendWelcomeEmail(user: User, password: string): Promise<void> {
    try {
      const result = await this.emailService.sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: password,
        role: user.role,
        loginUrl: process.env.FRONTEND_URL,
      });

      if (result.success) {
        this.logger.log(`Welcome email sent successfully to ${user.email}`);
      } else {
        this.logger.warn(
          `Failed to send welcome email to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${user.email}:`, error);
      // Don't throw - user creation should still succeed even if email fails
    }
  }

  async findAll(filterDto: FilterUsersDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, role, search, isActive } = filterDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role && role.length > 0) filter.role = { $in: Array.isArray(role) ? role : [role] };
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .select('-password')
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`L'utilisateur avec l'ID ${id} est introuvable`);
    }
    return user;
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.userModel.find({ role }).select('-password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // If email is being updated, check for conflicts
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new ConflictException('Cet email existe déjà');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`L'utilisateur avec l'ID ${id} est introuvable`);
    }

    return updatedUser;
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`L'utilisateur avec l'ID ${id} est introuvable`);
    }

    user.isActive = !user.isActive;
    await user.save();

    const updatedUser = await this.userModel
      .findById(id)
      .select('-password')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`L'utilisateur avec l'ID ${id} est introuvable`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`L'utilisateur avec l'ID ${id} est introuvable`);
    }
  }
}
