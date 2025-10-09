/**
 * Admin Encyclopedia Lambda Handler
 * Manages degrees and courses for all universities
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createOptionsResponse, createCorsResponse } from './middleware/cors';
import { requireAdmin } from './middleware/auth';
import { handleError } from './utils/errors';
import * as degreeService from './services/degree.service';
import * as courseService from './services/course.service';
import { CreateDegreeRequest, UpdateDegreeRequest, CreateCourseRequest, UpdateCourseRequest } from './models/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Request:', JSON.stringify(event, null, 2));

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return createOptionsResponse();
  }

  try {
    // Require admin authorization for all requests
    const user = requireAdmin(event);
    console.log('Authorized admin:', user.email);

    const { httpMethod, path, pathParameters, body, queryStringParameters } = event;

    // Route requests
    if (path.includes('/admin/degrees')) {
      return await handleDegreeRequests(httpMethod, pathParameters, body, user.userId, queryStringParameters);
    }

    if (path.includes('/admin/courses')) {
      return await handleCourseRequests(httpMethod, pathParameters, body, user.userId, queryStringParameters);
    }

    return createCorsResponse(404, {
      success: false,
      message: 'Endpoint not found',
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle degree-related requests
 */
async function handleDegreeRequests(
  method: string,
  pathParameters: { [key: string]: string | undefined } | null,
  body: string | null,
  userId: string,
  queryParams?: { [key: string]: string | undefined } | null
): Promise<APIGatewayProxyResult> {
  const degreeId = pathParameters?.id;

  switch (method) {
    case 'POST': {
      // Create degree
      const request: CreateDegreeRequest = JSON.parse(body || '{}');
      
      if (!request.universityDomain || !request.degreeName) {
        return createCorsResponse(400, {
          success: false,
          message: 'universityDomain and degreeName are required',
        });
      }

      const degree = await degreeService.createDegree(request, userId);
      
      return createCorsResponse(201, {
        success: true,
        message: 'Degree created successfully',
        data: degree,
      });
    }

    case 'GET': {
      if (degreeId) {
        // Get single degree by ID
        const degree = await degreeService.getDegreeById(degreeId);
        
        if (!degree) {
          return createCorsResponse(404, {
            success: false,
            message: 'Degree not found',
          });
        }

        return createCorsResponse(200, {
          success: true,
          data: degree,
        });
      } else {
        // List degrees (with optional university filter)
        const universityDomain = queryParams?.universityDomain;

        if (!universityDomain) {
          return createCorsResponse(400, {
            success: false,
            message: 'universityDomain query parameter is required',
          });
        }

        const degrees = await degreeService.listDegreesByUniversity(universityDomain);
        
        return createCorsResponse(200, {
          success: true,
          data: degrees,
        });
      }
    }

    case 'PUT': {
      // Update degree
      if (!degreeId) {
        return createCorsResponse(400, {
          success: false,
          message: 'degreeId is required',
        });
      }

      const updates: UpdateDegreeRequest = JSON.parse(body || '{}');
      const degree = await degreeService.updateDegree(degreeId, updates);

      return createCorsResponse(200, {
        success: true,
        message: 'Degree updated successfully',
        data: degree,
      });
    }

    case 'DELETE': {
      // Delete degree (soft delete)
      if (!degreeId) {
        return createCorsResponse(400, {
          success: false,
          message: 'degreeId is required',
        });
      }

      await degreeService.deleteDegree(degreeId);

      return createCorsResponse(200, {
        success: true,
        message: 'Degree deleted successfully',
      });
    }

    default:
      return createCorsResponse(405, {
        success: false,
        message: 'Method not allowed',
      });
  }
}

/**
 * Handle course-related requests
 */
async function handleCourseRequests(
  method: string,
  pathParameters: { [key: string]: string | undefined } | null,
  body: string | null,
  userId: string,
  queryParams?: { [key: string]: string | undefined } | null
): Promise<APIGatewayProxyResult> {
  const courseId = pathParameters?.id;

  switch (method) {
    case 'POST': {
      // Create course
      const request: CreateCourseRequest = JSON.parse(body || '{}');
      
      if (!request.degreeId || !request.courseName || !request.courseCode) {
        return createCorsResponse(400, {
          success: false,
          message: 'degreeId, courseName, and courseCode are required',
        });
      }

      const course = await courseService.createCourse(request, userId);
      
      return createCorsResponse(201, {
        success: true,
        message: 'Course created successfully',
        data: course,
      });
    }

    case 'GET': {
      if (courseId) {
        // Get single course by ID
        const course = await courseService.getCourseById(courseId);
        
        if (!course) {
          return createCorsResponse(404, {
            success: false,
            message: 'Course not found',
          });
        }

        return createCorsResponse(200, {
          success: true,
          data: course,
        });
      } else {
        // List courses (by degree or university)
        const degreeId = queryParams?.degreeId;
        const universityDomain = queryParams?.universityDomain;
        const courseCode = queryParams?.courseCode;

        if (courseCode && universityDomain) {
          // Get course by university and code
          const course = await courseService.getCourseByCode(universityDomain, courseCode);
          
          if (!course) {
            return createCorsResponse(404, {
              success: false,
              message: 'Course not found',
            });
          }

          return createCorsResponse(200, {
            success: true,
            data: course,
          });
        } else if (degreeId) {
          // List courses by degree
          const courses = await courseService.listCoursesByDegree(degreeId);
          
          return createCorsResponse(200, {
            success: true,
            data: courses,
          });
        } else if (universityDomain) {
          // List courses by university
          const courses = await courseService.listCoursesByUniversity(universityDomain);
          
          return createCorsResponse(200, {
            success: true,
            data: courses,
          });
        } else {
          return createCorsResponse(400, {
            success: false,
            message: 'degreeId or universityDomain query parameter is required',
          });
        }
      }
    }

    case 'PUT': {
      // Update course
      if (!courseId) {
        return createCorsResponse(400, {
          success: false,
          message: 'courseId is required',
        });
      }

      const updates: UpdateCourseRequest = JSON.parse(body || '{}');
      const course = await courseService.updateCourse(courseId, updates);

      return createCorsResponse(200, {
        success: true,
        message: 'Course updated successfully',
        data: course,
      });
    }

    case 'DELETE': {
      // Delete course (soft delete)
      if (!courseId) {
        return createCorsResponse(400, {
          success: false,
          message: 'courseId is required',
        });
      }

      await courseService.deleteCourse(courseId);

      return createCorsResponse(200, {
        success: true,
        message: 'Course deleted successfully',
      });
    }

    default:
      return createCorsResponse(405, {
        success: false,
        message: 'Method not allowed',
      });
  }
}
