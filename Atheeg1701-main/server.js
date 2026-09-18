import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase } from './firebase-admin.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const memoryStore = {
  candidates: {},
  tests: {},
  attempts: {},
  settings: null,
  proctoring: {
    events: {},
    snapshots: {},
  },
};

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: origin not allowed'));
      }
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  })
);

/* =========================================================
   FIREBASE DATABASE
========================================================= */

const database = getDatabase();

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function cleanObject(value) {
  return value && typeof value === 'object' ? value : {};
}

function asList(value) {
  return Object.values(cleanObject(value));
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

function validateRecord(record, requiredFields) {
  if (!record || typeof record !== 'object') {
    return 'A JSON object is required.';
  }

  for (const field of requiredFields) {
    if (
      typeof record[field] !== 'string' ||
      !record[field].trim()
    ) {
      return `${field} is required.`;
    }
  }

  return null;
}

async function readPath(path) {
  if (database) {
    const snapshot = await database
      .ref(path)
      .once('value');

    return snapshot.val();
  }

  return path
    .split('/')
    .reduce(
      (value, key) => value?.[key],
      memoryStore
    );
}

async function writePath(path, value) {
  if (database) {
    return database
      .ref(path)
      .set(value);
  }

  const parts = path.split('/');
  const last = parts.pop();

  const parent = parts.reduce(
    (current, key) => {
      current[key] ||= {};
      return current[key];
    },
    memoryStore
  );

  parent[last] = value;
}

async function removePath(path) {
  if (database) {
    return database
      .ref(path)
      .remove();
  }

  const parts = path.split('/');
  const last = parts.pop();

  const parent = parts.reduce(
    (current, key) => current?.[key],
    memoryStore
  );

  if (parent) {
    delete parent[last];
  }
}

async function listRecords(path) {
  return asList(await readPath(path));
}

async function getRecord(path, id) {
  return (
    (await readPath(`${path}/${id}`)) || null
  );
}

async function upsertRecord(path, id, record) {
  await writePath(
    `${path}/${id}`,
    record
  );

  return record;
}

/* =========================================================
   BASIC API ROUTES
========================================================= */

app.get('/api/health', async (req, res) => {
  let firebase = false;

  try {
    if (database) {
      await database
        .ref('.info/connected')
        .once('value');

      firebase = true;
    }
  } catch (error) {
    console.error(
      '[FIREBASE_HEALTH_ERROR]',
      error.message
    );
  }

  res.status(200).json({
    status: 'ok',
    firebase,
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Atheeg API is running',
    data: {
      status: 'ok',
    },
  });
});

/* =========================================================
   FIREBASE CONNECTION TEST
========================================================= */

app.get('/api/firebase-test', async (req, res) => {
  try {
    if (!database) {
      return res.status(500).json({
        success: false,
        message:
          'Firebase database is not initialized',
      });
    }

    await database
      .ref('connectionTest')
      .set({
        connected: true,
        timestamp:
          new Date().toISOString(),
      });

    return res.json({
      success: true,
      message:
        'Firebase connection successful',
    });
  } catch (error) {
    console.error(
      '[FIREBASE_TEST_ERROR]',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Firebase connection failed',
    });
  }
});

/* =========================================================
   CANDIDATES
========================================================= */

