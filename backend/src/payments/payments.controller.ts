import {
  Controller,
  Post,
  Param,
  UseGuards,
  Headers,
  RawBody,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('policies/:id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('access_token')
  @ApiOperation({
    summary: 'Create Stripe checkout session for policy premium payment',
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session successfully created',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid auth token' })
  @ApiResponse({ status: 403, description: 'Forbidden — customer role only' })
  createCheckoutSession(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.createCheckoutSession(id, user);
  }

  @SkipThrottle()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe payments webhook endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid stripe signature' })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.paymentsService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
