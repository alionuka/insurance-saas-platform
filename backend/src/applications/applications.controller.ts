import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll() {
    return this.applicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Post()
  create(@Body() createApplicationDto: CreateApplicationDto) {
    if (!createApplicationDto.userId || !createApplicationDto.productId) {
      throw new BadRequestException('userId and productId are required');
    }
    return this.applicationsService.create(createApplicationDto);
  }

  // Note: This endpoint is temporary and will be replaced by auth-based user detection later.
  @Post('demo')
  createDemo(@Body('productId') productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    return this.applicationsService.createDemo(productId);
  }
}
