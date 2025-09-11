import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hobby } from './hobby.entity';
import { CreateHobbyDto } from './dto/create-hobby.dto';
import { UpdateHobbyDto } from './dto/update-hobby.dto';

@Injectable()
export class HobbiesService {
  constructor(
    @InjectRepository(Hobby)
    private readonly repo: Repository<Hobby>,
  ) {}

  create(dto: CreateHobbyDto) {
    const hobby = this.repo.create(dto);
    return this.repo.save(hobby);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateHobbyDto) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
