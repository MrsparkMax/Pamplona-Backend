import { BadRequestException, Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin/all-orders')
  async getAllOrders() {
    const [rows] = await (this.ordersService as any).pool().execute(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.customer_id = u.id ORDER BY o.created_at DESC'
    );
    return rows;
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@Req() req: { user: { sub?: number; userId?: number } }) {
    const customerId = req.user.sub ?? req.user.userId;
    if (customerId === undefined) {
      throw new BadRequestException('User ID is missing from the token');
    }

    const [rows] = await (this.ordersService as any).pool().execute(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
    return rows;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const [result] = await (this.ordersService as any).pool().execute(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [status, id]
    );
    return { success: true, affectedRows: (result as any).affectedRows };
  }

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
    @Body() body: { items: number[]; total: number; paymentMethod?: string; address?: string }
  ) {
    const customerId = req.user.sub ?? req.user.userId;
    if (customerId === undefined) {
      throw new BadRequestException('User ID is missing from the token');
    }

    return this.ordersService.createOrder(
      customerId,
      body.items,
      body.total,
      body.paymentMethod || 'Cash on Delivery',
      body.address || '' // <-- Ensures address is passed properly
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