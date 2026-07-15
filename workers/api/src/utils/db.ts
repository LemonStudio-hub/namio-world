/**
 * 数据库查询工具
 * 封装常用的数据库操作
 */

import type { D1Database } from '@cloudflare/workers-types';

/**
 * 用户查询
 */
export const userQueries = {
  /**
   * 根据用户名查找用户
   */
  async findByUsername(db: D1Database, username: string) {
    return db.prepare(
      'SELECT * FROM users WHERE username = ? AND status != ?'
    ).bind(username, 'deleted').first();
  },

  /**
   * 根据 ID 查找用户
   */
  async findById(db: D1Database, id: number) {
    return db.prepare(
      'SELECT * FROM users WHERE id = ? AND status != ?'
    ).bind(id, 'deleted').first();
  },

  /**
   * 创建用户
   */
  async create(db: D1Database, data: {
    username: string;
    passwordHash: string;
  }) {
    const result = await db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(data.username, data.passwordHash).run();

    return result.meta?.last_row_id;
  },

  /**
   * 更新用户
   */
  async update(db: D1Database, id: number, data: Record<string, unknown>) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await db.prepare(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...values, id).run();
  },

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(db: D1Database, id: number) {
    await db.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();
  },
};

/**
 * 邮件查询
 */
export const mailQueries = {
  /**
   * 获取邮件列表
   */
  async getList(
    db: D1Database,
    userId: number,
    options: {
      page: number;
      limit: number;
      offset: number;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ) {
    const { page, limit, offset, status, search, sortBy = 'received_at', sortOrder = 'desc' } = options;

    // 构建 WHERE 子句
    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (status === 'unread') {
      conditions.push('is_read = 0');
    } else if (status === 'read') {
      conditions.push('is_read = 1');
    } else if (status === 'starred') {
      conditions.push('is_starred = 1');
    }

    if (search) {
      conditions.push('(subject LIKE ? OR from_address LIKE ? OR body LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

    // 查询总数
    const countResult = await db.prepare(
      `SELECT COUNT(*) as total FROM mails WHERE ${whereClause}`
    ).bind(...params).first<{ total: number }>();

    // 查询列表
    const { results } = await db.prepare(
      `SELECT id, from_address, to_address, subject, received_at, size, is_read, is_starred
       FROM mails
       WHERE ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    const total = countResult?.total ?? 0;

    return {
      mails: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * 获取邮件详情
   */
  async getDetail(db: D1Database, mailId: number, userId: number) {
    return db.prepare(
      `SELECT * FROM mails WHERE id = ? AND user_id = ?`
    ).bind(mailId, userId).first();
  },

  /**
   * 获取邮件统计
   */
  async getStats(db: D1Database, userId: number) {
    return db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN is_starred = 1 THEN 1 ELSE 0 END) as starred,
        SUM(size) as total_size
      FROM mails WHERE user_id = ?`
    ).bind(userId).first<{
      total: number;
      unread: number;
      starred: number;
      total_size: number;
    }>();
  },

  /**
   * 标记邮件已读
   */
  async markRead(db: D1Database, mailId: number) {
    await db.prepare(
      'UPDATE mails SET is_read = 1 WHERE id = ?'
    ).bind(mailId).run();
  },

  /**
   * 标记邮件未读
   */
  async markUnread(db: D1Database, mailId: number) {
    await db.prepare(
      'UPDATE mails SET is_read = 0 WHERE id = ?'
    ).bind(mailId).run();
  },

  /**
   * 切换星标状态
   */
  async toggleStar(db: D1Database, mailId: number): Promise<boolean> {
    const mail = await db.prepare(
      'SELECT is_starred FROM mails WHERE id = ?'
    ).bind(mailId).first<{ is_starred: number }>();

    if (!mail) return false;

    const newStarred = mail.is_starred ? 0 : 1;
    await db.prepare(
      'UPDATE mails SET is_starred = ? WHERE id = ?'
    ).bind(newStarred, mailId).run();

    return newStarred === 1;
  },

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(
    db: D1Database,
    userId: number,
    mailIds: number[],
    field: 'is_read' | 'is_starred',
    value: number
  ) {
    if (mailIds.length === 0) return;

    const placeholders = mailIds.map(() => '?').join(',');
    await db.prepare(
      `UPDATE mails SET ${field} = ? WHERE id IN (${placeholders}) AND user_id = ?`
    ).bind(value, ...mailIds, userId).run();
  },

  /**
   * 删除邮件并返回删除的大小
   */
  async deleteWithSize(db: D1Database, mailId: number, userId: number): Promise<number> {
    const mail = await db.prepare(
      'SELECT size FROM mails WHERE id = ? AND user_id = ?'
    ).bind(mailId, userId).first<{ size: number }>();

    if (!mail) return 0;

    await db.prepare('DELETE FROM mails WHERE id = ?').bind(mailId).run();

    // 更新用户邮件总大小
    await db.prepare(
      'UPDATE users SET total_mail_size = MAX(0, total_mail_size - ?) WHERE id = ?'
    ).bind(mail.size, userId).run();

    return mail.size;
  },

  /**
   * 批量删除邮件
   */
  async batchDelete(db: D1Database, userId: number, mailIds: number[]): Promise<number> {
    if (mailIds.length === 0) return 0;

    const placeholders = mailIds.map(() => '?').join(',');

    // 计算待删除邮件总大小
    const { results: mailsToDelete } = await db.prepare(
      `SELECT size FROM mails WHERE id IN (${placeholders}) AND user_id = ?`
    ).bind(...mailIds, userId).all<{ size: number }>();

    const totalSize = mailsToDelete.reduce((sum, m) => sum + m.size, 0);

    // 执行删除
    await db.prepare(
      `DELETE FROM mails WHERE id IN (${placeholders}) AND user_id = ?`
    ).bind(...mailIds, userId).run();

    // 更新用户邮件总大小
    if (totalSize > 0) {
      await db.prepare(
        'UPDATE users SET total_mail_size = MAX(0, total_mail_size - ?) WHERE id = ?'
      ).bind(totalSize, userId).run();
    }

    return mailsToDelete.length;
  },
};
