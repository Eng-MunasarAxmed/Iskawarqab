const cron = require("node-cron");
const AuditLog = require("./model/AuditLog.service");

// =====================================================
// DELETE OLD AUDIT LOGS
// KEEP CURRENT MONTH + 2 PREVIOUS MONTHS
// DELETE EVERYTHING OLDER THAN THAT
// =====================================================

const deleteOldAuditLogs = async () => {
  try {
    const now = new Date();

    // Bilowga bisha 3-aad ee hadda laga soo bilaabo
    //
    // August:
    // KEEP  -> August, July, June
    // DELETE -> May iyo wixii ka horreeya
    //
    // September:
    // KEEP  -> September, August, July
    // DELETE -> June iyo wixii ka horreeya

    const cutoffDate = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      1,
      0,
      0,
      0,
      0,
    );

    const result = await AuditLog.deleteMany({
      createdAt: {
        $lt: cutoffDate,
      },
    });

    console.log(
      `[AUDIT CLEANUP] Deleted ${result.deletedCount} old audit logs.`,
    );

    console.log(
      `[AUDIT CLEANUP] Keeping logs from: ${cutoffDate.toISOString()}`,
    );
  } catch (error) {
    console.error("[AUDIT CLEANUP ERROR]:", error);
  }
};

// =====================================================
// RUN EVERY 1st DAY OF MONTH AT 00:05
// =====================================================

cron.schedule("5 0 1 * *", async () => {
  console.log("[CRON] Monthly audit-log cleanup started...");

  await deleteOldAuditLogs();

  console.log("[CRON] Monthly audit-log cleanup finished.");
});

module.exports = {
  deleteOldAuditLogs,
};
