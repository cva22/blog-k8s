import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModerationActionDto {
  @ApiProperty({
    description: 'ID of the content being moderated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({
    description: 'Type of content being moderated',
    enum: ['post', 'comment'],
    example: 'post',
  })
  @IsString()
  @IsEnum(['post', 'comment'])
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Moderation action to take',
    enum: ['approve', 'reject', 'flag'],
    example: 'approve',
  })
  @IsString()
  @IsEnum(['approve', 'reject', 'flag'])
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'ID of the moderator (optional, defaults to system)',
    example: 'moderator-uuid',
    required: false,
  })
  @IsString()
  @IsOptional()
  moderatorId?: string;

  @ApiProperty({
    description: 'Reason for the moderation action',
    example: 'Content meets community guidelines',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}


