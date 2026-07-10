import { auth } from "@/auth";
import { BookLibrary } from "@/components/book/book-library";
import { getBookCollectionsByUserId } from "@/services/book";
import { getWorkspacesByUserId } from "@/services/workspace";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Book",
  description: "Read and write your favorite books",
};

const BookPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [workspaces, collections] = await Promise.all([
    getWorkspacesByUserId(session.user.id),
    getBookCollectionsByUserId(session.user.id),
  ]);

  return (
    <BookLibrary
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        icon: workspace.icon,
        currentUserRole: workspace.currentUserRole,
      }))}
      collections={collections}
    />
  );
};

export default BookPage;
