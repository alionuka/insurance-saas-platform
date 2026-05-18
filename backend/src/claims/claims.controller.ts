import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';

@ApiTags('Claims')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({ summary: 'List all claims' })
  @ApiResponse({ status: 200, description: 'Claims listed successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationDto) {
    return this.claimsService.findAll(user, {
      limit: pagination.limit ?? 50,
      offset: pagination.offset ?? 0,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({ summary: 'Get claim details' })
  @ApiResponse({
    status: 200,
    description: 'Claim details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimsService.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new claim' })
  @ApiResponse({ status: 201, description: 'Claim successfully created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer role only' })
  create(
    @Body() createClaimDto: CreateClaimDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimsService.create(createClaimDto, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update claim status' })
  @ApiResponse({
    status: 200,
    description: 'Claim status successfully updated',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — admin/agent/company admin roles only',
  })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateClaimStatusDto: UpdateClaimStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimsService.updateStatus(
      id,
      updateClaimStatusDto.status,
      user,
    );
  }

  @Post(':id/documents')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  ) // 10MB
  @ApiOperation({ summary: 'Upload claim document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimsService.uploadDocument(id, file, user);
  }

  @Get(':id/documents')
  @Roles(
    UserRole.CUSTOMER,
    UserRole.AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({ summary: 'List claim documents' })
  @ApiResponse({
    status: 200,
    description: 'Claim documents listed successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  listDocuments(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimsService.listDocuments(id, user);
  }

  @Delete(':id/documents/:docId')
  @Roles(UserRole.CUSTOMER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Delete claim document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — customer or platform admin role only',
  })
  @ApiResponse({ status: 404, description: 'Claim or document not found' })
  deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimsService.deleteDocument(id, docId, user);
  }
}
