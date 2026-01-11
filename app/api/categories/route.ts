/**
 * Course Categories Management API
 * Issue #1298: Course Management REST API Implementation
 *
 * GET /api/categories - List all categories
 * POST /api/categories - Create new category (admin only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-error';
import {
  parseQuery,
  parseBody,
  createSuccessResponse,
  calculatePagination,
  withRoles,
  handleOptions
} from '@/lib/api-utils';
import {
  CategoryQuerySchema,
  CreateCategorySchema,
  type CategoryQuery,
  type CreateCategoryInput
} from '@/lib/validation-schemas';

/**
 * GET /api/categories
 * List all course categories with optional filters
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const query: CategoryQuery = parseQuery(request, CategoryQuerySchema);

  const where: any = {};

  // Add search filter if provided
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  // Add parent filter if provided
  if (query.parentId !== undefined) {
    where.parentId = query.parentId;
  }

  const skip = (query.page - 1) * query.limit;

  // Get total count for pagination
  const total = await db.category.count({ where });

  // Get categories
  const categories = await db.category.findMany({
    where,
    skip,
    take: query.limit,
    orderBy: query.sortBy === 'name'
      ? { name: query.sortOrder }
      : query.sortBy === 'order'
      ? { order: query.sortOrder }
      : { createdAt: query.sortOrder },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          courses: true,
          children: true,
        },
      },
    },
  });

  // Transform response
  const transformedCategories = categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    color: category.color,
    icon: category.icon,
    order: category.order,
    isActive: category.isActive,
    metaTitle: category.metaTitle,
    metaDescription: category.metaDescription,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    parent: category.parent,
    children: category.children,
    stats: {
      coursesCount: category._count.courses,
      subcategoriesCount: category._count.children,
    },
  }));

  const pagination = calculatePagination(total, query.page, query.limit);

  return createSuccessResponse({
    categories: transformedCategories,
    pagination,
  });
});

/**
 * POST /api/categories
 * Create new category (admin only)
 */
export const POST = withRoles(['ADMIN', 'SUPER_ADMIN'],
  withErrorHandling(async (user, request: NextRequest) => {
    const input: CreateCategoryInput = await parseBody(request, CreateCategorySchema);

    // Check if slug is unique
    const existingCategory = await db.category.findUnique({
      where: { slug: input.slug },
    });

    if (existingCategory) {
      throw new Error('Category with this slug already exists');
    }

    // Validate parent category exists if provided
    if (input.parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: input.parentId },
        select: { id: true },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // Create category
    const category = await db.category.create({
      data: input,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            courses: true,
            children: true,
          },
        },
      },
    });

    return createSuccessResponse({
      category,
      message: `Category "${category.name}" created successfully`,
    });
  })
);

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}