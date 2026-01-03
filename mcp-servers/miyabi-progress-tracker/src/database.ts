import sqlite3 from 'sqlite3';
import winston from 'winston';
import {
  Student,
  Course,
  ProgressEntry,
  Recommendation,
  LearningAnalytics,
  PredictionModel,
  AssessmentResult,
} from './types.js';

export class Database {
  private db: sqlite3.Database;
  private logger: winston.Logger;

  constructor(dbPath: string = ':memory:') {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'database' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
    this.db = new sqlite3.Database(dbPath);
  }

  private run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  private all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing SQLite database schema...');

      await this.run(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          enrollmentDate TEXT NOT NULL,
          learningStyle TEXT,
          goals TEXT,
          timezone TEXT,
          droppedOut INTEGER DEFAULT 0,
          timestamp TEXT NOT NULL
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          difficulty TEXT,
          estimatedDuration INTEGER,
          prerequisites TEXT,
          learningObjectives TEXT
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS progress_entries (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          courseId TEXT NOT NULL,
          lessonId TEXT,
          status TEXT NOT NULL,
          progress REAL NOT NULL,
          timeSpent INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          engagementScore REAL,
          difficultyRating INTEGER,
          FOREIGN KEY(studentId) REFERENCES students(id),
          FOREIGN KEY(courseId) REFERENCES courses(id)
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS assessment_results (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          assessmentId TEXT NOT NULL,
          score REAL NOT NULL,
          timeSpent INTEGER NOT NULL,
          attempts INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          answers TEXT,
          feedback TEXT,
          FOREIGN KEY(studentId) REFERENCES students(id)
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS recommendations (
          id TEXT PRIMARY KEY,
          studentId TEXT NOT NULL,
          type TEXT NOT NULL,
          content TEXT,
          priority TEXT NOT NULL,
          reasoning TEXT,
          confidence REAL NOT NULL,
          expiresAt TEXT,
          timestamp TEXT NOT NULL,
          FOREIGN KEY(studentId) REFERENCES students(id)
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS predictions (
          id TEXT PRIMARY KEY,
          studentId TEXT,
          courseId TEXT,
          modelType TEXT NOT NULL,
          confidence REAL NOT NULL,
          prediction TEXT,
          factors TEXT,
          timestamp TEXT NOT NULL
        )
      `);

      await this.run(`
        CREATE TABLE IF NOT EXISTS analytics_summary (
          studentId TEXT NOT NULL,
          courseId TEXT NOT NULL,
          totalTimeSpent INTEGER DEFAULT 0,
          averageEngagement REAL DEFAULT 0,
          completionRate REAL DEFAULT 0,
          learningVelocity REAL DEFAULT 0,
          knowledgeRetention REAL DEFAULT 0,
          lastActive TEXT,
          PRIMARY KEY(studentId, courseId)
        )
      `);

      this.logger.info('Database schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveStudent(student: Student): Promise<void> {
    await this.run(
      `INSERT OR REPLACE INTO students (id, name, email, enrollmentDate, learningStyle, goals, timezone, droppedOut, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student.id,
        student.name,
        student.email,
        student.enrollmentDate.toISOString(),
        student.learningStyle || null,
        JSON.stringify(student.goals || []),
        student.timezone || 'UTC',
        0, // Default not dropped out
        new Date().toISOString()
      ]
    );
  }

  async saveCourse(course: Course): Promise<void> {
    await this.run(
      `INSERT OR REPLACE INTO courses (id, title, description, difficulty, estimatedDuration, prerequisites, learningObjectives)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        course.id,
        course.title,
        course.description || null,
        course.difficulty || null,
        course.estimatedDuration || null,
        JSON.stringify(course.prerequisites || []),
        JSON.stringify(course.learningObjectives || [])
      ]
    );
  }

  async saveProgressEntry(entry: ProgressEntry): Promise<void> {
    await this.run(
      `INSERT INTO progress_entries (id, studentId, courseId, lessonId, status, progress, timeSpent, timestamp, engagementScore, difficultyRating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.studentId, entry.courseId, entry.lessonId, entry.status, entry.progress, entry.timeSpent, entry.timestamp.toISOString(), entry.engagementScore, entry.difficultyRating]
    );
  }

  async getProgressData(query: any): Promise<ProgressEntry[]> {
    let sql = 'SELECT * FROM progress_entries WHERE 1=1';
    const params: any[] = [];

    if (query.studentIds) {
      sql += ` AND studentId IN (${query.studentIds.map(() => '?').join(',')})`;
      params.push(...query.studentIds);
    }
    if (query.courseIds) {
      sql += ` AND courseId IN (${query.courseIds.map(() => '?').join(',')})`;
      params.push(...query.courseIds);
    }
    if (query.timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(query.timeRange.start.toISOString(), query.timeRange.end.toISOString());
    }

    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapProgressEntry(r));
  }

  async getRecentProgressEntries(limit: number): Promise<ProgressEntry[]> {
    const rows = await this.all<any>('SELECT * FROM progress_entries ORDER BY timestamp DESC LIMIT ?', [limit]);
    return rows.map(r => this.mapProgressEntry(r));
  }

  async getAssessmentData(query: any): Promise<AssessmentResult[]> {
    let sql = 'SELECT * FROM assessment_results WHERE 1=1';
    const params: any[] = [];

    if (query.studentIds) {
      sql += ` AND studentId IN (${query.studentIds.map(() => '?').join(',')})`;
      params.push(...query.studentIds);
    }
    if (query.timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(query.timeRange.start.toISOString(), query.timeRange.end.toISOString());
    }

    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapAssessmentResult(r));
  }

