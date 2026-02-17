import ConquestDetailClient from "./ConquestDetailClient";

// For static export: conquest routes are stored in localStorage (runtime),
// so we return an empty array and disable dynamic params.
export const dynamicParams = false;

export function generateStaticParams() {
    return [];
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <ConquestDetailClient id={params.id} />;
}
