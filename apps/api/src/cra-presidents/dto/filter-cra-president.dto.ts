import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

export class FilterCRAPresidentDto extends PaginationDto {
    /** Search by first name, last name, or email (case-insensitive) */
    @IsString()
    @IsOptional()
    search?: string;

    /** Filter by region */
    @IsString()
    @IsOptional()
    region?: string;

    /** Filter by active/inactive status (from linked User) */
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;
}
