Tab 1

\# Wiggy Production

\#\# Feature Summary and Current System State Document  
Tzipi & Fradi Wig Production  
Updated: 25.06.2026  
This document describes what already exists and is currently working in the system today: workflow, roles, features, settings, technical dependencies, and known gaps. It does not include code. Rather, it is a product and operational description intended to serve as a basis for further specification, transition planning, and development prioritization.

\#\# Short Table of Contents  
1\. Roles and permissions  
2\. Main workflow  
3\. Existing system features  
4\. Main technical dependencies  
5\. What is configurable versus what is fixed in code  
6\. Known gaps

\#\# 1\. Roles and Permissions  
There are four roles, defined in the user\_roles table, not in the profile. They are enforced both through RLS and in the UI (src/lib/permissions.ts).  
Role | Who | What they see / can do  
admin | System owner | Everything, including user management, branding, and admin actions.  
manager | Fradi, Tzipi | All operations, approvals, operational settings (staff, order types, templates, intake forms), and feedback.  
secretary | Sarah | Customers, creating/editing orders, starting a process, and viewing the production board.  
worker | Production workers | Dashboard, orders (viewing), and production board.  
Enforcement is done through \<ProtectedRoute check={can.X}\> on every route, and sensitive RPC calls check is\_manager\_or\_admin on the DB side.  
Configurable: assigning a role to a user (admin only, through the users screen).  
Not configurable: permissions per action. These are hardcoded in permissions.ts and in RLS.

\#\# 2\. Main Workflow  
Customer | Creates a new order through the wizard.  
Draft | The order is saved as a draft until the process is started.  
Start process | Tasks are created according to the work template, and the order moves into production.  
Task execution | Tasks move from waiting for execution through to completion.  
Approval and control | Tasks that require approval move to approval or return for correction.  
Completion and pickup | After all tasks are completed, the order is ready for pickup and is manually marked as collected.  
Order statuses: draft, intake, planning, ready\_for\_appointment, in\_production, waiting\_approval, ready\_for\_pickup, completed, collected, cancelled.  
Task statuses: pending, in\_progress, submitted\_for\_approval, approved, returned\_for\_correction, completed, skipped, cancelled, plus temporary deferral through deferred via RPC.  
Status transitions always go through RPC (task\_transition, task\_defer, task\_resume, start\_work\_order, cancel\_work\_order), not through direct client mutation. Every RPC calls log\_audit and then recalculate\_work\_order\_status to update the overall order status.

\#\# 3\. Features — Full Breakdown

\#\#\# 3.1 Authentication and Login (Auth)  
What: Login screens, “forgot password,” password reset. Through Supabase Auth (email \+ password).  
How: src/pages/auth/\*, src/contexts/AuthContext.tsx. On first login, the RPC bootstrap\_current\_user is called to create/link the profile and business.  
Purpose: Every access requires login; there is no open self-registration.  
Configurable: No. Users are created manually or through the users screen.  
Dependencies: Supabase Auth; tables: profiles, user\_roles, businesses.

\#\#\# 3.2 Dashboard  
What: Home page (/) showing an overview of active work.  
How: src/pages/Dashboard.tsx. Counts by status/dates.  
Purpose: “What is happening today” — where orders currently stand.  
Configurable: No.

\#\#\# 3.3 Customer Management  
What: Customer list, customer profile, create/edit.  
How: src/pages/customers/CustomersList.tsx, CustomerForm.tsx, CustomerProfile.tsx. Standard fields: name, phone, email, notes.  
Purpose: Customer database for linking to orders; full customer history.  
Permissions: Office staff only (secretary/manager/admin).  
Configurable: No. Fields are fixed.  
Dependencies: customers table.

\#\#\# 3.4 Work Order Types  
What: Definition of order types (new wig, upgrade, repair, etc.), each with a color, name, and association to a process template plus an intake form template.  
How: src/pages/settings/WorkOrderTypesSettings.tsx. Full CRUD.  
Purpose: The order type determines which intake form and which workflow will run.  
Configurable: Yes. A manager can create, edit, or mark active=false.  
Dependencies: work\_order\_types table, linked to workflow\_templates and intake\_form\_fields.

