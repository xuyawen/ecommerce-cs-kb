import { Pool } from 'pg';

// 订单域三张表（orders / logistics / refunds）的幂等自愈 + 演示数据注入。
// 与项目既有约定一致：kb_documents 也是运行时 CREATE TABLE IF NOT EXISTS 自建，
// 不引入独立迁移系统。首次空库时 seed 少量演示订单，使订单/物流查询可直接验证。
export async function ensureOrderSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_no   VARCHAR(32) PRIMARY KEY,
      status     VARCHAR(32),
      amount     NUMERIC(10,2),
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logistics (
      id         SERIAL PRIMARY KEY,
      order_no   VARCHAR(32) REFERENCES orders(order_no) ON DELETE CASCADE,
      carrier    VARCHAR(64),
      tracking_no VARCHAR(64),
      status     VARCHAR(32),
      last_node  TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id         SERIAL PRIMARY KEY,
      order_no   VARCHAR(32),
      reason     TEXT,
      status     VARCHAR(32) DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  const { rows } = await pool.query<{ c: number }>(
    'SELECT count(*)::int AS c FROM orders',
  );
  if (rows[0]?.c === 0) {
    await pool.query(
      `INSERT INTO orders(order_no, status, amount) VALUES
         ('SO123', '运输中', 299.00),
         ('SO124', '已签收', 159.50),
         ('SO125', '待发货', 89.90)`,
    );
    await pool.query(
      `INSERT INTO logistics(order_no, carrier, tracking_no, status, last_node) VALUES
         ('SO123', '顺丰速运', 'SF1234567890123', '运输中', '【上海转运中心】快件已发车，下一站 杭州转运中心'),
         ('SO124', '中通快递', 'ZT9876543210',   '已签收', '【杭州市】快件已签收，签收人：本人')`,
    );
  }
}
