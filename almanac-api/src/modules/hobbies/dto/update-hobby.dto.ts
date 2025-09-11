import { PartialType } from '@nestjs/mapped-types';
import { CreateHobbyDto } from './create-hobby.dto';


export class UpdateHobbyDto extends PartialType(CreateHobbyDto) {}
