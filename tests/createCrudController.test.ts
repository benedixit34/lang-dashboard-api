import { jest } from '@jest/globals';
import { createCrudController } from '../src/utils/createcontroller.utils.js';
import { db } from '../src/db/index.js';

jest.mock('../src/db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const table = { id: 'id', name: 'name' } as any;
const idColumn = table.id;
const fields = [
  {
    name: 'name',
    column: table.name,
    required: true,
  },
];

const controller = createCrudController({
  table,
  idColumn,
  fields,
  notFoundMessage: 'Not found',
});

function createCountBuilder(total: number) {
  const builder: {
    from: jest.Mock;
    where: jest.Mock;
  } = {
    from: jest.fn(),
    where: jest.fn(),
  };

  builder.from.mockReturnValue(builder);
  builder.where.mockImplementation(
    async () => [{ count: total }]
  );

  return builder;
}


function createRowsBuilder(rows: any[]) {
  const builder: any = {
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  };

  builder.from.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);

  builder.offset.mockImplementation(async () => rows);

  return builder;
}


beforeEach(() => {
  jest.clearAllMocks();

  mockedDb.select.mockImplementation((args: any) => {
    if (args && args.count !== undefined) {
      return createCountBuilder(1);
    }

    return createRowsBuilder([{ id: 1, name: "Sample" }]);
  });

  const insertBuilder: any = {
    values: jest.fn(),
    returning: jest.fn(),
  };

  insertBuilder.values.mockReturnValue(insertBuilder);
  insertBuilder.returning.mockImplementation(async () => [
    { id: 1, name: "Created" },
  ]);

  mockedDb.insert.mockReturnValue(insertBuilder);

  const updateBuilder: any = {
    set: jest.fn(),
    where: jest.fn(),
    returning: jest.fn(),
  };

  updateBuilder.set.mockReturnValue(updateBuilder);
  updateBuilder.where.mockReturnValue(updateBuilder);
  updateBuilder.returning.mockImplementation(async () => [
    { id: 1, name: "Updated" },
  ]);

  mockedDb.update.mockReturnValue(updateBuilder);

  const deleteBuilder: any = {
    where: jest.fn(),
    returning: jest.fn(),
  };

  deleteBuilder.where.mockReturnValue(deleteBuilder);
  deleteBuilder.returning.mockImplementation(async () => [
    { id: 1 },
  ]);

  mockedDb.delete.mockReturnValue(deleteBuilder);
});

describe("createCrudController", () => {
  const next = jest.fn();

  function makeResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  }

  it("returns paginated list results", async () => {
    const req = {
      query: {},
    } as any;

    const res = makeResponse();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 1, name: "Sample" }],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("returns one record when found", async () => {
    const req = {
      params: { id: "1" },
    } as any;

    const res = makeResponse();

    await controller.getOne(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      data: { id: 1, name: "Sample" },
    });
  });

  it("returns 404 when getOne record is missing", async () => {
    mockedDb.select.mockImplementation(() => {
      const builder: any = {
        from: jest.fn(),
        where: jest.fn(),
        limit: jest.fn(),
      };

      builder.from.mockReturnValue(builder);
      builder.where.mockReturnValue(builder);
      builder.limit.mockImplementation(async () => []);

      return builder;
    });

    const req = {
      params: { id: "999" },
    } as any;

    const res = makeResponse();

    await controller.getOne(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not found",
    });
  });

  it("returns 400 when required fields are missing on create", async () => {
    const req = {
      body: {},
    } as any;

    const res = makeResponse();

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing required field(s): name",
    });
  });

  it("creates a record when data is valid", async () => {
    const req = {
      body: { name: "Created" },
    } as any;

    const res = makeResponse();

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: { id: 1, name: "Created" },
    });
  });

  it("returns 400 when update has no fields", async () => {
    const req = {
      params: { id: "1" },
      body: {},
    } as any;

    const res = makeResponse();

    await controller.update(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "No updatable fields provided",
    });
  });

  it("returns 404 when update record is missing", async () => {
    const updateBuilder: any = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn(),
    };

    updateBuilder.set.mockReturnValue(updateBuilder);
    updateBuilder.where.mockReturnValue(updateBuilder);
    updateBuilder.returning.mockImplementation(async () => []);

    mockedDb.update.mockReturnValue(updateBuilder);

    const req = {
      params: { id: "999" },
      body: { name: "Missing" },
    } as any;

    const res = makeResponse();

    await controller.update(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not found",
    });
  });

  it("removes a record successfully", async () => {
    const req = {
      params: { id: "1" },
    } as any;

    const res = makeResponse();

    await controller.remove(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("returns 404 when remove record is missing", async () => {
    const deleteBuilder: any = {
      where: jest.fn(),
      returning: jest.fn(),
    };

    deleteBuilder.where.mockReturnValue(deleteBuilder);
    deleteBuilder.returning.mockImplementation(async () => []);

    mockedDb.delete.mockReturnValue(deleteBuilder);

    const req = {
      params: { id: "999" },
    } as any;

    const res = makeResponse();

    await controller.remove(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not found",
    });
  });
});