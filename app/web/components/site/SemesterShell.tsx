// web/components/site/SemesterShell.tsx
import React from "react";

export default function SemesterShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4 surface">
      <div className="flex items-center justify-between">
        {header}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
