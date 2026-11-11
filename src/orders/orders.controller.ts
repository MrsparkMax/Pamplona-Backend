import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.ordersService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.ordersService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: { user: { sub?: number; userId?: number } },
    @Body() body: { items: number[]; total: number; paymentMethod?: string }
  ) {
    // Extract customer/user ID safely from the JWT token payload (sub or userId)
    const customerId = req.user.sub ?? req.user.userId;
    if (customerId === undefined) {
      throw new BadRequestException('User ID is missing from the token');
    }

    return this.ordersService.createOrder(
      customerId,
      body.items,
      body.total,
      body.paymentMethod || 'Cash on Delivery'
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.updateOrder(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const service = this.ordersService as OrdersService & {
      deleteOrder?: (orderId: number) => Promise<unknown>;
    };

    if (typeof service.deleteOrder !== 'function') {
      throw new BadRequestException('Delete order is not implemented');
    }

    return service.deleteOrder(+id);
  }
}