app.get(
  '/api/candidates',
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await listRecords(
          'candidates'
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/candidates/:id',
  async (req, res, next) => {
    try {
      const data =
        await getRecord(
          'candidates',
          req.params.id
        );

      return data
        ? res.json({
            success: true,
            data,
          })
        : sendError(
            res,
            404,
            'Candidate not found.'
          );
    } catch (error) {
      return next(error);
    }
  }
);

app.post(
  '/api/candidates',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'id',
          'name',
          'email',
          'password',
          'createdAt',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      const existing =
        (
          await listRecords(
            'candidates'
          )
        ).find(
          (candidate) =>
            candidate.email
              ?.toLowerCase() ===
              req.body.email.toLowerCase() &&
            candidate.id !== req.body.id
        );

      if (existing) {
        return sendError(
          res,
          409,
          'A candidate with this email already exists.'
        );
      }

      return res.status(201).json({
        success: true,
        data: await upsertRecord(
          'candidates',
          req.body.id,
          req.body
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.put(
  '/api/candidates/:id',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'id',
          'name',
          'email',
          'password',
          'createdAt',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      return res.json({
        success: true,
        data: await upsertRecord(
          'candidates',
          req.params.id,
          {
            ...req.body,
            id: req.params.id,
          }
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.delete(
  '/api/candidates/:id',
  async (req, res, next) => {
    try {
      await removePath(
        `candidates/${req.params.id}`
      );

      const attempts =
        await listRecords(
          'attempts'
        );

      await Promise.all(
        attempts
          .filter(
            (attempt) =>
              attempt.candidateId ===
              req.params.id
          )
          .map(
            (attempt) =>
              removePath(
                `attempts/${attempt.id}`
              )
          )
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================================================
   TESTS
========================================================= */

app.get(
  '/api/tests',
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await listRecords(
          'tests'
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/tests/:id',
  async (req, res, next) => {
    try {
      const data =
        (
          await listRecords(
            'tests'
          )
        ).find(
          (test) =>
            test.id ===
              req.params.id ||
            test.code?.toLowerCase() ===
              req.params.id.toLowerCase()
        );

      return data
        ? res.json({
            success: true,
            data,
          })
        : sendError(
            res,
            404,
            'Test not found.'
          );
    } catch (error) {
      return next(error);
    }
  }
);

app.post(
  '/api/tests',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'id',
          'title',
          'code',
          'createdAt',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      return res.status(201).json({
        success: true,
        data: await upsertRecord(
          'tests',
          req.body.id,
          req.body
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.put(
  '/api/tests/:id',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'id',
          'title',
          'code',
          'createdAt',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      return res.json({
        success: true,
        data: await upsertRecord(
          'tests',
          req.params.id,
          {
            ...req.body,
            id: req.params.id,
          }
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.delete(
  '/api/tests/:id',
  async (req, res, next) => {
    try {
      await removePath(
        `tests/${req.params.id}`
      );

      const attempts =
        await listRecords(
          'attempts'
        );

      await Promise.all(
        attempts
          .filter(
            (attempt) =>
              attempt.testId ===
              req.params.id
          )
          .map(
            (attempt) =>
              removePath(
                `attempts/${attempt.id}`
              )
          )
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================================================
   ATTEMPTS
========================================================= */

app.get(
  '/api/attempts',
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: await listRecords(
          'attempts'
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/attempts/:id',
  async (req, res, next) => {
    try {
      const data =
        await getRecord(
          'attempts',
          req.params.id
        );

      return data
        ? res.json({
            success: true,
            data,
          })
        : sendError(
            res,
            404,
            'Attempt not found.'
          );
    } catch (error) {
      return next(error);
    }
  }
);

app.post(
  '/api/attempts',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'id',
          'candidateId',
          'testId',
          'submittedAt',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      return res.status(201).json({
        success: true,
        data: await upsertRecord(
          'attempts',
          req.body.id,
          req.body
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.delete(
  '/api/attempts/:id',
  async (req, res, next) => {
    try {
      await removePath(
        `attempts/${req.params.id}`
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================================================
   SETTINGS
========================================================= */

app.get(
  '/api/settings',
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data:
          (await readPath(
            'settings'
          )) || {},
      });
    } catch (error) {
      next(error);
    }
  }
);

app.put(
  '/api/settings',
  async (req, res, next) => {
    try {
      await writePath(
        'settings',
        req.body
      );

      return res.json({
        success: true,
        data: req.body,
      });
    } catch (error) {
      return next(error);
    }
  }
);

/* =========================================================
   PROCTORING EVENTS
========================================================= */

app.post(
  '/api/proctoring/events',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'attemptId',
          'type',
          'timestamp',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      const id =
        `${req.body.attemptId}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;

      return res.status(201).json({
        success: true,
        data: await upsertRecord(
          'proctoring/events',
          id,
          req.body
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.get(
  '/api/proctoring/events/:attemptId',
  async (req, res, next) => {
    try {
      const events =
        await listRecords(
          'proctoring/events'
        );

      res.json({
        success: true,
        data: events.filter(
          (event) =>
            event.attemptId ===
            req.params.attemptId
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   PROCTORING SNAPSHOTS
========================================================= */

app.post(
  '/api/proctoring/snapshots',
  async (req, res, next) => {
    try {
      const error = validateRecord(
        req.body,
        [
          'attemptId',
          'timestamp',
          'imageData',
        ]
      );

      if (error) {
        return sendError(
          res,
          400,
          error
        );
      }

      const id =
        `${req.body.attemptId}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;

      return res.status(201).json({
        success: true,
        data: await upsertRecord(
          'proctoring/snapshots',
          id,
          req.body
        ),
      });
    } catch (error) {
      return next(error);
    }
  }
);

app.get(
  '/api/proctoring/snapshots/:attemptId',
  async (req, res, next) => {
    try {
      const snapshots =
        await listRecords(
          'proctoring/snapshots'
        );

      res.json({
        success: true,
        data: snapshots.filter(
          (snapshot) =>
            snapshot.attemptId ===
            req.params.attemptId
        ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  return sendError(
    res,
    404,
    'Endpoint not found.'
  );
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      '[API_ERROR]',
      {
        method: req.method,
        path: req.path,
        message: error.message,
      }
    );

    return sendError(
      res,
      error.status || 500,
      'Unable to complete the operation.'
    );
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `[server] Atheeg API listening on http://0.0.0.0:${PORT}${
        database
          ? ' with Firebase'
          : ' with in-memory development storage'
      }`
    );
  }
);