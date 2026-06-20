/* Renders a JSON-LD <script> for structured data (Google rich results). */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // structured data is trusted, app-authored content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
