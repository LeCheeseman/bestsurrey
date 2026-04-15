/**
 * JsonLd — renders a JSON-LD <script> block.
 * Used on individual pages for page-level schema (breadcrumbs, collection, listing).
 * Sitewide schema (Organization, WebSite) is rendered in layout.tsx.
 */

interface JsonLdProps {
  id: string
  schema: object | object[]
}

export function JsonLd({ id, schema }: JsonLdProps) {
  const schemas = Array.isArray(schema) ? schema : [schema]

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={`${id}-${i}`}
          id={`${id}-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  )
}
