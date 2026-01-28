import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

// SePay webhook payload structure
interface SePayWebhookPayload {
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  transferType: string;
  transferAmount: number;
  accumulated: number;
  code: string | null;
  content: string;
  referenceCode: string;
  body: string;
}

// Helper to create consistent responses
function response(message: string, status: number = 200) {
  return NextResponse.json({ success: status === 200, message }, { status });
}

// Extract order ID from transaction content
// Expected format: "GD {orderId}" or contains the order ID
function extractOrderId(content: string): string | null {
  if (!content) return null;
  
  // Try to match "GD {orderId}" pattern (case insensitive)
  const gdMatch = content.match(/GD\s*([a-zA-Z0-9]+)/i);
  if (gdMatch) return gdMatch[1];
  
  // Try to match cuid pattern (starts with c, followed by alphanumeric)
  const cuidMatch = content.match(/\b(c[a-z0-9]{20,})\b/i);
  if (cuidMatch) return cuidMatch[1];
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify API Key from SePay
    const apiKey = request.headers.get('Authorization');
    const expectedApiKey = process.env.SEPAY_API_KEY;
    
    if (!expectedApiKey) {
      console.error('SEPAY_API_KEY not configured');
      return response('Server configuration error', 500);
    }
    
    if (!apiKey || apiKey !== `Apikey ${expectedApiKey}`) {
      console.log('Invalid API key received');
      return response('Unauthorized', 401);
    }

    // 2. Parse webhook payload
    const payload: SePayWebhookPayload = await request.json();
    console.log('SePay webhook received:', JSON.stringify(payload, null, 2));

    // 3. Validate required fields
    if (!payload.content || !payload.transferAmount) {
      console.log('Missing required fields in payload');
      return response('Invalid payload', 400);
    }

    const transactionAmount = payload.transferAmount;

    // 4. Extract order ID from content
    const orderId = extractOrderId(payload.content);
    if (!orderId) {
      console.log('Could not extract order ID from content:', payload.content);
      // Still return 200 to acknowledge receipt (might be unrelated transaction)
      return response('Order ID not found in content', 200);
    }

    // 5. Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      console.log('Order not found:', orderId);
      return response('Order not found', 200);
    }

    // 6. Check if order is already paid
    if (order.paymentStatus === 'Paid') {
      console.log('Order already paid:', orderId);
      return response('Order already processed', 200);
    }

    // 7. CRITICAL SECURITY CHECK: Verify payment amount matches EXACTLY
    const orderTotal = Number(order.total);
    
    if (transactionAmount < orderTotal) {
      console.log('Payment insufficient. Required:', orderTotal, 'Received:', transactionAmount);
      return response('Amount mismatch', 400);
    }

    if (transactionAmount !== orderTotal) {
      console.log('Payment amount mismatch. Expected:', orderTotal, 'Received:', transactionAmount);
      // Log but don't process - amount must match exactly
      return response('Amount must match exactly', 400);
    }

    // 8. All validations passed - Process the payment
    // Calculate subscription end date (30 days from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: order.userId,
          gateway: payload.gateway,
          transactionDate: new Date(payload.transactionDate),
          accountNumber: payload.accountNumber,
          subAccount: payload.subAccount,
          amountIn: new Decimal(transactionAmount),
          amountOut: new Decimal(0),
          accumulated: new Decimal(payload.accumulated),
          code: payload.code,
          transactionContent: payload.content,
          referenceNumber: payload.referenceCode,
          body: payload.body
        }
      });

      // Update order status to Paid
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'Paid' }
      });

      // Update user subscription to PREMIUM
      await tx.user.update({
        where: { id: order.userId },
        data: {
          subscriptionStatus: 'PREMIUM',
          subscriptionEndDate
        }
      });
    });

    console.log(`SUCCESS: User ${order.userId} upgraded to PREMIUM via Webhook`);
    return response('Payment processed successfully', 200);

  } catch (error) {
    console.error('SePay webhook error:', error);
    return response('Internal server error', 500);
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET() {
  return response('SePay webhook endpoint is active', 200);
}