\#\#\# 3.5 Dynamic Intake Form Fields (Intake Forms)  
What: For each order type, dynamic intake form fields can be defined: field type (text/number/dropdown/etc.), required/not required, display order, and selection options.  
How: src/pages/settings/IntakeFormsSettings.tsx, intake\_form\_fields table (21 fields). Displayed in the Wizard and on the order page through OrderFormFields.tsx / OrderFormDisplay.tsx.  
Purpose: Forms tailored to the work type without code changes.  
Configurable: Yes, fully. A manager can add/delete/change fields. Template changes affect new orders only; existing orders preserve a snapshot.  
Dependencies: intake\_form\_fields; data is saved on work\_orders.intake\_data (JSON).

\#\#\# 3.6 Operation Templates  
What: “Packages” of common operations, such as sewing blocks, that can be added to a workflow template.  
How: src/pages/settings/OperationTemplatesSettings.tsx. CRUD.  
Purpose: Prevent duplication when defining process templates.  
Configurable: Yes.  
Dependencies: operation\_templates table.

\#\#\# 3.7 Workflow Templates  
What: For each order type, a template with ordered steps: title, default assignee, requires approval (yes/no), default approver, order, relative days, and link to an operation template.  
How: src/pages/settings/WorkflowTemplatesSettings.tsx. Steps are saved in workflow\_template\_steps.  
Purpose: The source of truth for automatically creating tasks when an order starts.  
Configurable: Yes. A manager designs the process. Changes affect new orders only; runtime tasks remain stable.  
Dependencies: workflow\_templates, workflow\_template\_steps, read by RPC start\_work\_order.

\#\#\# 3.8 Staff Members  
What: List of staff members: name, role, default station, active. Used as default assignees for tasks.  
How: src/pages/settings/StaffSettings.tsx. CRUD.  
Purpose: Who can be responsible for or approve a task. Separate from authentication users (profiles); not every staff member must have a user account.  
Configurable: Yes. Instead of deletion, use active=false.  
Dependencies: staff\_members.

\#\#\# 3.9 New Work Order Wizard  
What: Four-step wizard: select/create customer → select order type → fill dynamic intake form → final details (dates, notes, urgency) → create order as draft.  
How: src/pages/work-orders/NewWorkOrderWizard.tsx. Saves to work\_orders with intake\_data. Includes a local draft hook (useFormDraft).  
Purpose: Fast and accurate intake by the secretary.  
Configurable: The intake form is configurable through section 3.5.  
Dependencies: customers, work\_order\_types, intake\_form\_fields, work\_orders.

\#\#\# 3.10 Work Orders List  
What: Table with search (by number/customer), status filter, and urgency marking.  
How: src/pages/work-orders/WorkOrdersList.tsx.  
Purpose: Quickly find an order.  
Configurable: No.

\#\#\# 3.11 Work Order Detail Page  
What: Central screen for each order: details, intake form, task list, status, attachments, voice notes, and print form.  
How: src/pages/work-orders/WorkOrderDetail.tsx. Available actions depend on status and permission:  
• “Start process” (RPC start\_work\_order) — creates tasks from the template.  
• “Cancel order” (RPC cancel\_work\_order).  
• Approve/return for correction on tasks in submitted\_for\_approval (RPC task\_transition).  
• Defer task (task\_defer) / resume (task\_resume).  
• Add manual task (add\_manual\_work\_order\_task).  
• Mark “reviewed with Tzipi” on the intake form (RPC set\_intake\_reviewed\_with\_tzipi).  
Configurable: Not on the page itself. The process structure is determined by templates.  
Dependencies: work\_orders, work\_order\_tasks, task\_approvals, attachments, work\_order\_attachments, task\_comments.

\#\#\# 3.12 Work Order Tasks  
What: Runtime tasks created from the template or added manually. Fields: title, status, assignee, approver, due date, requires approval, order, return reason, source (template\_step / operation / manual), start/end times.  
How: work\_order\_tasks table (28 fields). Transitions are only through task\_transition.  
Purpose: The atomic unit of production work.  
Configurable: At the individual task level: assignment, due date, manual add/defer. The template itself is configured through Workflow Templates.

\#\#\# 3.13 Task Approval Process  
What: A task with requires\_approval=true moves to submitted\_for\_approval when completed; the default approver is set from the template. Approval → approved → completed. Return for correction → returned\_for\_correction with a reason text.  
How: RPC task\_transition with actions submit/approve/reject. Recorded in task\_approvals \+ audit log.  
Purpose: Quality control before production continues / delivery.  
Configurable: The approver and the approval requirement per template step.

