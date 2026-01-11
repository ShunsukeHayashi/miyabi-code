/**
 * Test imports for new course management endpoints
 * Issue #1298: Course Management REST API Implementation
 */

describe('New Course Management Endpoints Import Test', () => {
  it('should import course reviews endpoints without errors', async () => {
    expect(async () => {
      await import('@/app/api/courses/[id]/reviews/route');
    }).not.toThrow();

    expect(async () => {
      await import('@/app/api/courses/[id]/reviews/[reviewId]/route');
    }).not.toThrow();
  });

  it('should import category endpoints without errors', async () => {
    expect(async () => {
      await import('@/app/api/categories/route');
    }).not.toThrow();

    expect(async () => {
      await import('@/app/api/categories/[id]/route');
    }).not.toThrow();
  });

  it('should import instructor endpoints without errors', async () => {
    expect(async () => {
      await import('@/app/api/courses/[id]/instructors/route');
    }).not.toThrow();

    expect(async () => {
      await import('@/app/api/courses/[id]/instructors/[instructorId]/route');
    }).not.toThrow();
  });

  it('should import publishing endpoint without errors', async () => {
    expect(async () => {
      await import('@/app/api/courses/[id]/publish/route');
    }).not.toThrow();
  });

  it('should verify endpoint exports', async () => {
    const reviewsModule = await import('@/app/api/courses/[id]/reviews/route');
    expect(reviewsModule.GET).toBeDefined();
    expect(reviewsModule.POST).toBeDefined();
    expect(reviewsModule.OPTIONS).toBeDefined();

    const categoriesModule = await import('@/app/api/categories/route');
    expect(categoriesModule.GET).toBeDefined();
    expect(categoriesModule.POST).toBeDefined();
    expect(categoriesModule.OPTIONS).toBeDefined();

    const instructorsModule = await import('@/app/api/courses/[id]/instructors/route');
    expect(instructorsModule.GET).toBeDefined();
    expect(instructorsModule.POST).toBeDefined();
    expect(instructorsModule.OPTIONS).toBeDefined();

    const publishModule = await import('@/app/api/courses/[id]/publish/route');
    expect(publishModule.GET).toBeDefined();
    expect(publishModule.PUT).toBeDefined();
    expect(publishModule.POST).toBeDefined();
    expect(publishModule.OPTIONS).toBeDefined();
  });
});