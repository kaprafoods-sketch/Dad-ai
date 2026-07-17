import { BadRequestException, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { normalizeRazorpayEvent, verifyRazorpaySignature, PLAN_FEATURES } from '@dad-ai/billing';
import { Ctx, type RequestContext } from '../../core/context';
import { Public } from '../../core/public.decorator';
import { PrismaService } from '../../core/prisma.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  /** What the current tenant's plan unlocks — the frontend mirrors gating. */
  @Get('features')
  features(@Ctx() ctx: RequestContext) {
    return { plan: ctx.plan, features: PLAN_FEATURES[ctx.plan] };
  }

  /**
   * Razorpay webhook (docs/architecture.md §13). Verifies the signature over
   * the RAW body, then updates the matching Subscription. Public route —
   * authenticated by signature, not JWT.
   */
  @Public()
  @Post('webhooks/razorpay')
  async razorpayWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string | undefined,
  ) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const raw = req.rawBody?.toString('utf8');
    if (!secret || !signature || !raw) {
      throw new BadRequestException('Missing signature, secret, or raw body');
    }
    if (!verifyRazorpaySignature(raw, signature, secret)) {
      throw new BadRequestException('Invalid signature');
    }

    const event = normalizeRazorpayEvent(JSON.parse(raw));
    if (!event) return { ignored: true };

    // Match by provider subscription id (set when the subscription was created).
    const subscription = await this.prisma.client.subscription.findFirst({
      where: { providerId: event.providerId },
    });
    if (subscription) {
      await this.prisma.client.subscription.update({
        where: { id: subscription.id },
        data: { status: event.status },
      });
    }
    return { received: true, type: event.type };
  }
}
