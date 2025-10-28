import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateModerationActionDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsEnum(['post', 'comment'])
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsEnum(['approve', 'reject', 'flag'])
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsOptional()
  moderatorId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}


