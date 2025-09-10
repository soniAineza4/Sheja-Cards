"use client";

import pb from "@/lib/pb";
import { createLog } from "./logs.service";
import { Students } from "@/types/student.types";

export const recentStudents = async () => {
  const schoolId = pb.authStore.record?.school;
  const academicYear = localStorage.getItem("academicYear");
  const recent = await pb.collection("students").getList(1, 5, {
    filter: `school="${schoolId}"&& academicYear="${academicYear}"`,
    expand: "Class",
    sort: "-created",
  });

  return recent;
};

export const fetchStudents = async (selectedClass: string) => {
  const schoolId = pb.authStore.record?.school;
  const academicYear = localStorage.getItem("academicYear");
  const className = selectedClass == "-" ? "" : selectedClass.split(" ")[0];
  const classCombination =
    selectedClass == "-" ? "" : selectedClass.split(" ")[1];
  //   console.log(selectedClass);
  const res = await pb.collection("students").getFullList({
    expand: "Class",
    filter: `school = "${schoolId}" && academicYear="${academicYear}" && isDeleted = false && Class.name="${className}" && Class.combination="${classCombination}"`,
  });

  return res;
};
export const classStudents = async (classId: string) => {
  const schoolId = pb.authStore.record?.school;
  const academicYear = localStorage.getItem("academicYear");

  console.log(classId);

  const res = await pb.collection("students").getFullList({
    expand: "Class",
    filter: `school = "${schoolId}" && academicYear="${academicYear}" && isDeleted = false && Class="${classId}"`,
  });
  return res;
};
export const createStudent = async ({
  data,
  Class,
}: {
  data: { name: string; gender: string; dateOfBirth: Date | string; registrationNumber?: string; profileImage?: File; [key: string]: any };
  Class: any;
}) => {
  const schoolId = pb.authStore.record?.school;
  const academicYear = localStorage.getItem("academicYear");
  const classId = await pb
    .collection("classes")
    .getFirstListItem(
      `school = "${schoolId}" && name="${
        Class.split(" ")[0]
      }" && combination="${
        Class.split(" ")[1]
      }" && academicYear="${academicYear}"`
    );
  if (!classId) {
    throw new Error("Class not found");
  }

  const res = await pb.collection("students").create(
    {
      ...data,
      registrationNumber:
        data.registrationNumber ||
        Class.split(" ").join("") + "-" + Math.floor(Math.random() * 1000),
      school: schoolId,
      Class: classId.id,
      academicYear,
      status: "ACTIVE",
    },
    { expand: "Class" }
  );

  // Log the student creation
  await createLog({
    action: "STUDENT_CREATED",
    description: `Student "${(data as any).firstName} ${
      (data as any).lastName
    }" was created in class ${Class}`,
    entityType: "student",
    entityId: res.id,
    metadata: {
      studentName: `${(data as any).firstName} ${(data as any).lastName}`,
      className: Class,
      academicYear,
    },
  });

  return res;
};

export const updateStudent = async (id: string, body: Partial<Students>) => {
  const schoolId = pb.authStore.record?.school;
  const res = await pb.collection("students").update(
    id,
    { ...body, school: schoolId },
    {
      expand: "Class",
    }
  );

  // Log the student update
  await createLog({
    action: "STUDENT_UPDATED",
    description: `Student "${res.firstName} ${res.lastName}" was updated`,
    entityType: "student",
    entityId: id,
    metadata: {
      studentName: `${res.firstName} ${res.lastName}`,
      updatedFields: Object.keys(body),
    },
  });

  return res;
};

export const deleteStudent = async (id: string) => {
  const student = await pb.collection("students").getOne(id);
  await pb.collection("students").update(id, { isDeleted: true });

  // Log the student deletion
  await createLog({
    action: "STUDENT_DELETED",
    description: `Student "${student.firstName} ${student.lastName}" was deleted`,
    entityType: "student",
    entityId: id,
    metadata: {
      studentName: `${student.firstName} ${student.lastName}`,
      className: student.Class?.name,
    },
  });
};

export const getStudent = async (id: string) => {
  const res = await pb.collection("students").getOne(id);
  return res;
};

export const createBulkStudents = async ({
  data,
  Class,
}: {
  data: Array<{
    name: string;
    gender: string;
    dateOfBirth: string;
    registrationNumber: string;
    profileImage: File;
  }>;
  Class: string;
}) => {
  const schoolId = pb.authStore.record?.school;
  const academicYear = localStorage.getItem("academicYear");
  const classId = await pb
    .collection("classes")
    .getFirstListItem(
      `school = "${schoolId}" && name="${
        Class.split(" ")[0]
      }" && combination="${
        Class.split(" ")[1]
      }" && academicYear="${academicYear}"`
    );

  if (!classId) {
    throw new Error("Class not found");
  }

  const createdStudents = await Promise.all(
    data.map(async (studentData) => {
      const formData = new FormData();
      formData.append("profileImage", studentData.profileImage);
      formData.append("name", studentData.name);
      formData.append("gender", studentData.gender);
      formData.append("dateOfBirth", studentData.dateOfBirth);
      formData.append("registrationNumber", studentData.registrationNumber);
      formData.append("school", schoolId);
      formData.append("Class", classId.id);
      formData.append("academicYear", academicYear as string);
      formData.append("status", "ACTIVE");

      const student = await pb.collection("students").create(formData, {
        expand: "Class",
      });

      await createLog({
        action: "STUDENT_CREATED",
        description: `Student "${studentData.name}" was created in class ${Class}`,
        entityType: "student",
        entityId: student.id,
        metadata: {
          studentName: studentData.name,
          className: Class,
          academicYear,
        },
      });

      return student;
    })
  );

  return createdStudents;
};
