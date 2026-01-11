/**
 * Individual Category Management API
 * Issue #1298: Course Management REST API Implementation
 *
 * GET /api/categories/[id] - Get category details
 * PUT /api/categories/[id] - Update category (admin only)
 * DELETE /api/categories/[id] - Delete category (admin only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, APIErrors } from '@/lib/api-error';
import {
  parseBody,
  createSuccessResponse,
  withRoles,
  handleOptions
} from '@/lib/api-utils';
import {
  UpdateCategorySchema,
  type UpdateCategoryInput
} from '@/lib/validation-schemas';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/categories/[id]
 * Get category details with courses and subcategories
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteContext) => {
  const categoryId = params.id;

  const category = await db.category.findUnique({
    where: { id: categoryId },
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
          description: true,
          color: true,
          icon: true,
          order: true,
          isActive: true,
        },
        orderBy: { order: 'asc' },
      },
      courses: {
        where: { course: { status: 'PUBLISHED' } }, // Only show published courses
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              thumbnail: true,
              level: true,
              price: true,
              estimatedTime: true,
              createdAt: true,
              creator: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
              _count: {
                select: {
                  enrollments: true,
                  reviews: true,
                },
              },
            },
          },
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

  if (!category) {
    throw APIErrors.CATEGORY_NOT_FOUND;
  }

  // Calculate average rating for courses in this category
  const courseIds = category.courses.map(cc => cc.course.id);
  const averageRating = courseIds.length > 0
    ? await db.courseReview.aggregate({
        where: { courseId: { in: courseIds } },
        _avg: { rating: true },
      })
    : { _avg: { rating: 0 } };

  // Transform response
  const transformedCategory = {
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
    courses: category.courses.map(cc => ({
      ...cc.course,
      averageRating: averageRating._avg.rating || 0,
    })),
    stats: {
      coursesCount: category._count.courses,
      subcategoriesCount: category._count.children,
      averageRating: averageRating._avg.rating || 0,
    },
  };

  return createSuccessResponse(transformedCategory);
});

/**
 * PUT /api/categories/[id]
 * Update category (admin only)
 */
export const PUT = withRoles(['ADMIN', 'SUPER_ADMIN'],
  withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
    const categoryId = params.id;
    const input: UpdateCategoryInput = await parseBody(request, UpdateCategorySchema);

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true },
    });

    if (!existingCategory) {
      throw APIErrors.CATEGORY_NOT_FOUND;
    }

    // Check if slug is unique (if being updated)
    if (input.slug && input.slug !== existingCategory.slug) {
      const conflictingCategory = await db.category.findUnique({
        where: { slug: input.slug },
      });

      if (conflictingCategory) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Validate parent category exists if provided
    if (input.parentId) {
      // Prevent circular reference
      if (input.parentId === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await db.category.findUnique({
        where: { id: input.parentId },
        select: { id: true },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Check for circular references (parent cannot be a descendant)
      const descendants = await getDescendantIds(categoryId);
      if (descendants.includes(input.parentId)) {
        throw new Error('Cannot create circular reference in category hierarchy');
      }
    }

    // Update category
    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
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

    return createSuccessResponse({
      category,
      message: `Category "${category.name}" updated successfully`,
    });
  })
);

/**
 * DELETE /api/categories/[id]
 * Delete category (admin only)
 */
export const DELETE = withRoles(['ADMIN', 'SUPER_ADMIN'],
  withErrorHandling(async (user, request: NextRequest, { params }: RouteContext) => {
    const categoryId = params.id;

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        courses: { select: { id: true } },
        children: { select: { id: true } },
      },
    });

    if (!existingCategory) {
      throw APIErrors.CATEGORY_NOT_FOUND;
    }

    // Check if category has courses
    if (existingCategory.courses.length > 0) {
      throw new Error('Cannot delete category with existing courses. Move courses to another category first.');
    }

    // Check if category has subcategories
    if (existingCategory.children.length > 0) {
      throw new Error('Cannot delete category with subcategories. Delete subcategories first or move them to another parent.');
    }

    // Delete category
    await db.category.delete({
      where: { id: categoryId },
    });

    return createSuccessResponse({
      message: `Category "${existingCategory.name}" deleted successfully`,
      deletedAt: new Date().toISOString(),
    });
  })
);

/**
 * Helper function to get all descendant category IDs
 */
async function getDescendantIds(categoryId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  const descendantIds: string[] = children.map(c => c.id);

  // Recursively get descendants of children
  for (const child of children) {
    const childDescendants = await getDescendantIds(child.id);
    descendantIds.push(...childDescendants);
  }

  return descendantIds;
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleOptions();
}