"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardPreview } from "@/components/card-generator/CardPreview";
import { Student, CardTemplate } from "@/types/card-generator";
import { IconDownload, IconPrinter } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ClassSelector } from "./ClassSelector";
import { classStudents } from "@/services/students.service";
import pb from "@/lib/pb";
import Link from "next/link";

import { Classes } from "@/types/classes.types";

const cardTemplates: CardTemplate[] = [
  {
    id: "1",
    name: "Classic Blue",
    preview: "classic-blue",
    bgColor: "bg-blue-50",
  },
  {
    id: "2",
    name: "Modern Dark",
    preview: "modern-dark",
    bgColor: "bg-gray-900 text-white",
  },
  {
    id: "3",
    name: "Gradient",
    preview: "gradient",
    bgColor: "bg-gradient-to-r from-cyan-50 to-blue-50",
  },
];

export default function CardGeneratorPage() {
  const [selectedClass, setSelectedClass] = useState<Classes | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState([]);

  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(
    cardTemplates[0]
  );

  useEffect(() => {
    if (selectedClass?.id) {
      (async () => {
        try {
          const res: any = await classStudents(selectedClass.id);
          console.log(res);
          setStudents(res);
        } catch (err: any) {
          console.error("ERROR: ", err);
          console.error("PB ERROR: ", err.response);
        }
      })();
    }
  }, [selectedClass]);

  const handleExportPDF = () => {
    console.log("Exporting PDF...");
    // Add PDF export logic here
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Card Generator</CardTitle>
            <div className={`flex gap-2 ${!selectedClass?.id && "hidden"}`}>
              <Link
                href={"/print/single/" + selectedStudent?.id}
                className={`${!selectedStudent?.id && "hidden"}`}
              >
                <Button variant="outline" onClick={handleExportPDF}>
                  <IconPrinter className="mr-2 h-4 w-4" />
                  Print Selected
                </Button>
              </Link>

              <Link href={"/print/" + selectedClass?.id}>
                <Button onClick={handleExportPDF}>
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export All as PDF
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <ClassSelector
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {students.map((student: any) => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedStudent?.id === student.id
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              className="rounded-full object-cover"
                              src={pb.files.getURL(
                                student,
                                student.profileImage
                              )}
                              alt={student.name}
                            />
                            <AvatarFallback className="border p-2 rounded-full">
                              {student.name
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Reg No: {student.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Card Preview</h3>
                <CardPreview
                  student={selectedStudent}
                  // template={selectedTemplate}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
