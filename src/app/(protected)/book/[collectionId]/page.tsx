import { auth } from "@/auth";
import { BookCollectionDetail } from "@/components/book/book-collection-detail";
import { getBookCollectionDetail } from "@/services/book";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Book collection",
  description: "Read and manage book volumes",
};

export default async function BookCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { collectionId } = await params;
  const collection = await getBookCollectionDetail(
    session.user.id,
    collectionId,
  );

  if (!collection) {
    notFound();
  }

  return <BookCollectionDetail collection={collection} />;
}
