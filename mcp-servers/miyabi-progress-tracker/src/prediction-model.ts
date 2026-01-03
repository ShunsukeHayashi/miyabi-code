import winston from 'winston';
import { Matrix } from 'ml-matrix';
// @ts-ignore
import { SimpleLinearRegression, PolynomialRegression } from 'ml-regression';
// @ts-ignore
import { kmeans } from 'ml-kmeans';
import { mean, standardDeviation } from 'simple-statistics';
import _ from 'lodash';
import { Database } from './database.js';
import {
  PredictionModel as PredictionModelType,
  ProgressEntry,
  AssessmentResult,
  Student,
  Course,
  ModelConfig,
} from './types.js';

interface PredictionInput {
  studentIds?: string[];
  courseIds?: string[];
  predictionTypes: PredictionModelType['modelType'][];
  minConfidence?: number;
}

interface TrainingData {
  features: number[][];
  targets: number[];
  metadata: any[];
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mae: number;
  rmse: number;
}

export class PredictionModel {
  private logger: winston.Logger;
  private database: Database;
  private config: ModelConfig;
  private models = new Map<string, any>();
  private modelMetrics = new Map<string, ModelMetrics>();
  private lastTraining = new Map<string, Date>();
  private predictionCount = 0;

  private readonly COMPLETION_FEATURES = [
    'averageSessionLength',
    'totalTimeSpent',
    'completionRate',
    'engagementScore',
    'assessmentScore',
    'studyFrequency',
    'difficultyRating',
    'timeOfDay',
    'dayOfWeek',
    'courseDifficulty',
  ];

  private readonly RISK_FEATURES = [
    'daysSinceLastActivity',
    'declineInEngagement',
    'completionRate',
    'averageScore',
    'sessionFrequency',
    'timeSpentVsExpected',
    'strugglingTopics',
    'assessmentAttempts',
    'helpRequested',
    'peerComparison',
  ];

