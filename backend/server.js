const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { initDb } = require('./db');
const lessonRouter = require('./src/routes/lessonRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer setup for secure uploads (images and PDFs)
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

// Accept only JPEG, PNG and PDF; limit size to 5MB
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
	fileFilter: (req, file, cb) => {
		const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
		if (allowed.includes(file.mimetype)) return cb(null, true);
		const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
		err.message = 'Invalid file type. Only JPEG, PNG and PDF files are allowed.';
		return cb(err);
	}
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Lesson API' }));

// Mount Lesson API routes
app.use('/api/lessons', lessonRouter);

// Upload endpoint (single file). Field name: uploaded_file
// NOTE: This uploads files but doesn't associate them with lessons yet
// To attach files to a lesson, use PATCH /api/lessons/:id with the file metadata
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
			let fileType = 'pdf';
			if (mimetype.startsWith('video/')) fileType = 'video';
			else if (mimetype.startsWith('image/')) fileType = 'image';
			
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
				message: 'File uploaded successfully. Use PATCH /api/lessons/:id to attach to a lesson.', 
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
		
		// Serve static frontend files after API routes so /api/* is not shadowed
		app.use('/uploads', express.static(UPLOADS_DIR));
		app.use(express.static(path.join(__dirname, '..')));
		
		// Start listening
		app.listen(PORT, () => {
			console.log(`✓ Server listening on port ${PORT}`);
			console.log(`✓ Lesson API available at http://localhost:${PORT}/api/lessons`);
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
