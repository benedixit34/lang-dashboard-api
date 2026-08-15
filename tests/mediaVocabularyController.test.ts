import { jest } from '@jest/globals';
import {
  importMediaController,
  uploadSingleImageController,
} from '../src/controllers/media.controller.js';
import {
  importVocabularyController,
  createVocabularyController,
} from '../src/controllers/vocabulary.controller.js';
import { db } from '../src/db/index.js';
import { uploadToBackblaze } from '../src/services/backblaze.service.js';
import { importMediaFromZip } from '../src/services/media.service.js';
import { importVocabularyFromExcel } from '../src/services/vocabularyBulkImportService.js';

jest.mock('../src/utils/backblaze.js', () => ({
  uploadToBackblaze: jest.fn(),
}));

jest.mock('../src/services/mediaBulkImportService.js', () => ({
  importMediaFromZip: jest.fn(),
}));

jest.mock('../src/services/vocabularyBulkImportService.js', () => ({
  importVocabularyFromExcel: jest.fn(),
}));

jest.mock('../src/db/index.js', () => ({
  db: {
    insert: jest.fn(),
  },
}));

const mockedUploadToBackblaze = uploadToBackblaze as unknown as jest.Mock;
const mockedImportMediaFromZip = importMediaFromZip as unknown as jest.Mock;
const mockedImportVocabularyFromExcel = importVocabularyFromExcel as unknown as jest.Mock;
const mockedDb = db as unknown as {
  insert: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();

  mockedUploadToBackblaze.mockImplementation(
    async () => "https://example.com/uploaded-file"
  );

  mockedImportMediaFromZip.mockImplementation(
    async () => [{ imported: 1 }]
  );

  mockedImportVocabularyFromExcel.mockImplementation(
    async () => [{ imported: 2 }]
  );

  const insertBuilder: any = {
    values: jest.fn(),
    returning: jest.fn(),
  };

  insertBuilder.values.mockReturnValue(insertBuilder);

  insertBuilder.returning.mockImplementation(
    async () => [{ id: 1 }]
  );

  mockedDb.insert.mockReturnValue(insertBuilder);
});


describe('media.controller', () => {
  const next = jest.fn();

  function makeResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  }

  it('returns 400 when no zip file is uploaded', async () => {
    const req = {} as any;
    const res = makeResponse();

    await importMediaController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please upload a ZIP file',
    });
  });

  it('returns 200 when media import succeeds', async () => {
    const req = { file: { buffer: Buffer.from('zip') } } as any;
    const res = makeResponse();

    await importMediaController(req, res);

    expect(mockedImportMediaFromZip).toHaveBeenCalledWith(req.file.buffer);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Media import completed',
      data: [{ imported: 1 }],
    });
  });

  it('returns 400 when no image file is uploaded', async () => {
    const req = {} as any;
    const res = makeResponse();

    await uploadSingleImageController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please upload an image',
    });
  });

  it('uploads image and returns success', async () => {
    const file = {
      originalname: 'image.png',
      buffer: Buffer.from('image data'),
      mimetype: 'image/png',
    } as any;
    const req = { file } as any;
    const res = makeResponse();

    await uploadSingleImageController(req, res);

    expect(mockedUploadToBackblaze).toHaveBeenCalledWith(
      file.buffer,
      expect.stringContaining('vocabulary/images/'),
      file.mimetype,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        filename: 'image.png',
        key: expect.any(String),
        url: 'https://example.com/uploaded-file',
      },
    });
  });
});

describe('vocabulary.controller', () => {
  function makeResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  }

  it('returns 400 when no excel file is uploaded', async () => {
    const req = {} as any;
    const res = makeResponse();

    await importVocabularyController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please upload an Excel file',
    });
  });

  it('returns 200 when vocabulary import succeeds', async () => {
    const req = { file: { path: '/tmp/test.xlsx' } } as any;
    const res = makeResponse();

    await importVocabularyController(req, res);

    expect(mockedImportVocabularyFromExcel).toHaveBeenCalledWith('/tmp/test.xlsx');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Vocabulary import completed',
      data: [{ imported: 2 }],
    });
  });

  it('creates vocabulary without files', async () => {
    const req = {
      body: {
        itemId: '1',
        categoryId: 2,
        learningSetId: 3,
        germanWord: 'Haus',
        englishMeaning: 'House',
        article: 'das',
        wordType: 'noun',
        difficulty: 'easy',
        imageIdea: 'A small house',
      },
      files: {},
    } as any;
    const res = makeResponse();

    await createVocabularyController(req, res);

    expect(mockedDb.insert).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Vocabulary created successfully',
      data: { id: 1 },
    });
  });

  it('creates vocabulary with uploaded image and audio', async () => {
    const req = {
      body: {
        itemId: '1',
        categoryId: 2,
        learningSetId: 3,
        germanWord: 'Haus',
        englishMeaning: 'House',
        article: 'das',
        wordType: 'noun',
        difficulty: 'easy',
        imageIdea: 'A small house',
      },
      files: {
        image: [
          {
            originalname: 'image.png',
            buffer: Buffer.from('image-binary'),
            mimetype: 'image/png',
          },
        ],
        audio: [
          {
            originalname: 'audio.mp3',
            buffer: Buffer.from('audio-binary'),
            mimetype: 'audio/mpeg',
          },
        ],
      },
    } as any;
    const res = makeResponse();

    await createVocabularyController(req, res);

    expect(mockedUploadToBackblaze).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Vocabulary created successfully',
      data: { id: 1 },
    });
  });
});
