import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';

// Intentionally public: product catalog is browsed by anonymous visitors and customers.
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll({
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get('my-company')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  listMyCompany(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.productsService.listMyCompany(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user);
  }

  @Post(':id/quote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  quote(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.quote(id, user);
  }
}
