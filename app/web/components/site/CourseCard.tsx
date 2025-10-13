import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  courseId: string;
  subject?: string;
  number?: string;
  title?: string;
  prereqText?: string;
  credits?: number;
};

export function CourseCard({ courseId, subject, number, title, prereqText, credits }: Props) {
  return (
    <Card className="p-4 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="text-lg font-semibold">
          {subject} {number} — {title}
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {typeof credits === "number" && <Badge variant="secondary">{credits} cr</Badge>}
          {prereqText && (
            <Badge variant="outline" className="max-w-[40ch] truncate">
              Prereq: {prereqText}
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <Link href={`/c/${encodeURIComponent(courseId)}`} className="text-primary underline text-sm">
          View
        </Link>
      </div>
    </Card>
  );
}
