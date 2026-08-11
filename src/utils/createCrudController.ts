
import  type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  and,
  asc,
  count,
  eq,
  type SQL,
} from "drizzle-orm";

import { db } from "../db/index.js";

import type { PgTable } from "drizzle-orm/pg-core";

interface CrudField {
  name: string;
  column: any;
  required?: boolean;
}

interface CrudFilter {
  name: string;
  column: any;
}

interface CrudConfig {
  table: PgTable;
  idColumn: any;

  fields: CrudField[];

  listFilters?: CrudFilter[];

  orderBy?: any;

  notFoundMessage?: string;
}

export function createCrudController({
  table,
  idColumn,
  fields,
  listFilters = [],
  orderBy,
  notFoundMessage = "Record not found",
}: CrudConfig) {
  
  async function list(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
    

      const page = Math.max(
        Number(req.query.page) || 1,
        1,
      );

      const requestedLimit =
        Number(req.query.limit) || 20;

      // Prevent someone requesting thousands of records
      const limit = Math.min(
        Math.max(requestedLimit, 1),
        100,
      );

      const offset = (page - 1) * limit;

      /**
       * Filters
       */

      const conditions: SQL[] = [];

      for (const filter of listFilters) {
        const value = req.query[filter.name];

        if (value !== undefined) {
          conditions.push(
            eq(
              filter.column,
              value as string,
            ),
          );
        }
      }

      const where =
        conditions.length > 0
          ? and(...conditions)
          : undefined;

  
      const countResult = await db
        .select({
          count: count(),
        })
        .from(table)
        .where(where);

      const total = Number(
        countResult[0]?.count ?? 0,
      );

     

      let query = db
        .select()
        .from(table);

      const rows = await query
        .where(where)
        .orderBy(
          asc(orderBy || idColumn),
        )
        .limit(limit)
        .offset(offset);

     

      const totalPages =
        Math.ceil(total / limit);

      res.json({
        data: rows,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resource/:id
   */
  async function getOne(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const rows = await db
        .select()
        .from(table)
        .where(
          eq(
            idColumn,
            Number(req.params.id),
          ),
        )
        .limit(1);

      const record = rows[0];

      if (!record) {
        return res.status(404).json({
          error: notFoundMessage,
        });
      }

      res.json({
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /resource
   */
  async function create(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const missing = fields
        .filter(
          (field) =>
            field.required &&
            (
              req.body[field.name] ===
                undefined ||
              req.body[field.name] === ""
            ),
        )
        .map((field) => field.name);

      if (missing.length > 0) {
        return res.status(400).json({
          error:
            `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      const values: Record<
        string,
        unknown
      > = {};

      for (const field of fields) {
        if (
          req.body[field.name] !==
          undefined
        ) {
          values[field.name] =
            req.body[field.name];
        }
      }

      const result = await db
        .insert(table)
        .values(values as any)
        .returning();

      const record = result[0];

      res.status(201).json({
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /resource/:id
   */
  async function update(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const values: Record<
        string,
        unknown
      > = {};

      for (const field of fields) {
        if (
          req.body[field.name] !==
          undefined
        ) {
          values[field.name] =
            req.body[field.name];
        }
      }

      if (
        Object.keys(values).length === 0
      ) {
        return res.status(400).json({
          error:
            "No updatable fields provided",
        });
      }

      const result = await db
        .update(table)
        .set(values as any)
        .where(
          eq(
            idColumn,
            Number(req.params.id),
          ),
        )
        .returning();

      const record = result[0];

      if (!record) {
        return res.status(404).json({
          error: notFoundMessage,
        });
      }

      res.json({
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /resource/:id
   */
  async function remove(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await db
        .delete(table)
        .where(
          eq(
            idColumn,
            Number(req.params.id),
          ),
        )
        .returning({
          id: idColumn,
        });

      const record = result[0];

      if (!record) {
        return res.status(404).json({
          error: notFoundMessage,
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  return {
    list,
    getOne,
    create,
    update,
    remove,
  };
}
