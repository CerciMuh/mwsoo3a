/**
 * Student Encyclopedia Lambda Handler
 * Read-only browse endpoints filtered by student's university
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createOptionsResponse, createCorsResponse } from './middleware/cors';
import { requireStudent } from './middleware/auth';
import { handleError } from './utils/errors';
import * as browseService from './services/browse.service';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Request:', JSON.stringify(event, null, 2));

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return createOptionsResponse();
  }

  try {
    // Require student authentication for all requests
    const student = await requireStudent(event);
    console.log('Authenticated student:', student.email, 'from', student.universityDomain);

    const { httpMethod, path, pathParameters } = event;

    // Only GET requests allowed
    if (httpMethod !== 'GET') {
      return createCorsResponse(405, {
        success: false,
        message: 'Method not allowed',
      });
    }

    // Route requests - check more specific paths first!
    if (path.includes('/encyclopedia/degrees/') && path.includes('/courses')) {
      // /encyclopedia/degrees/{id}/courses
      return await handleCourseRequests(pathParameters, student.universityDomain, path);
    }

    if (path.includes('/encyclopedia/courses/') && path.includes('/notes')) {
      // /encyclopedia/courses/{id}/notes
      return await handleNoteRequests(pathParameters, student.universityDomain, path);
    }

    if (path.includes('/encyclopedia/degrees')) {
      return await handleDegreeRequests(pathParameters, student.universityDomain);
    }

    if (path.includes('/encyclopedia/courses')) {
      return await handleCourseRequests(pathParameters, student.universityDomain, path);
    }

    if (path.includes('/encyclopedia/notes')) {
      return await handleNoteRequests(pathParameters, student.universityDomain, path);
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
 * Handle degree requests
 */
async function handleDegreeRequests(
  pathParameters: { [key: string]: string | undefined } | null,
  universityDomain: string
): Promise<APIGatewayProxyResult> {
  const degreeId = pathParameters?.id;

  if (degreeId) {
    // GET /encyclopedia/degrees/{id}
    const degree = await browseService.getDegreeById(degreeId, universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: degree,
    });
  } else {
    // GET /encyclopedia/degrees - List all degrees for student's university
    const degrees = await browseService.listDegrees(universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: degrees,
    });
  }
}

/**
 * Handle course requests
 */
async function handleCourseRequests(
  pathParameters: { [key: string]: string | undefined } | null,
  universityDomain: string,
  path: string
): Promise<APIGatewayProxyResult> {
  const id = pathParameters?.id;

  // Check if this is /encyclopedia/degrees/{id}/courses
  if (path.includes('/degrees/') && path.endsWith('/courses')) {
    // List courses by degree
    if (!id) {
      return createCorsResponse(400, {
        success: false,
        message: 'degreeId is required',
      });
    }
    
    const courses = await browseService.listCoursesByDegree(id, universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: courses,
    });
  }
  
  // /encyclopedia/courses/{id}
  if (id) {
    const course = await browseService.getCourseById(id, universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: course,
    });
  }

  return createCorsResponse(400, {
    success: false,
    message: 'courseId is required',
  });
}

/**
 * Handle note requests
 */
async function handleNoteRequests(
  pathParameters: { [key: string]: string | undefined } | null,
  universityDomain: string,
  path: string
): Promise<APIGatewayProxyResult> {
  const id = pathParameters?.id;

  // Check if this is /encyclopedia/courses/{id}/notes
  if (path.includes('/courses/') && path.endsWith('/notes')) {
    // List notes by course
    if (!id) {
      return createCorsResponse(400, {
        success: false,
        message: 'courseId is required',
      });
    }
    
    const notes = await browseService.listNotesByCourse(id, universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: notes,
    });
  }
  
  // /encyclopedia/notes/{id}
  if (id) {
    const note = await browseService.getNoteById(id, universityDomain);
    
    return createCorsResponse(200, {
      success: true,
      data: note,
    });
  }

  return createCorsResponse(400, {
    success: false,
    message: 'noteId is required',
  });
}
