import InvoicePrint from "@/views/InvoicePrint";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  return <InvoicePrint id={id} />;
}