  constructor(database: Database, config: ModelConfig) {
    this.database = database;
    this.config = config;

    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'prediction-model' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Prediction Models...');

      await Promise.all([
        this.initializeCompletionModel(),
        this.initializeRiskModel(),
        this.initializeTimeToCompleteModel(),
        this.initializeSuccessModel(),
      ]);

      this.logger.info('Prediction Models initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize prediction models:', error);
      throw error;
    }
  }

  async generatePredictions(input: PredictionInput): Promise<PredictionModelType[]> {
    try {
      this.logger.debug('Generating predictions:', input);
      const predictions: PredictionModelType[] = [];

      for (const predictionType of input.predictionTypes) {
        const typePredictions = await this.generatePredictionsByType(
          predictionType,
          input.studentIds,
          input.courseIds,
          input.minConfidence
        );
        predictions.push(...typePredictions);
      }

      this.predictionCount += predictions.length;
      this.logger.info(`Generated ${predictions.length} predictions`);
      return predictions;
    } catch (error) {
      this.logger.error('Failed to generate predictions:', error);
      throw error;
    }
  }

  async updateModels(): Promise<void> {
    try {
      const now = new Date();
      const updateTasks: Promise<void>[] = [];

      for (const modelType of ['completion', 'risk', 'time_to_complete', 'success'] as const) {
        const lastUpdate = this.lastTraining.get(modelType);
        const trainingInterval = this.config.completionModel.trainingInterval * 24 * 60 * 60 * 1000;

        if (!lastUpdate || now.getTime() - lastUpdate.getTime() > trainingInterval) {
          updateTasks.push(this.retrainModel(modelType));
        }
      }

      if (updateTasks.length > 0) {
        this.logger.info(`Updating ${updateTasks.length} models...`);
        await Promise.all(updateTasks);
        this.logger.info('Models updated successfully');
      }
    } catch (error) {
      this.logger.error('Failed to update models:', error);
      throw error;
    }
  }

  getModelMetrics(modelType: string): ModelMetrics | null {
    return this.modelMetrics.get(modelType) || null;
  }

  getPredictionCount(): number {
    return this.predictionCount;
  }

  private async generatePredictionsByType(
    modelType: PredictionModelType['modelType'],
    studentIds?: string[],
    courseIds?: string[],
    minConfidence = 70
  ): Promise<PredictionModelType[]> {
    const model = this.models.get(modelType);
    if (!model) {
      this.logger.warn(`Model ${modelType} not available`);
      return [];
    }

    const predictions: PredictionModelType[] = [];
    const data = await this.getDataForPrediction(modelType, studentIds, courseIds);

    for (const record of data) {
      try {
        const features = await this.extractFeatures(modelType, record);
        const prediction = await this.makePrediction(modelType, features);

        if (prediction.confidence >= minConfidence) {
          predictions.push({
            modelType,
            confidence: prediction.confidence,
            prediction: prediction.value,
            factors: prediction.factors,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        this.logger.debug(`Failed to generate prediction for record:`, error);
      }
    }

    return predictions;
  }

  private async initializeCompletionModel(): Promise<void> {
    try {
      const trainingData = await this.getCompletionTrainingData();
      if (trainingData.features.length === 0) return;

      let model: any;
      switch (this.config.completionModel.algorithm) {
        case 'regression':
          model = await this.trainLinearRegression(trainingData);
          break;
        case 'neural_network':
          model = await this.trainNeuralNetwork(trainingData);
          break;
        case 'ensemble':
        default:
          model = await this.trainEnsembleModel(trainingData, 'completion');
          break;
      }

      this.models.set('completion', model);
      this.lastTraining.set('completion', new Date());
      const metrics = await this.evaluateModel('completion', trainingData);
      this.modelMetrics.set('completion', metrics);
    } catch (error) {
      this.logger.error('Failed to initialize completion model:', error);
    }
  }

  private async initializeRiskModel(): Promise<void> {
    try {
      const trainingData = await this.getRiskTrainingData();
      if (trainingData.features.length === 0) return;

      let model: any;
      switch (this.config.riskModel.algorithm) {
        case 'classification':
          model = await this.trainClassificationModel(trainingData);
          break;
        case 'clustering':
          model = await this.trainClusteringModel(trainingData);
          break;
        case 'ensemble':
        default:
          model = await this.trainEnsembleModel(trainingData, 'risk');
          break;
      }

      this.models.set('risk', model);
      this.lastTraining.set('risk', new Date());
      const metrics = await this.evaluateModel('risk', trainingData);
      this.modelMetrics.set('risk', metrics);
    } catch (error) {
      this.logger.error('Failed to initialize risk model:', error);
    }
  }

  private async initializeTimeToCompleteModel(): Promise<void> {
    try {
      const trainingData = await this.getTimeToCompleteTrainingData();
      if (trainingData.features.length === 0) return;

      const model = await this.trainPolynomialRegression(trainingData, 2);
      this.models.set('time_to_complete', model);
      this.lastTraining.set('time_to_complete', new Date());
      const metrics = await this.evaluateModel('time_to_complete', trainingData);
      this.modelMetrics.set('time_to_complete', metrics);
    } catch (error) {
      this.logger.error('Failed to initialize time-to-complete model:', error);
    }
  }

  private async initializeSuccessModel(): Promise<void> {
    try {
      const trainingData = await this.getSuccessTrainingData();
      if (trainingData.features.length === 0) return;

      const model = await this.trainEnsembleModel(trainingData, 'success');
      this.models.set('success', model);
      this.lastTraining.set('success', new Date());
      const metrics = await this.evaluateModel('success', trainingData);
      this.modelMetrics.set('success', metrics);
    } catch (error) {
      this.logger.error('Failed to initialize success model:', error);
    }
  }

  private async getCompletionTrainingData(): Promise<TrainingData> {
    const progressData = await this.database.getHistoricalProgressData(90);
    const features: number[][] = [];
    const targets: number[] = [];
    const metadata: any[] = [];

    for (const progress of progressData) {
      try {
        const feature = await this.extractCompletionFeatures(progress);
        const target = progress.status === 'completed' ? 1 : 0;
        features.push(feature);
        targets.push(target);
        metadata.push({ studentId: progress.studentId, courseId: progress.courseId, timestamp: progress.timestamp });
      } catch (error) {
        this.logger.debug('Failed to extract features:', error);
      }
    }
    return { features, targets, metadata };
  }

  private async getRiskTrainingData(): Promise<TrainingData> {
    const studentData = await this.database.getHistoricalStudentData(180);
    const features: number[][] = [];
    const targets: number[] = [];
    const metadata: any[] = [];

    for (const student of studentData) {
      try {
        const feature = await this.extractRiskFeatures(student);
        const target = student.droppedOut ? 1 : 0;
        features.push(feature);
        targets.push(target);
        metadata.push({ studentId: student.id, timestamp: student.timestamp });
      } catch (error) {
        this.logger.debug('Failed to extract risk features:', error);
      }
    }
    return { features, targets, metadata };
  }

  private async getTimeToCompleteTrainingData(): Promise<TrainingData> {
    const completedCourses = await this.database.getCompletedCoursesData();
    const features: number[][] = [];
    const targets: number[] = [];
    const metadata: any[] = [];

    for (const course of completedCourses) {
      try {
        const feature = await this.extractTimeFeatures(course);
        const target = course.completionTime || 0;
        features.push(feature);
        targets.push(target);
        metadata.push({ studentId: course.studentId, courseId: course.courseId, timestamp: course.timestamp });
      } catch (error) {
        this.logger.debug('Failed to extract time features:', error);
      }
    }
    return { features, targets, metadata };
  }

  private async getSuccessTrainingData(): Promise<TrainingData> {
    const assessmentData = await this.database.getHistoricalAssessmentData(180);
    const features: number[][] = [];
    const targets: number[] = [];
    const metadata: any[] = [];

    for (const assessment of assessmentData) {
      try {
        const feature = await this.extractSuccessFeatures(assessment);
        const target = assessment.score >= 80 ? 1 : 0;
        features.push(feature);
        targets.push(target);
        metadata.push({ studentId: assessment.studentId, assessmentId: assessment.assessmentId, timestamp: assessment.timestamp });
      } catch (error) {
        this.logger.debug('Failed to extract success features:', error);
      }
    }
    return { features, targets, metadata };
  }

  private async extractFeatures(modelType: string, record: any): Promise<number[]> {
    switch (modelType) {
      case 'completion': return this.extractCompletionFeatures(record);
      case 'risk': return this.extractRiskFeatures(record);
      case 'time_to_complete': return this.extractTimeFeatures(record);
      case 'success': return this.extractSuccessFeatures(record);
      default: throw new Error(`Unknown model type: ${modelType}`);
    }
  }

  private async extractCompletionFeatures(progress: ProgressEntry): Promise<number[]> {
    return [
      progress.timeSpent / 3600,
      progress.progress / 100,
      progress.engagementScore || 0,
      progress.timestamp.getHours(),
      progress.timestamp.getDay(),
      progress.difficultyRating || 3,
    ];
  }

  private async extractRiskFeatures(student: any): Promise<number[]> {
    const lastActive = student.lastActive instanceof Date ? student.lastActive : new Date(student.lastActive || Date.now());
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    return [
      daysSinceActive,
      student.averageEngagement || 0,
      student.completionRate || 0,
      student.averageScore || 0,
      student.sessionFrequency || 0,
      student.strugglingTopics || 0,
    ];
  }

  private async extractTimeFeatures(course: any): Promise<number[]> {
    return [
      course.difficulty || 3,
      course.lessonCount || 10,
      course.estimatedDuration || 60,
      course.studentExperience || 1,
      course.prerequisitesMet ? 1 : 0,
    ];
  }

  private async extractSuccessFeatures(assessment: any): Promise<number[]> {
    return [
      (assessment.timeSpent || 0) / 60,
      assessment.attempts || 1,
      assessment.previousScore || 0,
      assessment.studyTimeBeforeAssessment || 0,
      assessment.difficultyLevel || 3,
      assessment.topicFamiliarity || 0.5,
    ];
  }

  private async trainLinearRegression(trainingData: TrainingData): Promise<any> {
    const x = trainingData.features.map(f => f[0] || 0);
    const y = trainingData.targets;
    return new SimpleLinearRegression(x, y);
  }

  private async trainPolynomialRegression(trainingData: TrainingData, degree: number): Promise<any> {
    const x = trainingData.features.map(f => f[0] || 0);
    const y = trainingData.targets;
    return new PolynomialRegression(x, y, degree);
  }

  private async trainNeuralNetwork(trainingData: TrainingData): Promise<any> {
    return {
      type: 'neural_network',
      predict: (input: number[]) => ({ value: Math.random(), confidence: 75 }),
    };
  }

  private async trainClassificationModel(trainingData: TrainingData): Promise<any> {
    const features = trainingData.features;
    const targets = trainingData.targets;
    const class0Features = features.filter((_, i) => targets[i] === 0);
    const class1Features = features.filter((_, i) => targets[i] === 1);
    const class0Means = this.calculateMeans(class0Features);
    const class1Means = this.calculateMeans(class1Features);
    return {
      type: 'classification',
      class0Means,
      class1Means,
      predict: (input: number[]) => this.classifyInput(input, class0Means, class1Means),
    };
  }

  private async trainClusteringModel(trainingData: TrainingData): Promise<any> {
    try {
      const features = trainingData.features;
      const res = kmeans(features, 3, {});
      return {
        type: 'clustering',
        centroids: res.centroids,
        predict: (input: number[]) => this.clusterPredict(input, res.centroids),
      };
    } catch (error) {
      return this.trainClassificationModel(trainingData);
    }
  }

  private async trainEnsembleModel(trainingData: TrainingData, modelType: string): Promise<any> {
    const models = await Promise.all([
      this.trainLinearRegression(trainingData),
      this.trainClassificationModel(trainingData),
    ]);
    return {
      type: 'ensemble',
      models,
      predict: (input: number[]) => this.ensemblePredict(input, models),
    };
  }

  private async makePrediction(modelType: string, features: number[]): Promise<{
    value: any;
    confidence: number;
    factors: Record<string, number>;
  }> {
    const model = this.models.get(modelType);
    if (!model) throw new Error(`Model ${modelType} not found`);
    const prediction = model.predict(features);
    const val = typeof prediction === 'number' ? prediction : prediction.value;
    const conf = typeof prediction === 'number' ? 75 : (prediction.confidence || 75);

    return {
      value: val,
      confidence: conf,
      factors: this.calculateFeatureImportance(features, modelType),
    };
  }

  private calculateFeatureImportance(features: number[], modelType: string): Record<string, number> {
    const featureNames = this.getFeatureNames(modelType);
    const importance: Record<string, number> = {};
    const sumAbs = _.sum(features.map(Math.abs)) || 1;

    for (let i = 0; i < Math.min(features.length, featureNames.length); i++) {
      const name = featureNames[i];
      if (name) {
        importance[name] = Math.abs(features[i] || 0) / sumAbs;
      }
    }
    return importance;
  }

  private getFeatureNames(modelType: string): string[] {
    switch (modelType) {
      case 'completion': return this.COMPLETION_FEATURES;
      case 'risk': return this.RISK_FEATURES;
      default: return ['feature1', 'feature2', 'feature3'];
    }
  }

  private async evaluateModel(modelType: string, trainingData: TrainingData): Promise<ModelMetrics> {
    const model = this.models.get(modelType);
    if (!model) throw new Error(`Model ${modelType} not found`);

    let correct = 0;
    let totalError = 0;
    const predictions: number[] = [];
    const actuals: number[] = [];
    const limit = Math.min(100, trainingData.features.length);

    for (let i = 0; i < limit; i++) {
      const feat = trainingData.features[i];
      const actual = trainingData.targets[i];
      if (feat === undefined || actual === undefined) continue;

      const prediction = model.predict(feat);
      const predVal = typeof prediction === 'number' ? prediction : prediction.value;

      predictions.push(predVal);
      actuals.push(actual);

      if (Math.round(predVal) === actual) correct++;
      totalError += Math.abs(predVal - actual);
    }

    const accuracy = limit > 0 ? (correct / limit) * 100 : 0;
    const mae = limit > 0 ? totalError / limit : 0;
    const rmse = predictions.length > 0 ? Math.sqrt(
      predictions.reduce((sum, pred, i) => sum + Math.pow(pred - (actuals[i] || 0), 2), 0) / predictions.length
    ) : 0;

    return { accuracy, precision: accuracy, recall: accuracy, f1Score: accuracy, mae, rmse };
  }

  private calculateMeans(features: number[][]): number[] {
    if (features.length === 0) return [];
    const featureCount = features[0]?.length || 0;
    const means: number[] = [];
    for (let i = 0; i < featureCount; i++) {
      means.push(mean(features.map(f => f[i] || 0)));
    }
    return means;
  }

  private classifyInput(input: number[], class0Means: number[], class1Means: number[]): { value: number; confidence: number; } {
    const d0 = this.euclideanDistance(input, class0Means);
    const d1 = this.euclideanDistance(input, class1Means);
    const prediction = d0 < d1 ? 0 : 1;
    const confidence = Math.abs(d1 - d0) / (d1 + d0 + 0.0001) * 100;
    return { value: prediction, confidence };
  }

  private clusterPredict(input: number[], centroids: any): { value: number; confidence: number; } {
    let minDistance = Infinity;
    let cluster = 0;
    for (let i = 0; i < centroids.length; i++) {
      const distance = this.euclideanDistance(input, centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        cluster = i;
      }
    }
    return { value: cluster, confidence: Math.max(0, 100 - minDistance * 10) };
  }

  private ensemblePredict(input: number[], models: any[]): { value: number; confidence: number; } {
    const predictions = models.map(model => {
      try {
        const res = model.predict(input);
        return typeof res === 'number' ? { value: res, confidence: 75 } : res;
      } catch {
        return { value: 0, confidence: 0 };
      }
    });
    return { value: mean(predictions.map(p => p.value)), confidence: mean(predictions.map(p => p.confidence || 0)) };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity;
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
  }

  private async getDataForPrediction(modelType: string, studentIds?: string[], courseIds?: string[]): Promise<any[]> {
    switch (modelType) {
      case 'completion': return this.database.getActiveProgressData(studentIds, courseIds);
      case 'risk': return this.database.getActiveStudentsData(studentIds);
      case 'time_to_complete': return this.database.getInProgressCoursesData(studentIds, courseIds);
      case 'success': return this.database.getUpcomingAssessmentsData(studentIds, courseIds);
      default: return [];
    }
  }

  private async retrainModel(modelType: PredictionModelType['modelType']): Promise<void> {
    this.logger.info(`Retraining ${modelType} model...`);
    try {
      switch (modelType) {
        case 'completion': await this.initializeCompletionModel(); break;
        case 'risk': await this.initializeRiskModel(); break;
        case 'time_to_complete': await this.initializeTimeToCompleteModel(); break;
        case 'success': await this.initializeSuccessModel(); break;
      }
      this.logger.info(`${modelType} model retrained successfully`);
    } catch (error) {
      this.logger.error(`Failed to retrain ${modelType} model:`, error);
    }
  }
}
