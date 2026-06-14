import {
  encryptUserData,
  ensureUserEncryptionKey,
  isEncryptedValue,
} from "../src/lib/data-encryption";
import prisma from "../src/lib/prisma";

async function main() {
  const workspaces = await prisma.workspace.findMany({
    select: {
      id: true,
      ownerId: true,
      nodes: {
        select: {
          id: true,
          title: true,
          pageContent: {
            select: {
              id: true,
              contentText: true,
            },
          },
        },
      },
    },
  });

  let encryptedTitles = 0;
  let encryptedContents = 0;

  for (const workspace of workspaces) {
    await ensureUserEncryptionKey(workspace.ownerId);

    for (const node of workspace.nodes) {
      const encryptedTitle = isEncryptedValue(node.title)
        ? null
        : await encryptUserData(
            workspace.ownerId,
            `node:${node.id}:title`,
            node.title,
          );
      const content = node.pageContent?.contentText;
      const encryptedContent =
        content != null && !isEncryptedValue(content)
          ? await encryptUserData(
              workspace.ownerId,
              `node:${node.id}:content`,
              content,
            )
          : null;

      await prisma.$transaction([
        ...(encryptedTitle
          ? [
              prisma.node.update({
                where: { id: node.id },
                data: { title: encryptedTitle },
              }),
            ]
          : []),
        ...(encryptedContent && node.pageContent
          ? [
              prisma.pageContent.update({
                where: { id: node.pageContent.id },
                data: { contentText: encryptedContent },
              }),
            ]
          : []),
      ]);

      if (encryptedTitle) encryptedTitles += 1;
      if (encryptedContent) encryptedContents += 1;
    }
  }

  console.log(
    `Encrypted ${encryptedTitles} node titles and ${encryptedContents} page contents.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
