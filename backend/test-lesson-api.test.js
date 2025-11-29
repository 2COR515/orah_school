// test-lesson-api.js - Automated tests for lesson upload and creation endpoints
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./server');

// Dummy JWT and instructorId for testing (replace with real values if needed)
const TEST_JWT = process.env.TEST_JWT || 'DUMMY_JWT';
const TEST_INSTRUCTOR_ID = process.env.TEST_INSTRUCTOR_ID || 'DUMMY_INSTRUCTOR_ID';

// Helper: get a sample video and pdf file from assets or fallback
const sampleVideo = path.join(__dirname, '../assets/Lessons/test1.mp4');
const samplePdf = path.join(__dirname, '../assets/sample.pdf');

// Ensure sample PDF exists for test
if (!fs.existsSync(samplePdf)) {
  fs.writeFileSync(samplePdf, 'Sample PDF content');
}

describe('Lesson API Phase 1', () => {
  let uploadedVideoUrl = '';

  it('should upload a video file', async () => {
    const res = await request('http://localhost:3002')
      .post('/api/upload')
      .attach('uploaded_file', sampleVideo);
    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.file.url).toMatch(/\.mp4$/);
    uploadedVideoUrl = res.body.file.url;
  });

  it('should upload a PDF file', async () => {
    const res = await request('http://localhost:3002')
      .post('/api/upload')
      .attach('uploaded_file', samplePdf);
    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.file.url).toMatch(/\.pdf$/);
  });

  it('should reject an invalid file type', async () => {
    const res = await request('http://localhost:3002')
      .post('/api/upload')
      .attach('uploaded_file', __filename); // this JS file
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('should create a lesson with videoUrl and quiz', async () => {
    const quiz = [
      { question: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: 1 }
    ];
    const res = await request('http://localhost:3002')
      .post('/api/lessons')
      .set('Authorization', `Bearer ${TEST_JWT}`)
      .field('title', 'Test Lesson')
      .field('instructorId', TEST_INSTRUCTOR_ID)
      .field('videoUrl', uploadedVideoUrl)
      .field('quiz', JSON.stringify(quiz));
    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.lesson.videoUrl).toBe(uploadedVideoUrl);
    expect(Array.isArray(res.body.lesson.quiz)).toBe(true);
    expect(res.body.lesson.quiz[0].question).toBe('What is 2+2?');
  });

  it('should reject lesson creation with missing title', async () => {
    const res = await request('http://localhost:3002')
      .post('/api/lessons')
      .set('Authorization', `Bearer ${TEST_JWT}`)
      .field('instructorId', TEST_INSTRUCTOR_ID)
      .field('videoUrl', uploadedVideoUrl);
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('should list published lessons', async () => {
    const res = await request('http://localhost:3002')
      .get('/api/lessons');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.lessons)).toBe(true);
  });
});