\#\#\# 3.14 Adding a Manual Task  
What: A manager adds an ad-hoc task to an active order.  
How: AddManualTaskDialog.tsx \+ RPC add\_manual\_work\_order\_task.  
Purpose: Unexpected work, such as an additional repair or customer request.  
Permissions: manager/admin only.

\#\#\# 3.15 Task Defer/Resume  
What: A manager can temporarily defer a task, with a reason and an estimated resume date, and then resume it.  
How: DeferTaskDialog.tsx, RPC task\_defer / task\_resume. Recorded in the audit log.  
Purpose: A stuck task, such as missing material, does not block the rest of the flow.  
Permissions: manager/admin.

\#\#\# 3.16 Attachments  
What: Uploading files to an order.  
How: WorkOrderAttachments.tsx, tables attachments / work\_order\_attachments, Supabase Storage.  
Configurable: No. File types are open.

\#\#\# 3.17 Intake Voice Notes  
What: Recording/uploading recordings to the intake form.  
How: IntakeVoiceNotes.tsx. Stored in Storage and linked to the form.  
Purpose: Fast verbal intake instead of long typing.  
Configurable: No. There is currently no automatic transcription, only file storage.

\#\#\# 3.18 Task Comments  
What: Internal text comments on a task.  
How: TaskComments.tsx, task\_comments table.  
Purpose: Internal documentation around the task.

\#\#\# 3.19 Order / Intake Form Printing  
What: Dedicated print view for the order.  
How: WorkOrderPrint.tsx \+ print CSS (src/index.css) with \#print-area and visibility hiding for the sidebar.  
Purpose: Physical form for production/archive.  
Configurable: No.

\#\#\# 3.20 Production Board  
What: Kanban/list by production stations: planning, sewing, hand work, color, wash & set, control, appointment/pickup scheduling. Displays open tasks with quick actions.  
How: src/pages/production/ProductionBoard.tsx. Mapping task → station in productionStations.ts according to title, staff, and status. Card actions: “Done” (outline), approval/return on control tasks. Regular statuses (waiting/in progress) are hidden; “requires approval,” “urgent,” and “deferred” are highlighted. Color stripe by order type.  
Purpose: One operational picture — “what now, who is responsible, what is stuck.”  
Configurable: The station mapping itself is currently in code, not in the UI. It is planned to become editable in settings in the future.

\#\#\# 3.21 Production Calendar  
What: Calendar view of tasks/orders by dates: due date, appointment, pickup, deadline.  
How: src/pages/production/ProductionCalendar.tsx, helpers in calendarHelpers.ts. Supports printing (calendar-print-root).  
Purpose: Time-based planning, identifying load and orders approaching deadline.  
Configurable: No.

\#\#\# 3.22 Feedback Box  
What: Global feedback button: type (bug/feature/question), title, description, priority. Saved with current URL, user, and business.  
How: FeedbackButton.tsx \+ FeedbackDialog.tsx, feedback\_items table. Admin screen FeedbackSettings.tsx for managers: statuses (new/reviewed/done).  
Purpose: Collect feedback from testers without an external tool.  
Configurable: Statuses are in code.

\#\#\# 3.23 Branding Settings  
What: Business branding settings: name, logo.  
How: BrandingSettings.tsx, businesses / settings table.  
Permissions: admin only.  
Configurable: Yes.

\#\#\# 3.24 User Management  
What: User list, role assignment, link to staff member.  
How: UsersSettings.tsx, user\_roles \+ profiles \+ staff\_members.  
Permissions: admin only.  
Configurable: Yes: role and linkage. There is currently no active email invitation inside the app; user creation requires a manual/Supabase process.

\#\#\# 3.25 Audit Log  
What: audit\_logs table (11 fields), written automatically from RPCs (log\_audit) on every task transition, approval, order start, cancellation, deferral, and manual addition.  
How: Append-only in the DB.  
Purpose: Full and immutable history.  
Currently missing: There is no UI for viewing it. The data is written but not displayed to the manager on the order page. This is a known gap.

\#\#\# 3.26 Business Isolation (Multi-tenant)  
What: All operational tables are filtered by current\_business\_id() in RLS.  
How: RPC current\_business\_id reads from the user profile; every policy uses it.  
Purpose: Readiness to run several salons without data leakage.  
Configurable: Not currently in the UI. Associating a user to a business is done in the DB / bootstrap\_current\_user.

