import { Request, Response } from 'express';
import { Course, Section, Student } from '../models';
import { ApiResponse } from '../types';
import { AppError, asyncHandler } from '../utils/errorHandler';

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { studentId, name, email, courses = [] } = req.body;

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        throw new AppError('Section not found', 404);
    }

    // Verify courses belong to the section
    if (courses.length > 0) {
        const coursesCount = await Course.countDocuments({
            _id: { $in: courses },
            sectionId,
        });

        if (coursesCount !== courses.length) {
            throw new AppError('Some courses do not belong to this section', 400);
        }
    }

    const student = await Student.create({
        studentId,
        name,
        email,
        sectionId,
        courses,
    });

    const populatedStudent = await Student.findById(student._id).populate('courses', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: populatedStudent,
        message: 'Student created successfully',
    };

    res.status(201).json(response);
});

export const createStudentsBatch = asyncHandler(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { students } = req.body;

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        throw new AppError('Section not found', 404);
    }

    // Get all course IDs from students
    const allCourseIds = [...new Set(students.flatMap((s: any) => s.courses || []))];

    // Verify all courses belong to the section
    if (allCourseIds.length > 0) {
        const coursesCount = await Course.countDocuments({
            _id: { $in: allCourseIds },
            sectionId,
        });

        if (coursesCount !== allCourseIds.length) {
            throw new AppError('Some courses do not belong to this section', 400);
        }
    }

    // Add sectionId to each student
    const studentsWithSection = students.map((student: any) => ({
        ...student,
        sectionId,
    }));

    const createdStudents = await Student.insertMany(studentsWithSection);

    const response: ApiResponse<any> = {
        success: true,
        data: createdStudents,
        message: `${createdStudents.length} students created successfully`,
    };

    res.status(201).json(response);
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const student = await Student.findById(id)
        .populate('sectionId', 'name code')
        .populate('courses', 'name code');

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    const response: ApiResponse<any> = {
        success: true,
        data: student,
    };

    res.status(200).json(response);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { studentId, name, email, courses } = req.body;

    const student = await Student.findById(id);

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // If courses are being updated, verify they belong to the student's section
    if (courses && courses.length > 0) {
        const coursesCount = await Course.countDocuments({
            _id: { $in: courses },
            sectionId: student.sectionId,
        });

        if (coursesCount !== courses.length) {
            throw new AppError('Some courses do not belong to this section', 400);
        }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        id,
        { studentId, name, email, courses },
        { new: true, runValidators: true }
    ).populate('courses', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: updatedStudent,
        message: 'Student updated successfully',
    };

    res.status(200).json(response);
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        message: 'Student deleted successfully',
    };

    res.status(200).json(response);
});

export const addStudentToCourses = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { courseIds } = req.body;

    const student = await Student.findById(id);

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Verify courses belong to the student's section
    const coursesCount = await Course.countDocuments({
        _id: { $in: courseIds },
        sectionId: student.sectionId,
    });

    if (coursesCount !== courseIds.length) {
        throw new AppError('Some courses do not belong to this section', 400);
    }

    // Add courses to student (avoid duplicates)
    const updatedStudent = await Student.findByIdAndUpdate(
        id,
        { $addToSet: { courses: { $each: courseIds } } },
        { new: true }
    ).populate('courses', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: updatedStudent,
        message: 'Student added to courses successfully',
    };

    res.status(200).json(response);
});

export const removeStudentFromCourses = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { courseIds } = req.body;

    const student = await Student.findById(id);

    if (!student) {
        throw new AppError('Student not found', 404);
    }

    // Remove courses from student
    const updatedStudent = await Student.findByIdAndUpdate(
        id,
        { $pull: { courses: { $in: courseIds } } },
        { new: true }
    ).populate('courses', 'name code');

    const response: ApiResponse<any> = {
        success: true,
        data: updatedStudent,
        message: 'Student removed from courses successfully',
    };

    res.status(200).json(response);
});