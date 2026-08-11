import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { categoryRoutes } from '../src/routes/category.routes.js';
import { learningSetRoutes}  from '../src/routes/learningSet.routes.js';
import mediaRoutes from '../src/routes/media.routes.js';
import vocabularyRoutes from '../src/routes/vocabulary.routes.js';
import { db } from '../src/db/index.js';


jest.mock('../src/db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/services/mediaBulkImportService.js', () => ({
  importMediaFromZip: jest.fn(),
}));

jest.mock('../src/services/vocabularyBulkImportService.js', () => ({
  importVocabularyFromExcel: jest.fn(),
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

function createCountBuilder(total: number) {
  const builder: any = {
    from: jest.fn(),
    where: jest.fn(),
  };

  builder.from.mockReturnValue(builder);
  builder.where.mockImplementation(async () => [
    { count: total },
  ]);

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

    return createRowsBuilder([
      { id: 1, name: "Sample" },
    ]);
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

describe('route modules', () => {
  it('mounts category routes correctly', async () => {
    const app = express();
    app.use(express.json());
    app.use('/categories', categoryRoutes);

    const response = await request(app).get('/categories');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, name: 'Sample' }]);
  });

  it('mounts learningSet routes correctly', async () => {
    const app = express();
    app.use(express.json());
    app.use('/learningSets', learningSetRoutes);

    const response = await request(app).get('/learningSets');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 1, name: 'Sample' }]);
  });

  it('returns 400 from media import route when file is missing', async () => {
    const app = express();
    app.use('/media', mediaRoutes);

    const response = await request(app).post('/media/import');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Please upload a ZIP file',
    });
  });

  it('returns 400 from vocabulary import route when file is missing', async () => {
    const app = express();
    app.use('/vocabulary', vocabularyRoutes);

    const response = await request(app).post('/vocabulary/import');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Please upload an Excel file',
    });
  });
});
