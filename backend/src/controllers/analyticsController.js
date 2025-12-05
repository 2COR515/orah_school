// analyticsController.js - Controller for analytics and performance data
const { getAllUsers, listAllLessons, listAllEnrollments, listAllAttendance } = require('../../db');

/**
 * Get comprehensive dashboard summary with aggregated analytics
 * Includes: Total users, lessons, enrollments, attendance, completion rates, etc.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDashboardSummary(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch all data
    const [users, lessons, enrollments, attendanceRecords] = await Promise.all([
      getAllUsers(),
      listAllLessons(),
      listAllEnrollments(),
      listAllAttendance()
    ]);

    // Filter data based on role
    let filteredLessons = lessons;
    let filteredEnrollments = enrollments;
    let filteredAttendance = attendanceRecords;

    if (userRole === 'instructor') {
      // Instructors only see their own lessons and related data
      filteredLessons = lessons.filter(l => l.instructorId === userId);
      const lessonIds = new Set(filteredLessons.map(l => l.id));
      filteredEnrollments = enrollments.filter(e => lessonIds.has(e.lessonId));
      filteredAttendance = attendanceRecords.filter(a => lessonIds.has(a.lessonId));
    }

    // Calculate metrics
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalInstructors = users.filter(u => u.role === 'instructor').length;
    const totalLessons = filteredLessons.length;
    const publishedLessons = filteredLessons.filter(l => l.status === 'published').length;
    const draftLessons = filteredLessons.filter(l => l.status === 'draft').length;

    // Enrollment metrics
    const totalEnrollments = filteredEnrollments.length;
    const activeEnrollments = filteredEnrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = filteredEnrollments.filter(e => e.progress === 100).length;
    const missedEnrollments = filteredEnrollments.filter(e => e.status === 'missed').length;

    // Calculate average completion rate
    const totalProgress = filteredEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    const averageCompletionRate = totalEnrollments > 0 
      ? Math.round(totalProgress / totalEnrollments) 
      : 0;

    // Attendance metrics
    const totalAttendanceRecords = filteredAttendance.length;
    const presentRecords = filteredAttendance.filter(a => a.status === 'present').length;
    const absentRecords = filteredAttendance.filter(a => a.status === 'absent').length;
    
    // Digital Attendance Rate = (Present / Total Records) * 100
    const digitalAttendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentRecords / totalAttendanceRecords) * 100)
      : 0;

    // Active students (students with at least one active enrollment)
    const activeStudentIds = new Set(
      filteredEnrollments
        .filter(e => e.status === 'active')
        .map(e => e.userId)
    );
    const activeStudents = activeStudentIds.size;

    // Time spent analytics (if available)
    const totalTimeSpent = filteredEnrollments.reduce((sum, e) => 
      sum + (e.timeSpentSeconds || 0), 0
    );
    const averageTimePerStudent = activeStudents > 0
      ? Math.round(totalTimeSpent / activeStudents / 60) // Convert to minutes
      : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEnrollments = filteredEnrollments.filter(e => 
      e.enrolledAt && e.enrolledAt > sevenDaysAgo
    ).length;

    // Response data
    const summary = {
      overview: {
        totalStudents,
        totalInstructors,
        totalLessons,
        publishedLessons,
        draftLessons,
        totalEnrollments,
        activeStudents
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        missed: missedEnrollments,
        averageCompletionRate: `${averageCompletionRate}%`
      },
      attendance: {
        totalRecords: totalAttendanceRecords,
        present: presentRecords,
        absent: absentRecords,
        digitalAttendanceRate: `${digitalAttendanceRate}%`
      },
      engagement: {
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        averageTimePerStudentMinutes: averageTimePerStudent,
        recentEnrollments: recentEnrollments
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      ok: true,
      summary
    });

  } catch (error) {
    console.error('❌ Error in getDashboardSummary:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error while fetching dashboard summary'
    });
  }
}

/**
 * Get detailed performance analytics for a specific lesson
 * Includes: Enrollment stats, completion rates, attendance, time spent, etc.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getLessonPerformance(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch all data
    const [lessons, enrollments, attendanceRecords] = await Promise.all([
      listAllLessons(),
      listAllEnrollments(),
      listAllAttendance()
    ]);

    // Find the lesson
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) {
      return res.status(404).json({
        ok: false,
        error: 'Lesson not found'
      });
    }

    // Authorization: Instructors can only view their own lessons
    if (userRole === 'instructor' && lesson.instructorId !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You do not have permission to view this lesson\'s analytics'
      });
    }

    // Filter enrollments for this lesson
    const lessonEnrollments = enrollments.filter(e => e.lessonId === lessonId);
    const lessonAttendance = attendanceRecords.filter(a => a.lessonId === lessonId);

    // Calculate metrics
    const totalEnrollments = lessonEnrollments.length;
    const activeEnrollments = lessonEnrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = lessonEnrollments.filter(e => e.progress === 100).length;
    const missedEnrollments = lessonEnrollments.filter(e => e.status === 'missed').length;

    // Completion rate
    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Average progress
    const totalProgress = lessonEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    const averageProgress = totalEnrollments > 0
      ? Math.round(totalProgress / totalEnrollments)
      : 0;

    // Attendance metrics
    const totalAttendance = lessonAttendance.length;
    const presentCount = lessonAttendance.filter(a => a.status === 'present').length;
    const absentCount = lessonAttendance.filter(a => a.status === 'absent').length;
    const attendanceRate = totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : 0;

    // Time spent
    const totalTimeSpent = lessonEnrollments.reduce((sum, e) => 
      sum + (e.timeSpentSeconds || 0), 0
    );
    const averageTimeSpent = totalEnrollments > 0
      ? Math.round(totalTimeSpent / totalEnrollments / 60) // Minutes
      : 0;

    // Student distribution by progress ranges
    const progressDistribution = {
      notStarted: lessonEnrollments.filter(e => e.progress === 0).length,
      inProgress: lessonEnrollments.filter(e => e.progress > 0 && e.progress < 100).length,
      completed: completedEnrollments,
      missed: missedEnrollments
    };

    // Recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEnrollments = lessonEnrollments.filter(e => 
      e.enrolledAt && e.enrolledAt > sevenDaysAgo
    ).length;
    const recentCompletions = lessonEnrollments.filter(e => 
      e.completedAt && e.completedAt > sevenDaysAgo
    ).length;

    // Response data
    const performance = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        topic: lesson.topic,
        status: lesson.status,
        createdAt: lesson.createdAt
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        missed: missedEnrollments,
        completionRate: `${completionRate}%`,
        averageProgress: `${averageProgress}%`
      },
      attendance: {
        totalRecords: totalAttendance,
        present: presentCount,
        absent: absentCount,
        attendanceRate: `${attendanceRate}%`
      },
      engagement: {
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        averageTimeSpentMinutes: averageTimeSpent
      },
      distribution: progressDistribution,
      recentActivity: {
        enrollmentsLast7Days: recentEnrollments,
        completionsLast7Days: recentCompletions
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      ok: true,
      performance
    });

  } catch (error) {
    console.error('❌ Error in getLessonPerformance:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error while fetching lesson performance'
    });
  }
}

/**
 * Get analytics for a specific student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getStudentAnalytics(req, res) {
  try {
    const { studentId } = req.params;

    const [users, enrollments, attendanceRecords] = await Promise.all([
      getAllUsers(),
      listAllEnrollments(),
      listAllAttendance()
    ]);

    const student = users.find(u => u.userId === studentId && u.role === 'student');
    if (!student) {
      return res.status(404).json({
        ok: false,
        error: 'Student not found'
      });
    }

    const studentEnrollments = enrollments.filter(e => e.userId === studentId);
    const studentAttendance = attendanceRecords.filter(a => a.studentId === studentId);

    const analytics = {
      student: {
        id: student.userId,
        email: student.email,
        name: `${student.firstName} ${student.lastName}`
      },
      enrollments: {
        total: studentEnrollments.length,
        active: studentEnrollments.filter(e => e.status === 'active').length,
        completed: studentEnrollments.filter(e => e.progress === 100).length,
        missed: studentEnrollments.filter(e => e.status === 'missed').length
      },
      attendance: {
        total: studentAttendance.length,
        present: studentAttendance.filter(a => a.status === 'present').length,
        absent: studentAttendance.filter(a => a.status === 'absent').length
      }
    };

    return res.status(200).json({
      ok: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Error in getStudentAnalytics:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get analytics for a specific instructor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getInstructorAnalytics(req, res) {
  try {
    const { instructorId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization: Instructors can only view their own analytics
    if (userRole === 'instructor' && instructorId !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'You can only view your own analytics'
      });
    }

    const [users, lessons, enrollments] = await Promise.all([
      getAllUsers(),
      listAllLessons(),
      listAllEnrollments()
    ]);

    const instructor = users.find(u => u.userId === instructorId && u.role === 'instructor');
    if (!instructor) {
      return res.status(404).json({
        ok: false,
        error: 'Instructor not found'
      });
    }

    const instructorLessons = lessons.filter(l => l.instructorId === instructorId);
    const lessonIds = new Set(instructorLessons.map(l => l.id));
    const instructorEnrollments = enrollments.filter(e => lessonIds.has(e.lessonId));

    const analytics = {
      instructor: {
        id: instructor.userId,
        email: instructor.email,
        name: `${instructor.firstName} ${instructor.lastName}`
      },
      lessons: {
        total: instructorLessons.length,
        published: instructorLessons.filter(l => l.status === 'published').length,
        draft: instructorLessons.filter(l => l.status === 'draft').length
      },
      enrollments: {
        total: instructorEnrollments.length,
        active: instructorEnrollments.filter(e => e.status === 'active').length,
        completed: instructorEnrollments.filter(e => e.progress === 100).length
      }
    };

    return res.status(200).json({
      ok: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Error in getInstructorAnalytics:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  getDashboardSummary,
  getLessonPerformance,
  getStudentAnalytics,
  getInstructorAnalytics
};