\#\#\# 3.27 RTL and Hebrew  
What: Hebrew-first interface, RTL across all screens, labels centralized in src/lib/labels.ts.  
Configurable: No. There is no active i18n.

\#\# 4\. Main Technical Dependencies  
Frontend: React 18 \+ TypeScript \+ Vite \+ TailwindCSS \+ shadcn/ui \+ React Router.  
Backend: Supabase (Postgres \+ Auth \+ Storage \+ RLS).  
State: React Context (AuthContext), TanStack Query for data calls, local hooks.  
Existing RPCs (every sensitive action goes through them):  
bootstrap\_current\_user, start\_work\_order, cancel\_work\_order, task\_transition, task\_defer, task\_resume, add\_manual\_work\_order\_task, set\_intake\_reviewed\_with\_tzipi, recalculate\_work\_order\_status, log\_audit, generate\_work\_order\_number, has\_role, is\_admin, is\_manager\_or\_admin, is\_staff, current\_business\_id, is\_assigned\_to\_task, handle\_new\_user, set\_updated\_at.  
Tables (19): businesses, profiles, user\_roles, staff\_members, customers, work\_order\_types, intake\_form\_fields, workflow\_templates, workflow\_template\_steps, operation\_templates, work\_orders, work\_order\_tasks, task\_approvals, task\_comments, attachments, work\_order\_attachments, audit\_logs, feedback\_items, settings.

\#\# 5\. Summary: What Is Configurable Versus What Is Fixed in Code  
\#\#\# Configurable in the UI  
• Staff (CRUD)  
• Order types \+ association to templates  
• Intake form fields (dynamic)  
• Operation templates  
• Workflow templates: steps, assignee, approver, approval requirement, order, days  
• Users and roles (admin only)  
• Branding (admin only)  
• Feedback statuses  
• Task assignment: assignee, due date, manual addition, deferral

\#\#\# Fixed in code (not currently configurable)  
• Names and full set of order and task statuses  
• The seven production board stations and the task → station mapping  
• Permissions for each action, by role  
• Customer fields  
• Feedback box structure  
• Field types in the intake form (fixed set)  
• Hebrew/RTL (no i18n)

\#\# 6\. Known Gaps  
The following are not part of the existing features, but are listed so the picture is complete:  
• No dedicated “mark as delivered” action → collected.  
• No UI for the audit log, although the data is written.  
• No active email user invitation from inside the application.  
• No automatic transcription of voice notes.  
• No AI / natural language queries.  
• No reminders / WhatsApp / external integrations.  
• No drag-and-drop on the production board.  
• No guided onboarding.  
Planning note: This document reflects the existing system state. For continued development, especially the transition to Cloud Code, it is recommended to create a separate document for the future architecture map and prioritization of new modules.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\# Wiggy — Feature and Infrastructure List for Continued Specification  
\# Wiggy — Feature and Infrastructure List for Continued Specification

