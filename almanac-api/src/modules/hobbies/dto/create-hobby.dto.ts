import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHobbyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  category: string;

  @IsString()
  @IsOptional()
  description?: string;
}
