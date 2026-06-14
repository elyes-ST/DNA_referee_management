import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

export class FilterInspectorDto extends PaginationDto {
    /** Search by first name, last name, email, or matricule (case-insensitive) */
    @IsString()
    @IsOptional()
    search?: string;

    /** Filter by region */
    @IsString()
    @IsOptional()
    region?: string;

    /** Filter by specialization */
    @IsString()
    @IsOptional()
    specialization?: string;

    /** Filter by active/inactive status (from linked User) */
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;
}