\#\# Purpose of the Document  
Wiggy began as a system for managing the wig production process through work orders. In practice, the business need is expanding into three connected areas:  
1\. Ongoing production management.  
2\. Load planning, prioritization, and completion forecasting.  
3\. CRM and documentation of customer relationships.  
The purpose of this document is to consolidate the features that came up, understand what can already be built on the existing infrastructure, and what requires a new infrastructure or module.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 1\. Production Planning and Work Prioritization  
\#\#\# 1.1 Regular Prioritization by Due Date  
Feature: The system should know which jobs come first according to the final due date of the order. For example, if a wig is supposed to be ready within seven weeks, the system should highlight the tasks that are close to the completion date.  
Why it matters: Right now, the board shows work, but it does not truly determine priority. Fradi or the workers still need to manually decide what comes first.  
Infrastructure status: Partially exists:  
• There is a final due date for an order.  
• There is a calendar view by final due date / task due date.  
• There is an urgent flag.  
Missing:  
• Automatic prioritization on the board by due date.  
• Calculation of “how urgent this task is compared with others.”  
• Clear display of the recommended work order.  
Specification note: The first stage should be display-only prioritization, without moving dates and without changing data. In other words: show the user what should come first; do not let the system “run” all production by itself.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 1.2 Dynamic Prioritization by Urgency  
Feature: When an urgent job comes in, it should receive priority over regular jobs, even if the regular dates were ordered differently.  
Why it matters: In reality, urgent items change the work order. The system needs to reflect that without Fradi having to calculate everything in her head.  
Infrastructure status: Partially exists:  
• There is an urgent flag.  
• There is a dashboard with urgent/overdue.  
• There are badges on the board.  
Missing:  
• A real effect of urgency on work order.  
• Urgency levels, for example regular / urgent / critical.  
• Effect of urgency on completion date forecasts.  
Specification note: Do not start with a complex calculation. First define that urgent always rises to the top of the station or receives clear visual priority. Later, urgency can be allowed to move forecasts.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 1.3 Daily Capacity of Workers  
Feature: Each worker will have a setting for how much work she can perform per day. At first this can be based on number of tasks, half-days, or estimated hours. Later, the system can learn her actual pace based on real performance.  
Why it matters: Without daily capacity, it is impossible to know whether today’s tasks are realistic. The system can show 15 tasks for one worker, but it has no idea whether that is one day or one week.  
Infrastructure status: Not sufficient.  
Exists:  
• There are workers.  
• Tasks are assigned to workers in some cases.  
• There are work stations.  
Missing:  
• Daily availability per worker.  
• Work capacity.  
• Estimated task duration.  
• Measurement of actual performance.  
Specification note: The first stage does not need exact hours. It is possible to start with “simple daily capacity” based on work points or work units. For example: regular color \= 1, complex hand work \= 2, small repair \= 0.5.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 1.4 Planning Buffer  
Feature: The system will not plan workers at 100% output every day. It will leave a daily buffer for urgent work, delays, mistakes, and overplanning.  
Why it matters: People tend to think they can get more done than they actually can. If the system plans every day to the edge, one small urgent item collapses the entire week.  
Infrastructure status: Does not exist.  
Specification note: It is advisable to define a “buffer” in advance per worker or per day, for example:  
• Regular day: 80% planned capacity.  
• Busy day: 90%.  
• Day with many urgent items: the system displays overload.  
This belongs to the production planning engine, not to a small patch.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 1.5 Estimated Completion Date Forecast  
Feature: In addition to the final due date promised to the customer, the system will calculate an expected completion date based on the actual work status.  
Why it matters: The salon needs to know what to tell the customer: “approximately when it will be ready.” The original due date does not always reflect reality after deferrals, load, and urgent jobs.  
Infrastructure status: Partially exists:  
• There is a final due date.  
• There is a calendar.  
• There are open and closed tasks.  
Missing:  
• estimated\_completion\_date.  
• Calculation based on capacity.  
• Recalculation when tasks were not completed.  
• Clear difference between original due date and updated forecast.  
Specification note: Separate between:  
• final\_due\_date: what was defined/promised.  
• estimated\_completion\_date: what the system currently thinks based on reality.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 1.6 Automatic Rollover of Work Not Completed  
Feature: If a task was supposed to be done today and was not marked as “Done,” the system should move it into tomorrow’s plan or display it as a carried-over task.  
Why it matters: Right now, items can remain stuck on a calendar day that has already passed. That makes the calendar less reliable.  
Infrastructure status: Does not fully exist.  
Exists:  
• There is a task due date.  
• There is manual task deferral.  
• There is a calendar.  
Missing:  
• Automatic rollover mechanism.  
• Recalculation of load for the next days.  
• Decision whether to update actual dates or only display dynamic planning.  
Specification note: Recommended first stage: do not automatically change dates in the data. Instead, display “carried over from yesterday” and place it at the top of the list. Automatic date changes should come only after the model is stable.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 2\. Task Availability Outside a Strict Sequence  
\#\#\# 2.1 Moving from a Linear Process to Available Tasks  
Feature: Instead of each task always waiting for the previous step to be completed, the system will know which tasks are already available now, even if they are not the classic next step.  
For example:  
• Color cannot happen before sewing.  
• But color can sometimes happen before hand work or before certain repairs.  
• Hand work can be performed before or after some color stages, depending on the type of work.  
Why it matters: Today Fradi has to manually defer and manually return to tasks. It works, but it requires continuous management. If the color worker is available, she should also see color jobs that are already available to her, even if they are not “the next step” according to the rigid process.  
Infrastructure status: Partially exists:  
• There are process templates.  
• There is defer and resume.  
• There are stations.  
• There are tasks by station.  
Missing:  
• Dependencies between tasks.  
• Definition of which tasks can be performed before others.  
• “blocked / available” state.  
• Display of available tasks to a worker, even if they have not officially reached the station.  
Specification note: This is an architectural change. It must be planned properly. Do not do it as a small batch.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 2.2 Three Logical States for a Task  
Feature: Each task will be in one of the following logical states:  
1\. Blocked: cannot be performed yet.  
2\. Available: can be performed now.  
3\. Active on board: displayed for execution at the station.  
Why it matters: This makes it possible to understand what can actually be done now, not only where the task sits in the process.  
Infrastructure status: Does not fully exist.  
Specification note: This is probably part of the Production Planning Engine and not regular UX.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 3\. Missing Items: Tops, Skins, and Materials  
\#\#\# 3.1 Missing Tops / Skins List  
Feature: When the intake form marks that there is no top or skin, the system will open a record in a missing-items list. The list will show what is missing, for which customer, for which order, and what details need to be searched for or produced.  
Why it matters: A missing top can block work. Right now the information is saved, but not managed.  
Infrastructure status: Partially exists:  
• It is possible to mark in the intake form that there is no top.  
• There is top\_missing and details.  
• The dashboard can show that there are missing items.  
Missing:  
• Dedicated screen/list.  
• Status for the missing item: open / found / ordered / handled.  
• Handling date.  
• Who is responsible for the search.  
• Removal from the dashboard after handling.  
• Not displaying missing items for completed orders.  
Specification note: This is probably one of the most important near-term modules. Start with a simple v1: missing-items list \+ “found/handled” button.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 3.2 Confirmation That a Top Was Found  
Feature: When the top is found or produced, it can be marked as handled, and the order stops appearing as missing.  
Why it matters: Right now the missing item stays open forever. Even completed work can continue appearing on the dashboard as missing.  
Infrastructure status: Not sufficient.  
Specification note: Editing the form is not enough. The missing item itself needs a lifecycle.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 3.3 Missing Items as Part of Internal Production Management  
Feature: Missing items are not just an order note. They can become internal work:  
• Search for a top.  
• Produce a top.  
• Prepare a skin.  
• Bring material.  
• Assign to the responsible person.  
Why it matters: The system needs to manage internal work that does not always look like customer-facing work.  
Infrastructure status: Does not fully exist.  
Specification note: This connects Missing Items with Internal Production.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 4\. Editing an Intake Form / Order Form After Creation  
\#\#\# 4.1 Editing Form Details After Work Has Opened  
Feature: Allow editing the intake form/order form after the order has already been created. For example, if a customer called and changed a request, or if the form was actually filled out a few days later.  
Why it matters: Reality changes. Today it may be possible to add notes, but the form itself remains outdated.  
Infrastructure status: Partially exists or unclear:  
• There is probably a display of intake data.  
• There are notes and recordings.  
• It is unclear whether full editing exists.  
Missing:  
• Safe editing of form data.  
• Audit for changes.  
• Distinction between descriptive fields and fields that affect workflow.  
• History preservation.  
Specification note: Be careful. Not every change in the form should automatically change tasks that were already created. It is preferable to start with field editing only, with audit, without regenerating tasks.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 4.2 Manual Order Received Date  
Feature: Define when the order actually came in, even if the form was entered into the system a few days later.  
Why it matters: The card should show “X days ago” since the customer brought in the order. This is not always the same date as the record’s created\_at in the system.  
Infrastructure status: Probably does not exist.  
Missing:  
• order\_received\_date or a similar field.  
• Display on the work card.  
• Edit option.  
• Use in future reports/CRM.  
Specification note: Do not rely only on created\_at. A separate business field is needed: “order received date.”

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 5\. Assigning a Responsible Worker to an Existing Task  
\#\#\# 5.1 Changing the Responsible Worker from the Production Board  
Feature: On the production board, near the worker’s name or on the card, it should be possible to click and change who is responsible for the task.  
Why it matters: Right now it is possible to define a worker mainly in the intake form or in a certain context, but it is not easy enough to change responsibility after the work is already open. In practice, tasks need to be transferred between workers.  
Infrastructure status: Partially exists:  
• There is assigned user / responsible person for tasks.  
• There is staff.  
• There is a board by stations.  
Missing:  
• Changing the responsible worker from the task card.  
• Changing the responsible worker from WorkOrderDetail for all order tasks.  
• Audit for a responsibility change.  
Specification note: This is a relatively small feature with high value. It can be done before a large planning engine.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 5.2 Managing Responsibility from the Order Card  
Feature: On the order card, view all tasks and change the responsible worker for each one, not only for the task currently appearing on the board.  
Why it matters: This allows Fradi to plan in advance who will do what, even if the task has not yet reached the station.  
Infrastructure status: Probably possible based on existing tasks, but requires UI and RPC/safe update.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 6\. Control, Approvals, and Review with Tzipi  
\#\#\# 6.1 Removing an Unnecessary Approval After Final Control  
Feature: If Fradi performs final control and clicks “Done,” there is no need for an additional approval on that same control, unless an additional Tzipi review is required.  
Why it matters: The system should not create a double approval for an action that is already defined as control.  
Infrastructure status: Probably solvable through configuration:  
• Check whether the final control step is defined as requires\_approval=true.  
• If yes, turn it off.  
Specification note: Do not develop if it can be solved through the process template.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 6.2 Review with Tzipi from the Production Board  
Feature: In stages where approval/review by Tzipi is required, there should be a direct indication on the production board. For example:  
• Gray icon: not yet reviewed with Tzipi.  
• Green V: reviewed with Tzipi.  
Why it matters: The existing indication on the order card is not accessible enough. If it is relevant to a work stage, it should appear on the board where people are working.  
Infrastructure status: Partially exists:  
• A hardcoded field was built: intake\_reviewed\_with\_tzipi.  
• There is a protected RPC.  
• There is an indication on the order card.  
Missing:  
• Appearance on the production board.  
• Connection to a control stage.  
• Definition of when it is required.  
• Icon display by state.  
Specification note: The existing indication can be displayed on the board as an interim solution, but in the long term a configurable mechanism is needed.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 6.3 Configurable Approvals  
Feature: Not a hardcoded “Tzipi,” but a mechanism in which it is possible to define:  
• Which stage requires an additional approval.  
• Who is responsible for the approval.  
• Whether it is possible to finish without the approval.  
• Whether to only alert or actually block.  
Why it matters: If the responsible person changes in the future, or if there are different types of controls, we will not want to write new code for each approval.  
Infrastructure status: Does not fully exist.  
Specification note: This is an Approval Rules module. Do not fix it as another point-specific button.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 7\. Calendar, Appointments, and Customer Timeline  
\#\#\# 7.1 Full Calendar by Hours and Workers  
Feature: An active calendar that allows viewing and scheduling appointments by hour, by worker, by service type, or by work type.  
Why it matters: To know when an appointment was scheduled, when a customer was in the salon, and when real availability exists.  
Infrastructure status: Partially exists:  
• There is a Calendar MVP.  
• There is a month/day/list view.  
• There is a worker filter.  
• There is daily print.  
Missing:  
• Real hours.  
• Creating an appointment in the calendar.  
• Editing an appointment.  
• Linking an appointment to a customer/order.  
• Appointment status: scheduled / arrived / cancelled / postponed / completed.  
• Load view by worker.  
Specification note: This is a new module: Scheduling / Appointments. Do not insert it as a patch into the Calendar MVP.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 7.2 Documenting When the Appointment Was Scheduled  
Feature: In the customer card, show:  
• When the appointment was scheduled.  
• For what date and time it was scheduled.  
• Who scheduled it.  
• Whether the customer arrived/cancelled/postponed.  
Why it matters: This is basic CRM. Not only what happened in the work, but also when contact was made or a meeting was scheduled.  
Infrastructure status: Not sufficient.  
Specification note: A real appointment entity is needed, or at least an events table, not just a date field on work\_order.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 7.3 Timeline in the Customer Card  
Feature: A timeline will appear in the customer card:  
• When an order came in.  
• When an appointment was scheduled.  
• When the customer was in the salon.  
• What was done during that visit.  
• When work was performed.  
• When it was delivered.  
• When there was a call/update/service interaction.  
Why it matters: Today the customer card mainly contains previous orders. That is not enough for CRM. The goal is to see the relationship history with the customer, not only a list of jobs.  
Infrastructure status: Partially exists:  
• There are customers.  
• There are orders.  
• There are certain dates.  
• There are notes/recordings.  
Missing:  
• customer\_events / timeline events table.  
• Automatic event creation from system actions.  
• Manual event creation.  
• Connection to the appointment calendar.  
• Timeline display in the customer card.  
Specification note: This is one of the central bridges between the production system and CRM.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 8\. Full CRM  
\#\#\# 8.1 Expanding the Customer Card  
Feature: The customer card should become a full CRM screen instead of an order-list screen:  
• Contact details.  
• Order history.  
• Visit history.  
• Timeline.  
• Notes.  
• Photos.  
• Preferences.  
• Future follow-ups.  
• Customer status.  
Why it matters: A wig salon is a business with a personal relationship and long-term service. Customer history is valuable.  
Infrastructure status: Basic foundation exists:  
• Customers table.  
• Orders.  
• Basic contact details.  
Missing:  
• CRM timeline.  
• Follow-up reminders.  
• Tags/statuses.  
• Customer notes.  
• Customer files/photos.  
• Communication log.  
Specification note: Do not open the full CRM now. Start with timeline and appointments, because they are directly connected to the calendar and production.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 9\. Internal Production  
\#\#\# 9.1 Internal Jobs Without a Customer  
Feature: Not every job in the system is a customer order. There are:  
• Display wigs.  
• Hair straightening.  
• Top preparation.  
• Skin preparation.  
• Materials.  
• Internal repairs.  
Why it matters: The system needs to manage the salon, not only customer orders.  
Infrastructure status: Not sufficient:  
• Currently, a work order probably requires a customer.  
• Hair straightening gets stuck because it requires choosing a customer.  
Specification note: Need to decide whether to do:  
• work\_order without customer\_id.  
• Internal customer.  
• New type of internal\_work\_order.  
• Category on work\_order.  
This is an architecture decision.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\#\# 9.2 Display Wigs  
Feature: A display wig needs a dedicated process without appointment coordination and pickup. Instead, it should be assigned to a wig stylist/responsible person or marked as completed.  
Why it matters: Not every process ends with a customer.  
Infrastructure status: Probably partially possible through configuration:  
• Dedicated order type.  
• Process template without appointment/pickup.  
Missing: If the system still requires appointment/pickup.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 10\. Photos and Files  
\#\#\# 10.1 Taking a Photo When Closing an Order  
Feature: When a customer closes an order, mark “Did I take a photo?” and maybe upload a photo. It can be required before closing.  
Why it matters: A photo is part of the professional and marketing documentation, and also helps understand the wig/customer condition.  
Infrastructure status: Partially exists:  
• There is private storage for recordings.  
• There are attachments or some file infrastructure.  
Missing:  
• Image upload.  
• Metadata for photos.  
• Photo requirement by stage/order type.  
• Display in the customer/order card.  
Specification note: This is not a small fix. It is a files/photos module that needs to connect to CRM.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 11\. Deleting / Merging Customers  
\#\#\# 11.1 Duplicate Customers  
Feature: If a customer was entered twice, there needs to be a way to correct it.  
Why it matters: As the system becomes a CRM, duplicates will damage the customer history.  
Infrastructure status: Does not exist.  
Specification note: It is not recommended to delete a customer with history. Needed:  
• Archive a customer with no activity.  
• Merge duplicate customers.  
• Move orders and events from one customer to another.  
This is an important CRM feature, but not immediate.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

