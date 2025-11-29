const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cron = require('node-cron');
const { initDb, listAllEnrollments } = require('./db');
const lessonRouter = require('./src/routes/lessonRoutes');
const enrollmentRouter = require('./src/routes/enrollmentRoutes');

/**
 * JWT Secret Key for signing and verifying tokens.
 * NOTE: Using a simple hardcoded string for development. This must be an environment variable in production.
 */
const JWT_SECRET = 'orah-school1';

const app = express();
const PORT = process.env.PORT || 3002;

// Time constants for reminder scheduler
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;    // 48 hours
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;  // 72 hours

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded files as static content (BEFORE API routes)
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer setup for secure uploads (videos and PDFs)
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, UPLOADS_DIR);
	},
	filename: function (req, file, cb) {
		// keep extension, but create a unique filename
		const ext = path.extname(file.originalname);
		const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
		const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${name}${ext}`;
		cb(null, unique);
	}
});

// Accept only mp4, mkv, and PDF; limit size to 200MB
const upload = multer({
	storage,
	limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
	fileFilter: (req, file, cb) => {
		const allowed = [
			'video/mp4',
			'video/x-matroska',
			'application/pdf'
		];
		if (allowed.includes(file.mimetype)) return cb(null, true);
		const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
		err.message = 'Invalid file type. Only MP4, MKV videos and PDF files are allowed.';
		return cb(err);
	}
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Lesson API' }));

// Mount Authentication API routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Mount Lesson API routes
app.use('/api/lessons', lessonRouter);

// Mount Enrollment API routes
app.use('/api/enrollments', enrollmentRouter);

// Upload endpoint (single file). Field name: uploaded_file
// Accepts video (mp4, mkv) and PDF files. Returns public URL.
app.post('/api/upload', (req, res, next) => {
  // delegate to multer and handle errors via next(err)
  const handler = upload.single('uploaded_file');
  handler(req, res, async function (err) {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded.' });

    try {
      const { originalname, filename, mimetype, size } = req.file;
      const url = `/uploads/${filename}`;
      // Determine file type based on mimetype
      let fileType = 'other';
      if (mimetype.startsWith('video/')) fileType = 'video';
      else if (mimetype === 'application/pdf') fileType = 'pdf';

      const meta = { 
        type: fileType,
        originalname, 
        filename, 
        mimetype, 
        size, 
        url, 
        uploadedAt: new Date().toISOString() 
      };

      console.log('Uploaded file:', { filename, mimetype, size });
      return res.status(201).json({ 
        ok: true, 
        message: 'File uploaded successfully. Use the returned URL in your lesson.', 
        file: meta 
      });
    } catch (e) {
      return next(e);
    }
  });
});

// Start server with database initialization
async function startServer() {
	try {
		// Initialize database
		await initDb();
		console.log('Database initialized successfully');
		
		// Automated Reminder Scheduler: runs every hour
		cron.schedule('0 * * * *', async () => {
			try {
				const now = Date.now();
				const enrollments = await listAllEnrollments();
				
				let reminderCount = 0;
				
				enrollments.forEach(enrollment => {
					// Only check active enrollments with incomplete progress
					if (enrollment.status === 'active' && enrollment.progress < 100) {
						const enrollmentAge = now - enrollment.enrolledAt;
						
						// Send reminder if enrollment is between 2-3 days old
						if (enrollmentAge >= TWO_DAYS_MS && enrollmentAge < THREE_DAYS_MS) {
							console.log(`[REMINDER SENT] User ${enrollment.userId} for Lesson ${enrollment.lessonId} is 2 days overdue.`);
							reminderCount++;
						}
					}
				});
				
				if (reminderCount > 0) {
					console.log(`[REMINDER SCHEDULER] Sent ${reminderCount} reminder(s) at ${new Date().toISOString()}`);
				}
			} catch (err) {
				console.error('[REMINDER ERROR]', err);
			}
		});
		console.log('✓ Reminder scheduler started (runs every hour)');
		
		// Serve static frontend files after API routes so /api/* is not shadowed
		app.use(express.static(path.join(__dirname, '..')));
		
		// Start listening
		app.listen(PORT, () => {
			console.log(`✓ Server listening on port ${PORT}`);
			console.log(`✓ Lesson API available at http://localhost:${PORT}/api/lessons`);
			console.log(`✓ Enrollment API available at http://localhost:${PORT}/api/enrollments`);
			console.log(`✓ Health check at http://localhost:${PORT}/health`);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Start the server
startServer();

// Error handling middleware: multer and generic errors -> JSON
app.use((err, req, res, next) => {
	console.error('Error:', err && err.stack ? err.stack : err);
	if (err instanceof multer.MulterError) {
		// Multer-specific errors
		const code = err.code || 'MULTER_ERROR';
		return res.status(400).json({ ok: false, error: err.message || code });
	}
	res.status(err.status || 500).json({ ok: false, error: err.message || 'Server error' });
});

// Export JWT_SECRET so other modules can access it for token verification (e.g., authMiddleware)
module.exports = {
	JWT_SECRET
};
