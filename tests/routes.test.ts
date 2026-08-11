import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { categoryRoutes } from '../src/routes/category.routes.js';
import { learningSetRoutes}  from '../src/routes/learningSet.routes.js';
import mediaRoutes from '../src/routes/media.routes.js';
import vocabularyRoutes from '../src/routes/vocabulary.routes.js';
import { db } from '../src/db/index.js';
import { importMediaFromZip } from '../src/services/mediaBulkImportService.js';
import { importVocabularyFromExcel } from '../src/services/vocabularyBulkImportService.js';

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
  return {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ count: total }]),
  };
}

function createRowsBuilder(rows: any[]) {
  const builder: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue(rows),
  };

  builder.where.mockImplementation(() => builder);

  return builder;
}

beforeEach(() => {
  jest.clearAllMocks();

  mockedDb.select.mockImplementation((args: any) => {
    if (args && args.count !== undefined) {
      return createCountBuilder(1);
    }

    return createRowsBuilder([{ id: 1, name: 'Sample' }]);
  });

  mockedDb.insert.mockReturnValue({
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1, name: 'Created' }]),
  });

  mockedDb.update.mockReturnValue({
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1, name: 'Updated' }]),
  });

  mockedDb.delete.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1 }]),
  });
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
