"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/lib/comments/actions";
import type { CommentWithAuthor } from "@/lib/comments/queries";
import type { HubTask } from "@/lib/work-orders/hub-queries";

const selectClass =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function NotesSection({
  workOrderId,
  notes,
  comments,
  tasks,
}: {
  workOrderId: string;
  notes: string | null;
  comments: CommentWithAuthor[];
  tasks: HubTask[];
}) {
  const t = useTranslations("pages.orders.detail.hub.notes");
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        {tasks.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {t("addComment")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {notes ? (
          <p className="rounded-control bg-mauve-100/40 p-3 text-sm text-ink">
            {notes}
          </p>
        ) : null}

        {comments.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="text-sm">
                <p className="text-ink">{comment.body}</p>
                <p className="text-xs text-muted">
                  {comment.taskTitle}
                  {" · "}
                  {comment.authorName ?? t("unknownAuthor")}
                  {" · "}
                  {new Date(comment.created_at).toLocaleString("he-IL")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AddCommentDialog
        workOrderId={workOrderId}
        tasks={tasks}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}

function AddCommentDialog({
  workOrderId,
  tasks,
  open,
  onOpenChange,
}: {
  workOrderId: string;
  tasks: HubTask[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.notes");
  const router = useRouter();
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setBody("");
      setError(undefined);
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await addCommentAction(taskId, workOrderId, body);
      if (!result.success) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addComment")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="comment-task">{t("taskLabel")}</Label>
            <select
              id="comment-task"
              className={selectClass}
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment-body">{t("bodyLabel")}</Label>
            <Textarea
              id="comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
        </div>
        {error ? <FormMessage variant="error">{t("errors.generic")}</FormMessage> : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={pending || !taskId}>
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
