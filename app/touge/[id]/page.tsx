import { allCircuits } from "../data";
import TougeDetailClient from "./TougeDetailClient";

// Generate static params for all circuits at build time
export function generateStaticParams() {
    return allCircuits.map((circuit) => ({
        id: circuit.id,
    }));
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <TougeDetailClient id={params.id} />;
}
