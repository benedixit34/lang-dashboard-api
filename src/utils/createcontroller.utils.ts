import type { Request, Response, NextFunction } from "express";

import { and, asc, count, eq, type SQL } from "drizzle-orm";

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
 function parseId(
  value: string | string[] | undefined
): string | null {
  const stringValue = Array.isArray(value)
    ? value[0]
    : value;

  if (!stringValue) {
    return null;
  }

  return stringValue;
}
  // GET /resource
  async function list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const requestedLimit = Number(req.query.limit) || 20;
      const limit = Math.min(Math.max(requestedLimit, 1), 100);
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [];

      for (const filter of listFilters) {
        const value = req.query[filter.name];

        if (value !== undefined) {
          conditions.push(eq(filter.column, value as string));
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const countQuery: any = db
        .select({
          count: count(),
        })
        .from(table);

      const countResult = await (where ? countQuery.where(where) : countQuery);

      const total = Number(countResult[0]?.count ?? 0);

      const rowsQuery: any = db.select().from(table);

      const rows = await (where ? rowsQuery.where(where) : rowsQuery)
        .orderBy(asc(orderBy || idColumn))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      res.json({
        data: rows,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage: page < totalPages,

          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("CRUD list error:", error);

      console.error("Message:", (error as Error).message);
      console.error("Cause:", (error as any)?.cause);
      console.error("Code:", (error as any)?.code);
      console.error("Detail:", (error as any)?.detail);
      console.error("Hint:", (error as any)?.hint);
      next(error);
    }
  }

  // GET /resource/:id
  async function getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          error: "Invalid id",
        });
      }

      const rows = await db
        .select()
        .from(table)
        .where(eq(idColumn, id))
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

  //POST /resource
  async function create(req: Request, res: Response, next: NextFunction) {
    console.log("CRUD fields:", fields);
    try {
      const missing = fields
        .filter((field) => {
          if (!field.required) {
            return false;
          }

          const value = req.body[field.name];
          return value === undefined || value === "" || value === null;
        })
        .map((field) => field.name);

      if (missing.length > 0) {
        return res.status(400).json({
          error: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      const values: Record<string, unknown> = {};

      for (const field of fields) {
        if (req.body[field.name] !== undefined) {
          values[field.name] = req.body[field.name];
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

  //PATCH /resource/:id
  async function update(req: Request, res: Response, next: NextFunction) {
    try {
      const values: Record<string, unknown> = {};

      for (const field of fields) {
        if (req.body[field.name] !== undefined) {
          values[field.name] = req.body[field.name];
        }
      }

      if (Object.keys(values).length === 0) {
        return res.status(400).json({
          error: "No updatable fields provided",
        });
      }

      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          error: "Invalid id",
        });
      }

      const result = await db
        .update(table)
        .set(values as any)
        .where(eq(idColumn, id))
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

  //DELETE /resource/:id
  async function remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseId(req.params.id);

      if (id === null) {
        return res.status(400).json({
          error: "Invalid id",
        });
      }

      const result = await db.delete(table).where(eq(idColumn, id)).returning({
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
