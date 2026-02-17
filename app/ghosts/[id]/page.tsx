import GhostDetailClient from "./GhostDetailClient";

// For static export: ghost runs are stored in localStorage (runtime),
// so we return an empty array and disable dynamic params.
export const dynamicParams = false;

export function generateStaticParams() {
    return [];
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <GhostDetailClient id={params.id} />;
}
