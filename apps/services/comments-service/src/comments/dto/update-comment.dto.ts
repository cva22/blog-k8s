import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Updated comment content.',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;
}


