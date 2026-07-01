import cron from 'node-cron';
import { Test } from '../models/test.model.js';
import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';

// Runs daily at 02:00 AM server time
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily test cleanup job');
  try {
    const now = new Date();
    // Find tests that have a scheduledDate and are still active or scheduled
    const expiredTests = await Test.find({
      status: { $in: ['active', 'scheduled'] },
      $or: [
        { scheduledAt: { $exists: true, $ne: null } },
        { createdAt: { $exists: true } },
      ],
    });

    for (const test of expiredTests) {
      // Determine end time based on scheduledAt if present, otherwise creation time + duration
      const start = test.scheduledAt || test.createdAt;
      const endTime = new Date(start.getTime() + (test.durationMinutes || 30) * 60 * 1000);
      if (now >= endTime) {
        // Mark test as completed
        test.status = 'completed';
        await test.save();
        // Update related job
        await Job.findByIdAndUpdate(test.job, { hasTest: false, testDescription: '', testDate: null, testDuration: null, testMinimumScore: null });
        console.log(`Test ${test._id} marked as completed and job ${test.job} cleared of test info`);
      }
    }
  } catch (err) {
    console.error('Error during test cleanup cron job:', err);
  }
});
