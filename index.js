import { Client, Databases } from "node-appwrite";

export default async ({ req, res }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const data = JSON.parse(req.body);

  const {
    status,
    createdBy,
    approvedBy
  } = data;

  // 1️⃣ approvedBy must exist when approving
  if (status === "approved" && !approvedBy) {
    return res.json(
      { error: "approvedBy is required when status is approved" },
      400
    );
  }

  // 2️⃣ Prevent self-approval
  if (status === "approved" && approvedBy === createdBy) {
    return res.json(
      { error: "Self-approval is not allowed" },
      403
    );
  }

  // Save document
  const document = await databases.createDocument(
    process.env.DB_ID,
    process.env.COLLECTION_ID,
    "unique()",
    data
  );

  return res.json(document);
};
