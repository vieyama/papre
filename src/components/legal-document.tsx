import type { LegalDocument } from "@/i18n/legal/types";

const CONTACT_EMAIL = "support@brisya.my.id";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const lastIndex = doc.sections.length - 1;

  return (
    <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
      <p>{doc.intro}</p>

      {doc.sections.map((section, index) => (
        <section key={section.heading}>
          <h2 className="text-lg font-semibold tracking-tight">
            {section.heading}
          </h2>

          {section.paragraphs?.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} className="mt-2 text-muted-foreground">
              {paragraph}
              {index === lastIndex && paragraphIndex === (section.paragraphs?.length ?? 1) - 1 && (
                <>
                  {" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="underline underline-offset-4"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </>
              )}
            </p>
          ))}

          {section.list && (
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
              {section.list.map((item) => (
                <li key={item.term}>
                  <span className="font-medium text-foreground">{item.term}</span>{" "}
                  {item.description}
                </li>
              ))}
            </ul>
          )}

          {section.listFootnote && (
            <p className="mt-2 text-muted-foreground">{section.listFootnote}</p>
          )}
        </section>
      ))}
    </div>
  );
}
