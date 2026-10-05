import { runReminderAutomation } from "../../src/lib/reminder-automation";
import { runTaskDeadlineScan } from "../../src/lib/task-notify";

export default async function reminderScan() {
  const attendance = await runReminderAutomation();
  const tasks = await runTaskDeadlineScan();
  return new Response(JSON.stringify({ attendance, tasks }), {
    headers: { "content-type": "application/json" },
  });
}