  async saveRecommendation(rec: Recommendation): Promise<void> {
    await this.run(
      `INSERT INTO recommendations (id, studentId, type, content, priority, reasoning, confidence, expiresAt, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rec.id, rec.studentId, rec.type, JSON.stringify(rec.content), rec.priority, rec.reasoning, rec.confidence, rec.expiresAt?.toISOString(), new Date().toISOString()]
    );
  }

  async getStudentRecommendations(studentId: string): Promise<Recommendation[]> {
    const rows = await this.all<any>('SELECT * FROM recommendations WHERE studentId = ? ORDER BY timestamp DESC', [studentId]);
    return rows.map(r => this.mapRecommendation(r));
  }

  async updateRunningTotals(entry: ProgressEntry): Promise<void> {
    const existing = await this.get<any>(
      'SELECT * FROM analytics_summary WHERE studentId = ? AND courseId = ?',
      [entry.studentId, entry.courseId]
    );

    if (existing) {
      await this.run(
        `UPDATE analytics_summary SET
          totalTimeSpent = totalTimeSpent + ?,
          averageEngagement = (averageEngagement + ?) / 2,
          completionRate = MAX(completionRate, ?),
          lastActive = ?
         WHERE studentId = ? AND courseId = ?`,
        [entry.timeSpent, entry.engagementScore || 0, entry.progress, entry.timestamp.toISOString(), entry.studentId, entry.courseId]
      );
    } else {
      await this.run(
        `INSERT INTO analytics_summary (studentId, courseId, totalTimeSpent, averageEngagement, completionRate, lastActive)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.studentId, entry.courseId, entry.timeSpent, entry.engagementScore || 0, entry.progress, entry.timestamp.toISOString()]
      );
    }
  }

  async getStudentAnalytics(studentId: string, timeRange?: any, courseId?: string): Promise<LearningAnalytics[]> {
    let sql = 'SELECT * FROM analytics_summary WHERE studentId = ?';
    const params: any[] = [studentId];

    if (courseId) {
      sql += ' AND courseId = ?';
      params.push(courseId);
    }

    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapLearningAnalytics(r));
  }

  async getStudentCount(): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM students');
    return row?.count || 0;
  }

  async getCourseCount(): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM courses');
    return row?.count || 0;
  }

  async getProgressEntryCount(): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM progress_entries');
    return row?.count || 0;
  }

  async getRecentActivityCount(hours: number): Promise<number> {
    const date = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const row = await this.get<{ count: number }>('SELECT COUNT(DISTINCT studentId) as count FROM progress_entries WHERE timestamp > ?', [date]);
    return row?.count || 0;
  }

  async getAtRiskStudentCount(): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(DISTINCT id) as count FROM students WHERE droppedOut = 1');
    return row?.count || 0;
  }

  async getTopPerformerCount(): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(*) as count FROM analytics_summary WHERE completionRate > 90');
    return row?.count || 0;
  }

  async getStudent(id: string): Promise<Student> {
    const row = await this.get<any>('SELECT * FROM students WHERE id = ?', [id]);
    if (!row) throw new Error(`Student ${id} not found`);
    return this.mapStudent(row);
  }

  async getActiveStudents(days: number): Promise<Student[]> {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await this.all<any>('SELECT DISTINCT s.* FROM students s JOIN progress_entries p ON s.id = p.studentId WHERE p.timestamp > ?', [date]);
    return rows.map(r => this.mapStudent(r));
  }

  async getCourse(id: string): Promise<Course> {
    const row = await this.get<any>('SELECT * FROM courses WHERE id = ?', [id]);
    if (!row) throw new Error(`Course ${id} not found`);
    return this.mapCourse(row);
  }

  async getCourseEnrollmentCount(courseId: string): Promise<number> {
    const row = await this.get<{ count: number }>('SELECT COUNT(DISTINCT studentId) as count FROM progress_entries WHERE courseId = ?', [courseId]);
    return row?.count || 0;
  }

  async getCourseProgressData(courseId: string, timeRange?: any): Promise<ProgressEntry[]> {
    let sql = 'SELECT * FROM progress_entries WHERE courseId = ?';
    const params: any[] = [courseId];

    if (timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(timeRange.start.toISOString(), timeRange.end.toISOString());
    }

    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapProgressEntry(r));
  }

  async getCourseAssessmentData(courseId: string, timeRange?: any): Promise<AssessmentResult[]> {
    let sql = 'SELECT * FROM assessment_results WHERE assessmentId LIKE ?';
    const params: any[] = [`%${courseId}%`];

    if (timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(timeRange.start.toISOString(), timeRange.end.toISOString());
    }

    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapAssessmentResult(r));
  }

  async getCourseBenchmarkData(courseId: string): Promise<any[]> {
    return this.all<any>('SELECT * FROM analytics_summary WHERE courseId = ?', [courseId]);
  }

  async getStudentPredictions(studentId: string): Promise<PredictionModel[]> {
    const rows = await this.all<any>('SELECT * FROM predictions WHERE studentId = ?', [studentId]);
    return rows.map(r => this.mapPrediction(r));
  }

  private mapProgressEntry(row: any): ProgressEntry {
    return {
      ...row,
      timestamp: new Date(row.timestamp)
    };
  }

  private mapAssessmentResult(row: any): AssessmentResult {
    return {
      ...row,
      timestamp: new Date(row.timestamp),
      answers: JSON.parse(row.answers || '{}')
    };
  }

  private mapRecommendation(row: any): Recommendation {
    return {
      ...row,
      content: JSON.parse(row.content || '{}'),
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined
    };
  }

  private mapStudent(row: any): Student {
    return {
      ...row,
      enrollmentDate: new Date(row.enrollmentDate),
      goals: JSON.parse(row.goals || '[]')
    };
  }

  private mapCourse(row: any): Course {
    return {
      ...row,
      prerequisites: JSON.parse(row.prerequisites || '[]'),
      learningObjectives: JSON.parse(row.learningObjectives || '[]')
    };
  }

  private mapLearningAnalytics(row: any): LearningAnalytics {
    return {
      studentId: row.studentId,
      courseId: row.courseId,
      totalTimeSpent: row.totalTimeSpent,
      averageEngagement: row.averageEngagement,
      completionRate: row.completionRate,
      learningVelocity: row.learningVelocity,
      knowledgeRetention: row.knowledgeRetention,
      skillMastery: {},
      lastActive: new Date(row.lastActive)
    };
  }

  private mapPrediction(row: any): PredictionModel {
    return {
      modelType: row.modelType,
      confidence: row.confidence,
      prediction: JSON.parse(row.prediction || 'null'),
      factors: JSON.parse(row.factors || '{}'),
      timestamp: new Date(row.timestamp)
    };
  }

  async getHistoricalProgressData(days: number): Promise<ProgressEntry[]> {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await this.all<any>('SELECT * FROM progress_entries WHERE timestamp > ?', [date]);
    return rows.map(r => this.mapProgressEntry(r));
  }

  async getHistoricalStudentData(days: number): Promise<any[]> {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return this.all<any>('SELECT * FROM students WHERE timestamp > ?', [date]);
  }

  async getCompletedCoursesData(): Promise<any[]> {
    return this.all<any>('SELECT * FROM analytics_summary WHERE completionRate = 100');
  }

  async getHistoricalAssessmentData(days: number): Promise<AssessmentResult[]> {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await this.all<any>('SELECT * FROM assessment_results WHERE timestamp > ?', [date]);
    return rows.map(r => this.mapAssessmentResult(r));
  }

  async getActiveProgressData(studentIds?: string[], courseIds?: string[]): Promise<ProgressEntry[]> {
    return this.getProgressData({ studentIds, courseIds });
  }

  async getActiveStudentsData(studentIds?: string[]): Promise<any[]> {
    let sql = 'SELECT * FROM students WHERE droppedOut = 0';
    const params: any[] = [];
    if (studentIds) {
      sql += ` AND id IN (${studentIds.map(() => '?').join(',')})`;
      params.push(...studentIds);
    }
    return this.all<any>(sql, params);
  }

  async getInProgressCoursesData(studentIds?: string[], courseIds?: string[]): Promise<any[]> {
    let sql = 'SELECT * FROM analytics_summary WHERE completionRate < 100';
    const params: any[] = [];
    if (studentIds) {
      sql += ` AND studentId IN (${studentIds.map(() => '?').join(',')})`;
      params.push(...studentIds);
    }
    if (courseIds) {
      sql += ` AND courseId IN (${courseIds.map(() => '?').join(',')})`;
      params.push(...courseIds);
    }
    return this.all<any>(sql, params);
  }

  async getUpcomingAssessmentsData(studentIds?: string[], courseIds?: string[]): Promise<any[]> {
    return this.all<any>('SELECT * FROM courses');
  }

  async getStudentCurrentCourses(studentId: string): Promise<Course[]> {
    const rows = await this.all<any>(
      'SELECT c.* FROM courses c JOIN analytics_summary a ON c.id = a.courseId WHERE a.studentId = ? AND a.completionRate < 100',
      [studentId]
    );
    return rows.map(r => this.mapCourse(r));
  }

  async getStudentRecentProgress(studentId: string, limit: number): Promise<ProgressEntry[]> {
    const rows = await this.all<any>(
      'SELECT * FROM progress_entries WHERE studentId = ? ORDER BY timestamp DESC LIMIT ?',
      [studentId, limit]
    );
    return rows.map(r => this.mapProgressEntry(r));
  }

  async getStudentProgressData(studentId: string, timeRange?: any): Promise<ProgressEntry[]> {
    let sql = 'SELECT * FROM progress_entries WHERE studentId = ?';
    const params: any[] = [studentId];
    if (timeRange) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(timeRange.start.toISOString(), timeRange.end.toISOString());
    }
    const rows = await this.all<any>(sql, params);
    return rows.map(r => this.mapProgressEntry(r));
  }
}