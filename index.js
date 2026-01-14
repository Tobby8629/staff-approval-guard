import { Client, Databases } from "node-appwrite";

export default async ({ req, res }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const data = JSON.parse(req.body);

  const { status, createdBy, approvedBy } = data;

  // -------------------------------
  // 1️⃣ BASIC VALIDATION
  // -------------------------------
  if (status === "approved" && !approvedBy) {
    return res.json(
      { error: "approvedBy is required when status is approved" },
      400
    );
  }

  if (status === "approved" && approvedBy === createdBy) {
    return res.json(
      { error: "Self-approval is not allowed" },
      403
    );
  }

  // -------------------------------
  // 2️⃣ FETCH APPROVER ROLE (SAFE)
  // -------------------------------
  const staffResult = await databases.listDocuments(
    process.env.DB_ID,
    "staff",
    [
      // approvedBy is an Auth userId
      // staff.userId stores auth userId
      { equal: ["userId", approvedBy] }
    ]
  );

  if (staffResult.total === 0) {
    return res.json(
      { error: "Approver staff record not found" },
      404
    );
  }

  const approverRole = staffResult.documents[0].role;

  // -------------------------------
  // 3️⃣ ROLE VALIDATION
  // -------------------------------
  if (status === "approved" && !["manager", "admin"].includes(approverRole)) {
    return res.json(
      { error: "Only managers or admins can approve schedules" },
      403
    );
  }

  // -------------------------------
  // 4️⃣ WRITE TO DATABASE
  // -------------------------------
  // create or update staff_shift_assignments here

  return res.json({ success: true });
};
