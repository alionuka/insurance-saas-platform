import { Controller, Get, Param } from '@nestjs/common';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async findAll() {
    return this.policiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }
}
