import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';
import { UserRole } from '@prisma/client';

@ApiTags('Companies')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all companies (platform admin only)' })
  @ApiResponse({ status: 200, description: 'Companies listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  findAll(@Query() pagination: PaginationDto) {
    return this.companiesService.findAll({
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get('me')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: "Get the calling company-admin's own tenant (branding settings)",
  })
  @ApiResponse({ status: 200, description: 'Company returned' })
  @ApiResponse({ status: 403, description: 'No company on this account' })
  findMyCompany(@CurrentUser() user: AuthUser) {
    return this.companiesService.findMyCompany(user);
  }

  @Patch('me')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary:
      "Update the calling company-admin's tenant — name, description, primary color",
  })
  @ApiResponse({ status: 200, description: 'Company updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Tenant scope violation' })
  updateMyCompany(
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.companyId) {
      throw new Error('COMPANY_ADMIN without companyId');
    }
    return this.companiesService.updateCompany(user.companyId, dto, user);
  }

  @Post('me/logo')
  @Roles(UserRole.COMPANY_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a logo for the calling company-admin tenant',
  })
  @ApiResponse({ status: 201, description: 'Logo uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file (type/size)' })
  uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.companyId) {
      throw new Error('COMPANY_ADMIN without companyId');
    }
    return this.companiesService.uploadLogo(user.companyId, file, user);
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Get details of a single company (platform admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Company details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary:
      'Approve a company pending KYC verification (platform admin only)',
  })
  @ApiResponse({ status: 200, description: 'Company moved to ACTIVE state' })
  @ApiResponse({ status: 400, description: 'Company is not pending verification' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — platform admin only' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.companiesService.approve(id, user);
  }
}
