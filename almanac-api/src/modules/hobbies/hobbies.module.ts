import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HobbiesController } from './hobbies.controller';
import { HobbiesService } from './hobbies.service';
import { Hobby } from './hobby.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hobby])],
  controllers: [HobbiesController],
  providers: [HobbiesService],
})
export class HobbiesModule {}
