export default function Home() {
  const requirements = [
    "Zoho Creator Professional plan or higher with Deluge scripting enabled",
    "Zoho Sign organization configured with templates and email sending domain",
    "Server-based connection in Creator for Zoho Sign (scope: ZohoSign.documents.CREATE & ZohoSign.documents.READ)",
    "A Creator form module to collect signer details and trigger the workflow",
    "Zoho WorkDrive folder (optional) if you want to archive completed documents",
  ];

  const flowSteps = [
    {
      title: "Collect deal data in Creator",
      description:
        "Capture signer information and business context with a Creator form. Use field rules to keep your payload clean and validated.",
      result: "Consolidated record ready to send to Zoho Sign",
    },
    {
      title: "Generate or pick a Zoho Sign template",
      description:
        "Store a template ID in a Creator variable or fetch it dynamically via the Zoho Sign API. Templates keep the document layout and merge fields in sync.",
      result: "Template ID available to Deluge script",
    },
    {
      title: "Trigger Deluge integration task",
      description:
        "Invoke a server-side Deluge function from a workflow, schedule, or button. The function calls the Zoho Sign API with the collected data.",
      result: "Zoho Sign request created and emails dispatched",
    },
    {
      title: "Track execution and update status",
      description:
        "Use webhooks or polling to pull the signing status back into Creator so users can monitor progress without leaving the app.",
      result: "Creator record reflects real-time signing status",
    },
  ];

  const signRequestSnippet = `// Signature request using a Zoho Sign connection called "zoho_sign_connection"
templateId = "1234567890"; // Replace with your Zoho Sign template ID

signersList = List();
signer = Map();
signer.put("recipient_name", input.Signatory_Full_Name);
signer.put("recipient_email", input.Signatory_Email);
signer.put("action", "SIGN");
signer.put("language", "en");
signersList.add(signer);

payload = Map();
payload.put("request_name", "Sales Quote Confirmation - " + input.Quote_ID);
payload.put("is_sequential", true);
payload.put("actions", signersList);
payload.put("template_id", templateId);
payload.put("notes", "Generated from Zoho Creator on " + zoho.currenttime.toString("yyyy-MM-dd"));

connectionName = "zoho_sign_connection";
headersMap = Map();
headersMap.put("Content-Type", "application/json");

response = invokeurl
[
  url :"https://sign.zoho.com/api/v1/requests"
  type :POST
  parameters: payload.toString()
  connection: connectionName
  headers: headersMap
];

if (response.get("status_code") == "SIGN_REQUEST_CREATED")
{
  info "Request created: " + response.get("requests").get(0).get("request_id");
  // Update your Creator record to store the request ID for status tracking
  input.Zoho_Sign_Request_ID = response.get("requests").get(0).get("request_id");
}
else
{
  throw "Zoho Sign creation failed: " + response;
}`;

  const statusSyncSnippet = `requestId = input.Zoho_Sign_Request_ID;

if (requestId != null)
{
  response = invokeurl
  [
    url :"https://sign.zoho.com/api/v1/requests/" + requestId
    type :GET
    connection: "zoho_sign_connection"
  ];

  currentStatus = response.get("requests").get(0).get("request_status");
  input.Zoho_Sign_Status = currentStatus;

  if (currentStatus == "COMPLETED")
  {
    signedFile = invokeurl
    [
      url :"https://sign.zoho.com/api/v1/requests/" + requestId + "/document"
      type :GET
      connection: "zoho_sign_connection"
    ];
    // Save the signedFile stream to WorkDrive or a file upload field
  }
}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16 md:px-10 lg:px-16">
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-10 shadow-xl shadow-slate-900/40">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
              Zoho Sign + Creator
            </span>
            <h1 className="text-4xl font-semibold md:text-5xl">
              Automate document signing in Zoho Creator with Deluge.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              This implementation guide walks through the exact setup required
              to trigger Zoho Sign requests directly from Zoho Creator, manage
              signer workflows, and synchronize statuses back to your app using
              clean, reusable Deluge functions.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-slate-800 px-4 py-1">
                Deluge server scripts
              </span>
              <span className="rounded-full border border-slate-800 px-4 py-1">
                OAuth-based connections
              </span>
              <span className="rounded-full border border-slate-800 px-4 py-1">
                Status sync patterns
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Implementation checklist</h2>
            <p className="mt-2 text-sm text-slate-400">
              Validate these items before connecting Creator to Zoho Sign.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-300">
              {requirements.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Connection configuration</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <p>
                In Creator, open <strong>Setup → Connections → Add Connection</strong>. Choose{" "}
                <strong>Zoho OAuth</strong>, select <strong>Server-based</strong>, and grant the scopes:
                <code className="ml-2 rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
                  ZohoSign.documents.CREATE
                </code>{" "}
                <code className="ml-2 rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
                  ZohoSign.documents.READ
                </code>
              </p>
              <p>
                Name the connection <strong>zoho_sign_connection</strong> to align with the Deluge samples
                below. Enable <strong>Use Connection in Server-Side scripts</strong>.
              </p>
              <p>
                If you need to merge Creator form data into document fields, configure them as variables in the
                Zoho Sign template and match the keys you send from Deluge.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10">
          <h2 className="text-2xl font-semibold">Reference workflow</h2>
          <p className="mt-3 max-w-3xl text-base text-slate-300">
            Layer these building blocks inside a Creator workflow rule. Each step outputs information that the
            next step uses to keep the automation deterministic and debuggable.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {flowSteps.map((step) => (
              <article
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-100">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-300">{step.description}</p>
                <p className="mt-auto text-xs uppercase tracking-wide text-emerald-400">
                  Output: {step.result}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/60 p-8">
            <h2 className="text-xl font-semibold text-emerald-300">
              Deluge: create signing request
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Run this from a Creator workflow or custom action when a form is submitted. Make sure the input
              fields referenced in the script exist on the form (for example{" "}
              <code className="text-xs">Signatory_Full_Name</code> and <code className="text-xs">Signatory_Email</code>).
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200">
              <code>{signRequestSnippet}</code>
            </pre>
          </div>

          <div className="rounded-3xl border border-sky-500/30 bg-slate-900/60 p-8">
            <h2 className="text-xl font-semibold text-sky-300">
              Deluge: refresh signing status
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Schedule this as a periodic function (e.g. every 15 minutes) or call it via webhook to keep
              Creator aligned with Zoho Sign. When completed, archive the signed document where your process
              expects it.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200">
              <code>{statusSyncSnippet}</code>
            </pre>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-xl font-semibold">Best practices & troubleshooting</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate-300">
            <li>
              Add structured logging with <code className="text-xs">info</code> and <code className="text-xs">debug</code> statements so admins can audit every attempt.
            </li>
            <li>
              Store the Zoho Sign request ID and the latest status in Creator fields; never rely solely on email notifications.
            </li>
            <li>
              Handle failures by capturing the <code className="text-xs">code</code> and <code className="text-xs">message</code> returned from Zoho Sign and surfacing it in a Creator report for quick remediation.
            </li>
            <li>
              Use merge fields in the Zoho Sign template for dynamic values. Populate them by adding a <code className="text-xs">field_data</code> map to the payload when needed.
            </li>
            <li>
              For multi-signer workflows, extend <code className="text-xs">signersList</code> with additional recipient maps and sequence numbers to control the signing order.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
