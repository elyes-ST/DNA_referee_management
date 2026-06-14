import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  DesignationCategory,
  DesignationStatus,
  RefereeRole,
  REQUIRED_REFEREE_ROLES,
} from '../../common/enums';

/**
 * Custom validator to check required referee roles
 * If hasVAR is true, also requires ARBITRE_VAR and ASSISTANT_VAR
 */
@ValidatorConstraint({ name: 'hasRequiredRoles', async: false })
export class HasRequiredRolesConstraint implements ValidatorConstraintInterface {
  validate(referees: RefereeDesignationDto[], args: ValidationArguments) {
    if (!referees || !Array.isArray(referees)) return false;

    const roles = referees.map((r) => r.role);
    const obj = args.object as CreateDesignationDto;

    // Check all required roles are present
    const hasRequiredRoles = REQUIRED_REFEREE_ROLES.every((role) =>
      roles.includes(role),
    );

    // If hasVAR is true, also check for VAR roles
    if (obj.hasVAR) {
      const hasVARRoles =
        roles.includes(RefereeRole.ARBITRE_VAR) &&
        roles.includes(RefereeRole.ASSISTANT_VAR);
      return hasRequiredRoles && hasVARRoles;
    }

    return hasRequiredRoles;
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as CreateDesignationDto;
    const roles =
      (args.value as RefereeDesignationDto[])?.map((r) => r.role) || [];

    const missingRoles = REQUIRED_REFEREE_ROLES.filter(
      (role) => !roles.includes(role),
    );

    if (obj.hasVAR) {
      if (!roles.includes(RefereeRole.ARBITRE_VAR)) {
        missingRoles.push(RefereeRole.ARBITRE_VAR);
      }
      if (!roles.includes(RefereeRole.ASSISTANT_VAR)) {
        missingRoles.push(RefereeRole.ASSISTANT_VAR);
      }
    }

    const baseMessage =
      'Rôles obligatoires manquants: ' + missingRoles.join(', ');
    const requirement = obj.hasVAR
      ? 'Une désignation avec VAR doit avoir: Arbitre Central, 1er Assistant, 2ème Assistant, 4ème Arbitre, Arbitre VAR, et Assistant VAR.'
      : 'Une désignation doit avoir: Arbitre Central, 1er Assistant, 2ème Assistant, et 4ème Arbitre.';

    return `${baseMessage}. ${requirement}`;
  }
}

export class RefereeDesignationDto {
  @IsNotEmpty()
  @IsString()
  refereeId: string;

  @IsNotEmpty()
  @IsEnum(RefereeRole, {
    message: `Role invalide. Valeurs possibles: ${Object.values(RefereeRole).join(', ')}`,
  })
  role: RefereeRole;
}

export class CreateDesignationDto {
  @IsNotEmpty()
  @IsString()
  matchId: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(4, {
    message:
      'Une désignation doit avoir au minimum 4 arbitres. Si VAR activée, 6 arbitres requis.',
  })
  @ValidateNested({ each: true })
  @Type(() => RefereeDesignationDto)
  @Validate(HasRequiredRolesConstraint)
  referees: RefereeDesignationDto[];

  @IsNotEmpty()
  @IsEnum(DesignationCategory)
  category: DesignationCategory;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  hasVAR?: boolean; // Indique si le match utilise la VAR
}

export class UpdateDesignationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefereeDesignationDto)
  referees?: RefereeDesignationDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FilterDesignationsDto {
  @IsOptional()
  @IsEnum(DesignationStatus)
  status?: DesignationStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    if (Array.isArray(value)) return value;
    return value.split(',').map((r: string) => r.trim());
  })
  @IsEnum(DesignationCategory, { each: true })
  category?: DesignationCategory[];

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  journee?: string;

  @IsOptional()
  @IsString()
  saison?: string;

  /** Pagination — optional; omitting returns all results */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class ValidateDesignationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectDesignationDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class BulkAssignDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDesignationDto)
  designations: CreateDesignationDto[];
}
