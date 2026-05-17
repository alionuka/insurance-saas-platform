import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products in catalog (public)' })
  @ApiResponse({ status: 200, description: 'Products listed successfully' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll({
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get('my-company')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: "List products belonging to admin's company" })
  @ApiResponse({ status: 200, description: 'Products listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — company admin role only' })
  listMyCompany(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.productsService.listMyCompany(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single product (public)' })
  @ApiResponse({ status: 200, description: 'Product details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Create a new insurance product' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin roles only' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user);
  }

  @Post(':id/quote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Request instant premium quote' })
  @ApiResponse({ status: 201, description: 'Premium quote generated successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer role only' })
  quote(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.quote(id, user);
  }
}
