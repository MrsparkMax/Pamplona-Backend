import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class OrdersService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createOrder(
    customer_id: number, 
    items: number[], 
    total_amount: number, 
    payment_method: string = 'Cash on Delivery',
    address: string = ''
  ) {
    // Set default values for optional foreign keys if your DB table requires them
    const restaurant_id = 1; // Default or mock restaurant ID
    const order_status = 'PENDING';

    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO orders (customer_id, restaurant_id, order_status, total_amount, payment_method, address) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, restaurant_id, order_status, total_amount, payment_method, address]
    );

    return { 
      order_id: result.insertId, 
      customer_id, 
      restaurant_id, 
      order_status, 
      total_amount, 
      payment_method,
      address,
      items 
    };
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM orders WHERE order_id = ?',
      [id]
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT * FROM orders'
    );
    return rows;
  }

  async updateOrder(id: number, partial: { order_status?: string; total_amount?: number; driver_id?: number; payment_method?: string; address?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.order_status) {
      fields.push('order_status = ?');
      values.push(partial.order_status);
    }
    if (partial.total_amount !== undefined) {
      fields.push('total_amount = ?');
      values.push(partial.total_amount);
    }
    if (partial.driver_id !== undefined) {
      fields.push('driver_id = ?');
      values.push(partial.driver_id);
    }
    if (partial.payment_method !== undefined) {
      fields.push('payment_method = ?');
      values.push(partial.payment_method);
    }
    if (partial.address !== undefined) {
      fields.push('address = ?');
      values.push(partial.address);
    }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`;
    await this.pool().execute(sql, values);

    return this.findById(id);
  }

  async deleteUser(id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return res.affectedRows > 0;
  }
}