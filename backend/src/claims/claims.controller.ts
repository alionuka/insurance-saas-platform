import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { DemoClaimDto } from './dto/demo-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  findAll() {
    return this.claimsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Post()
  create(@Body() createClaimDto: CreateClaimDto) {
    if (!createClaimDto.userId || !createClaimDto.applicationId || !createClaimDto.amount || !createClaimDto.description) {
      throw new BadRequestException('userId, applicationId, amount, and description are required');
    }
    return this.claimsService.create(createClaimDto);
  }

  // Note: This endpoint is temporary and will be replaced by auth-based user detection later.
  @Post('demo')
  createDemo(@Body() demoClaimDto: DemoClaimDto) {
    if (!demoClaimDto.amount || !demoClaimDto.description) {
      throw new BadRequestException('amount and description are required');
    }
    return this.claimsService.createDemo(demoClaimDto);
  }
}