\#\# 12\. Proposed Priority Order Summary  
\#\#\# Not Now  
Do not start now with:  
• Full dynamic planning engine.  
• Full CRM.  
• Full hourly calendar.  
• Full Approval Rules.  
• Form editing that changes workflow.  
• Customer deletion.  
These require architecture planning.

\#\#\# Yes, as Near-Term Stages  
Near-term stage 1: Missing Items v1  
Missing tops/skins list \+ mark found/handled \+ clean the dashboard from handled missing items or completed orders.  
Near-term stage 2: Change responsible worker for an existing task  
Option to change the responsible worker from the production board or order card.  
Near-term stage 3: Order received date  
Manual business field for an order: when the order actually came in. Display on the card: “X days ago.”  
Near-term stage 4: Safe intake form editing  
Edit form data after creation, with audit, without automatically changing the workflow.  
Near-term stage 5: Customer Timeline v1  
Basic timeline in the customer card from existing events: order opened, appointment scheduled, work completed, delivered, note added.

\#\#\# Separate Planning Stage  
Production Planning Engine:  
• Worker capacity.  
• Task durations.  
• Prioritization by urgency and due date.  
• Estimated completion date.  
• Rollover for tasks not completed.  
• Task availability by dependencies.  
Scheduling / Calendar Module:  
• Calendar by hours.  
• Appointments.  
• Workers.  
• Appointment status.  
• Connection to customer and order.  
• Visit history.  
CRM Module:  
• Timeline.  
• Notes.  
• Photos.  
• Follow-ups.  
• Duplicate customers.  
• Preferences.  
• Communication.  
